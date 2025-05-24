import dotenv from 'dotenv';
import { createApp } from './app';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3100;

async function startServer() {
  try {
    console.log('Starting API Gateway...');

    // Create Express app with full proxy configuration
    const app = await createApp();

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚀 API Gateway running on port ${PORT}`);
      console.log(`📚 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 API Gateway: http://localhost:${PORT}`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      console.log(`Received ${signal}, shutting down gracefully`);
      server.close(() => {
        console.log('API Gateway stopped');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start API Gateway:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', { promise, reason });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  process.exit(1);
});

startServer();
