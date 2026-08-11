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

export function registerSocketServer(httpServer, app) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
  });

  app.set("io", io);

  io.use(async (socket, next) => {
    try {
      const user = await authenticateSocket(socket);
      socket.data.user = {
        _id: String(user._id),
        name: user.name,
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

    socket.on("disconnect", async () => {
      await clearSocketUser(socket.id);
      const count = await decrementPresence(userId, socket.id);
      if (count === 0) {
        await notifyPresence(io, userId, false);
      }
    });
  });

  return io;
}
