"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = require("./app");
// Load environment variables
dotenv_1.default.config();
const PORT = process.env.PORT || 3100;
async function startServer() {
    try {
        console.log('Starting API Gateway...');
        // Create Express app with full proxy configuration
        const app = await (0, app_1.createApp)();
        // Start server
        const server = app.listen(PORT, () => {
            console.log(`🚀 API Gateway running on port ${PORT}`);
            console.log(`📚 Health check: http://localhost:${PORT}/health`);
            console.log(`🌐 API Gateway: http://localhost:${PORT}`);
        });
        // Graceful shutdown
        const gracefulShutdown = (signal) => {
            console.log(`Received ${signal}, shutting down gracefully`);
            server.close(() => {
                console.log('API Gateway stopped');
                process.exit(0);
            });
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }
    catch (error) {
        console.error('Failed to start API Gateway:', error);
        process.exit(1);
    }
}
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', { promise, reason });
    process.exit(1);
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', { error: error.message, stack: error.stack });
    process.exit(1);
});
startServer();
