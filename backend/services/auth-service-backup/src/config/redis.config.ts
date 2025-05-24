import { createClient, RedisClientType } from 'redis';
// import logger from '@hospital/shared/src/utils/logger';

// Simple logger for debugging
const logger = {
  info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
  error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || ''),
  warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta || ''),
};

let redisClient: RedisClientType | null = null;

let redisConnectionAttempted = false;

export const connectRedis = async (): Promise<void> => {
  // Only attempt connection once
  if (redisConnectionAttempted) {
    return;
  }
  redisConnectionAttempted = true;

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 3000,
        reconnectStrategy: false, // Disable automatic reconnection
      },
    });

    let hasLogged = false;

    redisClient.on('error', (err) => {
      if (!hasLogged) {
        logger.warn('Redis not available, continuing without Redis', { error: err.message });
        hasLogged = true;
      }
      // Silently ignore subsequent errors
    });

    redisClient.on('connect', () => {
      logger.info('Redis Client Connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis Client Ready');
    });

    redisClient.on('end', () => {
      logger.info('Redis Client Disconnected');
    });

    // Try to connect with timeout
    const connectPromise = redisClient.connect();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Redis connection timeout')), 3000);
    });

    await Promise.race([connectPromise, timeoutPromise]);

    // Test the connection
    await redisClient.ping();

    logger.info('Redis connected successfully');
  } catch (error) {
    logger.warn('Redis connection failed, continuing without Redis', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Don't throw error, just continue without Redis
    redisClient = null;
  }
};

export const getRedisClient = (): RedisClientType | null => {
  return redisClient || null;
};

export const isRedisAvailable = (): boolean => {
  return redisClient !== null && redisClient.isReady;
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis disconnected');
  }
};

// Helper functions for common Redis operations
export const setCache = async (key: string, value: any, ttl: number = 3600): Promise<void> => {
  const client = getRedisClient();
  if (!client || !isRedisAvailable()) {
    return; // Silently skip if Redis not available
  }
  try {
    await client.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    logger.warn('Failed to set cache', { key, error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  const client = getRedisClient();
  if (!client || !isRedisAvailable()) {
    return null; // Return null if Redis not available
  }
  try {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.warn('Failed to get cache', { key, error: error instanceof Error ? error.message : 'Unknown error' });
    return null;
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  const client = getRedisClient();
  if (!client || !isRedisAvailable()) {
    return; // Silently skip if Redis not available
  }
  try {
    await client.del(key);
  } catch (error) {
    logger.warn('Failed to delete cache', { key, error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const setCacheWithPattern = async (pattern: string, value: any, ttl: number = 3600): Promise<void> => {
  const client = getRedisClient();
  if (!client || !isRedisAvailable()) {
    return; // Silently skip if Redis not available
  }
  try {
    await client.setEx(pattern, ttl, JSON.stringify(value));
  } catch (error) {
    logger.warn('Failed to set cache with pattern', { pattern, error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const deleteCachePattern = async (pattern: string): Promise<void> => {
  const client = getRedisClient();
  if (!client || !isRedisAvailable()) {
    return; // Silently skip if Redis not available
  }
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (error) {
    logger.warn('Failed to delete cache pattern', { pattern, error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
