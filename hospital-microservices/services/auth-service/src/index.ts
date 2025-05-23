import dotenv from 'dotenv';
import { createApp } from './app';
import { connectDatabase } from './config/database.config';
import { connectRedis } from './config/redis.config';
import { getEventBus } from '@hospital/shared/src/events/event-bus';
import logger from '@hospital/shared/src/utils/logger';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3001;
const SERVICE_NAME = 'auth-service';

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    // Connect to Redis
    await connectRedis();
    logger.info('Redis connected successfully');

    // Connect to Event Bus
    const eventBus = getEventBus(SERVICE_NAME);
    if (process.env.RABBITMQ_URL) {
      await eventBus.connect(process.env.RABBITMQ_URL);
      logger.info('Event bus connected successfully');
    }

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Auth Service running on port ${PORT}`, {
        service: SERVICE_NAME,
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
      });
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully`);
      
      server.close(async () => {
        try {
          await eventBus.disconnect();
          logger.info('Event bus disconnected');
          
          // Close database connections
          // await disconnectDatabase();
          logger.info('Database disconnected');
          
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', { error });
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
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
