import { createClient, RedisClientType } from 'redis';
import logger from '@hospital/shared/src/utils/logger';

let redisClient: RedisClientType;

export const connectRedis = async (): Promise<void> => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error', { error: err.message });
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

    await redisClient.connect();
    
    // Test the connection
    await redisClient.ping();
    
    logger.info('Redis connected successfully');
  } catch (error) {
    logger.error('Redis connection failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new Error('Redis not connected. Call connectRedis() first.');
  }
  return redisClient;
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
  await client.setEx(key, ttl, JSON.stringify(value));
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  const client = getRedisClient();
  const value = await client.get(key);
  return value ? JSON.parse(value) : null;
};

export const deleteCache = async (key: string): Promise<void> => {
  const client = getRedisClient();
  await client.del(key);
};

export const setCacheWithPattern = async (pattern: string, value: any, ttl: number = 3600): Promise<void> => {
  const client = getRedisClient();
  await client.setEx(pattern, ttl, JSON.stringify(value));
};

export const deleteCachePattern = async (pattern: string): Promise<void> => {
  const client = getRedisClient();
  const keys = await client.keys(pattern);
  if (keys.length > 0) {
    await client.del(keys);
  }
};
