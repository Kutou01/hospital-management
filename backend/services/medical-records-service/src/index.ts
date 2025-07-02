import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

import { createServer } from 'http';
import app from './app';
import { logger } from '@hospital/shared';
import { MedicalRecordRealtimeService } from './services/realtime.service';

const httpServer = createServer(app);
const PORT = process.env.PORT || 3006;
const SERVICE_NAME = 'medical-records-service';

// Initialize real-time service
const realtimeService = new MedicalRecordRealtimeService();

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  try {
    // Disconnect realtime service
    await realtimeService.disconnect();
    logger.info('Real-time service disconnected');
  } catch (error) {
    logger.error('Error disconnecting real-time service:', error);
  }

  httpServer.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });

  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Initialize real-time service and start server
async function startServer() {
  try {
    // Start HTTP server first
    httpServer.listen(PORT, () => {
      logger.info(`🚀 ${SERVICE_NAME} with Real-time running on port ${PORT}`, {
        service: SERVICE_NAME,
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        features: {
          realtime: true,
          websocket: true,
          supabase: true,
          medical_records_monitoring: true,
          vital_signs_tracking: true,
          lab_results_tracking: true
        }
      });

      logger.info(`Health check available at: http://localhost:${PORT}/health`);
      logger.info(`API documentation available at: http://localhost:${PORT}/docs`);
    });

    // Initialize real-time service with HTTP server
    try {
      await realtimeService.initialize(httpServer);
      logger.info('✅ Real-time service initialized successfully');
    } catch (realtimeError) {
      logger.warn('⚠️ Real-time service failed to initialize, continuing without it:', realtimeError);
    }

  } catch (error) {
    logger.error('❌ Failed to start Medical Records Service:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default httpServer;
