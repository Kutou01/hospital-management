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
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
// Simple logger stream for morgan
const stream = {
    write: (message) => {
        console.log(message.trim());
    }
};
const error_middleware_1 = require("./middleware/error.middleware");
const not_found_middleware_1 = require("./middleware/not-found.middleware");
// Import routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const profile_routes_1 = __importDefault(require("./routes/profile.routes"));
const health_routes_1 = __importDefault(require("./routes/health.routes"));
function createApp() {
    const app = (0, express_1.default)();
    // Security middleware
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3100'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        preflightContinue: false,
        optionsSuccessStatus: 200
    }));
    // Rate limiting
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.',
    });
    app.use(limiter);
    // Body parsing middleware
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true }));
    // Logging middleware
    app.use((0, morgan_1.default)('combined', { stream }));
    // Swagger documentation
    const swaggerOptions = {
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'Hospital Auth Service API',
                version: '1.0.0',
                description: 'Authentication and Authorization Service for Hospital Management System',
            },
            servers: [
                {
                    url: process.env.API_URL || 'http://localhost:3001',
                    description: 'Development server',
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
        apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
    };
    const specs = (0, swagger_jsdoc_1.default)(swaggerOptions);
    app.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(specs));
    // Health check endpoint
    app.use('/health', health_routes_1.default);
    // API routes
    app.use('/api/auth', auth_routes_1.default);
    app.use('/api/users', user_routes_1.default);
    app.use('/api/profiles', profile_routes_1.default);
    // Root endpoint
    app.get('/', (req, res) => {
        res.json({
            service: 'Hospital Auth Service',
            version: '1.0.0',
            status: 'running',
            timestamp: new Date().toISOString(),
            docs: '/docs',
        });
    });
    // 404 handler
    app.use(not_found_middleware_1.notFoundHandler);
    // Error handling middleware (must be last)
    app.use(error_middleware_1.errorHandler);
    return app;
}
