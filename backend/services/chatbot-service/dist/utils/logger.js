"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logError = exports.logAPIRequest = exports.logDatabaseQuery = exports.logSpecialtyRecommendation = exports.logSymptomAnalysis = exports.logHealthConsultation = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
// Định nghĩa format log
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
}), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.printf(({ timestamp, level, message, service, ...meta }) => {
    return JSON.stringify({
        timestamp,
        level,
        service: service || 'chatbot-service',
        message,
        ...meta
    });
}));
// Tạo logger
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: {
        service: 'chatbot-service',
        version: '1.0.0'
    },
    transports: [
        // Console transport
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple(), winston_1.default.format.printf(({ timestamp, level, message, service, ...meta }) => {
                const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
                return `${timestamp} [${service}] ${level}: ${message} ${metaStr}`;
            }))
        }),
        // File transport cho tất cả logs
        new winston_1.default.transports.File({
            filename: path_1.default.join(process.cwd(), 'logs', 'chatbot-service.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // File transport riêng cho errors
        new winston_1.default.transports.File({
            filename: path_1.default.join(process.cwd(), 'logs', 'chatbot-service-error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // File transport cho health advisor logs
        new winston_1.default.transports.File({
            filename: path_1.default.join(process.cwd(), 'logs', 'health-advisor.log'),
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
            maxsize: 5242880, // 5MB
            maxFiles: 3,
        })
    ],
    // Xử lý uncaught exceptions
    exceptionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(process.cwd(), 'logs', 'exceptions.log')
        })
    ],
    // Xử lý unhandled rejections
    rejectionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(process.cwd(), 'logs', 'rejections.log')
        })
    ]
});
// Thêm transport cho development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
    }));
}
// Helper functions
const logHealthConsultation = (userId, input, result) => {
    logger.info('Health consultation completed', {
        category: 'health_consultation',
        userId,
        input: input.substring(0, 100), // Chỉ log 100 ký tự đầu
        recommended_specialty: result.recommended_specialty,
        confidence_score: result.confidence_score,
        urgency_level: result.urgency_level,
        symptoms_count: result.symptoms_detected?.length || 0
    });
};
exports.logHealthConsultation = logHealthConsultation;
const logSymptomAnalysis = (symptoms, detectedSymptoms) => {
    logger.info('Symptom analysis performed', {
        category: 'symptom_analysis',
        input_symptoms: symptoms,
        detected_count: detectedSymptoms.length,
        detected_symptoms: detectedSymptoms.map(s => s.name_vi)
    });
};
exports.logSymptomAnalysis = logSymptomAnalysis;
const logSpecialtyRecommendation = (symptoms, recommendation) => {
    logger.info('Specialty recommendation generated', {
        category: 'specialty_recommendation',
        symptoms_count: symptoms.length,
        recommended_specialty: recommendation?.recommended_specialty,
        confidence_score: recommendation?.confidence_score,
        urgency_level: recommendation?.urgency_level
    });
};
exports.logSpecialtyRecommendation = logSpecialtyRecommendation;
const logDatabaseQuery = (operation, table, duration, success) => {
    logger.info('Database query executed', {
        category: 'database_query',
        operation,
        table,
        duration_ms: duration,
        success
    });
};
exports.logDatabaseQuery = logDatabaseQuery;
const logAPIRequest = (method, endpoint, userId, duration) => {
    logger.info('API request processed', {
        category: 'api_request',
        method,
        endpoint,
        userId,
        duration_ms: duration
    });
};
exports.logAPIRequest = logAPIRequest;
const logError = (error, context = {}) => {
    logger.error('Error occurred', {
        category: 'error',
        error_message: error.message,
        error_stack: error.stack,
        ...context
    });
};
exports.logError = logError;
exports.default = logger;
//# sourceMappingURL=logger.js.map