import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// import { stream } from '@hospital/shared/src/utils/logger';
import { metricsMiddleware, getMetricsHandler } from '@hospital/shared';
import { authMiddleware } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error.middleware';
import { ServiceRegistry } from './services/service-registry';
import healthRoutes from './routes/health.routes';

export function createApp(): express.Application {
  const app = express();
  const serviceRegistry = ServiceRegistry.getInstance();
  const DOCTOR_ONLY_MODE = process.env.DOCTOR_ONLY_MODE === 'true';

  // Helper function for disabled services
  const createDisabledServiceHandler = (serviceName: string) => {
    return (req: express.Request, res: express.Response) => {
      res.status(503).json({
        error: 'Service temporarily unavailable',
        message: `${serviceName} service is disabled in doctor-only mode`,
        mode: 'doctor-only-development',
        availableServices: ['doctors']
      });
    };
  };

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
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
  app.use(morgan('combined'));

  // Metrics middleware
  app.use(metricsMiddleware('api-gateway'));

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
          url: process.env.API_URL || 'http://localhost:3100',
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

  // Public health endpoints for individual services (no auth required)
  app.get('/api/auth/health', createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
    changeOrigin: true,
    pathRewrite: {
      '^/api/auth/health': '/health',
    },
    onError: (err: any, req: any, res: any) => {
      console.error('Auth Service Health Proxy Error:', err);
      res.status(503).json({ error: 'Auth service health check unavailable' });
    },
  }));

  app.get('/api/doctors/health', createProxyMiddleware({
    target: process.env.DOCTOR_SERVICE_URL || 'http://doctor-service:3002',
    changeOrigin: true,
    pathRewrite: {
      '^/api/doctors/health': '/health',
    },
    onError: (err: any, req: any, res: any) => {
      console.error('Doctor Service Health Proxy Error:', err);
      res.status(503).json({ error: 'Doctor service health check unavailable' });
    },
  }));

  app.get('/api/patients/health', createProxyMiddleware({
    target: process.env.PATIENT_SERVICE_URL || 'http://patient-service:3003',
    changeOrigin: true,
    pathRewrite: {
      '^/api/patients/health': '/health',
    },
    onError: (err: any, req: any, res: any) => {
      console.error('Patient Service Health Proxy Error:', err);
      res.status(503).json({ error: 'Patient service health check unavailable' });
    },
  }));

  app.get('/api/appointments/health', createProxyMiddleware({
    target: process.env.APPOINTMENT_SERVICE_URL || 'http://appointment-service:3004',
    changeOrigin: true,
    pathRewrite: {
      '^/api/appointments/health': '/health',
    },
    onError: (err: any, req: any, res: any) => {
      console.error('Appointment Service Health Proxy Error:', err);
      res.status(503).json({ error: 'Appointment service health check unavailable' });
    },
  }));

  app.get('/api/departments/health', createProxyMiddleware({
    target: process.env.DEPARTMENT_SERVICE_URL || 'http://department-service:3005',
    changeOrigin: true,
    pathRewrite: {
      '^/api/departments/health': '/health',
    },
    onError: (err: any, req: any, res: any) => {
      console.error('Department Service Health Proxy Error:', err);
      res.status(503).json({ error: 'Department service health check unavailable' });
    },
  }));

  // Metrics endpoint for Prometheus
  app.get('/metrics', getMetricsHandler);

  // Auth Service Routes (Public - no auth middleware)
  const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
  console.log('🔧 Auth Service URL:', authServiceUrl);
  console.log('🔧 Environment AUTH_SERVICE_URL:', process.env.AUTH_SERVICE_URL);

  app.use('/api/auth', createProxyMiddleware({
    target: authServiceUrl,
    changeOrigin: true,
    pathRewrite: {
      '^/api/auth': '/api/auth',
    },
    timeout: 10000, // 10 second timeout
    proxyTimeout: 10000,
    onError: (err: any, req: any, res: any) => {
      console.error('Auth Service Proxy Error:', err);
      if (!res.headersSent) {
        res.status(503).json({ error: 'Auth service unavailable' });
      }
    },
    onProxyReq: (proxyReq: any, req: any, res: any) => {
      console.log('Proxying auth request:', req.method, req.url);
      // Fix content-length for POST requests
      if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onProxyRes: (proxyRes: any, req: any, res: any) => {
      console.log('Auth service response:', proxyRes.statusCode, req.method, req.url);
    }
  }));

  // Protected routes - require authentication via Auth Service

  // Doctor Service Routes
  app.use('/api/doctors', authMiddleware, createProxyMiddleware({
    target: process.env.DOCTOR_SERVICE_URL || 'http://doctor-service:3002',
    changeOrigin: true,
    pathRewrite: {
      '^/api/doctors': '/api/doctors',
    },
    onError: (err: any, req: any, res: any) => {
      console.error('Doctor Service Proxy Error:', err);
      res.status(503).json({ error: 'Doctor service unavailable' });
    },
  }));

  // Patient Service Routes - ENABLED
  app.use('/api/patients', authMiddleware, createProxyMiddleware({
    target: process.env.PATIENT_SERVICE_URL || 'http://patient-service:3003',
    changeOrigin: true,
    pathRewrite: {
      '^/api/patients': '/api/patients',
    },
    onError: (err: any, req: any, res: any) => {
      console.error('Patient Service Proxy Error:', err);
      res.status(503).json({ error: 'Patient service unavailable' });
    },
  }));

  // Appointment Service Routes - ENABLED
  app.use('/api/appointments', authMiddleware, createProxyMiddleware({
    target: process.env.APPOINTMENT_SERVICE_URL || 'http://appointment-service:3004',
    changeOrigin: true,
    pathRewrite: {
      '^/api/appointments': '/api/appointments',
    },
    onError: (err: any, req: any, res: any) => {
      console.error('Appointment Service Proxy Error:', err);
      res.status(503).json({ error: 'Appointment service unavailable' });
    },
  }));

  // Medical Records Service Routes - ENABLED
  app.use('/api/medical-records', authMiddleware, createProxyMiddleware({
    target: process.env.MEDICAL_RECORDS_SERVICE_URL || 'http://medical-records-service:3006',
    changeOrigin: true,
    pathRewrite: {
      '^/api/medical-records': '/api/medical-records',
    },
    onError: (err: any, req: any, res: any) => {
      console.error('Medical Records Service Proxy Error:', err);
      res.status(503).json({ error: 'Medical records service unavailable' });
    },
  }));

  // Prescription Service Routes - ENABLED
  app.use('/api/prescriptions', authMiddleware, createProxyMiddleware({
    target: process.env.PRESCRIPTION_SERVICE_URL || 'http://prescription-service:3007',
    changeOrigin: true,
    pathRewrite: {
      '^/api/prescriptions': '/api/prescriptions',
    },
    onError: (err: any, req: any, res: any) => {
      console.error('Prescription Service Proxy Error:', err);
      res.status(503).json({ error: 'Prescription service unavailable' });
    },
  }));

  // Billing Service Routes - ENABLED
  app.use('/api/billing', authMiddleware, createProxyMiddleware({
    target: process.env.BILLING_SERVICE_URL || 'http://billing-service:3008',
    changeOrigin: true,
    pathRewrite: {
      '^/api/billing': '/api/billing',
    },
    onError: (err: any, req: any, res: any) => {
      console.error('Billing Service Proxy Error:', err);
      res.status(503).json({ error: 'Billing service unavailable' });
    },
  }));

  // Department Service Routes - ENABLED (100% Complete)
  app.use('/api/departments', authMiddleware, createProxyMiddleware({
    target: process.env.DEPARTMENT_SERVICE_URL || 'http://department-service:3005',
    changeOrigin: true,
    pathRewrite: {
      '^/api/departments': '/api/departments',
    },
    onError: (err: any, req: any, res: any) => {
      console.error('Department Service Proxy Error:', err);
      res.status(503).json({ error: 'Department service unavailable' });
    },
  }));

  // Specialty Service Routes (part of Department Service)
  app.use('/api/specialties', authMiddleware, createProxyMiddleware({
    target: process.env.DEPARTMENT_SERVICE_URL || 'http://department-service:3005',
    changeOrigin: true,
    pathRewrite: {
      '^/api/specialties': '/api/specialties',
    },
    onError: (err: any, req: any, res: any) => {
      console.error('Specialty Service Proxy Error:', err);
      res.status(503).json({ error: 'Specialty service unavailable' });
    },
  }));

  // Room Service Routes (part of Department Service)
  app.use('/api/rooms', authMiddleware, createProxyMiddleware({
    target: process.env.DEPARTMENT_SERVICE_URL || 'http://department-service:3005',
    changeOrigin: true,
    pathRewrite: {
      '^/api/rooms': '/api/rooms',
    },
    onError: (err: any, req: any, res: any) => {
      console.error('Room Service Proxy Error:', err);
      res.status(503).json({ error: 'Room service unavailable' });
    },
  }));

  // Notification Service Routes - ENABLED
  app.use('/api/notifications', authMiddleware, createProxyMiddleware({
    target: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3011',
    changeOrigin: true,
    pathRewrite: {
      '^/api/notifications': '/api/notifications',
    },
    onError: (err: any, req: any, res: any) => {
      console.error('Notification Service Proxy Error:', err);
      res.status(503).json({ error: 'Notification service unavailable' });
    },
  }));

  // Chatbot Booking Service Routes - ENABLED (Public access for AI booking)
  app.use('/api/chatbot-booking', createProxyMiddleware({
    target: process.env.CHATBOT_BOOKING_SERVICE_URL || 'http://chatbot-booking-service:3015',
    changeOrigin: true,
    pathRewrite: {
      '^/api/chatbot-booking': '/api',
    },
    onError: (err: any, req: any, res: any) => {
      console.error('Chatbot Booking Service Proxy Error:', err);
      res.status(503).json({ error: 'Chatbot booking service unavailable' });
    },
  }));

  // Chatbot Consultation Service Routes - ENABLED (Public access for AI consultation)
  app.use('/api/chatbot', createProxyMiddleware({
    target: process.env.CHATBOT_CONSULTATION_SERVICE_URL || 'http://chatbot-consultation-service:3020',
    changeOrigin: true,
    pathRewrite: {
      '^/api/chatbot': '/api',
    },
    onError: (err: any, req: any, res: any) => {
      console.error('Chatbot Consultation Service Proxy Error:', err);
      res.status(503).json({ error: 'Chatbot consultation service unavailable' });
    },
  }));

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      service: 'Hospital Management API Gateway',
      version: '1.0.0',
      mode: DOCTOR_ONLY_MODE ? 'doctor-only-development' : 'full-system',
      status: 'running',
      timestamp: new Date().toISOString(),
      docs: '/docs',
      availableServices: ['auth', 'doctors', 'patients', 'appointments', 'departments', 'specialties', 'rooms', 'medical-records', 'prescriptions', 'billing', 'notifications'],
      disabledServices: [],
      services: serviceRegistry.getRegisteredServices(),
    });
  });

  // Service discovery endpoint
  app.get('/services', (req, res) => {
    res.json({
      mode: DOCTOR_ONLY_MODE ? 'doctor-only-development' : 'full-system',
      availableServices: {
        auth: {
          url: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
          status: 'active'
        },
        doctors: {
          url: process.env.DOCTOR_SERVICE_URL || 'http://doctor-service:3002',
          status: 'active'
        },
        patients: {
          url: process.env.PATIENT_SERVICE_URL || 'http://patient-service:3003',
          status: 'active'
        },
        appointments: {
          url: process.env.APPOINTMENT_SERVICE_URL || 'http://appointment-service:3004',
          status: 'active'
        },
        departments: {
          url: process.env.DEPARTMENT_SERVICE_URL || 'http://department-service:3005',
          status: 'active'
        },
        specialties: {
          url: process.env.DEPARTMENT_SERVICE_URL || 'http://department-service:3005',
          status: 'active'
        },
        rooms: {
          url: process.env.DEPARTMENT_SERVICE_URL || 'http://department-service:3005',
          status: 'active'
        },
        'medical-records': {
          url: process.env.MEDICAL_RECORDS_SERVICE_URL || 'http://medical-records-service:3006',
          status: 'active'
        },
        prescriptions: {
          url: process.env.PRESCRIPTION_SERVICE_URL || 'http://prescription-service:3007',
          status: 'active'
        },
        billing: {
          url: process.env.BILLING_SERVICE_URL || 'http://billing-service:3008',
          status: 'active'
        },
        notifications: {
          url: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3011',
          status: 'active'
        },
        'chatbot-booking': {
          url: process.env.CHATBOT_BOOKING_SERVICE_URL || 'http://chatbot-booking-service:3015',
          status: 'active'
        },
        'chatbot-consultation': {
          url: process.env.CHATBOT_CONSULTATION_SERVICE_URL || 'http://chatbot-consultation-service:3020',
          status: 'active'
        }
      },
      disabledServices: [],
    });
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Route not found',
      path: req.originalUrl,
      method: req.method,
      mode: DOCTOR_ONLY_MODE ? 'doctor-only-development' : 'full-system',
      availableRoutes: ['/api/auth', '/api/doctors', '/api/patients', '/api/appointments', '/api/departments', '/api/specialties', '/api/rooms', '/api/medical-records', '/api/prescriptions', '/api/billing', '/api/notifications', '/api/chatbot-booking', '/api/chatbot', '/health', '/docs', '/services']
    });
  });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}
