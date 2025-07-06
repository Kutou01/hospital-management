// =====================================================
// UNIFIED RASA-ONLY CHATBOT SERVICE
// Khắc phục tất cả khuyết điểm chatbot hospital management
// =====================================================

import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import Joi from 'joi';
import winston from 'winston';
import CircuitBreaker from 'opossum';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

// =====================================================
// CONFIGURATION
// =====================================================
const config = {
  port: process.env.PORT || 3021,
  testMode: process.env.TEST_MODE === 'true',
  supabase: {
    url: process.env.SUPABASE_URL!,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY!,
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '2048'),
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
  },
  rasa: {
    serverUrl: process.env.RASA_SERVER_URL || 'http://localhost:5005',
    actionsUrl: process.env.RASA_ACTIONS_URL || 'http://localhost:5055',
    timeout: parseInt(process.env.RASA_TIMEOUT || '10000'),
    retryAttempts: parseInt(process.env.RASA_RETRY_ATTEMPTS || '3'),
  },
  cache: {
    ttlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '3600'),
    maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000'),
  },
  session: {
    expirationMinutes: parseInt(process.env.SESSION_EXPIRATION_MINUTES || '60'),
    maxConcurrent: parseInt(process.env.MAX_CONCURRENT_SESSIONS || '100'),
  }
};

// =====================================================
// LOGGING SETUP
// =====================================================
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/unified-chatbot.log' })
  ]
});

// =====================================================
// DATABASE AND AI CLIENTS
// =====================================================
const supabase = config.testMode ? null : createClient(config.supabase.url, config.supabase.serviceKey);
const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
const geminiModel = genAI.getGenerativeModel({ model: config.gemini.model });

// =====================================================
// CIRCUIT BREAKERS
// =====================================================
const rasaCircuitBreaker = new CircuitBreaker(callRasaAPI, {
  timeout: config.rasa.timeout,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  name: 'rasa-api'
});

const geminiCircuitBreaker = new CircuitBreaker(callGeminiAPI, {
  timeout: 15000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  name: 'gemini-api'
});

// Circuit breaker event handlers
rasaCircuitBreaker.on('open', () => logger.warn('Rasa circuit breaker opened'));
rasaCircuitBreaker.on('halfOpen', () => logger.info('Rasa circuit breaker half-open'));
rasaCircuitBreaker.on('close', () => logger.info('Rasa circuit breaker closed'));

geminiCircuitBreaker.on('open', () => logger.warn('Gemini circuit breaker opened'));
geminiCircuitBreaker.on('halfOpen', () => logger.info('Gemini circuit breaker half-open'));
geminiCircuitBreaker.on('close', () => logger.info('Gemini circuit breaker closed'));

// =====================================================
// EXPRESS APP SETUP
// =====================================================
const app = express();

// =====================================================
// MIDDLEWARE SETUP
// =====================================================

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '30'),
  message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Enhanced UTF-8 support for Vietnamese
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Enhanced security middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Add request ID for tracking
  req.requestId = uuidv4();
  res.setHeader('X-Request-ID', req.requestId);

  next();
});

// Request logging with security context
app.use((req: Request, res: Response, next: NextFunction) => {
  const logData: any = {
    requestId: req.requestId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString()
  };

  // Log body for POST requests but mask sensitive data
  if (req.method === 'POST' && req.body) {
    const bodyStr = JSON.stringify(req.body);
    logData.containsSensitiveData = containsSensitiveMedicalInfo(bodyStr);
    logData.bodySize = bodyStr.length;
  }

  logger.info(`${req.method} ${req.path}`, logData);
  next();
});

// =====================================================
// SECURITY & ENCRYPTION FUNCTIONS
// =====================================================

// Generate secure session token
function generateSecureSessionToken(sessionId: string, userId?: string): string {
  const timestamp = Date.now().toString();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  const data = `${sessionId}:${userId || 'anonymous'}:${timestamp}:${randomBytes}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Hash input text for caching
function hashInputText(text: string): string {
  return crypto.createHash('sha256').update(text.toLowerCase().trim()).digest('hex');
}

// Encrypt sensitive data (using modern crypto methods)
function encryptSensitiveData(data: string, key?: string): string {
  const encryptionKey = key || process.env.ENCRYPTION_KEY || 'hospital_chatbot_key_2024';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', crypto.scryptSync(encryptionKey, 'salt', 32), iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Decrypt sensitive data (using modern crypto methods)
function decryptSensitiveData(encryptedData: string, key?: string): string {
  try {
    const encryptionKey = key || process.env.ENCRYPTION_KEY || 'hospital_chatbot_key_2024';
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', crypto.scryptSync(encryptionKey, 'salt', 32), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    logger.error('Decryption failed:', error);
    return '';
  }
}

// Check if message contains sensitive medical information
function containsSensitiveMedicalInfo(message: string): boolean {
  const sensitivePatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
    /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, // Credit card pattern
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email pattern
    /\b\d{10,11}\b/, // Phone number pattern
    /bệnh án|hồ sơ bệnh án|medical record/i,
    /xét nghiệm|kết quả xét nghiệm|test result/i,
    /chẩn đoán|diagnosis/i
  ];

  return sensitivePatterns.some(pattern => pattern.test(message));
}

// Log audit trail
async function logAuditTrail(
  sessionId: string,
  userId?: string,
  actionType: string = 'message_sent',
  actionDetails: any = {},
  ipAddress?: string,
  userAgent?: string,
  riskLevel: string = 'low'
) {
  if (config.testMode || !supabase) {
    // Test mode: just log to console
    logger.info('Audit Trail (Test Mode)', {
      sessionId,
      userId,
      actionType,
      actionDetails,
      riskLevel
    });
    return;
  }

  try {
    await supabase.rpc('log_chatbot_audit', {
      p_session_id: sessionId,
      p_user_id: userId,
      p_action_type: actionType,
      p_action_details: actionDetails,
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
      p_risk_level: riskLevel
    });
  } catch (error) {
    logger.error('Failed to log audit trail:', error);
  }
}

// =====================================================
// ENHANCED VIETNAMESE NLP PROCESSING
// =====================================================
const vietnameseNormalize = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a')
    .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e')
    .replace(/ì|í|ị|ỉ|ĩ/g, 'i')
    .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o')
    .replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u')
    .replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y')
    .replace(/đ/g, 'd')
    .trim();
};

// Enhanced Vietnamese medical term processing
const vietnameseMedicalSynonyms = {
  'đau đầu': ['nhức đầu', 'đau đầu', 'đau nửa đầu', 'migraine'],
  'sốt': ['nóng sốt', 'bị sốt', 'sốt cao', 'sốt nhẹ', 'ớn lạnh'],
  'ho': ['ho khan', 'ho có đờm', 'ho kéo dài', 'ho nhiều'],
  'buồn nôn': ['nôn', 'muốn nôn', 'ói', 'cảm giác nôn'],
  'chóng mặt': ['hoa mắt', 'choáng váng', 'mất thăng bằng', 'đầu quay'],
  'đau bụng': ['đau dạ dày', 'đau ruột', 'đau bụng dưới', 'đau bụng trên'],
  'khó thở': ['thở khó', 'thở gấp', 'ngạt thở', 'hụt hơi'],
  'mệt mỏi': ['mệt', 'uể oải', 'kiệt sức', 'không có sức'],
  'sốt xuất huyết': ['dengue', 'sốt xuất huyết dengue', 'sốt rét xuất huyết']
};

const normalizeVietnameseMedical = (text: string): string => {
  let normalized = vietnameseNormalize(text);

  // Replace synonyms with standard terms
  for (const [standard, synonyms] of Object.entries(vietnameseMedicalSynonyms)) {
    for (const synonym of synonyms) {
      const normalizedSynonym = vietnameseNormalize(synonym);
      if (normalized.includes(normalizedSynonym)) {
        normalized = normalized.replace(new RegExp(normalizedSynonym, 'g'), standard);
      }
    }
  }

  return normalized;
};

// Emergency detection with improved Vietnamese processing
const detectEmergency = (message: string): { isEmergency: boolean; level: string; priority: number } => {
  const normalizedMessage = normalizeVietnameseMedical(message);

  const emergencyPatterns = {
    critical: {
      keywords: ['sot xuat huyet', 'ngung tim', 'kho tho nang', 'co giat', 'bat tinh', 'chay mau nhieu'],
      priority: 1
    },
    high: {
      keywords: ['dau nguc', 'kho tho', 'dau dau nang', 'sot cao', 'noi mun', 'dau bung nang'],
      priority: 2
    },
    medium: {
      keywords: ['sot', 'dau dau', 'buon non', 'chong mat', 'met moi'],
      priority: 3
    }
  };

  for (const [level, data] of Object.entries(emergencyPatterns)) {
    if (data.keywords.some(keyword => normalizedMessage.includes(keyword))) {
      return { isEmergency: true, level, priority: data.priority };
    }
  }

  return { isEmergency: false, level: 'none', priority: 0 };
};

// =====================================================
// MEDICAL KNOWLEDGE INTEGRATION
// =====================================================

// Search symptoms in database
async function searchSymptoms(symptomText: string, limit: number = 5) {
  if (config.testMode || !supabase) {
    // Test mode: return mock data
    const mockSymptoms = [
      { symptom_id: '1', symptom_name_vi: 'Đau đầu', emergency_flags: [] },
      { symptom_id: '2', symptom_name_vi: 'Sốt', emergency_flags: [] },
      { symptom_id: '3', symptom_name_vi: 'Sốt xuất huyết', emergency_flags: ['xuất huyết', 'sốt cao'] }
    ];
    return mockSymptoms.filter(s => s.symptom_name_vi.toLowerCase().includes(symptomText.toLowerCase()));
  }

  try {
    const { data, error } = await supabase.rpc('search_symptoms_by_text', {
      p_symptom_text: symptomText,
      p_limit: limit
    });

    if (error) {
      logger.error('Error searching symptoms:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Failed to search symptoms:', error);
    return [];
  }
}

// Suggest conditions based on symptoms
async function suggestConditions(symptomIds: string[], limit: number = 3) {
  if (config.testMode || !supabase) {
    // Test mode: return mock conditions
    const mockConditions = [
      { condition_id: '1', condition_name_vi: 'Cảm cúm thông thường', category: 'internal', severity_level: 'low' },
      { condition_id: '2', condition_name_vi: 'Sốt xuất huyết Dengue', category: 'infectious', severity_level: 'high' }
    ];
    return mockConditions.slice(0, limit);
  }

  try {
    const { data, error } = await supabase.rpc('suggest_conditions_by_symptoms', {
      p_symptom_ids: symptomIds,
      p_limit: limit
    });

    if (error) {
      logger.error('Error suggesting conditions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('Failed to suggest conditions:', error);
    return [];
  }
}

// Enhanced medical analysis with improved emergency detection
async function analyzeMedicalMessage(message: string) {
  const normalizedMessage = normalizeVietnameseMedical(message);

  // Improved emergency detection logic
  const isEmergency = detectEmergencySymptoms(message);

  // Search for symptoms mentioned
  const words = normalizedMessage.split(' ');
  const symptomSearches = await Promise.all(
    words.map(word => searchSymptoms(word, 2))
  );

  const foundSymptoms = symptomSearches.flat().filter(Boolean);

  if (foundSymptoms.length > 0) {
    const symptomIds = foundSymptoms.map(s => s.symptom_id);
    const suggestedConditions = await suggestConditions(symptomIds, 3);

    return {
      symptoms: foundSymptoms,
      conditions: suggestedConditions,
      hasEmergencySymptoms: isEmergency.isEmergency
    };
  }

  return {
    symptoms: [],
    conditions: [],
    hasEmergencySymptoms: isEmergency.isEmergency
  };
}

// Improved emergency detection function
function detectEmergencySymptoms(text: string): { isEmergency: boolean; severity: string; score: number } {
  const normalizedText = text.toLowerCase().trim();

  // Common symptoms that are NOT emergencies (unless with severe modifiers)
  const commonSymptoms = {
    'đau đầu': { score: 20, severity: 'normal' },
    'đau bụng': { score: 25, severity: 'normal' },
    'sốt': { score: 30, severity: 'normal' },
    'ho': { score: 15, severity: 'normal' }
  };

  // Emergency symptoms with high scores
  const emergencySymptoms = {
    'sốt xuất huyết': { score: 100, severity: 'critical' },
    'đau ngực dữ dội': { score: 90, severity: 'high' },
    'khó thở cấp tính': { score: 85, severity: 'high' },
    'đau đầu dữ dội': { score: 75, severity: 'high' },
    'đau bụng dữ dội': { score: 80, severity: 'high' },
    'mất ý thức': { score: 100, severity: 'critical' },
    'co giật': { score: 85, severity: 'high' }
  };

  // Severe modifiers that upgrade common symptoms to emergency
  const severeModifiers = ['dữ dội', 'cấp tính', 'không chịu được', 'kinh khủng', 'như búa bổ', 'như dao cắt'];

  let maxScore = 0;
  let severity = 'normal';

  // Check for emergency symptoms first
  for (const [symptom, config] of Object.entries(emergencySymptoms)) {
    if (normalizedText.includes(symptom)) {
      maxScore = Math.max(maxScore, config.score);
      severity = config.severity;
    }
  }

  // Check common symptoms with modifiers
  if (maxScore < 60) { // Only if no emergency detected yet
    for (const [symptom, config] of Object.entries(commonSymptoms)) {
      if (normalizedText.includes(symptom)) {
        // Check if has severe modifiers
        const hasSevereModifier = severeModifiers.some(modifier => normalizedText.includes(modifier));

        if (hasSevereModifier) {
          maxScore = Math.max(maxScore, 75); // Upgrade to emergency
          severity = 'high';
        } else {
          maxScore = Math.max(maxScore, config.score); // Keep as normal
          severity = config.severity;
        }
      }
    }
  }

  // Emergency threshold: 60 points or higher
  const isEmergency = maxScore >= 60;

  return { isEmergency, severity, score: maxScore };
}

// =====================================================
// PERFORMANCE OPTIMIZATION FUNCTIONS
// =====================================================

// Cleanup expired data periodically
async function cleanupExpiredData() {
  try {
    const { data, error } = await supabase.rpc('cleanup_expired_chatbot_data');

    if (error) {
      logger.error('Cleanup failed:', error);
    } else {
      logger.info('Cleanup completed', { deletedRecords: data });
    }
  } catch (error) {
    logger.error('Cleanup error:', error);
  }
}

// Update daily metrics
async function updateDailyMetrics() {
  try {
    await supabase.rpc('update_daily_chatbot_metrics', {
      p_date: new Date().toISOString().split('T')[0]
    });

    logger.info('Daily metrics updated successfully');
  } catch (error) {
    logger.error('Failed to update daily metrics:', error);
  }
}

// Performance monitoring
const performanceMetrics = {
  requestCount: 0,
  totalResponseTime: 0,
  errorCount: 0,
  cacheHits: 0,
  cacheMisses: 0,
  emergencyDetections: 0,

  reset() {
    this.requestCount = 0;
    this.totalResponseTime = 0;
    this.errorCount = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.emergencyDetections = 0;
  },

  getAverageResponseTime() {
    return this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0;
  },

  getCacheHitRate() {
    const totalCacheRequests = this.cacheHits + this.cacheMisses;
    return totalCacheRequests > 0 ? this.cacheHits / totalCacheRequests : 0;
  },

  getErrorRate() {
    return this.requestCount > 0 ? this.errorCount / this.requestCount : 0;
  }
};

// Schedule periodic tasks
setInterval(cleanupExpiredData, 60 * 60 * 1000); // Every hour
setInterval(updateDailyMetrics, 24 * 60 * 60 * 1000); // Every day
setInterval(() => {
  logger.info('Performance metrics', {
    avgResponseTime: performanceMetrics.getAverageResponseTime(),
    cacheHitRate: performanceMetrics.getCacheHitRate(),
    errorRate: performanceMetrics.getErrorRate(),
    emergencyDetections: performanceMetrics.emergencyDetections
  });
  performanceMetrics.reset();
}, 15 * 60 * 1000); // Every 15 minutes

// =====================================================
// CORE FUNCTIONS
// =====================================================

// Enhanced Rasa API call with load balancing and test mode
const rasaEndpoints = [
  config.rasa.serverUrl,
  // Add more Rasa instances here for load balancing
  // 'http://rasa-server-2:5005',
  // 'http://rasa-server-3:5005'
];

let currentRasaIndex = 0;

// Mock Rasa responses for test mode
const mockRasaResponses = {
  'xin chào': [{ text: 'Xin chào! Tôi có thể giúp bạn tư vấn về sức khỏe. Bạn cần hỗ trợ gì?' }],
  'cảm ơn': [{ text: 'Rất vui được hỗ trợ bạn! Chúc bạn sức khỏe!' }],
  'tạm biệt': [{ text: 'Tạm biệt! Hãy chăm sóc sức khỏe nhé!' }],
  'default': [{ text: 'Tôi có thể giúp bạn tư vấn về các vấn đề sức khỏe. Bạn có triệu chứng gì cần tư vấn không?' }]
};

async function callRasaAPI(message: string, senderId: string, metadata: any = {}) {
  if (config.testMode) {
    // Test mode: use trained medical logic instead of mock responses
    const trainedLogic = require('../trained_medical_logic.js');
    const analysis = trainedLogic.analyzeSymptoms(message);

    const response = [{ text: analysis.response }];

    logger.info('Trained medical logic response', {
      message,
      intent: analysis.intent,
      confidence: analysis.confidence,
      emergency: analysis.emergency,
      response
    });

    return response;
  }

  const maxRetries = rasaEndpoints.length;
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const endpoint = rasaEndpoints[currentRasaIndex];
    currentRasaIndex = (currentRasaIndex + 1) % rasaEndpoints.length;

    try {
      const response = await axios.post(`${endpoint}/webhooks/rest/webhook`, {
        sender: senderId,
        message: message,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          attempt: attempt + 1,
          endpoint: endpoint
        }
      }, {
        timeout: config.rasa.timeout,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': uuidv4()
        }
      });

      // Log successful request
      logger.debug('Rasa API call successful', {
        endpoint,
        attempt: attempt + 1,
        responseTime: response.headers['x-response-time'],
        messageLength: message.length
      });

      return response.data;
    } catch (error) {
      lastError = error;
      logger.warn(`Rasa endpoint ${endpoint} failed, attempt ${attempt + 1}`, {
        error: error.message,
        endpoint,
        attempt: attempt + 1
      });

      // If this is not the last attempt, continue to next endpoint
      if (attempt < maxRetries - 1) {
        continue;
      }
    }
  }

  // All endpoints failed
  throw lastError;
}

// Gemini API call function
async function callGeminiAPI(message: string, context: string = '') {
  const prompt = `
Bạn là trợ lý AI chuyên về y tế tại bệnh viện. Hãy trả lời câu hỏi sau một cách chuyên nghiệp và hữu ích.

Context: ${context}

Câu hỏi: ${message}

Lưu ý:
- Trả lời bằng tiếng Việt
- Đưa ra lời khuyên y tế cơ bản nhưng luôn khuyến khích đến gặp bác sĩ
- Nếu là tình huống khẩn cấp, hãy khuyên đến bệnh viện ngay lập tức
- Giữ câu trả lời ngắn gọn và dễ hiểu
`;

  const result = await geminiModel.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

// Vietnamese text preprocessing
function preprocessVietnameseText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, ' ')
    .replace(/\s+/g, ' ');
}

// Enhanced health-related keyword detection with Vietnamese processing
function isHealthRelated(message: string): boolean {
  const healthKeywords = [
    'đau', 'bệnh', 'khám', 'thuốc', 'triệu chứng', 'sức khỏe', 'bác sĩ',
    'bệnh viện', 'điều trị', 'chữa', 'uống thuốc', 'khó thở', 'sốt',
    'ho', 'đau đầu', 'buồn nôn', 'chóng mặt', 'mệt mỏi', 'đau bụng',
    'cảm cúm', 'viêm', 'nhiễm trùng', 'dị ứng', 'tiêm chủng', 'xét nghiệm',
    'chẩn đoán', 'tái khám', 'đơn thuốc', 'toa thuốc', 'nhập viện',
    'xuất viện', 'phẫu thuật', 'mổ', 'nội soi', 'siêu âm', 'x-quang'
  ];

  // Use enhanced Vietnamese medical normalization
  const normalizedMessage = normalizeVietnameseMedical(message);
  return healthKeywords.some(keyword => {
    const normalizedKeyword = vietnameseNormalize(keyword);
    return normalizedMessage.includes(normalizedKeyword);
  });
}

// Note: Enhanced detectEmergency function is defined above in Vietnamese NLP section

// Session management
async function createSession(userId?: string, patientId?: string, sessionType: string = 'consultation') {
  try {
    const { data, error } = await supabase.rpc('create_unified_chatbot_session', {
      p_user_id: userId,
      p_patient_id: patientId,
      p_session_type: sessionType
    });

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error creating session:', error);
    throw error;
  }
}

// Message saving
async function saveMessage(
  sessionId: string,
  messageType: 'user' | 'bot' | 'system',
  content: string,
  aiSource?: string,
  intent?: string,
  confidence?: number,
  processingTime?: number
) {
  if (config.testMode || !supabase) {
    // Test mode: just log the message
    logger.info('Save Message (Test Mode)', {
      sessionId,
      messageType,
      content: content.substring(0, 100),
      aiSource,
      intent,
      confidence
    });
    return { success: true };
  }

  try {
    const { data, error } = await supabase.rpc('save_chatbot_message', {
      p_session_id: sessionId,
      p_message_type: messageType,
      p_content: content,
      p_ai_source: aiSource,
      p_intent: intent,
      p_confidence: confidence,
      p_processing_time: processingTime
    });

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error saving message:', error);
    throw error;
  }
}

// Cache management
// Enhanced intelligent caching with quality scoring
async function getCachedResponse(inputText: string) {
  try {
    const inputHash = hashInputText(inputText);
    const normalizedHash = hashInputText(normalizeVietnameseMedical(inputText));

    // Try exact match first
    let { data, error } = await supabase
      .from('chatbot_intelligent_cache')
      .select('*')
      .eq('input_text_hash', inputHash)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    // If no exact match, try normalized match
    if (!data && !error) {
      ({ data, error } = await supabase
        .from('chatbot_intelligent_cache')
        .select('*')
        .eq('normalized_input_hash', normalizedHash)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .gte('cache_quality_score', 0.7) // Only high-quality normalized matches
        .order('cache_quality_score', { ascending: false })
        .limit(1)
        .single());
    }

    if (error && error.code !== 'PGRST116') throw error;

    if (data) {
      // Update hit count and last hit time
      await supabase
        .from('chatbot_intelligent_cache')
        .update({
          hit_count: data.hit_count + 1,
          last_hit_at: new Date().toISOString(),
          cache_quality_score: Math.min(data.cache_quality_score + 0.05, 1.0)
        })
        .eq('cache_id', data.cache_id);

      return data;
    }

    return null;
  } catch (error) {
    logger.error('Error getting cached response:', error);
    return null;
  }
}

// Enhanced intelligent caching with security and quality assessment
async function cacheResponse(
  inputText: string,
  responseText: string,
  aiSource: string,
  confidence?: number,
  intent?: string,
  processingTime?: number
) {
  try {
    const inputHash = hashInputText(inputText);
    const normalizedHash = hashInputText(normalizeVietnameseMedical(inputText));
    const containsSensitive = containsSensitiveMedicalInfo(inputText) || containsSensitiveMedicalInfo(responseText);

    // Calculate cache quality score based on multiple factors
    let qualityScore = 0.5; // Base score

    if (confidence) {
      qualityScore += confidence * 0.3; // Confidence contributes 30%
    }

    if (aiSource === 'rasa') {
      qualityScore += 0.2; // Rasa responses are generally higher quality
    } else if (aiSource === 'emergency_detection') {
      qualityScore += 0.3; // Emergency responses are critical
    }

    if (processingTime && processingTime < 1000) {
      qualityScore += 0.1; // Fast responses get bonus
    }

    qualityScore = Math.min(qualityScore, 1.0);

    // Determine cache TTL based on content type
    let ttlDays = 30; // Default
    if (containsSensitive) {
      ttlDays = 1; // Sensitive data expires quickly
    } else if (aiSource === 'emergency_detection') {
      ttlDays = 7; // Emergency responses expire faster
    } else if (confidence && confidence > 0.9) {
      ttlDays = 60; // High confidence responses last longer
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ttlDays);

    await supabase
      .from('chatbot_intelligent_cache')
      .upsert({
        input_text_hash: inputHash,
        normalized_input_hash: normalizedHash,
        response_text: responseText,
        ai_source: aiSource,
        confidence_score: confidence,
        intent: intent,
        contains_sensitive_data: containsSensitive,
        cache_quality_score: qualityScore,
        avg_response_time_ms: processingTime,
        expires_at: expiresAt.toISOString(),
        hit_count: 1,
        last_hit_at: new Date().toISOString()
      }, {
        onConflict: 'input_text_hash'
      });

    logger.debug('Response cached successfully', {
      inputHash: inputHash.substring(0, 8),
      aiSource,
      qualityScore,
      containsSensitive,
      ttlDays
    });
  } catch (error) {
    logger.error('Error caching response:', error);
  }
}

// =====================================================
// INTELLIGENT FALLBACK SYSTEM
// =====================================================
async function processMessage(message: string, sessionId: string, userId?: string) {
  const startTime = Date.now();
  let response = '';
  let aiSource = 'fallback';
  let intent = '';
  let confidence = 0;

  // Update performance metrics
  performanceMetrics.requestCount++;

  try {
    // Step 1: Medical analysis first
    const medicalAnalysis = await analyzeMedicalMessage(message);

    // Step 2: Check cache first
    const cachedResponse = await getCachedResponse(message);
    if (cachedResponse) {
      performanceMetrics.cacheHits++;
      logger.info('Cache hit for message', { message: message.substring(0, 50) });

      // Log audit trail for cached response
      await logAuditTrail(sessionId, userId, 'cached_response', {
        message: message.substring(0, 100),
        cacheHit: true,
        medicalAnalysis
      });

      const processingTime = Date.now() - startTime;
      performanceMetrics.totalResponseTime += processingTime;

      return {
        response: cachedResponse.response_text,
        aiSource: cachedResponse.ai_source,
        intent: 'cached',
        confidence: cachedResponse.confidence_score,
        processingTime,
        cached: true,
        medicalAnalysis
      };
    } else {
      performanceMetrics.cacheMisses++;
    }

    // Step 3: Enhanced Emergency detection with medical analysis
    const emergencyResult = detectEmergencySymptoms(message);
    const hasEmergencyFromDB = medicalAnalysis.hasEmergencySymptoms;

    if (emergencyResult.isEmergency || hasEmergencyFromDB) {
      const emergencyMessages = {
        critical: `🚨 **TÌNH HUỐNG CỰC KỲ KHẨN CẤP** 🚨

Triệu chứng bạn mô tả có thể đe dọa tính mạng. Cần cấp cứu NGAY LẬP TỨC!

**HÀNH ĐỘNG NGAY:**
• Gọi 115 hoặc đến cấp cứu gần nhất
• KHÔNG chờ đợi hoặc tự điều trị
• Chuẩn bị thông tin: tuổi, triệu chứng, thuốc đang dùng`,

        high: `⚠️ **TÌNH HUỐNG KHẨN CẤP** ⚠️

Triệu chứng của bạn cần được khám ngay trong vài giờ tới.

**KHUYẾN NGHỊ:**
• Đến bệnh viện trong 2-4 giờ
• Gọi trước để báo tình trạng
• Không tự ý dùng thuốc`,

        medium: `🔔 **CẦN THEO DÕI** 🔔

Triệu chứng cần được theo dõi và có thể cần khám bác sĩ.

**KHUYẾN NGHỊ:**
• Theo dõi triệu chứng trong 24h
• Đặt lịch khám nếu không cải thiện
• Nghỉ ngơi và uống nhiều nước`
      };

      const level = emergencyResult.isEmergency ? emergencyResult.severity : 'high';
      response = emergencyMessages[level as keyof typeof emergencyMessages] || emergencyMessages.medium;

      // Add medical analysis to emergency response
      if (medicalAnalysis.symptoms.length > 0) {
        response += '\n\n**Triệu chứng được phát hiện:**\n';
        medicalAnalysis.symptoms.forEach(symptom => {
          response += `• ${symptom.symptom_name_vi}\n`;
        });
      }

      if (medicalAnalysis.conditions.length > 0) {
        response += '\n**Có thể liên quan đến:**\n';
        medicalAnalysis.conditions.forEach(condition => {
          response += `• ${condition.condition_name_vi} (${condition.category})\n`;
        });
      }

      response += '\n\n⚠️ *Đây là cảnh báo tự động. Vui lòng tìm kiếm sự trợ giúp y tế ngay lập tức.*';

      aiSource = 'emergency_detection';
      confidence = 0.95;

      // Log emergency case with medical analysis
      await logAuditTrail(sessionId, userId, 'emergency_detected', {
        message: message.substring(0, 100),
        emergencyLevel: level,
        medicalAnalysis,
        emergencyFromDB: hasEmergencyFromDB
      }, undefined, undefined, 'critical');

      logger.warn('Emergency detected', {
        message: message.substring(0, 50),
        sessionId,
        userId,
        level,
        medicalAnalysis
      });

      const processingTime = Date.now() - startTime;
      performanceMetrics.totalResponseTime += processingTime;
      performanceMetrics.emergencyDetections++;

      return {
        response,
        aiSource,
        intent: 'emergency',
        confidence,
        processingTime,
        emergency: true,
        medicalAnalysis
      };
    }

    // Step 3: Try Rasa first (primary AI)
    try {
      let rasaResponse;
      if (config.testMode) {
        // In test mode, call Rasa directly (bypass circuit breaker)
        rasaResponse = await callRasaAPI(message, sessionId, { userId });
      } else {
        rasaResponse = await rasaCircuitBreaker.fire(message, sessionId, { userId });
      }

      if (rasaResponse && rasaResponse.length > 0) {
        const rasaMessage = rasaResponse[0];
        response = rasaMessage.text || rasaMessage.custom?.text || '';
        intent = rasaMessage.intent || 'rasa_response';
        confidence = rasaMessage.confidence || 0.8;
        aiSource = 'rasa';

        if (response && confidence > 0.7) {
          logger.info('Rasa handled message successfully', { intent, confidence });

          // Cache successful Rasa response
          await cacheResponse(message, response, aiSource, confidence, intent);

          return {
            response,
            aiSource,
            intent,
            confidence,
            processingTime: Date.now() - startTime
          };
        }
      }
    } catch (error) {
      logger.warn('Rasa failed, falling back to Gemini', { error: error.message });
    }

    // Step 4: Fallback to Gemini for health-related questions
    if (isHealthRelated(message)) {
      try {
        let geminiResponse;
        if (config.testMode) {
          // Mock Gemini response for test mode
          geminiResponse = `Dựa trên triệu chứng bạn mô tả, tôi khuyên bạn nên theo dõi tình trạng sức khỏe và tham khảo ý kiến bác sĩ nếu cần thiết. Hãy nghỉ ngơi đầy đủ và uống nhiều nước.`;
        } else {
          geminiResponse = await geminiCircuitBreaker.fire(message, '');
        }
        response = geminiResponse + '\n\n⚠️ *Lưu ý: Đây chỉ là tư vấn sơ bộ, không thay thế ý kiến bác sĩ.*';
        aiSource = 'gemini_fallback';
        confidence = 0.6;
        intent = 'health_consultation';

        // Cache Gemini response
        await cacheResponse(message, response, aiSource, confidence, intent);

        return {
          response,
          aiSource,
          intent,
          confidence,
          processingTime: Date.now() - startTime
        };
      } catch (error) {
        logger.error('Gemini fallback failed', { error: error.message });
      }
    }

    // Step 5: Out-of-scope handling
    const outOfScopeResponses = [
      'Xin lỗi, tôi chỉ có thể tư vấn về các vấn đề sức khỏe và y tế. Bạn có cần hỗ trợ gì về sức khỏe không?',
      'Tôi là trợ lý AI chuyên về y tế. Bạn có thể hỏi tôi về:\n• Triệu chứng sức khỏe\n• Đặt lịch khám bệnh\n• Thông tin bệnh viện',
      'Tôi không thể trả lời câu hỏi này. Tôi chỉ hỗ trợ về các vấn đề y tế và sức khỏe. Bạn có cần tư vấn gì không?'
    ];

    response = outOfScopeResponses[Math.floor(Math.random() * outOfScopeResponses.length)];
    aiSource = 'out_of_scope';
    confidence = 0.9;
    intent = 'out_of_scope';

    return {
      response,
      aiSource,
      intent,
      confidence,
      processingTime: Date.now() - startTime
    };

  } catch (error) {
    performanceMetrics.errorCount++;
    const processingTime = Date.now() - startTime;
    performanceMetrics.totalResponseTime += processingTime;

    logger.error('Error processing message', { error, message: message.substring(0, 50), sessionId });

    // Log audit trail for error
    await logAuditTrail(sessionId, userId, 'system_error', {
      error: error.message,
      message: message.substring(0, 100)
    }, undefined, undefined, 'high');

    return {
      response: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ với nhân viên y tế.',
      aiSource: 'error',
      intent: 'system_error',
      confidence: 0,
      processingTime,
      error: true
    };
  }
}
// =====================================================
// VALIDATION SCHEMAS
// =====================================================
const chatRequestSchema = Joi.object({
  message: Joi.string().min(1).max(2000).required(),
  sessionId: Joi.string().max(100).optional(),
  userId: Joi.string().max(100).optional(),
  patientId: Joi.string().max(20).optional(),
  metadata: Joi.object().optional()
});

// =====================================================
// API ENDPOINTS
// =====================================================

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check Rasa health
    let rasaHealthy = false;
    if (config.testMode) {
      rasaHealthy = true; // In test mode, mock Rasa is always healthy
      logger.info('Rasa health check (Test Mode): healthy');
    } else {
      try {
        const rasaResponse = await axios.get(`${config.rasa.serverUrl}/status`, { timeout: 5000 });
        rasaHealthy = rasaResponse.status === 200;
      } catch (error) {
        logger.warn('Rasa health check failed', { error: error.message });
      }
    }

    // Check Supabase health
    let supabaseHealthy = false;
    if (config.testMode || !supabase) {
      supabaseHealthy = true; // In test mode, consider it healthy
    } else {
      try {
        const { data, error } = await supabase.from('chatbot_unified_sessions').select('count').limit(1);
        supabaseHealthy = !error;
      } catch (error) {
        logger.warn('Supabase health check failed', { error: error.message });
      }
    }

    // Check Gemini health (simple test)
    let geminiHealthy = false;
    if (config.testMode) {
      geminiHealthy = true; // In test mode, mock Gemini is always healthy
      logger.info('Gemini health check (Test Mode): healthy');
    } else {
      try {
        geminiHealthy = !!config.gemini.apiKey;
      } catch (error) {
        logger.warn('Gemini health check failed', { error: error.message });
      }
    }

    // Smart health assessment - service can work with fallbacks
    const coreHealthy = supabaseHealthy || config.testMode; // Core: database or test mode
    const hasAI = rasaHealthy || geminiHealthy; // At least one AI service

    let overallStatus = 'healthy';
    let httpStatus = 200;

    if (!coreHealthy) {
      overallStatus = 'unhealthy';
      httpStatus = 503;
    } else if (!hasAI) {
      overallStatus = 'degraded';
      httpStatus = 200; // Still functional with fallbacks
    } else if (!rasaHealthy || !geminiHealthy) {
      overallStatus = 'partial';
      httpStatus = 200; // Partial functionality
    }

    res.status(httpStatus).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      service: 'unified-rasa-chatbot',
      version: '1.0.0',
      mode: config.testMode ? 'test' : 'production',
      capabilities: {
        emergency_detection: true,
        vietnamese_nlp: true,
        medical_analysis: coreHealthy,
        rasa_ai: rasaHealthy,
        gemini_fallback: geminiHealthy,
        intelligent_caching: true
      },
      checks: {
        rasa: rasaHealthy ? 'healthy' : 'unhealthy',
        supabase: supabaseHealthy ? 'healthy' : (config.testMode ? 'test-mode' : 'unhealthy'),
        gemini: geminiHealthy ? 'healthy' : 'unhealthy',
        circuit_breakers: {
          rasa: rasaCircuitBreaker.stats,
          gemini: geminiCircuitBreaker.stats
        }
      }
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed'
    });
  }
});

// =====================================================
// MONITORING & ANALYTICS ENDPOINTS
// =====================================================

// Real-time metrics endpoint
app.get('/api/metrics/realtime', async (req, res) => {
  try {
    let todayMetrics = {};
    let activeSessions = [];
    let recentMessages = [];

    if (config.testMode || !supabase) {
      // Test mode: return mock data
      todayMetrics = {
        total_sessions: 10,
        total_messages: 50,
        unique_users: 8,
        emergency_alerts: 2
      };
      activeSessions = [1, 2, 3]; // Mock 3 active sessions
      recentMessages = [
        { ai_source: 'rasa', confidence_score: 0.9, processing_time_ms: 150, emergency_detected: false },
        { ai_source: 'gemini', confidence_score: 0.8, processing_time_ms: 200, emergency_detected: false },
        { ai_source: 'emergency_detection', confidence_score: 0.95, processing_time_ms: 100, emergency_detected: true }
      ];
    } else {
      const { data: metrics } = await supabase
        .from('chatbot_performance_metrics')
        .select('*')
        .eq('metric_date', new Date().toISOString().split('T')[0])
        .single();
      todayMetrics = metrics;

      const { data: sessions } = await supabase
        .from('chatbot_secure_sessions')
        .select('count')
        .gte('last_activity_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());
      activeSessions = sessions;

      const { data: messages } = await supabase
        .from('chatbot_secure_messages')
        .select('ai_source, confidence_score, processing_time_ms, emergency_detected')
        .gte('message_timestamp', new Date(Date.now() - 60 * 60 * 1000).toISOString());
      recentMessages = messages;
    }

    const metrics = {
      timestamp: new Date().toISOString(),
      today: todayMetrics || {},
      realtime: {
        activeSessions: activeSessions?.length || 0,
        messagesLastHour: recentMessages?.length || 0,
        avgConfidence: recentMessages?.reduce((sum, msg) => sum + (msg.confidence_score || 0), 0) / (recentMessages?.length || 1),
        avgResponseTime: recentMessages?.reduce((sum, msg) => sum + (msg.processing_time_ms || 0), 0) / (recentMessages?.length || 1),
        emergencyAlerts: recentMessages?.filter(msg => msg.emergency_detected).length || 0,
        aiSourceDistribution: {
          rasa: recentMessages?.filter(msg => msg.ai_source === 'rasa').length || 0,
          gemini: recentMessages?.filter(msg => msg.ai_source?.includes('gemini')).length || 0,
          emergency: recentMessages?.filter(msg => msg.ai_source === 'emergency_detection').length || 0
        }
      },
      circuitBreakers: {
        rasa: rasaCircuitBreaker.stats,
        gemini: geminiCircuitBreaker.stats
      }
    };

    res.json(metrics);
  } catch (error) {
    logger.error('Failed to get realtime metrics:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// Analytics dashboard data
app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: metrics } = await supabase
      .from('chatbot_performance_metrics')
      .select('*')
      .gte('metric_date', startDate.toISOString().split('T')[0])
      .order('metric_date', { ascending: true });

    const { data: topSymptoms } = await supabase
      .from('chatbot_secure_messages')
      .select('symptoms_mentioned')
      .gte('message_timestamp', startDate.toISOString())
      .not('symptoms_mentioned', 'eq', '[]');

    const { data: emergencyTrends } = await supabase
      .from('chatbot_secure_messages')
      .select('message_timestamp, emergency_level')
      .eq('emergency_detected', true)
      .gte('message_timestamp', startDate.toISOString())
      .order('message_timestamp', { ascending: true });

    // Process symptoms data
    const symptomCounts = {};
    topSymptoms?.forEach(msg => {
      if (msg.symptoms_mentioned && Array.isArray(msg.symptoms_mentioned)) {
        msg.symptoms_mentioned.forEach(symptom => {
          symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
        });
      }
    });

    const dashboardData = {
      period: `${days} days`,
      summary: {
        totalSessions: metrics?.reduce((sum, m) => sum + (m.total_sessions || 0), 0) || 0,
        totalMessages: metrics?.reduce((sum, m) => sum + (m.total_messages || 0), 0) || 0,
        uniqueUsers: Math.max(...(metrics?.map(m => m.unique_users || 0) || [0])),
        emergencyAlerts: metrics?.reduce((sum, m) => sum + (m.emergency_alerts || 0), 0) || 0,
        avgResponseTime: metrics?.reduce((sum, m) => sum + (m.avg_response_time_ms || 0), 0) / (metrics?.length || 1),
        avgConfidence: metrics?.reduce((sum, m) => sum + (m.avg_confidence_score || 0), 0) / (metrics?.length || 1)
      },
      trends: {
        daily: metrics || [],
        emergencies: emergencyTrends || []
      },
      topSymptoms: Object.entries(symptomCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([symptom, count]) => ({ symptom, count })),
      aiPerformance: {
        rasa: metrics?.reduce((sum, m) => sum + (m.rasa_responses || 0), 0) || 0,
        gemini: metrics?.reduce((sum, m) => sum + (m.gemini_responses || 0), 0) || 0,
        emergency: metrics?.reduce((sum, m) => sum + (m.emergency_responses || 0), 0) || 0
      }
    };

    res.json(dashboardData);
  } catch (error) {
    logger.error('Failed to get dashboard data:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// User behavior analytics
app.get('/api/analytics/behavior', async (req, res) => {
  try {
    const { data: sessionData } = await supabase
      .from('chatbot_secure_sessions')
      .select('message_count, avg_response_time_ms, user_satisfaction_score, session_type, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const { data: conversationFlows } = await supabase
      .from('chatbot_secure_messages')
      .select('intent_detected, ai_source, confidence_score')
      .gte('message_timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const behaviorAnalytics = {
      sessionPatterns: {
        avgMessagesPerSession: sessionData?.reduce((sum, s) => sum + (s.message_count || 0), 0) / (sessionData?.length || 1),
        avgSessionDuration: sessionData?.reduce((sum, s) => sum + (s.avg_response_time_ms || 0), 0) / (sessionData?.length || 1),
        satisfactionScore: sessionData?.filter(s => s.user_satisfaction_score)
          .reduce((sum, s) => sum + s.user_satisfaction_score, 0) /
          (sessionData?.filter(s => s.user_satisfaction_score).length || 1),
        sessionTypes: sessionData?.reduce((acc, s) => {
          acc[s.session_type] = (acc[s.session_type] || 0) + 1;
          return acc;
        }, {})
      },
      conversationFlow: {
        commonIntents: conversationFlows?.reduce((acc, msg) => {
          if (msg.intent_detected) {
            acc[msg.intent_detected] = (acc[msg.intent_detected] || 0) + 1;
          }
          return acc;
        }, {}),
        aiSourcePreference: conversationFlows?.reduce((acc, msg) => {
          acc[msg.ai_source] = (acc[msg.ai_source] || 0) + 1;
          return acc;
        }, {}),
        confidenceDistribution: {
          high: conversationFlows?.filter(msg => (msg.confidence_score || 0) > 0.8).length || 0,
          medium: conversationFlows?.filter(msg => (msg.confidence_score || 0) > 0.5 && (msg.confidence_score || 0) <= 0.8).length || 0,
          low: conversationFlows?.filter(msg => (msg.confidence_score || 0) <= 0.5).length || 0
        }
      }
    };

    res.json(behaviorAnalytics);
  } catch (error) {
    logger.error('Failed to get behavior analytics:', error);
    res.status(500).json({ error: 'Failed to get behavior analytics' });
  }
});

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
  const startTime = Date.now();

  try {
    // Validate request
    const { error, value } = chatRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const { message, sessionId, userId, patientId, metadata } = value;

    // Create or get session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      currentSessionId = await createSession(userId, patientId, 'consultation');
      logger.info('Created new session', { sessionId: currentSessionId, userId, patientId });
    }

    // Save user message
    await saveMessage(currentSessionId, 'user', message);

    // Process message with intelligent fallback
    const result = await processMessage(message, currentSessionId, userId);

    // Save bot response
    await saveMessage(
      currentSessionId,
      'bot',
      result.response,
      result.aiSource,
      result.intent,
      result.confidence,
      result.processingTime
    );

    // Response
    res.json({
      success: true,
      data: {
        sessionId: currentSessionId,
        userMessage: message,
        botResponse: result.response,
        aiSource: result.aiSource,
        intent: result.intent,
        confidence: result.confidence,
        processingTime: result.processingTime,
        cached: result.cached || false,
        emergency: result.emergency || false,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Chat endpoint error', { error, body: req.body });

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau.'
    });
  }
});

// Get session with context
app.get('/api/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const { data, error } = await supabase.rpc('get_session_with_context', {
      p_session_id: sessionId
    });

    if (error) throw error;

    res.json({
      success: true,
      data: data && data.length > 0 ? data[0] : null
    });

  } catch (error) {
    logger.error('Session endpoint error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get session info'
    });
  }
});

// Analytics endpoint
app.get('/api/analytics', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('chatbot_daily_analytics')
      .select('*')
      .order('date_recorded', { ascending: false })
      .limit(30);

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    logger.error('Analytics endpoint error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics'
    });
  }
});

// Feedback endpoint
app.post('/api/feedback', async (req, res) => {
  try {
    const feedbackSchema = Joi.object({
      sessionId: Joi.string().required(),
      rating: Joi.number().min(1).max(5).required(),
      feedback: Joi.string().max(1000).optional()
    });

    const { error, value } = feedbackSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const { sessionId, rating, feedback } = value;

    // Update session with feedback
    const { error: updateError } = await supabase
      .from('chatbot_unified_sessions')
      .update({
        user_rating: rating,
        feedback_text: feedback,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

    if (updateError) throw updateError;

    logger.info('User feedback received', { sessionId, rating, feedback });

    res.json({
      success: true,
      message: 'Cảm ơn bạn đã đánh giá!'
    });

  } catch (error) {
    logger.error('Feedback endpoint error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to save feedback'
    });
  }
});

// =====================================================
// MULTIMEDIA ENDPOINTS
// =====================================================

// Image analysis endpoint
app.post('/api/analyze-image', async (req, res) => {
  try {
    // This would use MultimediaProcessor
    res.json({
      success: true,
      message: 'Image analysis endpoint - to be implemented with MultimediaProcessor',
      note: 'Requires multer middleware and image processing setup'
    });
  } catch (error) {
    logger.error('Image analysis error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to analyze image'
    });
  }
});

// Voice processing endpoint
app.post('/api/process-voice', async (req, res) => {
  try {
    // This would use MultimediaProcessor
    res.json({
      success: true,
      message: 'Voice processing endpoint - to be implemented with speech-to-text integration'
    });
  } catch (error) {
    logger.error('Voice processing error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to process voice'
    });
  }
});

// =====================================================
// QUALITY ASSURANCE ENDPOINTS
// =====================================================

// Quality metrics endpoint
app.get('/api/quality/metrics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required'
      });
    }

    // This would use QualityAssuranceService
    return res.json({
      success: true,
      message: 'Quality metrics endpoint - to be implemented with QualityAssuranceService',
      data: {
        responseAccuracy: 0.85,
        userSatisfaction: 0.78,
        emergencyDetectionRate: 0.95,
        averageResponseTime: 1250
      }
    });
  } catch (error) {
    logger.error('Quality metrics error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get quality metrics'
    });
  }
});

// Doctor review endpoint
app.post('/api/quality/doctor-review', async (req, res) => {
  try {
    // This would use QualityAssuranceService
    res.json({
      success: true,
      message: 'Doctor review endpoint - to be implemented for medical professional feedback'
    });
  } catch (error) {
    logger.error('Doctor review error', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to submit doctor review'
    });
  }
});

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.'
  });
});

// =====================================================
// SERVER STARTUP
// =====================================================

const server = app.listen(config.port, () => {
  logger.info(`🚀 Unified Rasa-Only Chatbot Service started successfully`, {
    port: config.port,
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });

  logger.info('🎯 Service Features Enabled:', {
    rasaPrimary: true,
    geminiFallback: true,
    intelligentCaching: true,
    circuitBreaker: true,
    rateLimiting: true,
    emergencyDetection: true,
    vietnameseNLP: true,
    persistentSessions: true,
    medicalIntegration: true
  });

  logger.info('🔧 Configuration:', {
    rasa: {
      serverUrl: config.rasa.serverUrl,
      timeout: config.rasa.timeout
    },
    gemini: {
      model: config.gemini.model,
      maxTokens: config.gemini.maxTokens
    },
    cache: {
      ttlSeconds: config.cache.ttlSeconds
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');

  server.close(() => {
    logger.info('Server closed successfully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');

  server.close(() => {
    logger.info('Server closed successfully');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

export default app;
