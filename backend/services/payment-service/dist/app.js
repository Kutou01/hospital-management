"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const shared_1 = require("@hospital/shared");
const payos_routes_1 = require("./routes/payos.routes");
const payment_routes_1 = require("./routes/payment.routes");
const webhook_routes_1 = require("./routes/webhook.routes");
const error_middleware_1 = require("./middleware/error.middleware");
const auth_middleware_1 = require("./middleware/auth.middleware");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3008;
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        error: 'Too many requests from this IP, please try again later.',
    },
});
app.use('/api/', limiter);
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('combined', {
    stream: {
        write: (message) => shared_1.logger.info(message.trim())
    }
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'payment-service',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
    });
});
app.use('/api/payments/payos', auth_middleware_1.authMiddleware, payos_routes_1.payosRoutes);
app.use('/api/payments', auth_middleware_1.authMiddleware, payment_routes_1.paymentRoutes);
app.use('/api/webhooks', webhook_routes_1.webhookRoutes);
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.originalUrl
    });
});
app.use(error_middleware_1.errorHandler);
process.on('SIGTERM', () => {
    shared_1.logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    shared_1.logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});
app.listen(PORT, () => {
    shared_1.logger.info(`Payment Service running on port ${PORT}`);
    shared_1.logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    shared_1.logger.info(`PayOS Environment: ${process.env.PAYOS_ENVIRONMENT || 'sandbox'}`);
});
exports.default = app;
//# sourceMappingURL=app.js.map