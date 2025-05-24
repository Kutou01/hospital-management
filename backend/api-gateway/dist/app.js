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
    // Auth Service Routes (no auth required for login/register)
    console.log('Setting up Auth Service proxy to:', process.env.AUTH_SERVICE_URL || 'http://localhost:3001');
    app.use('/api/auth', (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
        changeOrigin: true,
        pathRewrite: {
            '^/api/auth': '/api/auth',
        },
        onProxyReq: (proxyReq, req, res) => {
            console.log(`🔄 Proxying ${req.method} ${req.url} to Auth Service`);
            // Forward original headers
            proxyReq.setHeader('X-Forwarded-For', req.ip || 'unknown');
            proxyReq.setHeader('X-Forwarded-Proto', req.protocol);
            proxyReq.setHeader('X-Forwarded-Host', req.get('Host') || 'unknown');
        },
        onProxyRes: (proxyRes, req, res) => {
            console.log(`✅ Auth Service responded with ${proxyRes.statusCode} for ${req.method} ${req.url}`);
        },
        onError: (err, req, res) => {
            console.error('❌ Auth Service Proxy Error:', err.message);
            if (!res.headersSent) {
                res.status(503).json({
                    success: false,
                    error: 'Auth service unavailable',
                    message: 'The authentication service is currently unavailable. Please try again later.',
                    timestamp: new Date().toISOString()
                });
            }
        },
    }));
    // Protected routes - require authentication
    app.use('/api/users', auth_middleware_1.authMiddleware, (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
        changeOrigin: true,
        pathRewrite: {
            '^/api/users': '/api/users',
        },
        onError: (err, req, res) => {
            console.error('❌ User Service Proxy Error:', err.message);
            if (!res.headersSent) {
                res.status(503).json({
                    success: false,
                    error: 'User service unavailable',
                    message: 'The user service is currently unavailable. Please try again later.',
                    timestamp: new Date().toISOString()
                });
            }
        },
    }));
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
    // Patient Service Routes
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
    // Appointment Service Routes
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
    // Medical Records Service Routes
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
    // Prescription Service Routes
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
    // Billing Service Routes
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
    // Room Service Routes
    app.use('/api/rooms', auth_middleware_1.authMiddleware, (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: process.env.ROOM_SERVICE_URL || 'http://room-service:3009',
        changeOrigin: true,
        pathRewrite: {
            '^/api/rooms': '/api/rooms',
        },
        onError: (err, req, res) => {
            console.error('Room Service Proxy Error:', err);
            res.status(503).json({ error: 'Room service unavailable' });
        },
    }));
    // Department Service Routes (placeholder for future implementation)
    app.use('/api/departments', auth_middleware_1.authMiddleware, (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: process.env.DEPARTMENT_SERVICE_URL || 'http://department-service:3010',
        changeOrigin: true,
        pathRewrite: {
            '^/api/departments': '/api/departments',
        },
        onError: (err, req, res) => {
            console.error('Department Service Proxy Error:', err);
            res.status(503).json({ error: 'Department service unavailable' });
        },
    }));
    // Notification Service Routes
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
    app.use(error_middleware_1.errorHandler);
    return app;
}
