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

  // Metrics endpoint for Prometheus
  app.get('/metrics', getMetricsHandler);

  // Auth Service Routes (Public - no auth middleware)
  app.use('/api/auth', createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
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

  // Other Service Routes - Services not yet implemented
  const disabledServices = [
    { path: '/api/rooms', name: 'Room' },
    { path: '/api/departments', name: 'Department' },
    { path: '/api/notifications', name: 'Notification' }
  ];

  disabledServices.forEach(service => {
    // These services are not yet implemented
    app.use(service.path, (req, res) => {
      res.status(503).json({
        error: 'Service not implemented yet',
        message: `${service.name} service is not yet implemented`
      });
    });
  });

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      service: 'Hospital Management API Gateway',
      version: '1.0.0',
      mode: DOCTOR_ONLY_MODE ? 'doctor-only-development' : 'full-system',
      status: 'running',
      timestamp: new Date().toISOString(),
      docs: '/docs',
      availableServices: ['auth', 'doctors', 'patients', 'appointments', 'medical-records', 'prescriptions', 'billing'],
      disabledServices: ['rooms', 'departments', 'notifications'],
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
        }
      },
      disabledServices: ['rooms', 'departments', 'notifications'],
    });
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Route not found',
      path: req.originalUrl,
      method: req.method,
      mode: DOCTOR_ONLY_MODE ? 'doctor-only-development' : 'full-system',
      availableRoutes: ['/api/auth', '/api/doctors', '/api/patients', '/api/appointments', '/api/medical-records', '/api/prescriptions', '/api/billing', '/health', '/docs', '/services']
    });
  });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}
