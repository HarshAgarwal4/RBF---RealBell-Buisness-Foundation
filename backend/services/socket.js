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
import LiveSessionModel from "../App/models/liveSession.js";
import {
  addGroupParticipant,
  removeGroupParticipant,
  getGroupParticipants,
  addGroupLobbyParticipant,
  removeGroupLobbyParticipant,
  getGroupLobbyParticipants,
  admitGroupLobbyParticipant,
  setSessionActiveConsultation,
  clearSessionActiveConsultation,
  incrementSessionStats,
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

    async function autoRemoveUserFromLiveConsultation(userA, userB) {
      if (!userA) return;
      try {
        const idA = String(userA);
        const idB = userB ? String(userB) : null;

        // Find session where one of the users was the active consultation participant
        const query = idB
          ? {
              status: "live",
              $or: [
                { "activeConsultation.user": idA, host: idB },
                { "activeConsultation.user": idB, host: idA },
              ],
            }
          : {
              status: "live",
              "activeConsultation.user": idA,
            };

        const sessions = await LiveSessionModel.find(query);

        for (const session of sessions) {
          const activeUser = session.activeConsultation?.user;
          if (!activeUser) continue;

          const qItem = session.queue.find(
            (q) => String(q.user?._id || q.user) === String(activeUser)
          );
          if (qItem) {
            qItem.status = "completed";
          }
          session.stats.completedCount = (session.stats.completedCount || 0) + 1;
          await incrementSessionStats(session._id, "completed");

          session.activeConsultation = { user: null, startedAt: null };
          await clearSessionActiveConsultation(session._id);

          let nextAdmitted = null;
          if (session.autoAdmit) {
            const nextInLine = session.queue.find((q) => q.status === "waiting");
            if (nextInLine) {
              nextInLine.status = "in_consultation";
              session.activeConsultation = {
                user: nextInLine.user,
                startedAt: new Date(),
              };
              session.stats.totalAdmittedCount = (session.stats.totalAdmittedCount || 0) + 1;
              nextAdmitted = nextInLine.user;
              await setSessionActiveConsultation(session._id, {
                userId: nextInLine.user,
                startedAt: new Date().toISOString(),
              });
              await incrementSessionStats(session._id, "totalAdmitted");
            }
          }

          await session.save();

          const updated = await LiveSessionModel.findById(session._id)
            .populate("host", "name company_name company_type account email")
            .populate("activeConsultation.user", "name company_name company_type account email")
            .populate("queue.user", "name company_name company_type account email");

          io.to(`user:${activeUser}`).emit("live-session:consultation-ended", { sessionId: session._id });
          if (nextAdmitted) {
            io.to(`user:${nextAdmitted}`).emit("live-session:admitted", {
              sessionId: session._id,
              host: updated.host,
              session: updated,
            });
          }
          io.to(`live_session:${session._id}`).emit("live-session:state:updated", {
            session: updated,
          });
          io.to(`live_session:${session._id}`).emit("live-session:queue:updated", {
            queue: updated.queue,
            stats: updated.stats,
          });
        }
      } catch (err) {
        console.error("Error auto-removing user from consultation on call end:", err);
      }
    }

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

      // Automatically remove ONLY the participant of this call
      await autoRemoveUserFromLiveConsultation(userId, targetId);
    });

    /* ============================================================
       Live Sessions & Group Call Handlers
       ============================================================ */

    socket.on("live-session:join-room", async ({ sessionId }) => {
      if (!sessionId) return;
      socket.join(`live_session:${sessionId}`);
    });

    socket.on("live-session:leave-room", async ({ sessionId }) => {
      if (!sessionId) return;
      socket.leave(`live_session:${sessionId}`);
    });

    // 1-on-1: Real-time Host Admit Participant
    socket.on("live-session:admit", async ({ sessionId, participantId }, ack) => {
      try {
        if (!sessionId || !participantId) return;
        const session = await LiveSessionModel.findById(sessionId);
        if (!session) return;
        if (session.host.toString() !== String(userId)) return;

        const qItem = session.queue.find((q) => q.user.toString() === String(participantId));
        if (qItem) {
          qItem.status = "in_consultation";
        }

        session.activeConsultation = {
          user: participantId,
          startedAt: new Date(),
        };
        session.stats.totalAdmittedCount = (session.stats.totalAdmittedCount || 0) + 1;

        await session.save();
        await setSessionActiveConsultation(sessionId, {
          userId: participantId,
          startedAt: new Date().toISOString(),
        });
        await incrementSessionStats(sessionId, "totalAdmitted");

        const updated = await LiveSessionModel.findById(sessionId)
          .populate("host", "name company_name company_type account")
          .populate("activeConsultation.user", "name company_name company_type account")
          .populate("queue.user", "name company_name company_type account");

        // Notify participant directly via socket
        io.to(`user:${participantId}`).emit("live-session:admitted", {
          sessionId,
          host: updated.host,
          session: updated,
        });

        // Broadcast to entire live session room (updating host console & all participants instantly)
        io.to(`live_session:${sessionId}`).emit("live-session:state:updated", {
          session: updated,
        });
        io.to(`live_session:${sessionId}`).emit("live-session:queue:updated", {
          queue: updated.queue,
          stats: updated.stats,
        });

        if (ack) ack({ status: 1, session: updated });
      } catch (err) {
        console.error("Socket error admitting participant:", err);
        if (ack) ack({ status: 0, msg: err.message });
      }
    });

    // 1-on-1: Real-time End Consultation
    socket.on("live-session:end-consultation", async ({ sessionId }, ack) => {
      try {
        if (!sessionId) return;
        const session = await LiveSessionModel.findById(sessionId);
        if (!session) return;
        if (session.host.toString() !== String(userId)) return;

        const activeUser = session.activeConsultation?.user;
        if (activeUser) {
          const qItem = session.queue.find((q) => q.user.toString() === activeUser.toString());
          if (qItem) {
            qItem.status = "completed";
          }
          session.stats.completedCount = (session.stats.completedCount || 0) + 1;
          await incrementSessionStats(sessionId, "completed");
        }

        session.activeConsultation = { user: null, startedAt: null };
        await clearSessionActiveConsultation(sessionId);

        let nextAdmitted = null;
        if (session.autoAdmit) {
          const nextInLine = session.queue.find((q) => q.status === "waiting");
          if (nextInLine) {
            nextInLine.status = "in_consultation";
            session.activeConsultation = {
              user: nextInLine.user,
              startedAt: new Date(),
            };
            session.stats.totalAdmittedCount = (session.stats.totalAdmittedCount || 0) + 1;
            nextAdmitted = nextInLine.user;
            await setSessionActiveConsultation(sessionId, {
              userId: nextInLine.user,
              startedAt: new Date().toISOString(),
            });
            await incrementSessionStats(sessionId, "totalAdmitted");
          }
        }

        await session.save();

        const updated = await LiveSessionModel.findById(sessionId)
          .populate("host", "name company_name company_type account")
          .populate("activeConsultation.user", "name company_name company_type account")
          .populate("queue.user", "name company_name company_type account");

        if (activeUser) {
          io.to(`user:${activeUser}`).emit("live-session:consultation-ended", { sessionId });
        }
        if (nextAdmitted) {
          io.to(`user:${nextAdmitted}`).emit("live-session:admitted", {
            sessionId,
            host: updated.host,
            session: updated,
          });
        }

        io.to(`live_session:${sessionId}`).emit("live-session:state:updated", {
          session: updated,
        });
        io.to(`live_session:${sessionId}`).emit("live-session:queue:updated", {
          queue: updated.queue,
          stats: updated.stats,
        });

        if (ack) ack({ status: 1, session: updated });
      } catch (err) {
        console.error("Socket error ending consultation:", err);
        if (ack) ack({ status: 0, msg: err.message });
      }
    });

    // Group Call: Join room & Lobby check
    socket.on("live-session:group:join", async ({ sessionId, userInfo }, ack) => {
      try {
        if (!sessionId) return;
        const session = await LiveSessionModel.findById(sessionId);
        if (!session) {
          if (ack) ack({ status: 0, msg: "Session not found" });
          return;
        }

        const isHost = String(session.host) === String(userId);

        const participantInfo = {
          _id: String(userId),
          socketId: socket.id,
          name: socket.data.user?.name || userInfo?.name || "Participant",
          avatar: socket.data.user?.account?.image || userInfo?.avatar || "",
          company: socket.data.user?.account?.designation || userInfo?.company || "",
          isMuted: userInfo?.isMuted || false,
          isVideoOff: userInfo?.isVideoOff || false,
          isScreenSharing: false,
          handRaised: false,
          isHost,
          joinedAt: new Date().toISOString(),
        };

        if (isHost) {
          socket.join(`live_session:group:${sessionId}`);
          socket.join(`live_session:group:host:${sessionId}`);

          await addGroupParticipant(sessionId, participantInfo);
          const currentMembers = (await getGroupParticipants(sessionId)) || [];
          const currentLobby = (await getGroupLobbyParticipants(sessionId)) || [];

          socket.to(`live_session:group:${sessionId}`).emit("live-session:group:user-joined", {
            participant: participantInfo,
          });

          if (ack) {
            ack({
              status: 1,
              isHost: true,
              isAdmitted: true,
              self: participantInfo,
              peers: currentMembers.filter((m) => String(m._id) !== String(userId)),
              lobby: currentLobby,
            });
          }
          return;
        }

        // Check if participant is already admitted in active session members (e.g. page refresh)
        const currentMembers = (await getGroupParticipants(sessionId)) || [];
        const alreadyAdmitted = currentMembers.find((m) => String(m._id) === String(userId));

        if (alreadyAdmitted) {
          socket.join(`live_session:group:${sessionId}`);
          await addGroupParticipant(sessionId, participantInfo);

          socket.to(`live_session:group:${sessionId}`).emit("live-session:group:user-joined", {
            participant: participantInfo,
          });

          if (ack) {
            ack({
              status: 1,
              isHost: false,
              isAdmitted: true,
              self: participantInfo,
              peers: currentMembers.filter((m) => String(m._id) !== String(userId)),
            });
          }
          return;
        }

        // Non-host user: placed in Waiting Lobby for Host Approval
        socket.join(`live_session:group:lobby:${sessionId}`);
        const updatedLobby = await addGroupLobbyParticipant(sessionId, participantInfo);

        // Notify host immediately about new lobby participant
        io.to(`live_session:group:host:${sessionId}`).emit("live-session:group:lobby-updated", {
          lobby: updatedLobby,
        });

        if (ack) {
          ack({
            status: 1,
            isHost: false,
            isAdmitted: false,
            self: participantInfo,
            msg: "Waiting for host approval to enter meeting",
          });
        }
      } catch (err) {
        console.error("Error in group join:", err);
        if (ack) ack({ status: 0, msg: err.message });
      }
    });

    // Group Call: Host Admits Participant
    socket.on("live-session:group:admit", async ({ sessionId, participantId }, ack) => {
      try {
        if (!sessionId || !participantId) return;
        const session = await LiveSessionModel.findById(sessionId);
        if (!session || String(session.host) !== String(userId)) {
          if (ack) ack({ status: 0, msg: "Unauthorized" });
          return;
        }

        const candidate = await admitGroupLobbyParticipant(sessionId, participantId);
        if (!candidate) {
          if (ack) ack({ status: 0, msg: "Participant not found in lobby" });
          return;
        }

        const currentMembers = (await getGroupParticipants(sessionId)) || [];
        const currentLobby = (await getGroupLobbyParticipants(sessionId)) || [];

        // Notify the admitted participant
        io.to(`user:${participantId}`).emit("live-session:group:admitted", {
          sessionId,
          self: candidate,
          peers: currentMembers.filter((m) => String(m._id) !== String(participantId)),
        });

        // Broadcast to all active meeting members
        io.to(`live_session:group:${sessionId}`).emit("live-session:group:user-joined", {
          participant: candidate,
        });

        // Update host lobby list
        io.to(`live_session:group:host:${sessionId}`).emit("live-session:group:lobby-updated", {
          lobby: currentLobby,
        });

        if (ack) ack({ status: 1, admitted: candidate, peers: currentMembers, lobby: currentLobby });
      } catch (err) {
        console.error("Error admitting group participant:", err);
        if (ack) ack({ status: 0, msg: err.message });
      }
    });

    // Group Call: Host Admits ALL Pending Lobby Participants
    socket.on("live-session:group:admit-all", async ({ sessionId }, ack) => {
      try {
        if (!sessionId) return;
        const session = await LiveSessionModel.findById(sessionId);
        if (!session || String(session.host) !== String(userId)) return;

        const lobby = (await getGroupLobbyParticipants(sessionId)) || [];
        for (const candidate of lobby) {
          await admitGroupLobbyParticipant(sessionId, candidate._id);
        }

        const currentMembers = (await getGroupParticipants(sessionId)) || [];

        for (const candidate of lobby) {
          io.to(`user:${candidate._id}`).emit("live-session:group:admitted", {
            sessionId,
            self: candidate,
            peers: currentMembers.filter((m) => String(m._id) !== String(candidate._id)),
          });
          io.to(`live_session:group:${sessionId}`).emit("live-session:group:user-joined", {
            participant: candidate,
          });
        }

        io.to(`live_session:group:host:${sessionId}`).emit("live-session:group:lobby-updated", {
          lobby: [],
        });

        if (ack) ack({ status: 1, admittedCount: lobby.length });
      } catch (err) {
        console.error("Error admitting all participants:", err);
      }
    });

    // Group Call: Host Denies / Removes Lobby Participant
    socket.on("live-session:group:deny", async ({ sessionId, participantId }, ack) => {
      try {
        if (!sessionId || !participantId) return;
        const session = await LiveSessionModel.findById(sessionId);
        if (!session || String(session.host) !== String(userId)) return;

        const updatedLobby = await removeGroupLobbyParticipant(sessionId, participantId);
        io.to(`user:${participantId}`).emit("live-session:group:denied", { sessionId });
        io.to(`live_session:group:host:${sessionId}`).emit("live-session:group:lobby-updated", {
          lobby: updatedLobby,
        });

        if (ack) ack({ status: 1 });
      } catch (err) {
        console.error("Error denying participant:", err);
      }
    });

    // Group Call: Host Kicks Active Participant
    socket.on("live-session:group:kick", async ({ sessionId, participantId }, ack) => {
      try {
        if (!sessionId || !participantId) return;
        const session = await LiveSessionModel.findById(sessionId);
        if (!session || String(session.host) !== String(userId)) {
          if (ack) ack({ status: 0, msg: "Unauthorized" });
          return;
        }

        await removeGroupParticipant(sessionId, participantId);

        // Notify the kicked user to leave immediately
        io.to(`user:${participantId}`).emit("live-session:group:kicked", {
          sessionId,
          reason: "You were removed from the meeting by the host.",
        });

        // Broadcast user-left to the meeting room
        io.to(`live_session:group:${sessionId}`).emit("live-session:group:user-left", {
          userId: String(participantId),
        });

        if (ack) ack({ status: 1 });
      } catch (err) {
        console.error("Error kicking participant:", err);
        if (ack) ack({ status: 0, msg: err.message });
      }
    });

    // Group Call: Host Remotely Mutes Participant
    socket.on("live-session:group:host-mute", async ({ sessionId, participantId }, ack) => {
      try {
        if (!sessionId || !participantId) return;
        const session = await LiveSessionModel.findById(sessionId);
        if (!session || String(session.host) !== String(userId)) return;

        io.to(`user:${participantId}`).emit("live-session:group:remote-mute", {
          sessionId,
          byHost: true,
        });

        io.to(`live_session:group:${sessionId}`).emit("live-session:group:peer-media-state", {
          userId: String(participantId),
          isMuted: true,
        });

        if (ack) ack({ status: 1 });
      } catch (err) {
        console.error("Error host-muting participant:", err);
      }
    });

    // Group Call: Host Remotely Stops Participant Video
    socket.on("live-session:group:host-stop-video", async ({ sessionId, participantId }, ack) => {
      try {
        if (!sessionId || !participantId) return;
        const session = await LiveSessionModel.findById(sessionId);
        if (!session || String(session.host) !== String(userId)) return;

        io.to(`user:${participantId}`).emit("live-session:group:remote-stop-video", {
          sessionId,
          byHost: true,
        });

        io.to(`live_session:group:${sessionId}`).emit("live-session:group:peer-media-state", {
          userId: String(participantId),
          isVideoOff: true,
        });

        if (ack) ack({ status: 1 });
      } catch (err) {
        console.error("Error host-stopping participant video:", err);
      }
    });

    // Group Call: Host Mute All Participants
    socket.on("live-session:group:host-mute-all", async ({ sessionId }, ack) => {
      try {
        if (!sessionId) return;
        const session = await LiveSessionModel.findById(sessionId);
        if (!session || String(session.host) !== String(userId)) return;

        const members = (await getGroupParticipants(sessionId)) || [];
        for (const member of members) {
          if (String(member._id) !== String(userId)) {
            io.to(`user:${member._id}`).emit("live-session:group:remote-mute", {
              sessionId,
              byHost: true,
            });
            io.to(`live_session:group:${sessionId}`).emit("live-session:group:peer-media-state", {
              userId: String(member._id),
              isMuted: true,
            });
          }
        }

        if (ack) ack({ status: 1 });
      } catch (err) {
        console.error("Error muting all participants:", err);
      }
    });

    // Group Call: Leave room
    socket.on("live-session:group:leave", async ({ sessionId }) => {
      try {
        if (!sessionId) return;
        socket.leave(`live_session:group:${sessionId}`);
        socket.leave(`live_session:group:host:${sessionId}`);
        socket.leave(`live_session:group:lobby:${sessionId}`);
        await removeGroupParticipant(sessionId, userId);
        await removeGroupLobbyParticipant(sessionId, userId);

        io.to(`live_session:group:${sessionId}`).emit("live-session:group:user-left", {
          userId: String(userId),
          socketId: socket.id,
        });

        const updatedLobby = (await getGroupLobbyParticipants(sessionId)) || [];
        io.to(`live_session:group:host:${sessionId}`).emit("live-session:group:lobby-updated", {
          lobby: updatedLobby,
        });
      } catch (err) {
        console.error("Error in group leave:", err);
      }
    });

    // Group Call: WebRTC Signaling Mesh (offer, answer, candidate)
    socket.on("live-session:group:signal", ({ sessionId, to, signal, toSocketId }) => {
      if (toSocketId) {
        io.to(toSocketId).emit("live-session:group:signal", {
          from: String(userId),
          fromSocketId: socket.id,
          fromName: socket.data.user?.name,
          fromAvatar: socket.data.user?.account?.image,
          signal,
        });
      } else if (to) {
        io.to(`user:${to}`).emit("live-session:group:signal", {
          from: String(userId),
          fromSocketId: socket.id,
          fromName: socket.data.user?.name,
          fromAvatar: socket.data.user?.account?.image,
          signal,
        });
      }
    });

    // Group Call: In-Meeting Chat
    socket.on("live-session:group:chat", ({ sessionId, text }) => {
      if (!sessionId || !text?.trim()) return;
      const chatMsg = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        senderId: String(userId),
        senderName: socket.data.user?.name || "Participant",
        senderAvatar: socket.data.user?.account?.image || "",
        text: text.trim(),
        timestamp: new Date().toISOString(),
      };

      io.to(`live_session:group:${sessionId}`).emit("live-session:group:chat-message", chatMsg);
    });

    // Group Call: Hand Raise
    socket.on("live-session:group:raise-hand", ({ sessionId, raised }) => {
      if (!sessionId) return;
      io.to(`live_session:group:${sessionId}`).emit("live-session:group:hand-raised", {
        userId: String(userId),
        raised: Boolean(raised),
      });
    });

    // Group Call: Media state update
    socket.on("live-session:group:media-state", ({ sessionId, isMuted, isVideoOff, isScreenSharing }) => {
      if (!sessionId) return;
      socket.to(`live_session:group:${sessionId}`).emit("live-session:group:peer-media-state", {
        userId: String(userId),
        socketId: socket.id,
        isMuted,
        isVideoOff,
        isScreenSharing,
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
          await autoRemoveUserFromLiveConsultation(userId, peerId);
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

