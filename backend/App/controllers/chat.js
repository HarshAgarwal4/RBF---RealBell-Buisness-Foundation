import mongoose from "mongoose";
import {
  listChatThreads,
  getThreadMessages,
  markThreadRead,
  persistMessage,
  resolveChatConnection,
  saveAttachmentMessage,
} from "../../services/chat.js";

function sendError(res, msg, status = 0, code = 200) {
  return res.status(code).send({ status, msg });
}

export async function fetchThreads(req, res) {
  try {
    const threads = await listChatThreads(req.user._id);
    return res.send({
      status: 1,
      msg: "Threads fetched successfully",
      threads,
    });
  } catch (error) {
    console.error("fetchThreads failed", error);
    return sendError(res, "Unable to fetch threads");
  }
}

export async function fetchThreadMessages(req, res) {
  try {
    const { otherId } = req.params;
    const limit = Math.min(Number(req.query.limit || 100), 200);
    const thread = await getThreadMessages(req.user._id, otherId, limit);

    if (!thread) {
      return sendError(res, "Thread not found", 9);
    }

    return res.send({
      status: 1,
      msg: "Messages fetched successfully",
      ...thread,
    });
  } catch (error) {
    console.error("fetchThreadMessages failed", error);
    return sendError(res, "Unable to fetch messages");
  }
}

export async function sendTextMessage(req, res) {
  try {
    const { otherId, text, replyTo = null } = req.body;

    if (!mongoose.isValidObjectId(otherId)) {
      return sendError(res, "Invalid connection id", 7);
    }

    if (!text || !String(text).trim()) {
      return sendError(res, "Message text is required", 7);
    }

    const thread = await persistMessage({
      senderId: req.user._id,
      otherId,
      kind: "text",
      text: String(text).trim(),
      replyTo,
    });

    if (!thread) {
      return sendError(res, "You can only chat with accepted connections", 7);
    }

    const io = req.app.get("io");
    if (io) {
      io.to(`user:${req.user._id}`).to(`user:${otherId}`).emit("chat:message:new", thread);
    }

    return res.send({
      status: 1,
      msg: "Message sent successfully",
      message: thread,
    });
  } catch (error) {
    console.error("sendTextMessage failed", error);
    return sendError(res, "Unable to send message");
  }
}

export async function sendAttachmentMessage(req, res) {
  try {
    const { otherId, text = "", duration = null, kind = "file" } = req.body;
    const file = req.file;

    if (!mongoose.isValidObjectId(otherId)) {
      return sendError(res, "Invalid connection id", 7);
    }

    if (!file) {
      return sendError(res, "Attachment is required", 7);
    }

    const message = await saveAttachmentMessage({
      senderId: req.user._id,
      otherId,
      file,
      kind,
      text: String(text || "").trim(),
      duration,
    });

    if (!message) {
      return sendError(res, "You can only chat with accepted connections", 7);
    }

    const io = req.app.get("io");
    if (io) {
      io.to(`user:${req.user._id}`).to(`user:${otherId}`).emit("chat:message:new", message);
    }

    return res.send({
      status: 1,
      msg: "Attachment sent successfully",
      message,
    });
  } catch (error) {
    console.error("sendAttachmentMessage failed", error);
    return sendError(res, error?.message || "Unable to upload attachment");
  }
}

export async function markThreadAsRead(req, res) {
  try {
    const { otherId } = req.params;
    const { messageId = null } = req.body || {};

    const result = await markThreadRead(req.user._id, otherId, messageId);
    if (!result) {
      return sendError(res, "Thread not found", 9);
    }

    const io = req.app.get("io");
    if (io) {
      io.to(`user:${req.user._id}`).to(`user:${otherId}`).emit("chat:message:read", {
        threadId: result.threadId,
        readerId: String(req.user._id),
        messageId,
        readAt: result.readAt,
      });
    }

    return res.send({
      status: 1,
      msg: "Thread marked as read",
      ...result,
    });
  } catch (error) {
    console.error("markThreadAsRead failed", error);
    return sendError(res, "Unable to mark thread as read");
  }
}

