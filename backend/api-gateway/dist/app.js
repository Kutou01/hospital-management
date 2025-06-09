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
    // Protected routes - require Supabase authentication
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
    // Other Service Routes - Disabled in Doctor-Only Mode
    const disabledServices = [
        { path: '/api/medical-records', name: 'Medical Records' },
        { path: '/api/prescriptions', name: 'Prescription' },
        { path: '/api/billing', name: 'Billing' },
        { path: '/api/rooms', name: 'Room' },
        { path: '/api/departments', name: 'Department' },
        { path: '/api/notifications', name: 'Notification' }
    ];
    disabledServices.forEach(service => {
        if (DOCTOR_ONLY_MODE) {
            app.use(service.path, createDisabledServiceHandler(service.name));
        }
        else {
            // In full mode, these would be properly configured
            app.use(service.path, (req, res) => {
                res.status(503).json({
                    error: 'Service not implemented yet',
                    message: `${service.name} service is not yet implemented`
                });
            });
        }
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
            availableServices: ['doctors', 'patients', 'appointments', 'medical-records', 'prescriptions', 'billing', 'rooms', 'departments', 'notifications'],
            disabledServices: ['medical-records', 'prescriptions', 'billing', 'rooms', 'departments', 'notifications'],
            services: serviceRegistry.getRegisteredServices(),
        });
    });
    // Service discovery endpoint
    app.get('/services', (req, res) => {
        res.json({
            mode: DOCTOR_ONLY_MODE ? 'doctor-only-development' : 'full-system',
            availableServices: {
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
                }
            },
            disabledServices: ['medical-records', 'prescriptions', 'billing', 'rooms', 'departments', 'notifications'],
        });
    });
    // 404 handler
    app.use('*', (req, res) => {
        res.status(404).json({
            error: 'Route not found',
            path: req.originalUrl,
            method: req.method,
            mode: DOCTOR_ONLY_MODE ? 'doctor-only-development' : 'full-system',
            availableRoutes: ['/api/doctors', '/api/patients', '/api/appointments', '/health', '/docs', '/services']
        });
    });
    // Error handling middleware (must be last)
    app.use(error_middleware_1.errorHandler);
    return app;
}
