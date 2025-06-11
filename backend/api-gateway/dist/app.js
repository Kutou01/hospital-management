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
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
// import { stream } from '@hospital/shared/src/utils/logger';
const auth_middleware_1 = require("./middleware/auth.middleware");
const error_middleware_1 = require("./middleware/error.middleware");
const service_registry_1 = require("./services/service-registry");
const health_routes_1 = __importDefault(require("./routes/health.routes"));
function createApp() {
    const app = (0, express_1.default)();
    const serviceRegistry = service_registry_1.ServiceRegistry.getInstance();
    const DOCTOR_ONLY_MODE = process.env.DOCTOR_ONLY_MODE === 'true';
    // Helper function for disabled services
    const createDisabledServiceHandler = (serviceName) => {
        return (req, res) => {
            res.status(503).json({
                error: 'Service temporarily unavailable',
                message: `${serviceName} service is disabled in doctor-only mode`,
                mode: 'doctor-only-development',
                availableServices: ['doctors']
            });
        };
    };
    // Security middleware
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        credentials: true,
    }));
    // Rate limiting
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // limit each IP to 1000 requests per windowMs
        message: 'Too many requests from this IP, please try again later.',
    });
    app.use(limiter);
    // Body parsing middleware
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true }));
    // Logging middleware
    app.use((0, morgan_1.default)('combined'));
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
    const specs = (0, swagger_jsdoc_1.default)(swaggerOptions);
    app.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(specs));
    // Health check endpoint
    app.use('/health', health_routes_1.default);
    // Auth Service Routes (Public - no auth middleware)
    app.use('/api/auth', (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
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
    app.use('/api/doctors', auth_middleware_1.authMiddleware, (0, http_proxy_middleware_1.createProxyMiddleware)({
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
    // Patient Service Routes - ENABLED
    app.use('/api/patients', auth_middleware_1.authMiddleware, (0, http_proxy_middleware_1.createProxyMiddleware)({
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
    app.use('/api/appointments', auth_middleware_1.authMiddleware, (0, http_proxy_middleware_1.createProxyMiddleware)({
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
        target: process.env.BILLING_SERVICE_URL || 'http://billing-service:3008',
        changeOrigin: true,
        pathRewrite: {
            '^/api/billing': '/api/billing',
        },
        onError: (err, req, res) => {
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
    app.use(error_middleware_1.errorHandler);
    return app;
}
