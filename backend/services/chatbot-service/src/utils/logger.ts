import winston from 'winston';
import path from 'path';

// Định nghĩa format log
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      service: service || 'chatbot-service',
      message,
      ...meta
    });
  })
);

// Tạo logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'chatbot-service',
    version: '1.0.0'
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} [${service}] ${level}: ${message} ${metaStr}`;
        })
      )
    }),

    // File transport cho tất cả logs
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'chatbot-service.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // File transport riêng cho errors
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'chatbot-service-error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // File transport cho health advisor logs
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'health-advisor.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    })
  ],

  // Xử lý uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'exceptions.log')
    })
  ],

  // Xử lý unhandled rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'rejections.log')
    })
  ]
});

// Thêm transport cho development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Helper functions
export const logHealthConsultation = (userId: string, input: string, result: any) => {
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

export const logSymptomAnalysis = (symptoms: string[], detectedSymptoms: any[]) => {
  logger.info('Symptom analysis performed', {
    category: 'symptom_analysis',
    input_symptoms: symptoms,
    detected_count: detectedSymptoms.length,
    detected_symptoms: detectedSymptoms.map(s => s.name_vi)
  });
};

export const logSpecialtyRecommendation = (symptoms: any[], recommendation: any) => {
  logger.info('Specialty recommendation generated', {
    category: 'specialty_recommendation',
    symptoms_count: symptoms.length,
    recommended_specialty: recommendation?.recommended_specialty,
    confidence_score: recommendation?.confidence_score,
    urgency_level: recommendation?.urgency_level
  });
};

export const logDatabaseQuery = (operation: string, table: string, duration: number, success: boolean) => {
  logger.info('Database query executed', {
    category: 'database_query',
    operation,
    table,
    duration_ms: duration,
    success
  });
};

export const logAPIRequest = (method: string, endpoint: string, userId?: string, duration?: number) => {
  logger.info('API request processed', {
    category: 'api_request',
    method,
    endpoint,
    userId,
    duration_ms: duration
  });
};

export const logError = (error: Error, context: any = {}) => {
  logger.error('Error occurred', {
    category: 'error',
    error_message: error.message,
    error_stack: error.stack,
    ...context
  });
};

export default logger;
