const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3020;

// Initialize Gemini AI
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCGniYSMrC7RV0D_6YtS1vCSgYXpjeT2ZA';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb', charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true, limit: '10mb', charset: 'utf-8' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Medical consultation function using Gemini AI
async function getMedicalConsultation(symptom) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Bạn là một AI hỗ trợ y tế của bệnh viện tại Việt Nam. Hãy phân tích triệu chứng và đưa ra lời khuyên y tế phù hợp.

TRIỆU CHỨNG: ${symptom}

Hãy trả lời theo format sau:
1. Phân tích triệu chứng
2. Các nguyên nhân có thể
3. Lời khuyên sơ cứu/chăm sóc tại nhà (nếu có)
4. Khi nào cần đến bệnh viện
5. Chuyên khoa nên khám

Lưu ý:
- Trả lời bằng tiếng Việt
- Không sử dụng markdown formatting (**, *, #, etc.)
- Không chẩn đoán chính xác, chỉ tư vấn tham khảo
- Luôn khuyến khích đến bệnh viện nếu triệu chứng nghiêm trọng
- Giữ tone thân thiện, chuyên nghiệp
- Tối đa 200 từ
- Viết text thuần túy, không có ký tự đặc biệt`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini AI error:', error);
    return null;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    service: 'Unified Chatbot Service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Chat endpoint - simplified version
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Simple response logic
    let response = '';
    let confidence = 0.8;
    
    // Emergency detection - simple and reliable
    const emergencyKeywords = ['sốt xuất huyết', 'xuất huyết', 'cấp cứu', 'nguy hiểm', 'khó thở', 'đau tim'];
    const messageText = message.toLowerCase();
    let isEmergency = false;

    console.log('DEBUG: Message received:', message);
    console.log('DEBUG: Message lowercase:', messageText);

    // Check each keyword
    for (const keyword of emergencyKeywords) {
      console.log('DEBUG: Checking keyword:', keyword);
      if (messageText.includes(keyword.toLowerCase())) {
        console.log('DEBUG: EMERGENCY DETECTED with keyword:', keyword);
        isEmergency = true;
        break;
      }
    }

    console.log('DEBUG: Final isEmergency:', isEmergency);
    
    if (isEmergency) {
      response = '🚨 CẢNH BÁO KHẨN CẤP! Triệu chứng của bạn có thể nghiêm trọng. Vui lòng đến bệnh viện ngay lập tức hoặc gọi cấp cứu 115. Chúng tôi khuyến nghị bạn không trì hoãn việc tìm kiếm sự chăm sóc y tế khẩn cấp.';
      confidence = 0.95;
    } else if (message.toLowerCase().includes('đặt lịch') || message.toLowerCase().includes('book')) {
      response = 'Tôi có thể giúp bạn đặt lịch khám. Vui lòng cho biết:\n1. Triệu chứng của bạn\n2. Thời gian mong muốn\n3. Thông tin liên hệ';
    } else if (message.toLowerCase().includes('xin chào') || message.toLowerCase().includes('hello')) {
      response = 'Xin chào! Tôi là AI hỗ trợ của bệnh viện. Tôi có thể giúp bạn:\n- Tư vấn sức khỏe\n- Đặt lịch khám\n- Thông tin về dịch vụ\n\nBạn cần hỗ trợ gì?';
    } else {
      // Try to get AI medical consultation for symptoms
      console.log('🤖 Getting AI consultation for:', message);
      const aiResponse = await getMedicalConsultation(message);

      if (aiResponse) {
        response = aiResponse;
        confidence = 0.9;
        console.log('✅ AI consultation successful');
      } else {
        response = 'Cảm ơn bạn đã liên hệ. Tôi đang xử lý câu hỏi của bạn. Để được hỗ trợ tốt hơn, bạn có thể mô tả chi tiết triệu chứng hoặc vấn đề sức khỏe của mình.';
        console.log('❌ AI consultation failed, using fallback');
      }
    }

    res.json({
      success: true,
      sessionId: sessionId || `session_${Date.now()}`,
      response: response,
      confidence: confidence,
      source: 'unified-chatbot',
      processingTime: 100,
      cached: false,
      sessionInfo: {
        messageCount: 1,
        sessionType: 'consultation'
      }
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.'
    });
  }
});

// Booking endpoint - simplified
app.post('/api/booking/create', async (req, res) => {
  try {
    const { patientInfo, symptoms, preferredTime } = req.body;
    
    // Simple booking logic
    const appointmentCode = `APT${Date.now()}`;
    
    res.json({
      success: true,
      appointmentId: appointmentCode,
      appointmentCode: appointmentCode,
      doctorInfo: {
        name: 'Bác sĩ Nguyễn Văn A',
        specialty: 'Nội khoa'
      },
      appointmentTime: preferredTime || '2025-07-04 09:00',
      estimatedCost: 200000,
      paymentUrl: `http://localhost:3000/payment/${appointmentCode}`,
      confirmationMessage: `Đặt lịch thành công! Mã lịch hẹn: ${appointmentCode}`
    });

  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Booking failed'
    });
  }
});

// Session endpoint
app.get('/api/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  res.json({
    sessionId: sessionId,
    isActive: true,
    currentStep: 'consultation',
    progress: 50,
    contextSummary: 'Đang tư vấn sức khỏe'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🤖 Unified Chatbot Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Chat API: http://localhost:${PORT}/api/chat`);
  console.log(`📅 Booking API: http://localhost:${PORT}/api/booking/create`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
