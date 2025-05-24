"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCachePattern = exports.setCacheWithPattern = exports.deleteCache = exports.getCache = exports.setCache = exports.disconnectRedis = exports.isRedisAvailable = exports.getRedisClient = exports.connectRedis = void 0;
const redis_1 = require("redis");
// import logger from '@hospital/shared/src/utils/logger';
// Simple logger for debugging
const logger = {
    info: (message, meta) => console.log(`[INFO] ${message}`, meta || ''),
    error: (message, meta) => console.error(`[ERROR] ${message}`, meta || ''),
    warn: (message, meta) => console.warn(`[WARN] ${message}`, meta || ''),
};
let redisClient = null;
let redisConnectionAttempted = false;
const connectRedis = async () => {
    // Only attempt connection once
    if (redisConnectionAttempted) {
        return;
    }
    redisConnectionAttempted = true;
    try {
        redisClient = (0, redis_1.createClient)({
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
    }
    catch (error) {
        logger.warn('Redis connection failed, continuing without Redis', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Don't throw error, just continue without Redis
        redisClient = null;
    }
};
exports.connectRedis = connectRedis;
const getRedisClient = () => {
    return redisClient || null;
};
exports.getRedisClient = getRedisClient;
const isRedisAvailable = () => {
    return redisClient !== null && redisClient.isReady;
};
exports.isRedisAvailable = isRedisAvailable;
const disconnectRedis = async () => {
    if (redisClient) {
        await redisClient.quit();
        logger.info('Redis disconnected');
    }
};
exports.disconnectRedis = disconnectRedis;
// Helper functions for common Redis operations
const setCache = async (key, value, ttl = 3600) => {
    const client = (0, exports.getRedisClient)();
    if (!client || !(0, exports.isRedisAvailable)()) {
        return; // Silently skip if Redis not available
    }
    try {
        await client.setEx(key, ttl, JSON.stringify(value));
    }
    catch (error) {
        logger.warn('Failed to set cache', { key, error: error instanceof Error ? error.message : 'Unknown error' });
    }
};
exports.setCache = setCache;
const getCache = async (key) => {
    const client = (0, exports.getRedisClient)();
    if (!client || !(0, exports.isRedisAvailable)()) {
        return null; // Return null if Redis not available
    }
    try {
        const value = await client.get(key);
        return value ? JSON.parse(value) : null;
    }
    catch (error) {
        logger.warn('Failed to get cache', { key, error: error instanceof Error ? error.message : 'Unknown error' });
        return null;
    }
};
exports.getCache = getCache;
const deleteCache = async (key) => {
    const client = (0, exports.getRedisClient)();
    if (!client || !(0, exports.isRedisAvailable)()) {
        return; // Silently skip if Redis not available
    }
    try {
        await client.del(key);
    }
    catch (error) {
        logger.warn('Failed to delete cache', { key, error: error instanceof Error ? error.message : 'Unknown error' });
    }
};
exports.deleteCache = deleteCache;
const setCacheWithPattern = async (pattern, value, ttl = 3600) => {
    const client = (0, exports.getRedisClient)();
    if (!client || !(0, exports.isRedisAvailable)()) {
        return; // Silently skip if Redis not available
    }
    try {
        await client.setEx(pattern, ttl, JSON.stringify(value));
    }
    catch (error) {
        logger.warn('Failed to set cache with pattern', { pattern, error: error instanceof Error ? error.message : 'Unknown error' });
    }
};
exports.setCacheWithPattern = setCacheWithPattern;
const deleteCachePattern = async (pattern) => {
    const client = (0, exports.getRedisClient)();
    if (!client || !(0, exports.isRedisAvailable)()) {
        return; // Silently skip if Redis not available
    }
    try {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
            await client.del(keys);
        }
    }
    catch (error) {
        logger.warn('Failed to delete cache pattern', { pattern, error: error instanceof Error ? error.message : 'Unknown error' });
    }
};
exports.deleteCachePattern = deleteCachePattern;
