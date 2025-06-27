import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import logger from '@hospital/shared/dist/utils/logger';
import { metricsMiddleware, getMetricsHandler } from '@hospital/shared';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import sessionRoutes from './routes/session.routes';
import { errorHandler } from './middleware/error.middleware';
import { setupSwagger } from './config/swagger';
import { initializeSupabase, testSupabaseConnection } from './config/supabase';

const app = express();
const PORT = process.env.PORT || 3001;
const SERVICE_NAME = 'auth-service';

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-role']
}));

// Rate limiting - exclude health endpoints (TEMPORARILY DISABLED FOR TESTING)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10000'), // Increased limit for development
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health check endpoints AND development testing
    return req.path.includes('/health') || req.path === '/metrics' || process.env.NODE_ENV === 'development';
  }
});

app.use('/api/', limiter);

// Logging
app.use(morgan('combined'));

// Metrics middleware
app.use(metricsMiddleware('auth-service'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Setup Swagger documentation
setupSwagger(app);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const supabaseConnected = await testSupabaseConnection();
    const status = supabaseConnected ? 'healthy' : 'unhealthy';
    const statusCode = supabaseConnected ? 200 : 503;

    res.status(statusCode).json({
      service: 'Hospital Auth Service',
      status,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
      dependencies: {
        supabase: {
          connected: supabaseConnected,
          url: process.env.SUPABASE_URL ? 'configured' : 'missing'
        }
      }
    });
  } catch (error: any) {
    logger.error('Health check error:', error);
    res.status(503).json({
      service: 'Hospital Auth Service',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Metrics endpoint for Prometheus
app.get('/metrics', getMetricsHandler);

// API Routes with error handling
try {
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/sessions', sessionRoutes);
  logger.info('✅ Routes loaded successfully');
} catch (error: any) {
  logger.error('❌ Failed to load routes:', {
    error: error.message,
    stack: error.stack
  });
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Hospital Auth Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    description: 'Authentication microservice using Supabase Auth',
    endpoints: {
      health: '/health',
      docs: '/docs',
      auth: '/api/auth',
      users: '/api/users',
      sessions: '/api/sessions'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    service: SERVICE_NAME,
    availableRoutes: ['/api/auth', '/api/users', '/api/sessions', '/health', '/docs']
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize and start server
const startServer = async () => {
  try {
    logger.info('🔄 Starting server initialization...');

    // Initialize Supabase connection
    await initializeSupabase();

    logger.info('🔄 Starting Express server...');

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 ${SERVICE_NAME} started successfully on port ${PORT}`, {
        service: SERVICE_NAME,
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        supabaseConnected: true
      });
    });

    // Handle server errors
    server.on('error', (error: any) => {
      logger.error('❌ Server error:', {
        error: error.message,
        code: error.code,
        stack: error.stack
      });
      process.exit(1);
    });

  } catch (error: any) {
    logger.error('❌ Failed to start server:', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
