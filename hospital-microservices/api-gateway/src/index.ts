import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3005;
const SERVICE_NAME = 'api-gateway';

async function startServer() {
  try {
    console.log('Starting API Gateway...');

    // Create Express app
    const app = express();

    // Basic middleware
    app.use(helmet());
    app.use(cors());
    app.use(morgan('combined'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        service: 'Hospital API Gateway',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      });
    });

    // Root endpoint
    app.get('/', (req, res) => {
      res.json({
        service: 'Hospital Management API Gateway',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        docs: '/docs',
      });
    });

    // Basic proxy endpoints (without authentication for now)
    app.use('/api/patients', (req, res) => {
      res.json({
        message: 'Patient service proxy',
        method: req.method,
        path: req.path,
        timestamp: new Date().toISOString(),
      });
    });

    app.use('/api/doctors', (req, res) => {
      res.json({
        message: 'Doctor service proxy',
        method: req.method,
        path: req.path,
        timestamp: new Date().toISOString(),
      });
    });

    app.use('/api/appointments', (req, res) => {
      res.json({
        message: 'Appointment service proxy',
        method: req.method,
        path: req.path,
        timestamp: new Date().toISOString(),
      });
    });

    app.use('/api/departments', (req, res) => {
      res.json({
        message: 'Department service proxy',
        method: req.method,
        path: req.path,
        timestamp: new Date().toISOString(),
      });
    });

    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method,
      });
    });

    // Error handling middleware
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Unhandled error:', err.message);
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
      });
    });

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
