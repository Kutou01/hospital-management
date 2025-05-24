"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectRedis = exports.getRedisClient = exports.connectRedis = void 0;
const redis_1 = require("redis");
const logger_1 = __importDefault(require("@hospital/shared/src/utils/logger"));
let redisClient;
const connectRedis = async () => {
    try {
        redisClient = (0, redis_1.createClient)({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
        });
        redisClient.on('error', (err) => {
            logger_1.default.error('Redis Client Error', { error: err.message });
        });
        redisClient.on('connect', () => {
            logger_1.default.info('Redis Client Connected');
        });
        redisClient.on('ready', () => {
            logger_1.default.info('Redis Client Ready');
        });
        redisClient.on('end', () => {
            logger_1.default.info('Redis Client Disconnected');
        });
        await redisClient.connect();
        // Test the connection
        await redisClient.ping();
        logger_1.default.info('Redis connected successfully');
    }
    catch (error) {
        logger_1.default.error('Redis connection failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Don't throw error, just log it - Redis is optional for API Gateway
    }
};
exports.connectRedis = connectRedis;
const getRedisClient = () => {
    return redisClient || null;
};
exports.getRedisClient = getRedisClient;
const disconnectRedis = async () => {
    if (redisClient) {
        await redisClient.quit();
        logger_1.default.info('Redis disconnected');
    }
};
exports.disconnectRedis = disconnectRedis;
