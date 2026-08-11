import mongoose from "mongoose";
import OrganizationModel from "../App/models/organization.js";
import ChatThreadModel from "../App/models/chatThread.js";
import ChatMessageModel from "../App/models/chatMessage.js";
import { createUploadMiddleware, uploadFileToCloud } from "./upload.js";
import {
  addToRedisSet,
  getManyFromRedis,
  getFromRedis,
  getRedisHash,
  getRedisList,
  getRedisSet,
  incrementRedis,
  pushToRedisList,
  removeFromRedisSet,
  redis,
  setInRedis,
  setRedisHash,
  setRedisList,
} from "./Redis.js";

const CHAT_FILE_LIMIT = 5 * 1024 * 1024;
const CHAT_ATTACHMENT_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/webm",
  "audio/mp4",
  "audio/m4a",
  "audio/aac",
  "video/mp4",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
];

export const chatUpload = createUploadMiddleware({
  maxFileSize: CHAT_FILE_LIMIT,
  allowedMimeTypes: CHAT_ATTACHMENT_MIMES,
});

const CHAT_KEYS = {
  thread: (threadId) => `chat:thread:${threadId}`,
  threadMessages: (threadId) => `chat:thread:${threadId}:messages`,
  threadReads: (threadId) => `chat:thread:${threadId}:reads`,
  message: (messageId) => `chat:message:${messageId}`,
  userThreads: (userId) => `chat:user:${userId}:threads`,
  presence: (userId) => `chat:presence:${userId}`,
  socketUser: (socketId) => `chat:socket:${socketId}:user`,
};

function sortedPairKey(a, b) {
  return [String(a), String(b)].sort().join(":");
}

export function getChatThreadId(userId, otherId) {
  return sortedPairKey(userId, otherId);
}

export function getChatKeys(userId, otherId) {
  const threadId = getChatThreadId(userId, otherId);
  return {
    threadId,
    thread: CHAT_KEYS.thread(threadId),
    threadMessages: CHAT_KEYS.threadMessages(threadId),
    threadReads: CHAT_KEYS.threadReads(threadId),
    userThreads: CHAT_KEYS.userThreads(userId),
    otherUserThreads: CHAT_KEYS.userThreads(otherId),
    presence: CHAT_KEYS.presence(otherId),
  };
}

function toPlainProfile(profile) {
  if (!profile) return null;

  return {
    _id: profile._id,
    name: profile.name || "",
    company_name: profile.company_name || "",
    company_type: profile.company_type || "",
    email: profile.email || "",
    phone: profile.phone || "",
    account: {
      image: profile.account?.image || "",
      designation: profile.account?.designation || "",
      availability: profile.account?.availability || {},
    },
  };
}

async function getAcceptedConnectionRecord(userId, otherId) {
  const user = await OrganizationModel.findById(userId).populate(
    "connections.with",
    "name company_name company_type email phone account"
  );

  if (!user) return null;

  const connection = (user.connections || []).find(
    (entry) => String(entry.with?._id || entry.with) === String(otherId)
  );

  if (!connection || connection.status !== "accepted") {
    return null;
  }

  const otherUser = await OrganizationModel.findById(otherId).select(
    "name company_name company_type email phone account"
  );

  if (!otherUser) return null;

  return {
    user,
    connection,
    otherUser,
    profile: toPlainProfile(connection.with || otherUser),
  };
}

export async function listAcceptedChatConnections(userId) {
  const user = await OrganizationModel.findById(userId).populate(
    "connections.with",
    "name company_name company_type email phone account"
  );

  if (!user) return [];

  const accepted = (user.connections || []).filter((entry) => entry.status === "accepted");
  const results = [];

  for (const entry of accepted) {
    const otherId = String(entry.with?._id || entry.with);
    const chat = await getAcceptedConnectionRecord(userId, otherId);
    if (!chat) continue;

    results.push({
      profile: chat.profile,
      status: "accepted",
      direction: entry.direction,
      requestedAt: entry.requestedAt,
      respondedAt: entry.respondedAt,
      is_online: await isUserOnline(otherId),
    });
  }

  return results.sort((a, b) => {
    const left = new Date(b.respondedAt || b.requestedAt || 0).getTime();
    const right = new Date(a.respondedAt || a.requestedAt || 0).getTime();
    return left - right;
  });
}

export async function isUserOnline(userId) {
  const sockets = await getRedisSet(CHAT_KEYS.presence(userId));
  return Array.isArray(sockets) && sockets.length > 0;
}

export async function incrementPresence(userId, socketId) {
  if (socketId) {
    await addToRedisSet(CHAT_KEYS.presence(userId), socketId);
  }

  const sockets = await getRedisSet(CHAT_KEYS.presence(userId));
  return Array.isArray(sockets) ? sockets.length : 0;
}

export async function decrementPresence(userId, socketId) {
  if (socketId) {
    await removeFromRedisSet(CHAT_KEYS.presence(userId), socketId);
  }

  const sockets = await getRedisSet(CHAT_KEYS.presence(userId));
  return Array.isArray(sockets) ? sockets.length : 0;
}

async function storeThreadMeta(threadId, participantIds, messageId, createdAt) {
  await setRedisHash(CHAT_KEYS.thread(threadId), {
    threadId,
    participants: JSON.stringify(participantIds),
    lastMessageId: messageId,
    lastMessageAt: createdAt,
    updatedAt: createdAt,
  });

  await addToRedisSet(CHAT_KEYS.userThreads(participantIds[0]), threadId);
  await addToRedisSet(CHAT_KEYS.userThreads(participantIds[1]), threadId);
}

function computeMessageStatus(message, viewerId, readAtByUser, recipientOnline) {
  if (String(message.senderId) !== String(viewerId)) {
    return message.readAt ? "read" : message.deliveredAt ? "delivered" : "sent";
  }

  const recipientId = message.recipientId;
  const recipientReadAt = readAtByUser[recipientId];
  if (recipientReadAt && new Date(recipientReadAt).getTime() >= new Date(message.createdAt).getTime()) {
    return "read";
  }

  if (recipientOnline) return "delivered";
  return "sent";
}

function toMessagePayload(message) {
  if (!message) return null;

  const plain = typeof message.toObject === "function" ? message.toObject() : message;

  return {
    id: String(plain.externalId || plain.id || ""),
    threadId: String(plain.threadKey || plain.threadId || ""),
    senderId: String(plain.senderId || ""),
    recipientId: String(plain.recipientId || ""),
    kind: plain.kind || "text",
    text: plain.text || "",
    attachment: plain.attachment || null,
    voice: plain.voice || null,
    replyTo: plain.replyTo || null,
    createdAt: plain.createdAt,
    deliveredAt: plain.deliveredAt,
    readAt: plain.readAt,
  };
}

async function loadReadMap(threadId) {
  const raw = await getRedisHash(CHAT_KEYS.threadReads(threadId));
  return raw || {};
}

async function loadMessages(threadId, limit = 100) {
  const dbMessages = await ChatMessageModel.find({ threadKey: String(threadId) })
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean();

  if (dbMessages.length > 0) {
    return dbMessages.map(toMessagePayload);
  }

  const ids = (await getRedisList(CHAT_KEYS.threadMessages(threadId))) || [];
  const slice = ids.slice(-limit);
  const messages = [];

  for (const id of slice) {
    const raw = await getFromRedis(CHAT_KEYS.message(id));
    if (!raw) continue;
    try {
      messages.push(toMessagePayload(JSON.parse(raw)));
    } catch {
      continue;
    }
  }

  return messages;
}

async function buildThreadPayload(viewerId, otherId, limit = 1) {
  const chat = await getAcceptedConnectionRecord(viewerId, otherId);
  if (!chat) {
    return null;
  }

  const threadId = getChatThreadId(viewerId, otherId);
  const messages = await loadMessages(threadId, limit);
  const readMap = await loadReadMap(threadId);
  const otherOnline = await isUserOnline(otherId);

  return {
    threadId,
    profile: chat.profile,
    messages: messages.map((message) => ({
      ...message,
      status: computeMessageStatus(message, viewerId, readMap, otherOnline),
    })),
    lastMessage: messages[messages.length - 1] || null,
    unreadCount: await getUnreadCount(viewerId, otherId),
    is_online: otherOnline,
  };
}

export async function getUnreadCount(viewerId, otherId) {
  const threadId = getChatThreadId(viewerId, otherId);
  const readMap = await loadReadMap(threadId);
  const readAt = readMap[viewerId];
  const messages = await loadMessages(threadId, 500);

  return messages.filter(
    (message) =>
      String(message.senderId) === String(otherId) &&
      (!readAt || new Date(message.createdAt).getTime() > new Date(readAt).getTime())
  ).length;
}

export async function getThreadMetadata(threadId) {
  const meta = await ChatThreadModel.findOne({ threadKey: String(threadId) }).lean();
  if (meta) {
    return {
      ...meta,
      threadId: meta.threadKey,
      participants: (meta.participants || []).map((id) => String(id)),
    };
  }

  const redisMeta = await getRedisHash(CHAT_KEYS.thread(threadId));
  if (!redisMeta?.participants) return null;

  let participants = [];
  try {
    participants = JSON.parse(redisMeta.participants);
  } catch {
    participants = [];
  }

  return {
    ...redisMeta,
    participants: Array.isArray(participants) ? participants.map(String) : [],
  };
}

async function updateStoredMessage(messageId, patch = {}) {
  const dbUpdate = await ChatMessageModel.findOneAndUpdate(
    { externalId: String(messageId) },
    {
      $set: {
        ...patch,
        deliveredAt: patch.deliveredAt ? new Date(patch.deliveredAt) : patch.deliveredAt,
        readAt: patch.readAt ? new Date(patch.readAt) : patch.readAt,
      },
    },
    { new: true }
  ).lean();

  if (dbUpdate) {
    const payload = toMessagePayload(dbUpdate);
    await setInRedis(CHAT_KEYS.message(messageId), JSON.stringify(payload));
    return payload;
  }

  const raw = await getFromRedis(CHAT_KEYS.message(messageId));
  if (!raw) return null;

  const current = JSON.parse(raw);
  const next = { ...current, ...patch };
  await setInRedis(CHAT_KEYS.message(messageId), JSON.stringify(next));
  return next;
}

export async function markMessageDelivered(messageId, deliveredAt = new Date().toISOString()) {
  return updateStoredMessage(messageId, { deliveredAt });
}

export async function markMessageRead(messageId, readAt = new Date().toISOString()) {
  return updateStoredMessage(messageId, { readAt });
}

export async function listChatThreads(viewerId) {
  const connections = await listAcceptedChatConnections(viewerId);
  const payloads = [];

  for (const connection of connections) {
    const otherId = String(connection.profile._id);
    const thread = await buildThreadPayload(viewerId, otherId, 1);
    if (!thread) continue;

    payloads.push(thread);
  }

  return payloads.sort((a, b) => {
    const left = new Date(b.lastMessage?.createdAt || 0).getTime();
    const right = new Date(a.lastMessage?.createdAt || 0).getTime();
    return left - right;
  });
}

export async function getThreadMessages(viewerId, otherId, limit = 100) {
  const chat = await getAcceptedConnectionRecord(viewerId, otherId);
  if (!chat) return null;

  const threadId = getChatThreadId(viewerId, otherId);
  const messages = await loadMessages(threadId, limit);
  const readMap = await loadReadMap(threadId);
  const otherOnline = await isUserOnline(otherId);

  return {
    threadId,
    profile: chat.profile,
    is_online: otherOnline,
    messages: messages.map((message) => ({
      ...message,
      status: computeMessageStatus(message, viewerId, readMap, otherOnline),
    })),
  };
}

export async function markThreadRead(viewerId, otherId, messageId = null) {
  const chat = await getAcceptedConnectionRecord(viewerId, otherId);
  if (!chat) return null;

  const threadId = getChatThreadId(viewerId, otherId);
  const now = new Date().toISOString();
  await ChatMessageModel.updateMany(
    {
      threadKey: String(threadId),
      senderId: new mongoose.Types.ObjectId(String(otherId)),
      recipientId: new mongoose.Types.ObjectId(String(viewerId)),
      readAt: null,
    },
    {
      $set: { readAt: new Date(now) },
    }
  );

  const messages = await loadMessages(threadId, 500);
  await Promise.all(
    messages
      .filter((message) => String(message.senderId) === String(otherId) && !message.readAt)
      .map((message) => markMessageRead(message.id, now))
  );

  await setRedisHash(CHAT_KEYS.threadReads(threadId), {
    [String(viewerId)]: now,
  });

  return {
    threadId,
    readAt: now,
    messageId,
  };
}

export async function persistMessage({
  senderId,
  otherId,
  kind = "text",
  text = "",
  attachment = null,
  voice = null,
  replyTo = null,
}) {
  const chat = await getAcceptedConnectionRecord(senderId, otherId);
  if (!chat) return null;

  const threadId = getChatThreadId(senderId, otherId);
  const messageSeq = await incrementRedis("chat:ids:message", 1);
  const createdAt = new Date().toISOString();
  const recipientOnline = await isUserOnline(otherId);
  const dbMessage = await ChatMessageModel.create({
    externalId: String(messageSeq),
    threadKey: String(threadId),
    senderId: senderId,
    recipientId: otherId,
    kind,
    text,
    attachment,
    voice,
    replyTo,
    deliveredAt: recipientOnline ? new Date(createdAt) : null,
    readAt: null,
  });

  const message = toMessagePayload(dbMessage);

  await setInRedis(CHAT_KEYS.message(message.id), JSON.stringify(message));
  await pushToRedisList(CHAT_KEYS.threadMessages(threadId), message.id);
  await storeThreadMeta(threadId, [String(senderId), String(otherId)], message.id, createdAt);

  await ChatThreadModel.findOneAndUpdate(
    { threadKey: String(threadId) },
    {
      $set: {
        participants: [senderId, otherId],
        lastMessage: dbMessage._id,
        lastMessageAt: new Date(createdAt),
      },
    },
    { upsert: true, new: true }
  );

  return {
    ...message,
    profile: chat.profile,
    is_online: recipientOnline,
  };
}

export async function deliverPendingMessagesForUser(userId, io = null) {
  const now = new Date().toISOString();
  const delivered = [];

  const pendingMessages = await ChatMessageModel.find({
    recipientId: new mongoose.Types.ObjectId(String(userId)),
    deliveredAt: null,
  }).sort({ createdAt: 1 });

  for (const doc of pendingMessages) {
    const updated = await markMessageDelivered(doc.externalId, now);
    if (!updated) continue;

    delivered.push(updated);
    if (io) {
      io.to(`user:${userId}`).emit("chat:message:new", updated);
      io.to(`user:${updated.senderId}`).emit("chat:message:delivered", updated);
    }
  }

  return delivered;
}

export async function saveAttachmentMessage({
  senderId,
  otherId,
  file,
  kind = "file",
  text = "",
  duration = null,
}) {
  if (!file) return null;

  const uploadResult = await uploadFileToCloud(file.buffer, file.originalname, {
    folder: "RBF/Chat",
    resourceType: "auto",
    allowedFormats: [],
  });

  return persistMessage({
    senderId,
    otherId,
    kind,
    text,
    attachment: {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      mimeType: file.mimetype,
      name: file.originalname,
      size: file.size,
      resourceType: uploadResult.resource_type,
    },
    voice: duration ? { duration } : null,
  });
}

export async function resolveChatConnection(userId, otherId) {
  if (!mongoose.isValidObjectId(otherId)) return null;
  return getAcceptedConnectionRecord(userId, otherId);
}

export function getSocketRoom(userId) {
  return `user:${userId}`;
}

export async function setSocketUser(socketId, userId) {
  let r = await setInRedis(CHAT_KEYS.socketUser(socketId), String(userId), 86400);
  return r
}

export async function getSocketUser(socketId) {
  return getFromRedis(CHAT_KEYS.socketUser(socketId));
}

export async function clearSocketUser(socketId) {
  return redis.del(CHAT_KEYS.socketUser(socketId));
}

export async function getConnectionIds(userId) {
  const user = await OrganizationModel.findById(userId).select("connections");
  if (!user) return [];

  return (user.connections || [])
    .filter((entry) => entry.status === "accepted")
    .map((entry) => String(entry.with))
    .filter(Boolean);
}

export async function getConnectionRooms(userId) {
  return getConnectionIds(userId);
}
