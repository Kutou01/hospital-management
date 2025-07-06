import { NextApiRequest, NextApiResponse } from 'next';
import { geminiCircuitBreaker, withCircuitBreaker } from '../../../lib/utils/circuit-breaker';
import { chatbotCache, CacheKeys } from '../../../lib/utils/cache-manager';
import { InputValidator, chatbotRateLimiter, getClientIdentifier } from '../../../lib/utils/input-validator';
import { performanceTracker, recordMetric, logInfo, logError, recordHealthCheck } from '../../../lib/utils/monitoring';

/**
 * Simple Gemini-only Chatbot API with Circuit Breaker and Caching
 * Enhanced with reliability and performance optimizations
 */

interface ChatRequest {
  message: string;
  conversation_history?: any[];
  user_id?: string;
  session_id?: string;
  chat_type?: 'consultation' | 'booking' | 'emergency';
}

interface ChatResponse {
  success: boolean;
  data?: {
    ai_response: string;
    response_source: string;
    symptoms?: any[];
    severity?: string;
    user_id?: string;
    session_id?: string;
    response_time_ms?: number;
    timestamp?: string;
  };
  error?: string;
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: 'Only POST requests are supported'
    });
  }

  const startTime = Date.now();
  const operationId = `gemini-api-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Start performance tracking
  performanceTracker.start(operationId);

  try {
    // Security: Rate limiting
    const clientId = getClientIdentifier(req);
    const rateLimitResult = chatbotRateLimiter.checkLimit(clientId);

    // Record rate limiting metrics
    recordMetric('api.rate_limit.requests', 1, 'count', {
      client: clientId.substring(0, 10),
      allowed: rateLimitResult.allowed.toString()
    });

    if (!rateLimitResult.allowed) {
      console.warn('🚨 Rate limit exceeded for client:', clientId);
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.'
      });
    }

    // Security: Validate API request
    const apiValidation = InputValidator.validateApiRequest(req);
    if (!apiValidation.isValid && apiValidation.riskLevel === 'high') {
      console.warn('🚨 High-risk API request detected:', apiValidation.errors);
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Request validation failed'
      });
    }

    const { message, conversation_history, user_id, session_id, chat_type = 'consultation' }: ChatRequest = req.body;

    // Enhanced input validation
    const messageValidation = InputValidator.validateChatMessage(message);
    if (!messageValidation.isValid) {
      console.warn('🚨 Message validation failed:', messageValidation.errors);
      return res.status(400).json({
        success: false,
        error: 'Invalid message',
        message: 'Message validation failed'
      });
    }

    // High risk content detection
    if (messageValidation.riskLevel === 'high') {
      console.error('🚨 High risk content detected:', { message: message.substring(0, 50), clientId });
      return res.status(400).json({
        success: false,
        error: 'Content not allowed',
        message: 'Message contains potentially harmful content'
      });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Configuration error',
        message: 'Gemini API key not configured'
      });
    }

    // Test API key first
    try {
      const testResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
      if (!testResponse.ok) {
        console.error('❌ Gemini API Key Test Failed:', testResponse.status, testResponse.statusText);
        return res.status(500).json({
          success: false,
          error: 'Invalid API key',
          message: 'Gemini API key không hợp lệ hoặc đã hết hạn'
        });
      }
      console.log('✅ Gemini API Key Test Passed');
    } catch (keyTestError) {
      console.error('❌ Gemini API Key Test Error:', keyTestError);
      return res.status(500).json({
        success: false,
        error: 'API key test failed',
        message: 'Không thể kết nối đến Gemini API'
      });
    }

    // Enhanced Vietnamese text processing with comprehensive spell correction
    const VIETNAMESE_CORRECTIONS = [
      // Emergency terms
      { wrong: 'sot xuat huyet', correct: 'sốt xuất huyết' },
      { wrong: 'sot dhd', correct: 'sốt xuất huyết' },
      { wrong: 'dengue', correct: 'sốt xuất huyết' },

      // Common symptoms
      { wrong: 'dau dau', correct: 'đau đầu' },
      { wrong: 'kho tho', correct: 'khó thở' },
      { wrong: 'buon non', correct: 'buồn nôn' },
      { wrong: 'chong mat', correct: 'chóng mặt' },
      { wrong: 'met moi', correct: 'mệt mỏi' },
      { wrong: 'dau bung', correct: 'đau bụng' },
      { wrong: 'dau nguc', correct: 'đau ngực' },
      { wrong: 'tho gap', correct: 'thở gấp' },
      { wrong: 'hoa mat', correct: 'hoa mắt' },
      { wrong: 'choang vang', correct: 'choáng váng' },

      // Medical terms
      { wrong: 'bac si', correct: 'bác sĩ' },
      { wrong: 'benh vien', correct: 'bệnh viện' },
      { wrong: 'kham benh', correct: 'khám bệnh' },
      { wrong: 'thuoc men', correct: 'thuốc men' },
      { wrong: 'chuyen khoa', correct: 'chuyên khoa' },
      { wrong: 'dat lich', correct: 'đặt lịch' },

      // Common typos
      { wrong: 'toi', correct: 'tôi' },
      { wrong: 'bi', correct: 'bị' },
      { wrong: 'muon', correct: 'muốn' },
      { wrong: 'can', correct: 'cần' },
      { wrong: 'giup', correct: 'giúp' },
      { wrong: 'lam', correct: 'làm' },
      { wrong: 'nhu', correct: 'như' },
      { wrong: 'co', correct: 'có' },
      { wrong: 'duoc', correct: 'được' }
    ];

    // Process and correct Vietnamese text
    let processedMessage = message
      .toLowerCase()
      .trim()
      // Fix encoding corruption
      .replace(/t�i/gi, 'tôi')
      .replace(/b?/gi, 'bị')
      .replace(/s?t/gi, 'sốt')
      .replace(/xu?t/gi, 'xuất')
      .replace(/huy?t/gi, 'huyết')
      .replace(/d?u/gi, 'đau')
      .replace(/bu?ng/gi, 'bụng')
      .replace(/kh?/gi, 'khó')
      .replace(/th?/gi, 'thở')
      .replace(/bu?n/gi, 'buồn')
      .replace(/n?n/gi, 'nôn')
      .replace(/ch?ng/gi, 'chóng')
      .replace(/m?t/gi, 'mặt')
      .replace(/�/g, '') // Remove replacement characters
      .replace(/\s+/g, ' '); // Normalize spaces

    // Apply spell corrections
    VIETNAMESE_CORRECTIONS.forEach(correction => {
      const regex = new RegExp(`\\b${correction.wrong}\\b`, 'gi');
      processedMessage = processedMessage.replace(regex, correction.correct);
    });

    console.log('🔤 Text Processing:', {
      original: message,
      processed: processedMessage,
      corrected: processedMessage !== message.toLowerCase().trim()
    });

    // Check cache first
    const cacheKey = CacheKeys.chatbotResponse(processedMessage, user_id);
    const cachedResponse = chatbotCache.get(cacheKey);

    if (cachedResponse) {
      console.log('💾 Cache hit for Gemini API');
      return res.status(200).json({
        success: true,
        response: cachedResponse.response,
        source: 'cache',
        severity: cachedResponse.severity || 'medium',
        symptoms: cachedResponse.symptoms || [],
        responseTime: Date.now() - startTime,
        cached: true
      });
    }

    // Build conversation context
    let conversationContext = '';
    if (conversation_history && conversation_history.length > 0) {
      conversationContext = conversation_history.slice(-6).join('\n') + '\n';
    }

    // Create system prompt for hospital chatbot
    const systemPrompt = `Bạn là AI Hỗ trợ của bệnh viện, chuyên tư vấn sức khỏe và hỗ trợ đặt lịch khám bệnh.

NHIỆM VỤ CHÍNH:
1. Tư vấn sức khỏe cơ bản (triệu chứng, bệnh thường gặp)
2. Hỗ trợ đặt lịch khám bệnh
3. Thông tin về các chuyên khoa
4. Hướng dẫn chuẩn bị khám bệnh

CHUYÊN KHOA CÓ SẴN:
- SPEC042: Nội Tổng Hợp
- SPEC043: Nội Tiết  
- SPEC045: Phẫu Thuật Nội Soi
- SPEC032: Nhi Khoa

NGUYÊN TẮC TRẢ LỜI:
- Luôn trả lời bằng tiếng Việt
- Thân thiện, chuyên nghiệp
- Không chẩn đoán bệnh cụ thể
- Khuyến khích khám bác sĩ khi cần thiết
- Phát hiện tình huống cấp cứu (sốt xuất huyết, đau ngực, khó thở)

TÌNH HUỐNG CẤP CỨU - Trả lời ngay:
"🚨 TÌNH HUỐNG CẤP CỨU! Bạn cần đến bệnh viện NGAY LẬP TỨC hoặc gọi 115. Triệu chứng này có thể nguy hiểm đến tính mạng."

Hãy trả lời câu hỏi sau một cách hữu ích và chuyên nghiệp.`;

    // Enhanced emergency detection
    const EMERGENCY_PATTERNS = [
      {
        keywords: ['sốt xuất huyết', 'sot xuat huyet', 'dengue', 'xuất huyết', 'xuat huyet'],
        severity: 'emergency',
        response: '🚨 **CẢNH BÁO KHẨN CẤP**: Sốt xuất huyết là bệnh nguy hiểm đến tính mạng! CẦN ĐẾN CẤP CỨU NGAY LẬP TỨC hoặc GỌI 115!'
      },
      {
        keywords: ['đau ngực', 'dau nguc', 'khó thở', 'kho tho', 'thở gấp', 'tho gap'],
        severity: 'emergency',
        response: '🚨 **CẢNH BÁO KHẨN CẤP**: Đau ngực kèm khó thở có thể là dấu hiệu nhồi máu cơ tim! ĐẾN CẤP CỨU NGAY hoặc GỌI 115!'
      },
      {
        keywords: ['đột quỵ', 'dot quy', 'liệt nửa người', 'liet nua nguoi', 'méo miệng', 'meo mieng'],
        severity: 'emergency',
        response: '🚨 **CẢNH BÁO KHẨN CẤP**: Triệu chứng đột quỵ! THỜI GIAN LÀ VÀNG - ĐẾN CẤP CỨU NGAY hoặc GỌI 115!'
      }
    ];

    // Check for emergency symptoms
    let emergencyDetected = false;
    let emergencyResponse = '';

    for (const pattern of EMERGENCY_PATTERNS) {
      const hasEmergency = pattern.keywords.some(keyword =>
        processedMessage.includes(keyword.toLowerCase())
      );

      if (hasEmergency) {
        emergencyDetected = true;
        emergencyResponse = pattern.response;
        console.log('🚨 EMERGENCY DETECTED:', {
          message: processedMessage,
          pattern: pattern.keywords,
          severity: pattern.severity
        });
        break;
      }
    }

    // If emergency detected, return immediate response
    if (emergencyDetected) {
      return res.status(200).json({
        success: true,
        response: emergencyResponse,
        source: 'emergency-detection',
        severity: 'emergency',
        symptoms: ['emergency'],
        responseTime: Date.now() - startTime
      });
    }

    const userMessage = `${conversationContext}Người dùng: ${processedMessage}`;

    // Call Gemini API with Circuit Breaker protection
    const geminiApiCall = async () => {
      return fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              { text: userMessage }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
      });
    };

    // Execute with circuit breaker
    const geminiResponse = await withCircuitBreaker('gemini-api', geminiApiCall);

    if (!geminiResponse.ok) {
      console.error('Gemini API Error:', geminiResponse.status, geminiResponse.statusText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }

    const aiResponse = geminiData.candidates[0].content.parts[0].text;
    const responseTime = Date.now() - startTime;

    // Enhanced symptom analysis using processed message
    const symptoms: string[] = [];
    let severity = 'low';

    // Comprehensive symptom detection
    const SYMPTOM_KEYWORDS = [
      'đau đầu', 'đau bụng', 'đau ngực', 'đau lưng', 'đau họng', 'đau răng',
      'sốt', 'sốt cao', 'sốt xuất huyết',
      'ho', 'ho khan', 'ho có đờm', 'ho ra máu',
      'buồn nôn', 'nôn', 'tiêu chảy', 'táo bón',
      'chóng mặt', 'hoa mắt', 'choáng váng',
      'mệt mỏi', 'uể oải', 'kiệt sức',
      'khó thở', 'thở gấp', 'ngạt thở',
      'đau', 'sưng', 'viêm', 'ngứa', 'phát ban'
    ];

    // Detect symptoms from processed message
    SYMPTOM_KEYWORDS.forEach(symptom => {
      if (processedMessage.includes(symptom)) {
        symptoms.push(symptom);
      }
    });

    // Determine severity based on symptoms
    if (symptoms.length === 0) severity = 'low';
    else if (symptoms.length <= 2) severity = 'medium';
    else if (symptoms.length > 2) severity = 'medium';

    // High severity symptoms
    const highSeveritySymptoms = ['sốt cao', 'đau ngực', 'khó thở', 'thở gấp', 'ho ra máu', 'choáng váng'];
    if (symptoms.some(s => highSeveritySymptoms.includes(s))) {
      severity = 'high';
    }

    console.log(`✅ Simple Gemini Response:`, {
      user_message: message.substring(0, 50) + '...',
      response_length: aiResponse.length,
      response_time: responseTime,
      severity,
      symptoms_count: symptoms.length
    });

    // Cache the successful response
    const responseData = {
      response: aiResponse,
      severity,
      symptoms,
      timestamp: Date.now()
    };

    // Cache for 10 minutes for non-emergency, 5 minutes for emergency
    const cacheTTL = severity === 'emergency' ? 5 * 60 * 1000 : 10 * 60 * 1000;
    chatbotCache.set(cacheKey, responseData, cacheTTL);

    // Record performance metrics
    const totalResponseTime = performanceTracker.end(operationId, 'api.chatbot.gemini.total', {
      severity,
      cached: 'false',
      symptoms_count: symptoms.length.toString()
    });

    // Record success metrics
    recordMetric('api.chatbot.gemini.success', 1, 'count', { severity });
    recordMetric('api.chatbot.gemini.response_length', aiResponse.length, 'chars');
    recordMetric('api.chatbot.gemini.symptoms_detected', symptoms.length, 'count');

    // Health check
    recordHealthCheck('gemini-api', 'healthy', totalResponseTime, {
      response_length: aiResponse.length,
      symptoms_count: symptoms.length
    });

    logInfo('Gemini API request completed successfully', {
      operationId,
      responseTime: totalResponseTime,
      severity,
      symptomsCount: symptoms.length,
      clientId: clientId.substring(0, 10)
    });

    return res.status(200).json({
      success: true,
      data: {
        ai_response: aiResponse,
        response_source: 'gemini-simple',
        symptoms,
        severity,
        user_id: user_id || `user_${Date.now()}`,
        session_id: session_id || `session_${Date.now()}`,
        response_time_ms: responseTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    // Record error metrics and performance
    const totalResponseTime = performanceTracker.end(operationId, 'api.chatbot.gemini.error', {
      error_type: error.constructor.name,
      error_message: error.message?.substring(0, 100)
    });

    // Categorize error
    let errorCategory = 'unknown';
    let errorMessage = 'Có lỗi xảy ra trong hệ thống chatbot';
    let statusCode = 500;

    if (error.message?.includes('API key')) {
      errorCategory = 'auth';
      errorMessage = 'Cấu hình API không hợp lệ';
      statusCode = 500;
    } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
      errorCategory = 'quota';
      errorMessage = 'Hệ thống đang quá tải. Vui lòng thử lại sau.';
      statusCode = 503;
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      errorCategory = 'network';
      errorMessage = 'Kết nối mạng không ổn định. Vui lòng thử lại.';
      statusCode = 503;
    } else if (error.message?.includes('Circuit breaker')) {
      errorCategory = 'circuit_breaker';
      errorMessage = 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.';
      statusCode = 503;
    }

    // Record error metrics
    recordMetric('api.chatbot.gemini.error', 1, 'count', {
      category: errorCategory,
      status_code: statusCode.toString()
    });

    // Health check
    recordHealthCheck('gemini-api', 'unhealthy', totalResponseTime, {
      error_category: errorCategory,
      error_message: error.message
    }, error.message);

    // Log error with context
    logError('Gemini API request failed', {
      operationId,
      error: error.message,
      errorCategory,
      statusCode,
      responseTime: totalResponseTime,
      stack: error.stack
    });

    console.error('❌ Simple Gemini API Error:', error);

    return res.status(statusCode).json({
      success: false,
      error: 'Chatbot service error',
      message: errorMessage
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '8mb',
  },
}
