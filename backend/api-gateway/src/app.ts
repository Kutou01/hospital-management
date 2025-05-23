import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { stream } from '@hospital/shared/src/utils/logger';
import { authMiddleware } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error.middleware';
import { ServiceRegistry } from './services/service-registry';
import healthRoutes from './routes/health.routes';

export function createApp(): express.Application {
  const app = express();
  const serviceRegistry = ServiceRegistry.getInstance();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3100'],
    credentials: true,
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
  });
  app.use(limiter);

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Logging middleware
  app.use(morgan('combined', { stream }));

  // Swagger documentation
  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Hospital Management API Gateway',
        version: '1.0.0',
        description: 'API Gateway for Hospital Management Microservices',
      },
      servers: [
        {
          url: process.env.API_URL || 'http://localhost:3000',
          description: 'API Gateway',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    apis: ['./src/routes/*.ts'],
  };

  const specs = swaggerJsdoc(swaggerOptions);
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

  // Health check endpoint
  app.use('/health', healthRoutes);

  // Auth Service Routes (no auth required for login/register)
  app.use('/api/auth', createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
    changeOrigin: true,
    pathRewrite: {
      '^/api/auth': '/api/auth',
    },
    onError: (err, req, res) => {
      console.error('Auth Service Proxy Error:', err);
      res.status(503).json({ error: 'Auth service unavailable' });
    },
  }));

  // Protected routes - require authentication
  app.use('/api/users', authMiddleware, createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
    changeOrigin: true,
    pathRewrite: {
      '^/api/users': '/api/users',
    },
    onError: (err, req, res) => {
      console.error('User Service Proxy Error:', err);
      res.status(503).json({ error: 'User service unavailable' });
    },
  }));

  // Doctor Service Routes
  app.use('/api/doctors', authMiddleware, createProxyMiddleware({
    target: process.env.DOCTOR_SERVICE_URL || 'http://doctor-service:3002',
    changeOrigin: true,
    pathRewrite: {
      '^/api/doctors': '/api/doctors',
    },
    onError: (err, req, res) => {
      console.error('Doctor Service Proxy Error:', err);
      res.status(503).json({ error: 'Doctor service unavailable' });
    },
  }));

  // Patient Service Routes
  app.use('/api/patients', authMiddleware, createProxyMiddleware({
    target: process.env.PATIENT_SERVICE_URL || 'http://patient-service:3003',
    changeOrigin: true,
    pathRewrite: {
      '^/api/patients': '/api/patients',
    },
    onError: (err, req, res) => {
      console.error('Patient Service Proxy Error:', err);
      res.status(503).json({ error: 'Patient service unavailable' });
    },
  }));

  // Appointment Service Routes
  app.use('/api/appointments', authMiddleware, createProxyMiddleware({
    target: process.env.APPOINTMENT_SERVICE_URL || 'http://appointment-service:3004',
    changeOrigin: true,
    pathRewrite: {
      '^/api/appointments': '/api/appointments',
    },
    onError: (err, req, res) => {
      console.error('Appointment Service Proxy Error:', err);
      res.status(503).json({ error: 'Appointment service unavailable' });
    },
  }));

  // Department Service Routes
  app.use('/api/departments', authMiddleware, createProxyMiddleware({
    target: process.env.DEPARTMENT_SERVICE_URL || 'http://department-service:3005',
    changeOrigin: true,
    pathRewrite: {
      '^/api/departments': '/api/departments',
    },
    onError: (err, req, res) => {
      console.error('Department Service Proxy Error:', err);
      res.status(503).json({ error: 'Department service unavailable' });
    },
  }));

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      service: 'Hospital Management API Gateway',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
      docs: '/docs',
      services: serviceRegistry.getRegisteredServices(),
    });
  });

  // Service discovery endpoint
  app.get('/services', (req, res) => {
    res.json({
      services: serviceRegistry.getRegisteredServices(),
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

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}
