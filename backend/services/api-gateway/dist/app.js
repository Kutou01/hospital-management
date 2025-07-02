"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_proxy_middleware_1 = require("http-proxy-middleware");
const swagger_config_1 = require("./config/swagger.config");
// import { stream } from '@hospital/shared/src/utils/logger';
const shared_1 = require("@hospital/shared");
const response_helpers_1 = require("@hospital/shared/dist/utils/response-helpers");
const validation_middleware_1 = require("@hospital/shared/dist/middleware/validation.middleware");
const versioning_middleware_1 = require("@hospital/shared/dist/middleware/versioning.middleware");
const auth_middleware_1 = require("./middleware/auth.middleware");
const service_registry_1 = require("./services/service-registry");
const health_routes_1 = __importDefault(require("./routes/health.routes"));
function createApp() {
    const app = (0, express_1.default)();
    const serviceRegistry = service_registry_1.ServiceRegistry.getInstance();
    const DOCTOR_ONLY_MODE = process.env.DOCTOR_ONLY_MODE === 'true';
    // Initialize ResponseHelper
    response_helpers_1.ResponseHelper.initialize('Hospital Management API Gateway', '1.0.0');
    // Helper function for disabled services
    const createDisabledServiceHandler = (serviceName) => {
        return (req, res) => {
            const errorResponse = response_helpers_1.ResponseHelper.serviceUnavailable(serviceName);
            errorResponse.error.details = {
                mode: 'doctor-only-development',
                availableServices: ['doctors']
            };
            res.status(503).json(errorResponse);
        };
    };
    // Security middleware
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        credentials: true,
    }));
    // Add request ID to all responses
    app.use(response_helpers_1.addRequestId);
    // Rate limiting - exclude health endpoints
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // limit each IP to 1000 requests per windowMs
        message: 'Too many requests from this IP, please try again later.',
        skip: (req) => {
            // Skip rate limiting for health check endpoints
            return req.path.includes('/health') || req.path === '/metrics';
        }
    });
    app.use(limiter);
    // Body parsing middleware
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true }));
    // Phase 2 Middleware - API Optimization
    app.use(validation_middleware_1.sanitizeInput); // Sanitize input data
    app.use((0, versioning_middleware_1.createVersioningMiddleware)()); // API versioning
    app.use((0, versioning_middleware_1.responseTransformMiddleware)()); // Response transformation based on version
    // Logging middleware
    app.use((0, morgan_1.default)('combined'));
    // Metrics middleware
    app.use((0, shared_1.metricsMiddleware)('api-gateway'));
    // Setup comprehensive OpenAPI 3.0 documentation
    (0, swagger_config_1.setupSwagger)(app);
    // Validate OpenAPI specification
    (0, swagger_config_1.validateOpenAPISpec)();
    // Health check endpoint
    app.use('/health', health_routes_1.default);
    // Public health endpoints for individual services (no auth required)
    app.get('/api/auth/health', (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
        changeOrigin: true,
        pathRewrite: {
            '^/api/auth/health': '/health',
        },
        onError: (err, req, res) => {
            console.error('Auth Service Health Proxy Error:', err);
            res.status(503).json({ error: 'Auth service health check unavailable' });
        },
    }));
    app.get('/api/doctors/health', (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: process.env.DOCTOR_SERVICE_URL || 'http://doctor-service:3002',
        changeOrigin: true,
        pathRewrite: {
            '^/api/doctors/health': '/health',
        },
        onError: (err, req, res) => {
            console.error('Doctor Service Health Proxy Error:', err);
            res.status(503).json({ error: 'Doctor service health check unavailable' });
        },
    }));
    app.get('/api/patients/health', (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: process.env.PATIENT_SERVICE_URL || 'http://patient-service:3003',
        changeOrigin: true,
        pathRewrite: {
            '^/api/patients/health': '/health',
        },
        onError: (err, req, res) => {
            console.error('Patient Service Health Proxy Error:', err);
            res.status(503).json({ error: 'Patient service health check unavailable' });
        },
    }));
    app.get('/api/appointments/health', (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: process.env.APPOINTMENT_SERVICE_URL || 'http://appointment-service:3004',
        changeOrigin: true,
        pathRewrite: {
            '^/api/appointments/health': '/health',
        },
        onError: (err, req, res) => {
            console.error('Appointment Service Health Proxy Error:', err);
            res.status(503).json({ error: 'Appointment service health check unavailable' });
        },
    }));
    app.get('/api/departments/health', (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: process.env.DEPARTMENT_SERVICE_URL || 'http://department-service:3005',
        changeOrigin: true,
        pathRewrite: {
            '^/api/departments/health': '/health',
        },
        onError: (err, req, res) => {
            console.error('Department Service Health Proxy Error:', err);
            res.status(503).json({ error: 'Department service health check unavailable' });
        },
    }));
    // Metrics endpoint for Prometheus
    app.get('/metrics', shared_1.getMetricsHandler);
    // Auth Service Routes (Public - no auth middleware)
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
    console.log('🔧 Auth Service URL:', authServiceUrl);
    console.log('🔧 Environment AUTH_SERVICE_URL:', process.env.AUTH_SERVICE_URL);
    // General auth routes (excluding health which is handled above)
    app.use('/api/auth', (req, res, next) => {
        // Skip if this is a health check request (already handled above)
        if (req.path === '/health') {
            return next('route');
        }
        next();
    }, (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: authServiceUrl,
        changeOrigin: true,
        pathRewrite: {
            '^/api/auth': '/api/auth',
        },
        timeout: 10000, // 10 second timeout
        proxyTimeout: 10000,
        onError: (err, req, res) => {
            console.error('Auth Service Proxy Error:', err);
            if (!res.headersSent) {
                res.status(503).json({ error: 'Auth service unavailable' });
            }
        },
        onProxyReq: (proxyReq, req, res) => {
            console.log('Proxying auth request:', req.method, req.url);
            // Fix content-length for POST requests
            if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        },
        onProxyRes: (proxyRes, req, res) => {
            console.log('Auth service response:', proxyRes.statusCode, req.method, req.url);
        }
    }));
    // Protected routes - require authentication via Auth Service
    // Doctor Service Routes
    app.use('/api/doctors', (req, res, next) => {
        // Skip auth for health check (already handled above)
        if (req.path === '/health') {
            return next('route');
        }
        next();
    }, auth_middleware_1.authMiddleware, (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: process.env.DOCTOR_SERVICE_URL || 'http://doctor-service:3002',
        changeOrigin: true,
        pathRewrite: {
            '^/api/doctors': '/api/doctors',
        },
        timeout: 30000,
        proxyTimeout: 30000,
        onError: (err, req, res) => {
            console.error('🚨 Doctor Service Proxy Error:', err);
            if (!res.headersSent) {
                res.status(503).json({
                    error: 'Doctor service unavailable',
                    details: err.message,
                    timestamp: new Date().toISOString()
                });
            }
        },
        onProxyReq: (proxyReq, req, res) => {
            console.log('🔄 Proxying doctor request:', req.method, req.originalUrl, '→', proxyReq.path);
            // Forward authentication headers
            if (req.headers.authorization) {
                proxyReq.setHeader('Authorization', req.headers.authorization);
            }
            // Forward user info from auth middleware
            if (req.user) {
                proxyReq.setHeader('X-User-ID', req.user.userId);
                proxyReq.setHeader('X-User-Role', req.user.role);
                proxyReq.setHeader('X-User-Email', req.user.email);
            }
            // Fix content-length for POST/PUT/PATCH requests
            if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        },
        onProxyRes: (proxyRes, req, res) => {
            console.log('✅ Doctor service response:', proxyRes.statusCode, req.method, req.originalUrl);
        }
    }));
    // REMOVED: Duplicate /api/experiences route - use /api/doctors/:id/experiences instead
    // Patient Service Routes - ENABLED
    app.use('/api/patients', (req, res, next) => {
        // Skip auth for health check (already handled above)
        if (req.path === '/health') {
            return next('route');
        }
        next();
    }, auth_middleware_1.authMiddleware, (0, http_proxy_middleware_1.createProxyMiddleware)({
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
    // Appointment Service Routes - ENABLED
    app.use('/api/appointments', (req, res, next) => {
        // Skip auth for health check (already handled above)
        if (req.path === '/health') {
            return next('route');
        }
        next();
    }, auth_middleware_1.authMiddleware, (0, http_proxy_middleware_1.createProxyMiddleware)({
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
    // Medical Records Service Routes - ENABLED
    app.use('/api/medical-records', auth_middleware_1.authMiddleware, (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: process.env.MEDICAL_RECORDS_SERVICE_URL || 'http://medical-records-service:3006',
        changeOrigin: true,
        pathRewrite: {
            '^/api/medical-records': '/api/medical-records',
        },
        onError: (err, req, res) => {
            console.error('Medical Records Service Proxy Error:', err);
            res.status(503).json({ error: 'Medical records service unavailable' });
        },
    }));
    // Prescription Service Routes - ENABLED
    app.use('/api/prescriptions', auth_middleware_1.authMiddleware, (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: process.env.PRESCRIPTION_SERVICE_URL || 'http://prescription-service:3007',
        changeOrigin: true,
        pathRewrite: {
            '^/api/prescriptions': '/api/prescriptions',
        },
        onError: (err, req, res) => {
            console.error('Prescription Service Proxy Error:', err);
            res.status(503).json({ error: 'Prescription service unavailable' });
        },
    }));
    // Billing Service Routes - ENABLED
    app.use('/api/billing', auth_middleware_1.authMiddleware, (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: process.env.BILLING_SERVICE_URL || 'http://billing-service:3007',
        changeOrigin: true,
        pathRewrite: {
            '^/api/billing': '/api/billing',
        },
        onError: (err, req, res) => {
            console.error('Billing Service Proxy Error:', err);
            res.status(503).json({ error: 'Billing service unavailable' });
        },
    }));
    // Payment Service Routes - ENABLED
    app.use('/api/payments', (req, res, next) => {
        // Skip auth for health check and webhooks
        if (req.path === '/health' || req.path.startsWith('/webhooks')) {
            return next('route');
        }
        next();
    }, auth_middleware_1.authMiddleware, (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3008',
        changeOrigin: true,
        pathRewrite: {
            '^/api/payments': '/api/payments',
        },
        onError: (err, req, res) => {
            console.error('Payment Service Proxy Error:', err);
            res.status(503).json({ error: 'Payment service unavailable' });
        },
    }));
    // Payment Webhooks (no auth required)
    app.use('/api/webhooks', (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3008',
        changeOrigin: true,
        pathRewrite: {
            '^/api/webhooks': '/api/webhooks',
        },
        onError: (err, req, res) => {
            console.error('Payment Webhook Proxy Error:', err);
            res.status(503).json({ error: 'Payment webhook service unavailable' });
        },
    }));
    // Department Service Routes - ENABLED (100% Complete)
    app.use('/api/departments', (req, res, next) => {
        // Skip auth for health check (already handled above)
        if (req.path === '/health') {
            return next('route');
        }
        next();
    }, auth_middleware_1.authMiddleware, (0, http_proxy_middleware_1.createProxyMiddleware)({
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
    // Specialty Service Routes (part of Department Service)
    app.use('/api/specialties', auth_middleware_1.authMiddleware, (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: process.env.DEPARTMENT_SERVICE_URL || 'http://department-service:3005',
        changeOrigin: true,
        pathRewrite: {
            '^/api/specialties': '/api/specialties',
        },
        onError: (err, req, res) => {
            console.error('Specialty Service Proxy Error:', err);
            res.status(503).json({ error: 'Specialty service unavailable' });
        },
    }));
    // Room Service Routes (part of Department Service)
    app.use('/api/rooms', auth_middleware_1.authMiddleware, (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: process.env.DEPARTMENT_SERVICE_URL || 'http://department-service:3005',
        changeOrigin: true,
        pathRewrite: {
            '^/api/rooms': '/api/rooms',
        },
        onError: (err, req, res) => {
            console.error('Room Service Proxy Error:', err);
            res.status(503).json({ error: 'Room service unavailable' });
        },
    }));
    // Notification Service Routes - ENABLED
    app.use('/api/notifications', auth_middleware_1.authMiddleware, (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3011',
        changeOrigin: true,
        pathRewrite: {
            '^/api/notifications': '/api/notifications',
        },
        onError: (err, req, res) => {
            console.error('Notification Service Proxy Error:', err);
            res.status(503).json({ error: 'Notification service unavailable' });
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
    // ========================================
    // INTERNAL SERVICE-TO-SERVICE ROUTING
    // ========================================
    // These endpoints allow services to communicate through API Gateway
    // instead of direct service-to-service calls
    // Internal Patient Service Routes (for service-to-service communication)
    app.use('/internal/patients', (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: process.env.PATIENT_SERVICE_URL || 'http://patient-service:3003',
        changeOrigin: true,
        pathRewrite: {
            '^/internal/patients': '/api/patients',
        },
        timeout: 10000,
        proxyTimeout: 10000,
        onError: (err, req, res) => {
            console.error('🚨 Internal Patient Service Proxy Error:', err);
            if (!res.headersSent) {
                res.status(503).json({
                    error: 'Internal patient service unavailable',
                    details: err.message,
                    timestamp: new Date().toISOString()
                });
            }
        },
        onProxyReq: (proxyReq, req, res) => {
            // Forward service-to-service headers
            if (req.headers['x-service-name']) {
                proxyReq.setHeader('x-service-name', req.headers['x-service-name']);
            }
            if (req.headers['x-request-id']) {
                proxyReq.setHeader('x-request-id', req.headers['x-request-id']);
            }
        }
    }));
    // Internal Appointment Service Routes (for service-to-service communication)
    app.use('/internal/appointments', (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: process.env.APPOINTMENT_SERVICE_URL || 'http://appointment-service:3004',
        changeOrigin: true,
        pathRewrite: {
            '^/internal/appointments': '/api/appointments',
        },
        timeout: 10000,
        proxyTimeout: 10000,
        onError: (err, req, res) => {
            console.error('🚨 Internal Appointment Service Proxy Error:', err);
            if (!res.headersSent) {
                res.status(503).json({
                    error: 'Internal appointment service unavailable',
                    details: err.message,
                    timestamp: new Date().toISOString()
                });
            }
        },
        onProxyReq: (proxyReq, req, res) => {
            // Forward service-to-service headers
            if (req.headers['x-service-name']) {
                proxyReq.setHeader('x-service-name', req.headers['x-service-name']);
            }
            if (req.headers['x-request-id']) {
                proxyReq.setHeader('x-request-id', req.headers['x-request-id']);
            }
        }
    }));
    // Internal Doctor Service Routes (for service-to-service communication)
    app.use('/internal/doctors', (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: process.env.DOCTOR_SERVICE_URL || 'http://doctor-service:3002',
        changeOrigin: true,
        pathRewrite: {
            '^/internal/doctors': '/api/doctors',
        },
        timeout: 10000,
        proxyTimeout: 10000,
        onError: (err, req, res) => {
            console.error('🚨 Internal Doctor Service Proxy Error:', err);
            if (!res.headersSent) {
                res.status(503).json({
                    error: 'Internal doctor service unavailable',
                    details: err.message,
                    timestamp: new Date().toISOString()
                });
            }
        },
        onProxyReq: (proxyReq, req, res) => {
            // Forward service-to-service headers
            if (req.headers['x-service-name']) {
                proxyReq.setHeader('x-service-name', req.headers['x-service-name']);
            }
            if (req.headers['x-request-id']) {
                proxyReq.setHeader('x-request-id', req.headers['x-request-id']);
            }
        }
    }));
    // Internal Department Service Routes (for service-to-service communication)
    app.use('/internal/departments', (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: process.env.DEPARTMENT_SERVICE_URL || 'http://department-service:3005',
        changeOrigin: true,
        pathRewrite: {
            '^/internal/departments': '/api/departments',
        },
        timeout: 10000,
        proxyTimeout: 10000,
        onError: (err, req, res) => {
            console.error('🚨 Internal Department Service Proxy Error:', err);
            if (!res.headersSent) {
                res.status(503).json({
                    error: 'Internal department service unavailable',
                    details: err.message,
                    timestamp: new Date().toISOString()
                });
            }
        },
        onProxyReq: (proxyReq, req, res) => {
            // Forward service-to-service headers
            if (req.headers['x-service-name']) {
                proxyReq.setHeader('x-service-name', req.headers['x-service-name']);
            }
            if (req.headers['x-request-id']) {
                proxyReq.setHeader('x-request-id', req.headers['x-request-id']);
            }
        }
    }));
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
                }
            },
            disabledServices: [],
            internalRoutes: {
                patients: '/internal/patients',
                appointments: '/internal/appointments',
                doctors: '/internal/doctors',
                departments: '/internal/departments'
            },
            communicationPattern: 'Pure API Gateway Communication',
            timestamp: new Date().toISOString()
        });
    });
    // 404 handler
    app.use('*', (req, res) => {
        res.status(404).json({
            error: 'Route not found',
            path: req.originalUrl,
            method: req.method,
            mode: DOCTOR_ONLY_MODE ? 'doctor-only-development' : 'full-system',
            availableRoutes: ['/api/auth', '/api/doctors', '/api/patients', '/api/appointments', '/api/departments', '/api/specialties', '/api/rooms', '/api/medical-records', '/api/prescriptions', '/api/billing', '/api/notifications', '/health', '/docs', '/services', '/internal/appointments', '/internal/doctors', '/internal/patients', '/internal/departments']
        });
    });
    // Global error handling middleware with Vietnamese messages (must be last)
    app.use(response_helpers_1.globalErrorHandler);
    return app;
}
