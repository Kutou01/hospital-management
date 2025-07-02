"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables FIRST
dotenv_1.default.config();
const http_1 = require("http");
const app_1 = __importDefault(require("./app"));
const shared_1 = require("@hospital/shared");
const realtime_service_1 = require("./services/realtime.service");
const httpServer = (0, http_1.createServer)(app_1.default);
const PORT = process.env.PORT || 3006;
const SERVICE_NAME = 'medical-records-service';
// Initialize real-time service
const realtimeService = new realtime_service_1.MedicalRecordRealtimeService();
// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
    shared_1.logger.info(`${signal} received. Starting graceful shutdown...`);
    try {
        // Disconnect realtime service
        await realtimeService.disconnect();
        shared_1.logger.info('Real-time service disconnected');
    }
    catch (error) {
        shared_1.logger.error('Error disconnecting real-time service:', error);
    }
    httpServer.close(() => {
        shared_1.logger.info('HTTP server closed.');
        process.exit(0);
    });
    // Force close after 30 seconds
    setTimeout(() => {
        shared_1.logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 30000);
};
// Initialize real-time service and start server
async function startServer() {
    try {
        // Start HTTP server first
        httpServer.listen(PORT, () => {
            shared_1.logger.info(`🚀 ${SERVICE_NAME} with Real-time running on port ${PORT}`, {
                service: SERVICE_NAME,
                port: PORT,
                environment: process.env.NODE_ENV || 'development',
                features: {
                    realtime: true,
                    websocket: true,
                    supabase: true,
                    medical_records_monitoring: true,
                    vital_signs_tracking: true,
                    lab_results_tracking: true
                }
            });
            shared_1.logger.info(`Health check available at: http://localhost:${PORT}/health`);
            shared_1.logger.info(`API documentation available at: http://localhost:${PORT}/docs`);
        });
        // Initialize real-time service with HTTP server
        try {
            await realtimeService.initialize(httpServer);
            shared_1.logger.info('✅ Real-time service initialized successfully');
        }
        catch (realtimeError) {
            shared_1.logger.warn('⚠️ Real-time service failed to initialize, continuing without it:', realtimeError);
        }
    }
    catch (error) {
        shared_1.logger.error('❌ Failed to start Medical Records Service:', error);
        process.exit(1);
    }
}
// Start the server
startServer();
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
exports.default = httpServer;
//# sourceMappingURL=index.js.map