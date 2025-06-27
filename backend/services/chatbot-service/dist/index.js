"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Import routes
const health_advisor_routes_1 = __importDefault(require("./routes/health-advisor.routes"));
// Import utilities
const logger_1 = __importDefault(require("./utils/logger"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.CHATBOT_SERVICE_PORT || 3009;
// Tạo thư mục logs nếu chưa có
const logsDir = path_1.default.join(process.cwd(), 'logs');
if (!fs_1.default.existsSync(logsDir)) {
    fs_1.default.mkdirSync(logsDir, { recursive: true });
}
// Middleware
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
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use((0, morgan_1.default)('combined', {
    stream: {
        write: (message) => {
            logger_1.default.info(message.trim(), { category: 'http_request' });
        }
    }
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        service: 'Hospital Chatbot Service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        features: {
            health_advisor: true,
            symptom_analysis: true,
            specialty_recommendation: true,
            post_treatment_advice: true,
            emergency_consultation: true,
            vietnamese_language: true
        },
        environment: {
            node_env: process.env.NODE_ENV || 'development',
            port: PORT,
            supabase_connected: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
            gemini_connected: !!process.env.GEMINI_API_KEY
        }
    });
});
// API Routes
app.use('/api/health', health_advisor_routes_1.default);
// Root endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'Hospital Chatbot Service',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        description: 'AI-powered chatbot service for hospital management system',
        features: [
            'Tư vấn sức khỏe cơ bản',
            'Phân tích triệu chứng',
            'Khuyến nghị chuyên khoa',
            'Hướng dẫn chuẩn bị khám bệnh',
            'Chăm sóc sau điều trị',
            'Tư vấn cấp cứu'
        ],
        endpoints: {
            health_check: '/health',
            analyze_symptoms: '/api/health/analyze-symptoms',
            quick_consultation: '/api/health/quick-consultation',
            chat_with_ai: '/api/health/chat',
            specialties: '/api/health/specialties',
            post_treatment_advice: '/api/health/post-treatment-advice',
            emergency_symptoms: '/api/health/emergency-symptoms',
            test: '/api/health/test'
        },
        documentation: 'Xem API documentation tại /api/health/test'
    });
});
// Test endpoint để kiểm tra kết nối database
app.get('/test-db', async (req, res) => {
    try {
        const { createClient } = await Promise.resolve().then(() => __importStar(require('@supabase/supabase-js')));
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseServiceKey) {
            res.status(500).json({
                success: false,
                message: 'Thiếu cấu hình Supabase',
                error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
            });
            return;
        }
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        // Test query
        const { data, error } = await supabase
            .from('symptoms')
            .select('count(*)')
            .limit(1);
        if (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi kết nối database',
                error: error.message
            });
            return;
        }
        res.json({
            success: true,
            message: 'Kết nối database thành công',
            data: {
                supabase_url: supabaseUrl,
                connection_status: 'connected',
                test_query_result: data
            }
        });
    }
    catch (error) {
        logger_1.default.error('Database connection test failed:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể kiểm tra kết nối database',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method,
        service: 'Hospital Chatbot Service',
        timestamp: new Date().toISOString(),
        available_routes: [
            'GET /',
            'GET /health',
            'GET /test-db',
            'POST /api/health/analyze-symptoms',
            'POST /api/health/quick-consultation',
            'POST /api/health/chat',
            'GET /api/health/specialties',
            'POST /api/health/post-treatment-advice',
            'GET /api/health/emergency-symptoms',
            'GET /api/health/test'
        ]
    });
});
// Error handling middleware
app.use((error, req, res, next) => {
    logger_1.default.error('Unhandled error:', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        body: req.body
    });
    res.status(error.status || 500).json({
        success: false,
        message: 'Có lỗi xảy ra trong hệ thống',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
    });
});
// Graceful shutdown
process.on('SIGTERM', () => {
    logger_1.default.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger_1.default.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});
// Start server
app.listen(PORT, () => {
    logger_1.default.info(`🤖 Hospital Chatbot Service started successfully`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        features: [
            'Health Advisor',
            'Symptom Analysis',
            'Specialty Recommendation',
            'Vietnamese Language Support'
        ]
    });
    console.log(`
🏥 ===================================
🤖 HOSPITAL CHATBOT SERVICE STARTED
🏥 ===================================
🌐 Server: http://localhost:${PORT}
📊 Health: http://localhost:${PORT}/health
🧪 Test DB: http://localhost:${PORT}/test-db
📚 API: http://localhost:${PORT}/api/health/test
🏥 ===================================
  `);
});
exports.default = app;
//# sourceMappingURL=index.js.map