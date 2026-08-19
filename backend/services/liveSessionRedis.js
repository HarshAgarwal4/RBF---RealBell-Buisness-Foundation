import {
  addToRedisSet,
  removeFromRedisSet,
  getRedisSet,
  setInRedis,
  getFromRedis,
  deleteFromRedis,
  expireRedis,
} from "./Redis.js";

const SESSION_KEYS = {
  members: (sessionId) => `live-session:${sessionId}:members`,
  state: (sessionId) => `live-session:${sessionId}:state`,
  queue: (sessionId) => `live-session:${sessionId}:queue`,
};

/**
 * Record a user joining a live session room in Redis
 * @param {string} sessionId
 * @param {string} userId
 * @returns {Promise<number>} Total live members count
 */
export async function recordSessionMember(sessionId, userId) {
  if (!sessionId || !userId) return 0;
  try {
    const key = SESSION_KEYS.members(sessionId);
    await addToRedisSet(key, String(userId));
    await expireRedis(key, 86400); // 24 hours TTL
    const members = await getRedisSet(key);
    return Array.isArray(members) ? members.length : 1;
  } catch (err) {
    console.error("Redis recordSessionMember error:", err);
    return 1;
  }
}

/**
 * Remove a user from the live session room in Redis
 * @param {string} sessionId
 * @param {string} userId
 * @returns {Promise<number>} Updated live members count
 */
export async function removeSessionMember(sessionId, userId) {
  if (!sessionId || !userId) return 0;
  try {
    const key = SESSION_KEYS.members(sessionId);
    await removeFromRedisSet(key, String(userId));
    const members = await getRedisSet(key);
    return Array.isArray(members) ? members.length : 0;
  } catch (err) {
    console.error("Redis removeSessionMember error:", err);
    return 0;
  }
}

/**
 * Get all active live members in a session from Redis
 * @param {string} sessionId
 * @returns {Promise<string[]>}
 */
export async function getSessionLiveMembers(sessionId) {
  if (!sessionId) return [];
  try {
    const members = await getRedisSet(SESSION_KEYS.members(sessionId));
    return Array.isArray(members) ? members : [];
  } catch (err) {
    console.error("Redis getSessionLiveMembers error:", err);
    return [];
  }
}

/**
 * Cache current queue snapshot in Redis for high-speed retrieval
 * @param {string} sessionId
 * @param {Array} queueEntries
 */
export async function cacheQueueState(sessionId, queueEntries) {
  if (!sessionId) return;
  try {
    await setInRedis(SESSION_KEYS.queue(sessionId), queueEntries, 3600); // 1 hour TTL
  } catch (err) {
    console.error("Redis cacheQueueState error:", err);
  }
}

/**
 * Get cached queue snapshot from Redis
 * @param {string} sessionId
 * @returns {Promise<Array|null>}
 */
export async function getCachedQueue(sessionId) {
  if (!sessionId) return null;
  try {
    return await getFromRedis(SESSION_KEYS.queue(sessionId));
  } catch (err) {
    console.error("Redis getCachedQueue error:", err);
    return null;
  }
}

/**
 * Cache session status in Redis
 * @param {string} sessionId
 * @param {object} state
 */
export async function cacheSessionState(sessionId, state) {
  if (!sessionId) return;
  try {
    await setInRedis(SESSION_KEYS.state(sessionId), state, 3600);
  } catch (err) {
    console.error("Redis cacheSessionState error:", err);
  }
}

/**
 * Clean up all Redis keys for a concluded session
 * @param {string} sessionId
 */
export async function clearSessionRedis(sessionId) {
  if (!sessionId) return;
  try {
    await Promise.all([
      deleteFromRedis(SESSION_KEYS.members(sessionId)),
      deleteFromRedis(SESSION_KEYS.state(sessionId)),
      deleteFromRedis(SESSION_KEYS.queue(sessionId)),
    ]);
  } catch (err) {
    console.error("Redis clearSessionRedis error:", err);
  }
}
