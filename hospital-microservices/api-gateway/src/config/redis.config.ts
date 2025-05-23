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
    // Don't throw error, just log it - Redis is optional for API Gateway
  }
};

export const getRedisClient = (): RedisClientType | null => {
  return redisClient || null;
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis disconnected');
  }
};
