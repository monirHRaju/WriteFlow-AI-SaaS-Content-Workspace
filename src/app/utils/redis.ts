import Redis from 'ioredis';
import config from '../config';
import logger from './logger';

let redis: Redis | null = null;

try {
  if (config.redisUrl) {
    redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
      lazyConnect: true, // Prevents blocking app startup if Redis is down
    });

    redis.connect().catch((error) => {
      logger.error('❌ Redis connection error on startup:', error);
    });

    redis.on('connect', () => {
      logger.info('🚀 Connected to Redis successfully');
    });

    redis.on('error', (error) => {
      logger.error('❌ Redis connection error:', error);
    });
  } else {
    logger.warn('⚠️ REDIS_URL not configured. Caching is disabled.');
  }
} catch (error) {
  logger.error('❌ Redis initialization error:', error);
}

/**
 * Retrieve parsed data from Redis cache.
 * @param key Cache key
 * @returns Cached string or null
 */
export const getCache = async (key: string): Promise<string | null> => {
  if (!redis) return null;
  try {
    return await redis.get(key);
  } catch (error) {
    logger.error(`Redis GET error for key ${key}:`, error);
    return null;
  }
};

/**
 * Save data to Redis cache with a TTL (Time-To-Live).
 * @param key Cache key
 * @param value Cache value string
 * @param ttlSeconds TTL in seconds
 */
export const setCache = async (key: string, value: string, ttlSeconds: number): Promise<void> => {
  if (!redis) return;
  try {
    await redis.set(key, value, 'EX', ttlSeconds);
  } catch (error) {
    logger.error(`Redis SET error for key ${key}:`, error);
  }
};

/**
 * Invalidate all Redis keys matching a pattern.
 * @param pattern Glob-style pattern (e.g. "templates:popular:*")
 */
export const invalidateCachePattern = async (pattern: string): Promise<void> => {
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info(`Redis invalidated cache pattern: ${pattern} (${keys.length} keys)`);
    }
  } catch (error) {
    logger.error(`Redis invalidate cache pattern error for ${pattern}:`, error);
  }
};

export default redis;
