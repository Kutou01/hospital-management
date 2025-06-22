"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
console.log('=== START billing-service ===');
// Load environment variables
dotenv_1.default.config();
console.log('✅ dotenv.config() completed');
const app_1 = __importDefault(require("./app"));
console.log('🔄 About to import app...');
// import { logger } from '@hospital/shared'; // Comment out logger for debugging
const PORT = process.env.PORT || 3008;
const SERVICE_NAME = 'billing-service';
// Graceful shutdown handler
const gracefulShutdown = (signal) => {
    console.log(`${signal} received. Starting graceful shutdown...`);
    server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
    });
    // Force close after 30 seconds
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 30000);
};
// Start server
const server = app_1.default.listen(PORT, () => {
    console.log(`${SERVICE_NAME} is running on port ${PORT}`, {
        service: SERVICE_NAME,
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
    console.log(`Health check available at: http://localhost:${PORT}/health`);
    console.log(`API documentation available at: http://localhost:${PORT}/docs`);
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', { promise, reason });
    gracefulShutdown('UNHANDLED_REJECTION');
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    if (error instanceof Error) {
        console.error('Uncaught Exception:', { error: error.message, stack: error.stack });
    }
    else {
        console.error('Uncaught Exception:', error);
    }
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});
// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
exports.default = server;
//# sourceMappingURL=index.js.map