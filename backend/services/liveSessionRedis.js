import {
  setInRedis,
  getFromRedis,
  deleteFromRedis,
  incrementRedis,
} from "./Redis.js";

const SESSION_TTL = 86400; // 24 hours

export async function setSessionActiveConsultation(sessionId, data) {
  if (!sessionId) return;
  const key = `live_session:${sessionId}:active_consultation`;
  if (!data) {
    await deleteFromRedis(key);
  } else {
    await setInRedis(key, JSON.stringify(data), SESSION_TTL);
  }
}

export async function getSessionActiveConsultation(sessionId) {
  if (!sessionId) return null;
  const raw = await getFromRedis(`live_session:${sessionId}:active_consultation`);
  if (!raw) return null;
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (err) {
    return null;
  }
}

export async function clearSessionActiveConsultation(sessionId) {
  if (!sessionId) return;
  await deleteFromRedis(`live_session:${sessionId}:active_consultation`);
}

export async function setQueuePausedState(sessionId, isPaused) {
  if (!sessionId) return;
  await setInRedis(`live_session:${sessionId}:paused`, isPaused ? "1" : "0", SESSION_TTL);
}

export async function getQueuePausedState(sessionId) {
  if (!sessionId) return false;
  const val = await getFromRedis(`live_session:${sessionId}:paused`);
  return val === "1";
}

export async function incrementSessionStats(sessionId, key) {
  if (!sessionId || !key) return;
  const redisKey = `live_session:${sessionId}:stats:${key}`;
  return await incrementRedis(redisKey, 1);
}

export async function getSessionStats(sessionId) {
  if (!sessionId) return { completed: 0, totalAdmitted: 0 };
  const [completed, totalAdmitted] = await Promise.all([
    getFromRedis(`live_session:${sessionId}:stats:completed`),
    getFromRedis(`live_session:${sessionId}:stats:totalAdmitted`),
  ]);

  return {
    completed: Number(completed) || 0,
    totalAdmitted: Number(totalAdmitted) || 0,
  };
}

export async function addGroupParticipant(sessionId, participant) {
  if (!sessionId || !participant) return;
  const key = `live_session:${sessionId}:group_members`;
  const existing = (await getGroupParticipants(sessionId)) || [];
  const filtered = existing.filter((p) => String(p._id) !== String(participant._id));
  filtered.push(participant);
  await setInRedis(key, JSON.stringify(filtered), SESSION_TTL);
  return filtered;
}

export async function removeGroupParticipant(sessionId, userId) {
  if (!sessionId || !userId) return;
  const key = `live_session:${sessionId}:group_members`;
  const existing = (await getGroupParticipants(sessionId)) || [];
  const filtered = existing.filter((p) => String(p._id) !== String(userId));
  await setInRedis(key, JSON.stringify(filtered), SESSION_TTL);
  return filtered;
}

export async function getGroupParticipants(sessionId) {
  if (!sessionId) return [];
  const raw = await getFromRedis(`live_session:${sessionId}:group_members`);
  if (!raw) return [];
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (_) {
    return [];
  }
}

export async function addGroupLobbyParticipant(sessionId, participant) {
  if (!sessionId || !participant) return [];
  const key = `live_session:${sessionId}:group_lobby`;
  const existing = (await getGroupLobbyParticipants(sessionId)) || [];
  const filtered = existing.filter((p) => String(p._id) !== String(participant._id));
  filtered.push(participant);
  await setInRedis(key, JSON.stringify(filtered), SESSION_TTL);
  return filtered;
}

export async function removeGroupLobbyParticipant(sessionId, userId) {
  if (!sessionId || !userId) return [];
  const key = `live_session:${sessionId}:group_lobby`;
  const existing = (await getGroupLobbyParticipants(sessionId)) || [];
  const filtered = existing.filter((p) => String(p._id) !== String(userId));
  await setInRedis(key, JSON.stringify(filtered), SESSION_TTL);
  return filtered;
}

export async function getGroupLobbyParticipants(sessionId) {
  if (!sessionId) return [];
  const raw = await getFromRedis(`live_session:${sessionId}:group_lobby`);
  if (!raw) return [];
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (_) {
    return [];
  }
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

export async function setUserSessionPresence(userId, email, sessionId, socketId) {
  if (!userId || !sessionId) return;
  const userKey = `user_presence:${userId}`;
  const data = { userId: String(userId), email, sessionId: String(sessionId), socketId, updatedAt: new Date().toISOString() };
  await setInRedis(userKey, JSON.stringify(data), SESSION_TTL);
  if (email) {
    await setInRedis(`email_presence:${email.toLowerCase()}`, JSON.stringify(data), SESSION_TTL);
  }
}

export async function getUserSessionPresence(userIdOrEmail) {
  if (!userIdOrEmail) return null;
  const key = userIdOrEmail.includes("@")
    ? `email_presence:${userIdOrEmail.toLowerCase()}`
    : `user_presence:${userIdOrEmail}`;
  const raw = await getFromRedis(key);
  if (!raw) return null;
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (_) {
    return null;
  }
}
