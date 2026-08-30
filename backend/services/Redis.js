import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export { redis };

export const getFromRedis = async (key) => {
  try {
    return await redis.get(key);
  } catch (error) {
    console.error(`Redis GET error [${key}]:`, error);
    throw error;
  }
};

/**
 * Set value in Redis
 *
 * @param {string} key
 * @param {*} value
 * @param {number} expirationInSeconds - optional
 */
export const setInRedis = async (
  key,
  value,
  expirationInSeconds = null
) => {
  try {
    if (expirationInSeconds) {
      return await redis.set(key, value, {
        ex: expirationInSeconds,
      });
    }

    return await redis.set(key, value);
  } catch (error) {
    console.error(`Redis SET error [${key}]:`, error);
    throw error;
  }
};

/**
 * Delete key from Redis
 */
export const deleteFromRedis = async (key) => {
  try {
    return await redis.del(key);
  } catch (error) {
    console.error(`Redis DELETE error [${key}]:`, error);
    throw error;
  }
};

/**
 * Check whether a key exists
 */
export const existsInRedis = async (key) => {
  try {
    return await redis.exists(key);
  } catch (error) {
    console.error(`Redis EXISTS error [${key}]:`, error);
    throw error;
  }
};

/**
 * Get multiple keys
 */
export const getManyFromRedis = async (keys) => {
  try {
    return await redis.mget(...keys);
  } catch (error) {
    console.error("Redis MGET error:", error);
    throw error;
  }
};

/**
 * Delete multiple keys
 */
export const deleteManyFromRedis = async (keys) => {
  try {
    if (!keys?.length) return 0;

    return await redis.del(...keys);
  } catch (error) {
    console.error("Redis DELETE MANY error:", error);
    throw error;
  }
};

/**
 * Set expiration on an existing key
 *
 * @param {string} key
 * @param {number} seconds
 */
export const expireRedis = async (key, seconds) => {
  try {
    return await redis.expire(key, seconds);
  } catch (error) {
    console.error(`Redis EXPIRE error [${key}]:`, error);
    throw error;
  }
};

/**
 * Get remaining TTL of a key
 */
export const getRedisTTL = async (key) => {
  try {
    return await redis.ttl(key);
  } catch (error) {
    console.error(`Redis TTL error [${key}]:`, error);
    throw error;
  }
};

/**
 * Increment a number
 */
export const incrementRedis = async (key, amount = 1) => {
  try {
    return await redis.incrby(key, amount);
  } catch (error) {
    console.error(`Redis INCREMENT error [${key}]:`, error);
    throw error;
  }
};

/**
 * Decrement a number
 */
export const decrementRedis = async (key, amount = 1) => {
  try {
    return await redis.decrby(key, amount);
  } catch (error) {
    console.error(`Redis DECREMENT error [${key}]:`, error);
    throw error;
  }
};

/**
 * Push item to Redis list
 */
export const pushToRedisList = async (key, value) => {
  try {
    return await redis.rpush(key, value);
  } catch (error) {
    console.error(`Redis RPUSH error [${key}]:`, error);
    throw error;
  }
};

export const setRedisList = async (key, values = []) => {
  try {
    await redis.del(key);
    if (!Array.isArray(values) || values.length === 0) return 0;
    return await redis.rpush(key, ...values);
  } catch (error) {
    console.error(`Redis SET LIST error [${key}]:`, error);
    throw error;
  }
};

/**
 * Get all items from Redis list
 */
export const getRedisList = async (key) => {
  try {
    return await redis.lrange(key, 0, -1);
  } catch (error) {
    console.error(`Redis LRANGE error [${key}]:`, error);
    throw error;
  }
};

export const addToRedisSet = async (key, ...values) => {
  try {
    if (!values.length) return 0;
    return await redis.sadd(key, ...values);
  } catch (error) {
    console.error(`Redis SADD error [${key}]:`, error);
    throw error;
  }
};

export const removeFromRedisSet = async (key, ...values) => {
  try {
    if (!values.length) return 0;
    return await redis.srem(key, ...values);
  } catch (error) {
    console.error(`Redis SREM error [${key}]:`, error);
    throw error;
  }
};

export const getRedisSet = async (key) => {
  try {
    return await redis.smembers(key);
  } catch (error) {
    console.error(`Redis SMEMBERS error [${key}]:`, error);
    throw error;
  }
};

export const setRedisHash = async (key, value = {}) => {
  try {
    return await redis.hset(key, value);
  } catch (error) {
    console.error(`Redis HSET error [${key}]:`, error);
    throw error;
  }
};

export const getRedisHash = async (key) => {
  try {
    return await redis.hgetall(key);
  } catch (error) {
    console.error(`Redis HGETALL error [${key}]:`, error);
    throw error;
  }
};

/**
 * Clear all Redis data
 *
 * ⚠️ Use carefully. This deletes everything.
 */
export const clearRedis = async () => {
  try {
    return await redis.flushdb();
  } catch (error) {
    console.error("Redis FLUSHDB error:", error);
    throw error;
  }
};

/**
 * Test Redis connection
 */
export const testRedis = async () => {
  try {
    const result = await redis.ping();
    console.log("Redis connected:", result);
    return result;
  } catch (error) {
    console.error("Redis connection failed:", error);
    throw error;
  }
};
