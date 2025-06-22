"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_config_1 = require("./config/database.config");
const department_routes_1 = __importDefault(require("./routes/department.routes"));
const room_routes_1 = __importDefault(require("./routes/room.routes"));
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3005;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
}));
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.get('/health', async (req, res) => {
    try {
        const dbConnected = await (0, database_config_1.testConnection)();
        res.json({
            service: 'Hospital Department Service',
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            database: dbConnected ? 'connected' : 'disconnected',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            environment: process.env.NODE_ENV || 'development',
        });
    }
    catch (error) {
        res.status(500).json({
            service: 'Hospital Department Service',
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
app.use('/api/departments', department_routes_1.default);
app.use('/api/rooms', room_routes_1.default);
app.get('/api/specialties', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                specialty_id: 'SPEC001',
                specialty_name: 'Cardiology',
                specialty_code: 'CARD',
                department_id: 'DEPT001',
                description: 'Heart and cardiovascular system',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ],
        message: 'Specialties retrieved successfully (test endpoint)',
        timestamp: new Date().toISOString()
    });
});
app.get('/', (req, res) => {
    res.json({
        service: 'Hospital Department Service',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/health',
            departments: '/api/departments',
            specialties: '/api/specialties',
            rooms: '/api/rooms',
        },
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method,
        service: 'Hospital Department Service',
        timestamp: new Date().toISOString(),
    });
});
app.use((error, req, res, next) => {
    logger_1.default.error('Unhandled error:', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
    });
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        timestamp: new Date().toISOString(),
    });
});
const startServer = async () => {
    try {
        const dbConnected = await (0, database_config_1.testConnection)();
        if (!dbConnected) {
            logger_1.default.error('Failed to connect to database. Exiting...');
            process.exit(1);
        }
        app.listen(PORT, () => {
            logger_1.default.info(`🏥 Department Service started successfully`, {
                port: PORT,
                environment: process.env.NODE_ENV || 'development',
                timestamp: new Date().toISOString(),
            });
        });
    }
    catch (error) {
        logger_1.default.error('Failed to start server:', error);
        process.exit(1);
    }
};
process.on('SIGTERM', () => {
    logger_1.default.info('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger_1.default.info('SIGINT received. Shutting down gracefully...');
    process.exit(0);
});
startServer();
exports.default = app;
//# sourceMappingURL=index.js.map