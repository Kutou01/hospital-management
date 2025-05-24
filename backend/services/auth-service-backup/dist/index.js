"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Load environment variables FIRST, before any other imports
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = require("./app");
const database_config_1 = require("./config/database.config");
const redis_config_1 = require("./config/redis.config");
// import { getEventBus } from '@hospital/shared/src/events/event-bus';
// import logger from '@hospital/shared/src/utils/logger';
// Simple logger for now
const logger = {
    info: (message, meta) => console.log(`[INFO] ${message}`, meta || ''),
    error: (message, meta) => console.error(`[ERROR] ${message}`, meta || ''),
    warn: (message, meta) => console.warn(`[WARN] ${message}`, meta || ''),
};
const PORT = process.env.PORT || 3001;
const SERVICE_NAME = 'auth-service';
async function startServer() {
    try {
        // Connect to database
        await (0, database_config_1.connectDatabase)();
        logger.info('Database connected successfully');
        // Connect to Redis (optional)
        try {
            await (0, redis_config_1.connectRedis)();
            logger.info('Redis connected successfully');
        }
        catch (error) {
            logger.warn('Redis connection failed, continuing without Redis', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
        // Connect to Event Bus (disabled for now)
        // const eventBus = getEventBus(SERVICE_NAME);
        // if (process.env.RABBITMQ_URL) {
        //   await eventBus.connect(process.env.RABBITMQ_URL);
        //   logger.info('Event bus connected successfully');
        // }
        // Create Express app
        const app = (0, app_1.createApp)();
        // Start server
        const server = app.listen(PORT, () => {
            logger.info(`🚀 Auth Service running on port ${PORT}`, {
                service: SERVICE_NAME,
                port: PORT,
                environment: process.env.NODE_ENV || 'development',
            });
        });
        // Graceful shutdown
        const gracefulShutdown = async (signal) => {
            logger.info(`Received ${signal}, shutting down gracefully`);
            server.close(async () => {
                try {
                    // await eventBus.disconnect();
                    // logger.info('Event bus disconnected');
                    // Close database connections
                    // await disconnectDatabase();
                    logger.info('Database disconnected');
                    process.exit(0);
                }
                catch (error) {
                    logger.error('Error during shutdown', { error });
                    process.exit(1);
                }
            });
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }
    catch (error) {
        logger.error('Failed to start server', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        process.exit(1);
    }
}
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', { promise, reason });
    process.exit(1);
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
    process.exit(1);
});
startServer();
