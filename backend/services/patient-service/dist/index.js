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
const http_1 = require("http");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const patient_routes_1 = __importDefault(require("./routes/patient.routes"));
const realtime_service_1 = require("./services/realtime.service");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const PORT = process.env.PORT || 3003;
const SERVICE_NAME = 'patient-service';
const realtimeService = new realtime_service_1.PatientRealtimeService();
app.get('/early-test', (req, res) => {
    console.log('✅ EARLY TEST ROUTE HIT - Before any middleware');
    res.json({
        success: true,
        message: 'Early test endpoint working - before any middleware',
        query: req.query,
        timestamp: new Date().toISOString()
    });
});
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.get('/health', (req, res) => {
    res.json({
        service: 'Hospital Patient Service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        features: {
            realtime: realtimeService.isRealtimeConnected(),
            websocket: true,
            supabase_integration: true,
            patient_monitoring: true
        }
    });
});
app.get('/debug-test', (req, res) => {
    console.log('✅ DEBUG TEST ROUTE HIT - Outside /api path');
    res.json({
        success: true,
        message: 'Debug test endpoint working - completely outside /api path',
        query: req.query,
        timestamp: new Date().toISOString()
    });
});
app.get('/api/debug', (req, res) => {
    console.log('✅ API DEBUG ROUTE HIT - Inside /api but not /api/patients');
    res.json({
        success: true,
        message: 'API debug endpoint working - inside /api but not /api/patients',
        query: req.query,
        timestamp: new Date().toISOString()
    });
});
app.get('/api/patients/direct-test', (req, res) => {
    res.json({
        success: true,
        message: 'Direct test endpoint working - bypassing router',
        query: req.query,
        timestamp: new Date().toISOString()
    });
});
const testRouter = express_1.default.Router();
testRouter.get('/working-test', (req, res) => {
    res.json({
        success: true,
        message: 'New test router working',
        query: req.query,
        timestamp: new Date().toISOString()
    });
});
app.use('/api/test', testRouter);
app.use('/api/patients', patient_routes_1.default);
app.get('/patients', (req, res) => {
    res.json({
        message: 'Patient service is running - use /api/patients for API endpoints',
        timestamp: new Date().toISOString(),
    });
});
app.get('/', (req, res) => {
    res.json({
        service: 'Hospital Patient Service',
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
async function startServer() {
    try {
        httpServer.listen(PORT, () => {
            logger_1.default.info(`🚀 Patient Service with Real-time running on port ${PORT}`, {
                service: SERVICE_NAME,
                port: PORT,
                environment: process.env.NODE_ENV || 'development',
                features: {
                    realtime: true,
                    websocket: true,
                    supabase: true,
                    patient_monitoring: true
                }
            });
        });
        await realtimeService.initialize(httpServer);
    }
    catch (error) {
        logger_1.default.error('❌ Failed to start Patient Service:', error);
        process.exit(1);
    }
}
startServer();
const gracefulShutdown = async (signal) => {
    logger_1.default.info(`Received ${signal}, shutting down gracefully`);
    try {
        await realtimeService.disconnect();
        logger_1.default.info('✅ Patient Real-time service disconnected');
    }
    catch (error) {
        logger_1.default.error('❌ Error during patient real-time service shutdown:', error);
    }
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