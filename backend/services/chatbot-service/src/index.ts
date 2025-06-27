import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Import routes
import healthAdvisorRoutes from './routes/health-advisor.routes';

// Import utilities
import logger from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.CHATBOT_SERVICE_PORT || 3009;

// Tạo thư mục logs nếu chưa có
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(morgan('combined', {
  stream: {
    write: (message: string) => {
      logger.info(message.trim(), { category: 'http_request' });
    }
  }
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
app.use('/api/health', healthAdvisorRoutes);

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
app.get('/test-db', async (req, res): Promise<void> => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
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

  } catch (error) {
    logger.error('Database connection test failed:', error);
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
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', {
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
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`🤖 Hospital Chatbot Service started successfully`, {
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

export default app;
