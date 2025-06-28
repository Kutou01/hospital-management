import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import logger from '@hospital/shared/dist/utils/logger';
import patientRoutes from './routes/patient.routes';
import { PatientRealtimeService } from './services/realtime.service';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3003;
const SERVICE_NAME = 'patient-service';

// Initialize real-time service
const realtimeService = new PatientRealtimeService();

// EARLY TEST ROUTES - BEFORE ANY MIDDLEWARE
app.get('/early-test', (req, res) => {
  console.log('✅ EARLY TEST ROUTE HIT - Before any middleware');
  res.json({
    success: true,
    message: 'Early test endpoint working - before any middleware',
    query: req.query,
    timestamp: new Date().toISOString()
  });
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint with real-time status
app.get('/health', (req, res) => {
  res.json({
    service: 'Hospital Patient Service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: {
      realtime: realtimeService.isRealtimeConnected(),
      websocket: true,
      supabase_integration: true,
      patient_monitoring: true
    }
  });
});

// Test route to debug the issue - OUTSIDE /api path completely
app.get('/debug-test', (req, res) => {
  console.log('✅ DEBUG TEST ROUTE HIT - Outside /api path');
  res.json({
    success: true,
    message: 'Debug test endpoint working - completely outside /api path',
    query: req.query,
    timestamp: new Date().toISOString()
  });
});

// Test route inside /api but not /api/patients
app.get('/api/debug', (req, res) => {
  console.log('✅ API DEBUG ROUTE HIT - Inside /api but not /api/patients');
  res.json({
    success: true,
    message: 'API debug endpoint working - inside /api but not /api/patients',
    query: req.query,
    timestamp: new Date().toISOString()
  });
});

// Test route to debug the issue
app.get('/api/patients/direct-test', (req, res) => {
  res.json({
    success: true,
    message: 'Direct test endpoint working - bypassing router',
    query: req.query,
    timestamp: new Date().toISOString()
  });
});

// Create a completely new test router
const testRouter = express.Router();
testRouter.get('/working-test', (req, res) => {
  res.json({
    success: true,
    message: 'New test router working',
    query: req.query,
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/test', testRouter);
app.use('/api/patients', patientRoutes);

// Legacy endpoint for backward compatibility
app.get('/patients', (req, res) => {
  res.json({
    message: 'Patient service is running - use /api/patients for API endpoints',
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Hospital Patient Service',
    version: '1.0.0',
    status: 'running',
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
  logger.error('Unhandled error:', { error: err.message, stack: err.stack });
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// Initialize real-time service and start server
async function startServer() {
  try {
    // Start HTTP server first
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Patient Service with Real-time running on port ${PORT}`, {
        service: SERVICE_NAME,
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        features: {
          realtime: true,
          websocket: true,
          supabase: true,
          patient_monitoring: true
        }
      });
    });

    // Initialize real-time service with HTTP server
    await realtimeService.initialize(httpServer);

  } catch (error) {
    logger.error('❌ Failed to start Patient Service:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Graceful shutdown with real-time cleanup
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully`);

  try {
    // Disconnect real-time service
    await realtimeService.disconnect();
    logger.info('✅ Patient Real-time service disconnected');
  } catch (error) {
    logger.error('❌ Error during patient real-time service shutdown:', error);
  }

  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

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
