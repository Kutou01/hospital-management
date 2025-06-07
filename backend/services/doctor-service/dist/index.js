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
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const doctor_routes_1 = __importDefault(require("./routes/doctor.routes"));
const shift_routes_1 = __importDefault(require("./routes/shift.routes"));
const experience_routes_1 = __importDefault(require("./routes/experience.routes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3002;
const SERVICE_NAME = 'doctor-service';
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/health', (req, res) => {
    res.json({
        service: 'Hospital Doctor Service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});
app.use('/api/doctors', doctor_routes_1.default);
app.use('/api/shifts', shift_routes_1.default);
app.use('/api/experiences', experience_routes_1.default);
app.get('/', (req, res) => {
    res.json({
        service: 'Hospital Doctor Service',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method,
    });
});
app.use((err, req, res, next) => {
    logger_1.default.error('Unhandled error:', { error: err.message, stack: err.stack });
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
});
app.listen(PORT, () => {
    logger_1.default.info(`🚀 Doctor Service running on port ${PORT}`, {
        service: SERVICE_NAME,
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
    });
});
const gracefulShutdown = (signal) => {
    logger_1.default.info(`Received ${signal}, shutting down gracefully`);
    process.exit(0);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason, promise) => {
    logger_1.default.error('Unhandled Rejection at:', { promise, reason });
    process.exit(1);
});
process.on('uncaughtException', (error) => {
    logger_1.default.error('Uncaught Exception:', { error: error.message, stack: error.stack });
    process.exit(1);
});
//# sourceMappingURL=index.js.map