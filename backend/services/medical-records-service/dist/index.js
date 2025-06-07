"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
const shared_1 = require("@hospital/shared");
// Load environment variables
dotenv_1.default.config();
const PORT = process.env.PORT || 3006;
const SERVICE_NAME = 'medical-records-service';
// Graceful shutdown handler
const gracefulShutdown = (signal) => {
    shared_1.logger.info(`${signal} received. Starting graceful shutdown...`);
    server.close(() => {
        shared_1.logger.info('HTTP server closed.');
        process.exit(0);
    });
    // Force close after 30 seconds
    setTimeout(() => {
        shared_1.logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 30000);
};
// Start server
const server = app_1.default.listen(PORT, () => {
    shared_1.logger.info(`${SERVICE_NAME} is running on port ${PORT}`, {
        service: SERVICE_NAME,
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
    shared_1.logger.info(`Health check available at: http://localhost:${PORT}/health`);
    shared_1.logger.info(`API documentation available at: http://localhost:${PORT}/docs`);
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    shared_1.logger.error('Unhandled Rejection at:', { promise, reason });
    gracefulShutdown('UNHANDLED_REJECTION');
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    shared_1.logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});
// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
exports.default = server;
//# sourceMappingURL=index.js.map