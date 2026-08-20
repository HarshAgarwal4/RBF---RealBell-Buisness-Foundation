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
import {
  handleDisconnectGrace,
  handleReconnect,
  getQueue,
  getCurrentParticipant,
  startConsultation,
} from "./queueService.js";
import {
  recordSessionMember,
  removeSessionMember,
  getSessionLiveMembers,
  cacheQueueState,
} from "./liveSessionRedis.js";

function parseCookieValue(cookieHeader, name) {
  if (!cookieHeader) return null;

  const parts = cookieHeader.split(";").map((part) => part.trim());
  const found = parts.find((part) => part.startsWith(`${name}=`));
  if (!found) return null;

  return decodeURIComponent(found.slice(name.length + 1));
}

async function authenticateSocket(socket) {
  const cookieHeader = socket.request.headers.cookie || "";
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.query?.token ||
    parseCookieValue(cookieHeader, "UID");

  let user = null;

  if (token) {
    try {
      const payload = getUser(token);
      if (payload?.id) {
        user = await OrganizationModel.findById(payload.id);
      }
    } catch (_) {}
  }

  // Robust fallback for cross-port development where browser strips cookies
  if (!user) {
    const fallbackUserId =
      socket.handshake.auth?.userId || socket.handshake.query?.userId;
    if (fallbackUserId) {
      user = await OrganizationModel.findById(fallbackUserId);
    }
  }

  if (!user) {
    throw new Error("Authentication failed: No valid token or user session");
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
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "https://realbell-buisness-foundations.vercel.app",
  ].filter(Boolean);

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          origin.includes("localhost") ||
          origin.includes("127.0.0.1")
        ) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
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
      socket.data.joinedSessions = new Set();
      next();
    } catch (error) {
      console.warn("Socket authentication rejected:", error.message);
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

    socket.on("webrtc:answer-call", async ({ callId, callerId, targetId, answer }, ack) => {
      try {
        const destId = callerId || targetId;
        await updateCallStatus(callId, "connected");
        if (destId) {
          io.to(`user:${destId}`).emit("webrtc:call-answered", {
            callId,
            answer,
            responderId: userId,
          });
        }
        if (ack) ack({ status: 1 });
      } catch (error) {
        if (ack) ack({ status: 0, msg: error.message });
      }
    });

    socket.on("webrtc:decline-call", async ({ callId, callerId, targetId }, ack) => {
      try {
        const destId = callerId || targetId;
        if (callId) await clearCallSession(callId);
        if (destId) {
          io.to(`user:${destId}`).emit("webrtc:call-declined", {
            callId,
            declinerId: userId,
          });
        }
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

    // Reconnect active queue grace handler
    handleReconnect(userId);

    /* ============================================================
       Live Session & Waiting Queue Socket Handlers (with Redis)
       ============================================================ */

    socket.on("session:join", async ({ sessionId }, ack) => {
      try {
        if (!sessionId) return;
        socket.join(`live-session:${sessionId}`);
        if (!socket.data.joinedSessions) {
          socket.data.joinedSessions = new Set();
        }
        socket.data.joinedSessions.add(sessionId);

        // Record live member in Redis and broadcast real-time count
        const liveCount = await recordSessionMember(sessionId, userId);
        io.to(`live-session:${sessionId}`).emit("session:members:update", {
          sessionId: String(sessionId),
          count: liveCount,
        });

        if (ack) ack({ status: 1, msg: "Joined session room", liveCount });
      } catch (err) {
        if (ack) ack({ status: 0, msg: err.message });
      }
    });

    socket.on("session:leave", async ({ sessionId }) => {
      if (sessionId) {
        socket.leave(`live-session:${sessionId}`);
        if (socket.data.joinedSessions) {
          socket.data.joinedSessions.delete(sessionId);
        }
        const liveCount = await removeSessionMember(sessionId, userId);
        io.to(`live-session:${sessionId}`).emit("session:members:update", {
          sessionId: String(sessionId),
          count: liveCount,
        });
      }
    });

    /* --- Consultation Video Room Handlers --- */
    socket.on("session:room:join", async ({ sessionId, token }, ack) => {
      try {
        if (!sessionId) {
          if (ack) ack({ status: 0, msg: "Missing session ID" });
          return;
        }

        socket.join(`live-session-room:${sessionId}`);

        // Announce user joined room
        socket.to(`live-session-room:${sessionId}`).emit("session:room:peer-joined", {
          peerId: userId,
          peerName: socket.data.user.name,
          peerAvatar: socket.data.user.account?.image || "",
        });

        if (ack) ack({ status: 1, msg: "Joined consultation room" });
      } catch (err) {
        if (ack) ack({ status: 0, msg: err.message });
      }
    });

    socket.on("session:room:ready", ({ sessionId }) => {
      if (!sessionId) return;
      socket.to(`live-session-room:${sessionId}`).emit("session:room:peer-ready", {
        peerId: userId,
        peerName: socket.data.user.name,
      });
    });

    socket.on("session:room:leave", ({ sessionId }) => {
      if (sessionId) {
        socket.leave(`live-session-room:${sessionId}`);
        socket.to(`live-session-room:${sessionId}`).emit("session:room:peer-left", {
          peerId: userId,
        });
      }
    });

    socket.on("session:room:signal", ({ sessionId, targetPeerId, signalData }) => {
      if (!sessionId) return;
      if (targetPeerId && String(targetPeerId) !== String(userId)) {
        io.to(`user:${targetPeerId}`).emit("session:room:signal", {
          senderId: userId,
          signalData,
        });
      }
      socket.to(`live-session-room:${sessionId}`).emit("session:room:signal", {
        senderId: userId,
        signalData,
      });
    });

    socket.on("session:room:media-state", ({ sessionId, isMuted, isVideoOff, isScreenSharing }) => {
      if (!sessionId) return;
      socket.to(`live-session-room:${sessionId}`).emit("session:room:media-state", {
        peerId: userId,
        isMuted,
        isVideoOff,
        isScreenSharing,
      });
    });

    socket.on("session:room:chat", ({ sessionId, message }) => {
      if (!sessionId || !message) return;
      io.to(`live-session-room:${sessionId}`).emit("session:room:chat", {
        id: Date.now().toString(),
        senderId: userId,
        senderName: socket.data.user.name,
        senderAvatar: socket.data.user.account?.image || "",
        text: message,
        createdAt: new Date().toISOString(),
      });
    });

    socket.on("session:room:end", ({ sessionId }) => {
      if (!sessionId) return;
      io.to(`live-session-room:${sessionId}`).emit("session:room:ended", {
        initiatorId: userId,
      });
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

      // Remove from all active Redis session sets
      if (socket.data.joinedSessions && socket.data.joinedSessions.size > 0) {
        for (const sId of socket.data.joinedSessions) {
          try {
            const liveCount = await removeSessionMember(sId, userId);
            io.to(`live-session:${sId}`).emit("session:members:update", {
              sessionId: String(sId),
              count: liveCount,
            });
          } catch (_) {}
        }
      }

      // Schedule queue grace check for disconnected user
      handleDisconnectGrace(userId);

      await clearSocketUser(socket.id);
      const count = await decrementPresence(userId, socket.id);
      if (count === 0) {
        await notifyPresence(io, userId, false);
      }
    });
  });

  return io;
}

