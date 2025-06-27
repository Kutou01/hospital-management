"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const shared_1 = require("@hospital/shared");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const session_routes_1 = __importDefault(require("./routes/session.routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const swagger_1 = require("./config/swagger");
const supabase_1 = require("./config/supabase");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const SERVICE_NAME = 'auth-service';
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-role']
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10000'),
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        return req.path.includes('/health') || req.path === '/metrics' || process.env.NODE_ENV === 'development';
    }
});
app.use('/api/', limiter);
app.use((0, morgan_1.default)('combined'));
app.use((0, shared_1.metricsMiddleware)('auth-service'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
(0, swagger_1.setupSwagger)(app);
app.get('/health', async (req, res) => {
    try {
        const supabaseConnected = await (0, supabase_1.testSupabaseConnection)();
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
    }
    catch (error) {
        logger_1.default.error('Health check error:', error);
        res.status(503).json({
            service: 'Hospital Auth Service',
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});
app.get('/metrics', shared_1.getMetricsHandler);
try {
    app.use('/api/auth', auth_routes_1.default);
    app.use('/api/users', user_routes_1.default);
    app.use('/api/sessions', session_routes_1.default);
    logger_1.default.info('✅ Routes loaded successfully');
}
catch (error) {
    logger_1.default.error('❌ Failed to load routes:', {
        error: error.message,
        stack: error.stack
    });
}
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
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method,
        service: SERVICE_NAME,
        availableRoutes: ['/api/auth', '/api/users', '/api/sessions', '/health', '/docs']
    });
});
app.use(error_middleware_1.errorHandler);
const startServer = async () => {
    try {
        logger_1.default.info('🔄 Starting server initialization...');
        await (0, supabase_1.initializeSupabase)();
        logger_1.default.info('🔄 Starting Express server...');
        const server = app.listen(PORT, () => {
            logger_1.default.info(`🚀 ${SERVICE_NAME} started successfully on port ${PORT}`, {
                service: SERVICE_NAME,
                port: PORT,
                environment: process.env.NODE_ENV || 'development',
                timestamp: new Date().toISOString(),
                supabaseConnected: true
            });
        });
        server.on('error', (error) => {
            logger_1.default.error('❌ Server error:', {
                error: error.message,
                code: error.code,
                stack: error.stack
            });
            process.exit(1);
        });
    }
    catch (error) {
        logger_1.default.error('❌ Failed to start server:', {
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
};
startServer();
process.on('SIGTERM', () => {
    logger_1.default.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger_1.default.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});
exports.default = app;
//# sourceMappingURL=index.js.map