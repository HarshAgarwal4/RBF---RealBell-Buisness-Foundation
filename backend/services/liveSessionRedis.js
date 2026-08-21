import {
  setInRedis,
  getFromRedis,
  deleteFromRedis,
  incrementRedis,
} from "./Redis.js";

const SESSION_TTL = 86400; // 24 hours
const memoryStore = new Map();

export async function setSessionActiveConsultation(sessionId, data) {
  if (!sessionId) return;
  const key = `live_session:${sessionId}:active_consultation`;
  if (!data) {
    memoryStore.delete(key);
    try { await deleteFromRedis(key); } catch (_) {}
  } else {
    memoryStore.set(key, JSON.stringify(data));
    try { await setInRedis(key, JSON.stringify(data), SESSION_TTL); } catch (_) {}
  }
}

export async function getSessionActiveConsultation(sessionId) {
  if (!sessionId) return null;
  const key = `live_session:${sessionId}:active_consultation`;
  try {
    const raw = await getFromRedis(key);
    if (raw) return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (_) {}
  const mem = memoryStore.get(key);
  if (!mem) return null;
  try { return typeof mem === "string" ? JSON.parse(mem) : mem; } catch (_) { return null; }
}

export async function clearSessionActiveConsultation(sessionId) {
  if (!sessionId) return;
  const key = `live_session:${sessionId}:active_consultation`;
  memoryStore.delete(key);
  try { await deleteFromRedis(key); } catch (_) {}
}

export async function setQueuePausedState(sessionId, isPaused) {
  if (!sessionId) return;
  const key = `live_session:${sessionId}:paused`;
  memoryStore.set(key, isPaused ? "1" : "0");
  try { await setInRedis(key, isPaused ? "1" : "0", SESSION_TTL); } catch (_) {}
}

export async function getQueuePausedState(sessionId) {
  if (!sessionId) return false;
  const key = `live_session:${sessionId}:paused`;
  try {
    const val = await getFromRedis(key);
    if (val !== undefined && val !== null) return val === "1";
  } catch (_) {}
  return memoryStore.get(key) === "1";
}

export async function incrementSessionStats(sessionId, key) {
  if (!sessionId || !key) return;
  const redisKey = `live_session:${sessionId}:stats:${key}`;
  const current = (memoryStore.get(redisKey) || 0) + 1;
  memoryStore.set(redisKey, current);
  try { return await incrementRedis(redisKey, 1); } catch (_) { return current; }
}

export async function getSessionStats(sessionId) {
  if (!sessionId) return { completed: 0, totalAdmitted: 0 };
  let completed = 0;
  let totalAdmitted = 0;
  try {
    const [c, t] = await Promise.all([
      getFromRedis(`live_session:${sessionId}:stats:completed`),
      getFromRedis(`live_session:${sessionId}:stats:totalAdmitted`),
    ]);
    completed = Number(c) || 0;
    totalAdmitted = Number(t) || 0;
  } catch (_) {
    completed = Number(memoryStore.get(`live_session:${sessionId}:stats:completed`)) || 0;
    totalAdmitted = Number(memoryStore.get(`live_session:${sessionId}:stats:totalAdmitted`)) || 0;
  }

  return { completed, totalAdmitted };
}

export async function addGroupParticipant(sessionId, participant) {
  if (!sessionId || !participant) return [];
  const key = `live_session:${sessionId}:group_members`;
  const existing = (await getGroupParticipants(sessionId)) || [];
  const pId = String(participant._id);
  const filtered = existing.filter((p) => String(p._id) !== pId);
  filtered.push(participant);
  memoryStore.set(key, filtered);
  try { await setInRedis(key, JSON.stringify(filtered), SESSION_TTL); } catch (_) {}
  return filtered;
}

export async function removeGroupParticipant(sessionId, userId) {
  if (!sessionId || !userId) return [];
  const key = `live_session:${sessionId}:group_members`;
  const existing = (await getGroupParticipants(sessionId)) || [];
  const uId = String(userId);
  const filtered = existing.filter((p) => String(p._id) !== uId);
  memoryStore.set(key, filtered);
  try { await setInRedis(key, JSON.stringify(filtered), SESSION_TTL); } catch (_) {}
  return filtered;
}

export async function updateGroupParticipantState(sessionId, userId, updates) {
  if (!sessionId || !userId || !updates) return [];
  const key = `live_session:${sessionId}:group_members`;
  const existing = (await getGroupParticipants(sessionId)) || [];
  const uId = String(userId);
  const updated = existing.map((p) =>
    String(p._id) === uId ? { ...p, ...updates } : p
  );
  memoryStore.set(key, updated);
  try { await setInRedis(key, JSON.stringify(updated), SESSION_TTL); } catch (_) {}
  return updated;
}

export async function getGroupParticipants(sessionId) {
  if (!sessionId) return [];
  const key = `live_session:${sessionId}:group_members`;
  try {
    const raw = await getFromRedis(key);
    if (raw) {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed)) {
        memoryStore.set(key, parsed);
        return parsed;
      }
    }
  } catch (_) {}
  const mem = memoryStore.get(key);
  return Array.isArray(mem) ? mem : [];
}

export async function addGroupLobbyParticipant(sessionId, participant) {
  if (!sessionId || !participant) return [];
  const key = `live_session:${sessionId}:group_lobby`;
  const existing = (await getGroupLobbyParticipants(sessionId)) || [];
  const pId = String(participant._id);
  const filtered = existing.filter((p) => String(p._id) !== pId);
  filtered.push(participant);
  memoryStore.set(key, filtered);
  try { await setInRedis(key, JSON.stringify(filtered), SESSION_TTL); } catch (_) {}
  return filtered;
}

export async function removeGroupLobbyParticipant(sessionId, userId) {
  if (!sessionId || !userId) return [];
  const key = `live_session:${sessionId}:group_lobby`;
  const existing = (await getGroupLobbyParticipants(sessionId)) || [];
  const uId = String(userId);
  const filtered = existing.filter((p) => String(p._id) !== uId);
  memoryStore.set(key, filtered);
  try { await setInRedis(key, JSON.stringify(filtered), SESSION_TTL); } catch (_) {}
  return filtered;
}

export async function getGroupLobbyParticipants(sessionId) {
  if (!sessionId) return [];
  const key = `live_session:${sessionId}:group_lobby`;
  try {
    const raw = await getFromRedis(key);
    if (raw) {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed)) {
        memoryStore.set(key, parsed);
        return parsed;
      }
    }
  } catch (_) {}
  const mem = memoryStore.get(key);
  return Array.isArray(mem) ? mem : [];
}

export async function admitGroupLobbyParticipant(sessionId, userId) {
  if (!sessionId || !userId) return null;
  const lobby = (await getGroupLobbyParticipants(sessionId)) || [];
  const candidate = lobby.find((p) => String(p._id) === String(userId));
  if (!candidate) return null;

  await removeGroupLobbyParticipant(sessionId, userId);
  await addGroupParticipant(sessionId, candidate);
  return candidate;
}

export async function clearGroupSession(sessionId) {
  if (!sessionId) return;
  const membersKey = `live_session:${sessionId}:group_members`;
  const lobbyKey = `live_session:${sessionId}:group_lobby`;
  memoryStore.delete(membersKey);
  memoryStore.delete(lobbyKey);
  try {
    await Promise.all([
      deleteFromRedis(membersKey),
      deleteFromRedis(lobbyKey),
    ]);
  } catch (_) {}
}

export async function setUserSessionPresence(userId, email, sessionId, socketId) {
  if (!userId || !sessionId) return;
  const userKey = `user_presence:${userId}`;
  const data = { userId: String(userId), email, sessionId: String(sessionId), socketId, updatedAt: new Date().toISOString() };
  memoryStore.set(userKey, data);
  try { await setInRedis(userKey, JSON.stringify(data), SESSION_TTL); } catch (_) {}
  if (email) {
    memoryStore.set(`email_presence:${email.toLowerCase()}`, data);
    try { await setInRedis(`email_presence:${email.toLowerCase()}`, JSON.stringify(data), SESSION_TTL); } catch (_) {}
  }
}

export async function getUserSessionPresence(userIdOrEmail) {
  if (!userIdOrEmail) return null;
  const key = userIdOrEmail.includes("@")
    ? `email_presence:${userIdOrEmail.toLowerCase()}`
    : `user_presence:${userIdOrEmail}`;
  try {
    const raw = await getFromRedis(key);
    if (raw) return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (_) {}
  const mem = memoryStore.get(key);
  if (!mem) return null;
  try { return typeof mem === "string" ? JSON.parse(mem) : mem; } catch (_) { return null; }
}
