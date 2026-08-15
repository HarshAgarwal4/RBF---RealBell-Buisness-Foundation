import { Server } from "socket.io";
import OrganizationModel from "../App/models/organization.js";
import { getUser } from "./Auth.js";
import {
  clearSocketUser,
  decrementPresence,
  deliverPendingMessagesForUser,
  getConnectionIds,
  incrementPresence,
  markThreadRead,
  persistMessage,
  resolveChatConnection,
  setSocketUser,
} from "./chat.js";
import {
  createCallSession,
  clearCallSession,
  clearUserCall,
  getUserActiveCall,
  updateCallStatus,
} from "./webrtc.js";

function parseCookieValue(cookieHeader, name) {
  if (!cookieHeader) return null;

  const parts = cookieHeader.split(";").map((part) => part.trim());
  const found = parts.find((part) => part.startsWith(`${name}=`));
  if (!found) return null;

  return decodeURIComponent(found.slice(name.length + 1));
}

async function authenticateSocket(socket) {
  const cookieHeader = socket.request.headers.cookie || "";
  const token = socket.handshake.auth?.token || parseCookieValue(cookieHeader, "UID");

  if (!token) {
    throw new Error("Authentication token not found");
  }

  const payload = await getUser(token);
  if (!payload?.id) {
    throw new Error("Invalid token");
  }

  const user = await OrganizationModel.findById(payload.id);
  if (!user) {
    throw new Error("User not found");
  }

  const sessionToken = user.sessions?.[0]?.token;
  if (sessionToken !== token) {
    throw new Error("Invalid session");
  }

  return user;
}

async function notifyPresence(io, userId, online) {
  const contactIds = await getConnectionIds(userId);
  contactIds.forEach((contactId) => {
    io.to(`user:${contactId}`).emit("chat:presence:update", {
      userId: String(userId),
      online,
    });
  });
}

let ioInstance = null;

export function getIO() {
  return ioInstance;
}

export function registerSocketServer(httpServer, app) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
  });

  ioInstance = io;
  app.set("io", io);

  io.use(async (socket, next) => {
    try {
      const user = await authenticateSocket(socket);
      socket.data.user = {
        _id: String(user._id),
        name: user.name,
        account: user.account,
      };
      next();
    } catch (error) {
      next(new Error(error.message || "Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.data.user._id;
    socket.join(`user:${userId}`);

    await setSocketUser(socket.id, userId);
    const presenceCount = await incrementPresence(userId, socket.id);
    if (presenceCount === 1) {
      await notifyPresence(io, userId, true);
    }

    const delivered = await deliverPendingMessagesForUser(userId, io);

    socket.emit("chat:ready", {
      userId,
      deliveredCount: delivered.length,
    });

    socket.on("chat:thread:join", async ({ otherId }, ack) => {
      try {
        const connection = await resolveChatConnection(userId, otherId);
        if (!connection) {
          const payload = { status: 0, msg: "Thread not found" };
          if (ack) ack(payload);
          return;
        }

        socket.join(`thread:${[String(userId), String(otherId)].sort().join(":")}`);
        const payload = { status: 1, msg: "Joined thread successfully" };
        if (ack) ack(payload);
      } catch (error) {
        if (ack) ack({ status: 0, msg: error.message || "Unable to join thread" });
      }
    });

    socket.on("chat:message:send", async (payload = {}, ack) => {
      try {
        const { otherId, text = "", replyTo = null } = payload;
        const message = await persistMessage({
          senderId: userId,
          otherId,
          kind: "text",
          text,
          replyTo,
        });

        if (!message) {
          const response = { status: 0, msg: "You can only chat with accepted connections" };
          if (ack) ack(response);
          return;
        }

        io.to(`user:${userId}`).to(`user:${otherId}`).emit("chat:message:new", message);
        if (ack) ack({ status: 1, message });
      } catch (error) {
        if (ack) ack({ status: 0, msg: error.message || "Unable to send message" });
      }
    });

    socket.on("chat:message:read", async (payload = {}, ack) => {
      try {
        const { otherId, messageId = null } = payload;
        const result = await markThreadRead(userId, otherId, messageId);

        if (!result) {
          const response = { status: 0, msg: "Thread not found" };
          if (ack) ack(response);
          return;
        }

        io.to(`user:${userId}`).to(`user:${otherId}`).emit("chat:message:read", {
          threadId: result.threadId,
          readerId: String(userId),
          messageId,
          readAt: result.readAt,
        });

        if (ack) ack({ status: 1, ...result });
      } catch (error) {
        if (ack) ack({ status: 0, msg: error.message || "Unable to mark thread read" });
      }
    });

    /* ============================================================
       WebRTC Video Call Signaling Handlers
       ============================================================ */

    socket.on("webrtc:call-user", async ({ targetId, offer, callType = "video" }, ack) => {
      try {
        const callerId = userId;
        const busyCall = await getUserActiveCall(targetId);
        if (busyCall && busyCall.status === "connected") {
          if (ack) ack({ status: 0, reason: "busy", msg: "User is currently on another call" });
          socket.emit("webrtc:call-busy", { targetId });
          return;
        }

        const callId = `call_${callerId}_${targetId}_${Date.now()}`;
        const session = await createCallSession({
          callId,
          callerId,
          callerName: socket.data.user.name,
          callerAvatar: socket.data.user.account?.image || "",
          receiverId: targetId,
          callType,
        });

        io.to(`user:${targetId}`).emit("webrtc:incoming-call", {
          callId,
          callerId,
          callerName: socket.data.user.name,
          callerAvatar: socket.data.user.account?.image || "",
          offer,
          callType,
        });

        if (ack) ack({ status: 1, callId });
      } catch (error) {
        if (ack) ack({ status: 0, msg: error.message || "Failed to initiate call" });
      }
    });

    socket.on("webrtc:answer-call", async ({ callId, callerId, answer }, ack) => {
      try {
        await updateCallStatus(callId, "connected");
        io.to(`user:${callerId}`).emit("webrtc:call-answered", {
          callId,
          answer,
          responderId: userId,
        });
        if (ack) ack({ status: 1 });
      } catch (error) {
        if (ack) ack({ status: 0, msg: error.message });
      }
    });

    socket.on("webrtc:decline-call", async ({ callId, callerId }, ack) => {
      try {
        await clearCallSession(callId);
        io.to(`user:${callerId}`).emit("webrtc:call-declined", {
          callId,
          declinerId: userId,
        });
        if (ack) ack({ status: 1 });
      } catch (error) {
        if (ack) ack({ status: 0, msg: error.message });
      }
    });

    socket.on("webrtc:ice-candidate", ({ targetId, candidate, callId }) => {
      io.to(`user:${targetId}`).emit("webrtc:ice-candidate", {
        candidate,
        senderId: userId,
        callId,
      });
    });

    socket.on("webrtc:media-state", ({ targetId, isMuted, isVideoOff, isScreenSharing }) => {
      io.to(`user:${targetId}`).emit("webrtc:media-state", {
        senderId: userId,
        isMuted,
        isVideoOff,
        isScreenSharing,
      });
    });

    socket.on("webrtc:end-call", async ({ targetId, callId }) => {
      if (callId) {
        await clearCallSession(callId);
      } else {
        await clearUserCall(userId);
      }
      if (targetId) {
        io.to(`user:${targetId}`).emit("webrtc:call-ended", {
          senderId: userId,
          callId,
        });
      }
    });

    socket.on("disconnect", async () => {
      try {
        const activeCall = await getUserActiveCall(userId);
        if (activeCall) {
          const peerId = activeCall.callerId === userId ? activeCall.receiverId : activeCall.callerId;
          io.to(`user:${peerId}`).emit("webrtc:call-ended", {
            senderId: userId,
            callId: activeCall.callId,
            reason: "disconnected",
          });
          await clearCallSession(activeCall.callId);
        }
      } catch (err) {
        console.error("Error clearing call on disconnect:", err);
      }

      await clearSocketUser(socket.id);
      const count = await decrementPresence(userId, socket.id);
      if (count === 0) {
        await notifyPresence(io, userId, false);
      }
    });
  });

  return io;
}

