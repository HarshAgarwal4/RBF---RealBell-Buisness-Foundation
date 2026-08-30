import AiSessionModel from "../App/models/aiSession.js";
import AiMessageModel from "../App/models/aiMessage.js";
import OrganizationModel from "../App/models/organization.js";
import { streamMrDoomChat } from "../App/AI/mrDoomAgent.js";
import {
  setInRedis,
  getFromRedis,
  deleteFromRedis,
} from "./Redis.js";

// Map to store active abort controllers for live cancellation
const activeStreams = new Map();

/**
 * Register AI Chat Streaming Socket Event Handlers
 */
export function registerAiSocketHandlers(io, socket) {
  const userId = String(socket.data?.user?._id || socket.data?.user?.id || "");

  /**
   * Client requests real-time token streaming for Mr. Doom
   */
  socket.on("ai:chat:stream", async (payload = {}, ack) => {
    try {
      const { sessionId, message, tempId } = payload;
      if (!message || !message.trim()) {
        if (ack) ack({ status: 0, msg: "Message cannot be empty" });
        return;
      }

      if (!userId) {
        if (ack) ack({ status: 0, msg: "Unauthorized" });
        return;
      }

      // Fetch user profile and check subscription for rbf_ai
      let userDoc = null;
      try {
        userDoc = await OrganizationModel.findById(userId).lean();
      } catch (_) {}

      const isStaffOrAdmin =
        userDoc?.role === "super_admin" ||
        userDoc?.role === "admin" ||
        Boolean(userDoc?.team);

      if (!isStaffOrAdmin) {
        const sub = userDoc?.subscription;
        const hasExpired = sub?.endDate && new Date(sub.endDate) < new Date();
        const isSubActive = sub?.status === "active" && !hasExpired;
        const planKey = isSubActive ? sub?.planKey || "free" : "free";

        if (!isSubActive || planKey === "free") {
          const errPayload = {
            status: 0,
            code: "SUBSCRIPTION_REQUIRED",
            msg: "RBF-AI is a Premium Copilot feature. Please upgrade your subscription plan to chat with Mr. Doom.",
          };
          if (ack) ack(errPayload);
          socket.emit("ai:chat:error", {
            status: 0,
            tempId,
            ...errPayload,
          });
          return;
        }
      }

      const streamKey = `${userId}:${tempId || Date.now()}`;
      const abortController = new AbortController();
      activeStreams.set(streamKey, abortController);

      // Set concurrency lock in Redis
      try {
        await setInRedis(
          `ai:stream:active:${userId}`,
          JSON.stringify({ sessionId, tempId, startedAt: Date.now() }),
          180
        );
      } catch (redisErr) {
        console.warn("Redis active stream set warning:", redisErr.message);
      }

      // 1. Resolve or Create Chat Session
      let session = null;
      if (sessionId) {
        session = await AiSessionModel.findOne({
          _id: sessionId,
          user: userId,
          is_deleted: { $ne: true },
        });
      }

      if (!session) {
        const generatedTitle =
          message.trim().length > 35
            ? `${message.trim().slice(0, 32)}...`
            : message.trim();

        session = await AiSessionModel.create({
          user: userId,
          title: generatedTitle,
          lastMessageAt: new Date(),
        });
      }

      // 2. Persist User Message to MongoDB
      const userMessage = await AiMessageModel.create({
        session: session._id,
        user: userId,
        role: "user",
        content: message.trim(),
      });

      // Acknowledge initiation
      if (ack) {
        ack({
          status: 1,
          sessionId: String(session._id),
          tempId,
          userMessage,
        });
      }

      // 3. Load recent conversation history (Try Redis Cache first, else MongoDB)
      let pastMessages = [];
      const cacheKey = `ai:session:cache:${session._id}`;

      try {
        const cached = await getFromRedis(cacheKey);
        if (cached) {
          pastMessages = typeof cached === "string" ? JSON.parse(cached) : cached;
        }
      } catch (e) {
        // Ignore redis cache error and fallback to DB
      }

      if (!pastMessages || pastMessages.length === 0) {
        pastMessages = await AiMessageModel.find({
          session: session._id,
          _id: { $ne: userMessage._id },
        })
          .sort({ createdAt: 1 })
          .limit(10)
          .lean();
      }

      // 4. Stream Tokens via Socket & Buffer in Redis
      let lastBufferUpdate = 0;

      const aiResponse = await streamMrDoomChat({
        user: userDoc,
        prompt: message.trim(),
        history: pastMessages,
        sessionTitle: session.title,
        signal: abortController.signal,
        onChunk: (chunkText, accumulated) => {
          // Emit token chunk to socket client
          socket.emit("ai:chat:chunk", {
            sessionId: String(session._id),
            tempId,
            chunk: chunkText,
            accumulated,
          });

          // Buffer in Redis periodically (throttled to every 350ms)
          const now = Date.now();
          if (now - lastBufferUpdate > 350) {
            lastBufferUpdate = now;
            setInRedis(
              `ai:stream:buffer:${session._id}:${tempId}`,
              accumulated,
              300
            ).catch(() => {});
          }
        },
      });

      // 5. Persist Assistant Message in MongoDB
      const assistantMessage = await AiMessageModel.create({
        session: session._id,
        user: userId,
        role: "assistant",
        content: aiResponse.content,
        providerUsed: aiResponse.providerUsed,
        modelUsed: aiResponse.modelUsed,
      });

      // 6. Update Session Metadata & Title
      const messageCount = await AiMessageModel.countDocuments({ session: session._id });
      if (messageCount <= 2 && session.title === "New Strategy Session") {
        const newTitle =
          message.trim().length > 35
            ? `${message.trim().slice(0, 32)}...`
            : message.trim();
        session.title = newTitle;
      }
      session.lastMessageAt = new Date();
      await session.save();

      // 7. Update Redis Session Cache
      try {
        const updatedCache = [...pastMessages, userMessage, assistantMessage].slice(-10);
        await setInRedis(cacheKey, JSON.stringify(updatedCache), 3600);
        await deleteFromRedis(`ai:stream:active:${userId}`);
        await deleteFromRedis(`ai:stream:buffer:${session._id}:${tempId}`);
      } catch (redisErr) {
        console.warn("Redis cleanup warning:", redisErr.message);
      }

      activeStreams.delete(streamKey);

      // 8. Emit Completion Event
      socket.emit("ai:chat:done", {
        status: 1,
        sessionId: String(session._id),
        tempId,
        userMessage,
        assistantMessage,
        session,
        botName: aiResponse.botName,
        providerUsed: aiResponse.providerUsed,
        modelUsed: aiResponse.modelUsed,
      });
    } catch (err) {
      console.error("ai:chat:stream error:", err);
      socket.emit("ai:chat:error", {
        status: 0,
        tempId: payload?.tempId,
        msg: err.message || "Streaming failed",
      });
      if (ack) ack({ status: 0, msg: err.message || "Failed to stream" });
    }
  });

  /**
   * Client requests to abort/stop streaming
   */
  socket.on("ai:chat:stop", async ({ tempId }) => {
    try {
      const streamKey = `${userId}:${tempId}`;
      const controller = activeStreams.get(streamKey);
      if (controller) {
        controller.abort();
        activeStreams.delete(streamKey);
      }
      await deleteFromRedis(`ai:stream:active:${userId}`).catch(() => {});
      socket.emit("ai:chat:stopped", { tempId });
    } catch (err) {
      console.error("ai:chat:stop error:", err);
    }
  });
}
