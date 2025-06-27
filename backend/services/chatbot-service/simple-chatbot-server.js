require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 3020;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini AI
let genAI, model;
try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log('✅ Gemini AI initialized successfully');
  } else {
    console.log('❌ GEMINI_API_KEY not found');
  }
} catch (error) {
  console.log('❌ Error initializing Gemini AI:', error.message);
}

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Function sửa lỗi chính tả tiếng Việt
function normalizeVietnameseText(text) {
  const corrections = {
    'đâu đầu': 'đau đầu',
    'đau đâu': 'đau đầu',
    'dau dau': 'đau đầu',
    'buồn non': 'buồn nôn',
    'buon non': 'buồn nôn',
    'buon nôn': 'buồn nôn',
    'đau bung': 'đau bụng',
    'dau bung': 'đau bụng',
    'kho thở': 'khó thở',
    'kho tho': 'khó thở',
    'chong mat': 'chóng mặt',
    'chóng mặt': 'chóng mặt',
    'sot': 'sốt',
    'ho': 'ho',
    'dau nguc': 'đau ngực',
    'đau nguc': 'đau ngực',
    'mat ngu': 'mất ngủ',
    'mất ngu': 'mất ngủ'
  };

  let normalized = text.toLowerCase();
  for (const [wrong, correct] of Object.entries(corrections)) {
    normalized = normalized.replace(new RegExp(wrong, 'gi'), correct);
  }
  return normalized;
}

// Function phân tích context từ lịch sử hội thoại
function analyzeConversationContext(userMessage, conversationHistory) {
  if (!conversationHistory || conversationHistory.length === 0) {
    return { hasContext: false };
  }

  // Sửa lỗi chính tả trước khi phân tích
  const normalizedMessage = normalizeVietnameseText(userMessage);
  const recentMessages = normalizeVietnameseText(conversationHistory.slice(-3).join(' '));

  // Phân tích thời gian kéo dài triệu chứng
  const timeIndicators = {
    'tuần trước': 'kéo dài 1 tuần',
    'mấy ngày': 'kéo dài vài ngày',
    'hôm qua': 'từ hôm qua',
    'sáng nay': 'từ sáng nay',
    'lâu rồi': 'kéo dài lâu',
    'mới': 'mới xuất hiện'
  };

  // Tìm triệu chứng trong lịch sử
  const symptoms = ['đau đầu', 'đau bụng', 'sốt', 'ho', 'khó thở', 'chóng mặt', 'buồn nôn'];
  let detectedSymptom = null;

  for (const symptom of symptoms) {
    if (recentMessages.includes(symptom)) {
      detectedSymptom = symptom;
      break;
    }
  }

  // Tìm thời gian trong tin nhắn hiện tại
  let timeContext = null;
  for (const [timePhrase, meaning] of Object.entries(timeIndicators)) {
    if (normalizedMessage.includes(timePhrase)) {
      timeContext = meaning;
      break;
    }
  }

  if (detectedSymptom && timeContext) {
    return {
      hasContext: true,
      symptom: detectedSymptom,
      duration: timeContext,
      contextualMessage: `${detectedSymptom} ${timeContext}`
    };
  }

  return { hasContext: false };
}

// Function nhận diện tình huống cấp cứu
function detectEmergencyScenarios(userMessage, conversationContext = null) {
  // Sửa lỗi chính tả trước khi phân tích
  const normalizedText = normalizeVietnameseText(userMessage);

  // 🚨 KIỂM TRA DURATION TRONG SINGLE MESSAGE TRƯỚC
  // Đau đầu + thời gian kéo dài trong cùng 1 câu
  if (normalizedText.includes('đau đầu') &&
      (normalizedText.includes('2 tuần') || normalizedText.includes('tuần nay') ||
       normalizedText.includes('tuần rồi') || normalizedText.includes('lâu rồi'))) {

    // Nếu có buồn nôn trong cùng message = CẤP CỨU
    if (normalizedText.includes('buồn nôn') || normalizedText.includes('nôn')) {
      return {
        isEmergency: true,
        condition: 'Đau đầu kéo dài + buồn nôn - nghi ngờ tăng áp lực nội sọ',
        response: '🚨 **CẢNH BÁO CẤP CỨU**: Đau đầu kéo dài 2 tuần + buồn nôn có thể là dấu hiệu tăng áp lực nội sọ hoặc vấn đề thần kinh nghiêm trọng!\n\n⚡ **HÀNH ĐỘNG NGAY**:\n• Đến cấp cứu ngay lập tức\n• Cần chụp CT/MRI não\n• KHÔNG trì hoãn\n• Gọi 115 nếu cần\n\n🏥 Khuyến nghị: **Cấp cứu Thần kinh**\n\n⚠️ Đây có thể là dấu hiệu u não, xuất huyết não hoặc viêm màng não!',
        confidence: 95
      };
    }

    // Đau đầu kéo dài không có buồn nôn = KHẨN CẤP
    return {
      isEmergency: true,
      condition: 'Đau đầu kéo dài 2 tuần cần khám ngay',
      response: '⚠️ **CẢNH BÁO KHẨN CẤP**: Đau đầu kéo dài 2 tuần cần được khám ngay!\n\n🔍 **Có thể là**:\n• Tăng huyết áp nghiêm trọng\n• Viêm xoang mãn tính\n• Stress kéo dài\n• Vấn đề thần kinh\n• U não (cần loại trừ)\n\n🏥 **Khuyến nghị khám NGAY**: **Khoa Thần kinh** hoặc **Cấp cứu**\n\n💊 KHÔNG tự ý uống thuốc giảm đau!',
      confidence: 90
    };
  }

  // Sốt cao kéo dài
  if (normalizedText.includes('sốt') &&
      (normalizedText.includes('2 tuần') || normalizedText.includes('tuần nay') ||
       normalizedText.includes('tuần rồi') || normalizedText.includes('lâu rồi'))) {
    return {
      isEmergency: true,
      condition: 'Sốt kéo dài cần khám ngay',
      response: '⚠️ **CẢNH BÁO**: Sốt kéo dài hơn 1 tuần có thể là nhiễm trùng nghiêm trọng!\n\n🏥 **Cần khám NGAY**: **Khoa Nội** hoặc **Cấp cứu**\n\n🔍 Cần xét nghiệm máu để tìm nguyên nhân.',
      confidence: 90
    };
  }

  // Kiểm tra triệu chứng kéo dài từ context
  if (conversationContext && conversationContext.hasContext) {
    const { symptom, duration, contextualMessage } = conversationContext;

    // 🚨 CẤP CỨU: Đau đầu kéo dài + buồn nôn = nghi ngờ tăng áp lực nội sọ
    if (symptom === 'đau đầu' &&
        (duration.includes('tuần') || duration.includes('lâu')) &&
        (normalizedText.includes('buồn nôn') || normalizedText.includes('nôn'))) {
      return {
        isEmergency: true,
        condition: 'Đau đầu kéo dài + buồn nôn - nghi ngờ tăng áp lực nội sọ',
        response: '🚨 **CẢNH BÁO CẤP CỨU**: Đau đầu kéo dài 2 tuần + buồn nôn có thể là dấu hiệu tăng áp lực nội sọ hoặc vấn đề thần kinh nghiêm trọng!\n\n⚡ **HÀNH ĐỘNG NGAY**:\n• Đến cấp cứu ngay lập tức\n• Cần chụp CT/MRI não\n• KHÔNG trì hoãn\n• Gọi 115 nếu cần\n\n🏥 Khuyến nghị: **Cấp cứu Thần kinh**\n\n⚠️ Đây có thể là dấu hiệu u não, xuất huyết não hoặc viêm màng não!',
        confidence: 95
      };
    }

    // Đau đầu kéo dài > 1 tuần (không có buồn nôn)
    if (symptom === 'đau đầu' && (duration.includes('tuần') || duration.includes('lâu'))) {
      return {
        isEmergency: true,
        condition: 'Đau đầu kéo dài cần khám ngay',
        response: '⚠️ **CẢNH BÁO**: Đau đầu kéo dài hơn 1 tuần cần được khám ngay!\n\n🔍 **Có thể là**:\n• Tăng huyết áp\n• Viêm xoang mãn tính\n• Stress kéo dài\n• Vấn đề thần kinh\n\n🏥 **Khuyến nghị khám ngay**: **Khoa Thần kinh** hoặc **Nội khoa**\n\n💊 Trong lúc chờ khám: nghỉ ngơi, uống đủ nước, tránh ánh sáng mạnh.',
        confidence: 90
      };
    }

    // Sốt kéo dài > 3 ngày
    if (symptom === 'sốt' && (duration.includes('tuần') || duration.includes('lâu'))) {
      return {
        isEmergency: true,
        condition: 'Sốt kéo dài cần khám ngay',
        response: '⚠️ **CẢNH BÁO**: Sốt kéo dài hơn 3 ngày có thể là nhiễm trùng nghiêm trọng!\n\n🏥 **Cần khám ngay**: **Khoa Nội** hoặc **Cấp cứu**\n\n🔍 Cần xét nghiệm máu để tìm nguyên nhân.',
        confidence: 90
      };
    }
  }

  // Viêm ruột thừa: nôn + đau hông phải/bụng dưới phải
  if ((normalizedText.includes('nôn') || normalizedText.includes('buồn nôn')) &&
      (normalizedText.includes('hông phải') || normalizedText.includes('bụng dưới') ||
       normalizedText.includes('đau phải') || normalizedText.includes('bên phải'))) {
    return {
      isEmergency: true,
      condition: 'Nghi ngờ viêm ruột thừa',
      response: '🚨 **CẢNH BÁO CẤP CỨU**: Triệu chứng nôn + đau hông phải có thể là viêm ruột thừa - tình trạng nghiêm trọng cần phẫu thuật khẩn cấp!\n\n⚡ **HÀNH ĐỘNG NGAY**:\n• Đến cấp cứu ngay lập tức\n• Gọi 115 nếu đau dữ dội\n• KHÔNG ăn uống gì\n• KHÔNG uống thuốc giảm đau\n\n🏥 Khuyến nghị: **Khoa Ngoại Tổng hợp** hoặc **Cấp cứu**',
      confidence: 95
    };
  }

  // Đau ngực + khó thở = nghi ngờ tim mạch
  if ((normalizedText.includes('đau ngực') || normalizedText.includes('thắt ngực')) &&
      (normalizedText.includes('khó thở') || normalizedText.includes('thở dốc'))) {
    return {
      isEmergency: true,
      condition: 'Nghi ngờ vấn đề tim mạch cấp tính',
      response: '🚨 **CẢNH BÁO CẤP CỨU**: Đau ngực + khó thở có thể là nhồi máu cơ tim hoặc vấn đề tim mạch nghiêm trọng!\n\n⚡ **HÀNH ĐỘNG NGAY**:\n• Gọi 115 ngay lập tức\n• Ngồi thẳng, thở chậm\n• Nhai 1 viên aspirin nếu có\n• Đến cấp cứu ngay\n\n🏥 Khuyến nghị: **Cấp cứu Tim mạch**',
      confidence: 95
    };
  }

  return { isEmergency: false };
}

// Function tìm kiếm trong bảng chatbot_training_data
async function findTrainingDataResponse(userMessage) {
  try {
    // Sửa lỗi chính tả trước khi tìm kiếm
    const normalizedText = normalizeVietnameseText(userMessage);

    // Lấy tất cả training data từ database
    const { data: symptoms, error } = await supabase
      .from('chatbot_training_data')
      .select('question, answer, category, keywords, confidence_score')
      .eq('is_active', true);

    if (error) {
      console.log('❌ Error fetching symptoms:', error);
      console.log('Error details:', JSON.stringify(error, null, 2));
      return null;
    }

    console.log(`🔍 Searching in ${symptoms?.length || 0} training records for: "${userMessage}"`);

    if (!symptoms || symptoms.length === 0) {
      console.log('⚠️ No training data found in database');
      console.log('Training data:', symptoms);
      return null;
    }

    let bestMatch = null;
    let highestScore = 0;

    for (const trainingItem of symptoms) {
      let score = 0;

      // Kiểm tra keywords (chỉ từ khóa có ý nghĩa)
      if (trainingItem.keywords && Array.isArray(trainingItem.keywords)) {
        const matchingKeywords = trainingItem.keywords.filter(keyword => {
          const keywordLower = keyword.toLowerCase();
          // Chỉ match từ khóa dài >= 2 ký tự và không phải từ chung
          return keywordLower.length >= 2 &&
                 !['u', 'đau', 'bị', 'có', 'và', 'của'].includes(keywordLower) &&
                 normalizedText.includes(keywordLower);
        });
        score += matchingKeywords.length * 50;

        if (matchingKeywords.length > 0) {
          console.log(`   🎯 Found ${matchingKeywords.length} matching keywords in "${trainingItem.question}": [${matchingKeywords.join(', ')}]`);
        }
      }

      // Kiểm tra question match
      if (trainingItem.question && normalizedText.includes(trainingItem.question.toLowerCase())) {
        score += 60;
        console.log(`   📝 Question match: "${trainingItem.question}"`);
      }

      // Kiểm tra partial question match (cải thiện độ chính xác)
      const questionWords = trainingItem.question ? trainingItem.question.toLowerCase().split(' ') : [];
      const userWords = normalizedText.split(' ');

      // Chỉ tính điểm cho từ khóa quan trọng (không phải từ chung như "đau", "bị")
      const importantWords = questionWords.filter(word =>
        word.length > 3 &&
        !['đau', 'bị', 'tôi', 'của', 'với', 'và', 'có', 'là', 'một'].includes(word)
      );

      const commonImportantWords = importantWords.filter(word => userWords.includes(word));
      if (commonImportantWords.length > 0) {
        score += commonImportantWords.length * 20;
        console.log(`   🔤 Important common words: [${commonImportantWords.join(', ')}]`);
      }

      // Bonus cho exact phrase match
      if (trainingItem.question && trainingItem.question.toLowerCase().includes(normalizedText)) {
        score += 40;
        console.log(`   🎯 Exact phrase match in question`);
      }

      // Bonus cho confidence_score cao
      if (trainingItem.confidence_score >= 90) {
        score += 10;
      }

      if (score > highestScore && score >= 50) { // Tăng threshold từ 30 lên 50
        highestScore = score;
        bestMatch = {
          response: trainingItem.answer,
          confidence: Math.min(score, 100),
          source: 'training_database',
          question: trainingItem.question,
          category: trainingItem.category
        };
      }
    }

    if (bestMatch) {
      console.log(`✅ Best match: "${bestMatch.question}" (confidence: ${bestMatch.confidence}%)`);
    } else {
      console.log('❌ No suitable match found in training database');
    }

    return bestMatch;
  } catch (error) {
    console.log('❌ Error in findSymptomsResponse:', error);
    return null;
  }
}

// Function tìm kiếm bác sĩ
async function findDoctorsResponse(userMessage) {
  try {
    // Sửa lỗi chính tả trước khi tìm kiếm
    const normalizedText = normalizeVietnameseText(userMessage);

    // Kiểm tra xem có phải câu hỏi về bác sĩ không
    const doctorKeywords = ['bác sĩ', 'doctor', 'bs', 'thầy thuốc', 'bác sỹ'];
    const isDoctorQuestion = doctorKeywords.some(keyword =>
      normalizedText.includes(keyword)
    );

    if (!isDoctorQuestion) {
      return null;
    }

    console.log('🔍 Detected doctor-related question');

    // Xác định chuyên khoa được hỏi
    const specialtyMap = {
      'Tim mạch': ['tim mạch', 'tim', 'mạch máu', 'cardiology'],
      'Thần kinh': ['thần kinh', 'neurology', 'đau đầu', 'chóng mặt'],
      'Nhi khoa': ['nhi khoa', 'trẻ em', 'pediatric', 'em bé'],
      'Phụ khoa': ['phụ khoa', 'gynecology', 'phụ nữ'],
      'Da liễu': ['da liễu', 'dermatology', 'da', 'mụn'],
      'Tiêu hóa': ['tiêu hóa', 'dạ dày', 'ruột', 'gastro'],
      'Hô hấp': ['hô hấp', 'phổi', 'respiratory', 'ho', 'sốt'],
      'Tâm thần': ['tâm thần', 'psychology', 'trầm cảm', 'lo âu'],
      'Cấp cứu': ['cấp cứu', 'emergency', 'khẩn cấp'],
      'Nội khoa': ['nội khoa', 'internal', 'tổng quát'],
      'Tiết niệu': ['tiết niệu', 'urology', 'thận', 'bàng quang', 'tiểu'],
      'Nam khoa': ['nam khoa', 'rối loạn cương', 'xuất tinh sớm', 'vô sinh nam'],
      'Tai Mũi Họng': ['tai mũi họng', 'tmh', 'viêm họng', 'viêm xoang', 'ù tai'],
      'Răng Hàm Mặt': ['răng hàm mặt', 'răng', 'sâu răng', 'chỉnh nha'],
      'Mắt': ['mắt', 'nhãn khoa', 'cận thị', 'đục thủy tinh thể'],
      'Sản khoa': ['sản khoa', 'thai sản', 'thai kỳ', 'sinh nở'],
      'Ung bướu': ['ung bướu', 'ung thư', 'oncology', 'u'],
      'Ngoại khoa': ['ngoại khoa', 'phẫu thuật', 'surgery']
    };

    let targetSpecialty = null;
    for (const [specialty, keywords] of Object.entries(specialtyMap)) {
      if (keywords.some(keyword => normalizedText.includes(keyword))) {
        targetSpecialty = specialty;
        break;
      }
    }

    // Query database
    let query = supabase
      .from('chatbot_doctors')
      .select(`
        doctor_id,
        full_name,
        specialty,
        consultation_fee,
        rating,
        facility_name,
        facility_address,
        facility_phone
      `);

    if (targetSpecialty) {
      query = query.eq('specialty', targetSpecialty);
      console.log(`🎯 Searching for specialty: ${targetSpecialty}`);
    }

    // Sắp xếp theo rating
    query = query.order('rating', { ascending: false }).limit(5);

    const { data: doctors, error } = await query;

    if (error) {
      console.log('❌ Error fetching doctors:', error);
      return null;
    }

    if (!doctors || doctors.length === 0) {
      return {
        response: `Xin lỗi, tôi không tìm thấy bác sĩ ${targetSpecialty || ''} phù hợp. Bạn có thể liên hệ tổng đài để được hỗ trợ.`,
        confidence: 80,
        source: 'doctors_database'
      };
    }

    // Tạo response
    let response = '';
    if (targetSpecialty) {
      response = `🏥 Tôi gợi ý một số bác sĩ ${targetSpecialty} giỏi:\n\n`;
    } else {
      response = `🏥 Tôi gợi ý một số bác sĩ giỏi:\n\n`;
    }

    doctors.forEach((doctor, index) => {
      const fee = doctor.consultation_fee ?
        `${doctor.consultation_fee.toLocaleString()}đ` : 'Liên hệ';
      const facility = doctor.facility_name || 'Chưa xác định';
      const address = doctor.facility_address || 'Chưa có thông tin';
      const phone = doctor.facility_phone || 'Chưa có thông tin';

      response += `${index + 1}. **${doctor.full_name}**\n`;
      response += `   🏥 **${facility}**\n`;
      response += `   📍 ${address}\n`;
      response += `   📞 ${phone}\n`;
      response += `   💰 Phí khám: ${fee}\n`;
      response += `   ⭐ Rating: ${doctor.rating}/5.0\n\n`;
    });

    response += `💡 Bạn có triệu chứng gì cụ thể để tôi tư vấn thêm không?`;

    return {
      response: response,
      confidence: 90,
      source: 'doctors_database',
      specialty: targetSpecialty,
      count: doctors.length
    };

  } catch (error) {
    console.log('❌ Error in findDoctorsResponse:', error);
    return null;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    service: 'Hospital Chatbot Service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: {
      health_advisor: true,
      gemini_ai: !!model,
      vietnamese_language: true
    },
    environment: {
      node_env: process.env.NODE_ENV || 'development',
      port: PORT,
      gemini_connected: !!process.env.GEMINI_API_KEY
    }
  });
});

// Welcome message endpoint
app.get('/api/health/welcome', (req, res) => {
  res.json({
    success: true,
    data: {
      message: `Xin chào! Tôi là bác sĩ AI của bệnh viện, rất vui được hỗ trợ bạn! 👋

Tôi có thể giúp bạn:
🩺 Tư vấn về triệu chứng
🏥 Gợi ý chuyên khoa cần khám
💊 Hướng dẫn chăm sóc sức khỏe
🚨 Nhận diện tình huống khẩn cấp

Bạn đang gặp vấn đề gì về sức khỏe? Hãy chia sẻ với tôi nhé! 😊

💡 Lưu ý: Tôi chỉ tư vấn sơ bộ, bạn nên gặp bác sĩ để được khám chính xác.`,
      timestamp: new Date().toISOString()
    }
  });
});

// Chat với Gemini AI
app.post('/api/health/chat', async (req, res) => {
  try {
    const { message, conversation_history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tin nhắn',
        error: 'message is required and must be a string'
      });
    }

    if (!model) {
      return res.status(500).json({
        success: false,
        message: 'Gemini AI chưa được cấu hình',
        error: 'Gemini AI not initialized'
      });
    }

    console.log('Processing chat message:', message);
    const startTime = Date.now();

    // Kiểm tra xem có phải câu hỏi y tế không (với context)
    const hasHealthContext = conversation_history &&
      conversation_history.some(msg => isHealthRelatedQuestion(msg));

    if (!isHealthRelatedQuestion(message) && !hasHealthContext) {
      return res.json({
        success: true,
        message: 'Chat thành công',
        data: {
          user_message: message,
          ai_response: 'Xin lỗi, tôi chỉ có thể tư vấn về vấn đề sức khỏe. Bạn có triệu chứng gì cần tư vấn không? 😊',
          timestamp: new Date().toISOString()
        }
      });
    }

    // 🧠 BƯỚC 0: Phân tích context từ lịch sử hội thoại
    const conversationContext = analyzeConversationContext(message, conversation_history);
    console.log('🧠 Conversation context:', conversationContext);

    // 🚨 BƯỚC 1: Kiểm tra tình huống cấp cứu TRƯỚC (với context)
    const emergencyCheck = detectEmergencyScenarios(message, conversationContext);
    if (emergencyCheck.isEmergency) {
      console.log(`🚨 EMERGENCY DETECTED: ${emergencyCheck.condition}`);

      // Lưu conversation
      try {
        await supabase
          .from('chatbot_conversations')
          .insert({
            user_message: message,
            bot_response: emergencyCheck.response,
            response_source: 'emergency_detection',
            response_time_ms: Date.now() - startTime,
            conversation_history: conversation_history || []
          });
      } catch (saveError) {
        console.log('⚠️ Failed to save emergency conversation:', saveError.message);
      }

      return res.json({
        success: true,
        message: 'Phát hiện tình huống cấp cứu',
        data: {
          user_message: message,
          ai_response: emergencyCheck.response,
          response_source: 'emergency_detection',
          response_time_ms: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      });
    }

    // 🔍 BƯỚC 1: Tìm trong Database trước
    let aiResponse = null;
    let responseSource = 'gemini';

    try {
      // Tìm bác sĩ trước
      const doctorResponse = await findDoctorsResponse(message);
      if (doctorResponse && doctorResponse.confidence >= 80) {
        aiResponse = doctorResponse.response;
        responseSource = 'doctors_database';
        console.log(`✅ Found doctor response (confidence: ${doctorResponse.confidence}%)`);
      } else {
        // Tìm trong bảng training data
        const dbResponse = await findTrainingDataResponse(message);

      // 🧠 LOGIC THÔNG MINH: Phân biệt câu hỏi đơn giản vs phức tạp
      const isComplexQuestion = message.length > 40 ||
                               message.includes('tương tác') ||
                               message.includes('liều lượng') ||
                               message.includes('bao lâu') ||
                               message.includes('bao nhiêu') ||
                               message.includes('có thể') ||
                               message.includes('nên') ||
                               message.includes('cho trẻ') ||
                               message.includes('tuổi') ||
                               /\d+\s*(mg|ml|viên|tuổi)/.test(message) ||
                               message.split(' ').length > 8;

      const confidenceThreshold = isComplexQuestion ? 60 : 40; // Giảm threshold

      if (dbResponse && dbResponse.confidence >= confidenceThreshold) {
        aiResponse = dbResponse.response;
        responseSource = 'database';
        console.log(`✅ Found response in database (confidence: ${dbResponse.confidence}%, threshold: ${confidenceThreshold}%)`);
        } else if (dbResponse) {
          console.log(`⚠️ Database match too low (confidence: ${dbResponse.confidence}%, threshold: ${confidenceThreshold}%) - Using Gemini AI`);
        }
      }
    } catch (error) {
      console.log('⚠️ Database lookup failed, falling back to Gemini:', error.message);
    }

    // 🤖 BƯỚC 2: Nếu không tìm thấy trong DB, dùng Gemini AI
    if (!aiResponse) {
      console.log('🤖 Using Gemini AI for response (complex question or no database match)');

      // Tạo context từ lịch sử hội thoại
      const context = conversation_history ?
        `Lịch sử hội thoại:\n${conversation_history.slice(-4).join('\n')}\n\n` : '';

      const prompt = `
Bạn là bác sĩ AI thân thiện của bệnh viện, chuyên tư vấn sức khỏe bằng tiếng Việt một cách tự nhiên và liền mạch.

${context}Tin nhắn từ bệnh nhân: "${message}"

CÁCH TRẢ LỜI TỰ NHIÊN:
• Bắt đầu bằng lời thăm hỏi/đồng cảm (VD: "Tôi hiểu bạn đang lo lắng về...", "Cảm ơn bạn đã chia sẻ...")
• Đưa ra 2-3 lời khuyên ngắn gọn, dễ hiểu
• Kết thúc bằng câu hỏi tiếp theo để duy trì hội thoại
• Sử dụng emoji phù hợp: 😊 💊 🏥 ⚠️

QUY TẮC QUAN TRỌNG:
- Trả lời ngắn gọn (60-100 từ) để dễ đọc trên chat
- Thân thiện như bác sĩ gia đình
- KHÔNG chẩn đoán cụ thể, chỉ tư vấn chung
- Luôn khuyến khích gặp bác sĩ khi cần
- Hỏi thêm chi tiết để tư vấn tốt hơn

ĐẶC BIỆT VỀ THUỐC:
- Với câu hỏi về liều lượng thuốc: LUÔN cảnh báo rõ ràng nếu không phù hợp
- Đưa ra thông tin cụ thể về liều an toàn theo độ tuổi/cân nặng
- Khuyến cáo tham khảo bác sĩ/dược sĩ cho liều chính xác
- Cảnh báo nguy hiểm nếu quá liều

CHUYÊN KHOA: Khám tổng quát, Tim mạch, Tiêu hóa, Hô hấp, Thần kinh, Nội khoa, Ngoại khoa, Sản phụ khoa, Nhi khoa, Da liễu, Mắt, Tai mũi họng, Răng hàm mặt, Chấn thương chỉnh hình.

Hãy trả lời một cách tự nhiên và thân thiện:
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      aiResponse = response.text().trim();

      // Giới hạn độ dài response để phù hợp với chat interface
      if (aiResponse.length > 400) {
        const sentences = aiResponse.split('. ');
        aiResponse = sentences.slice(0, 2).join('. ') + '.';

        // Thêm câu hỏi tiếp theo nếu chưa có
        if (!aiResponse.includes('?')) {
          aiResponse += ' Bạn có triệu chứng nào khác không? 😊';
        }
      }
    }

    // 💾 BƯỚC 3: Lưu hội thoại để học
    const responseTime = Date.now() - startTime;
    const sessionId = req.headers['x-session-id'] || 'anonymous';

    try {
      await trainingService.saveConversation(sessionId, message, aiResponse, responseTime);
      console.log(`💾 Saved conversation (${responseTime}ms, source: ${responseSource})`);
    } catch (error) {
      console.log('⚠️ Failed to save conversation:', error.message);
    }

    res.json({
      success: true,
      message: 'Chat thành công',
      data: {
        user_message: message,
        ai_response: aiResponse,
        response_source: responseSource,
        response_time_ms: responseTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi xử lý tin nhắn',
      error: error.message
    });
  }
});

// Rasa integration endpoint
app.post('/api/health/rasa-chat', async (req, res) => {
  try {
    const { message, sender_id } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tin nhắn',
        error: 'message is required and must be a string'
      });
    }

    console.log('Processing Rasa chat message:', message);

    // Gọi Rasa server
    const rasaResponse = await axios.post('http://localhost:5005/webhooks/rest/webhook', {
      sender: sender_id || 'default_user',
      message: message
    });

    if (rasaResponse.data && rasaResponse.data.length > 0) {
      const botResponses = rasaResponse.data.map(response => response.text).filter(text => text);

      res.json({
        success: true,
        message: 'Rasa chat thành công',
        data: {
          user_message: message,
          bot_responses: botResponses,
          rasa_response: rasaResponse.data,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      // Fallback to Gemini if Rasa doesn't respond
      const geminiResponse = await handleGeminiFallback(message);

      res.json({
        success: true,
        message: 'Fallback to Gemini AI',
        data: {
          user_message: message,
          bot_responses: [geminiResponse],
          fallback: true,
          timestamp: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    console.error('Error in Rasa chat:', error);

    // Fallback to Gemini AI
    try {
      const geminiResponse = await handleGeminiFallback(req.body.message);

      res.json({
        success: true,
        message: 'Fallback to Gemini AI due to Rasa error',
        data: {
          user_message: req.body.message,
          bot_responses: [geminiResponse],
          fallback: true,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });
    } catch (geminiError) {
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra với cả Rasa và Gemini AI',
        error: {
          rasa: error.message,
          gemini: geminiError.message
        }
      });
    }
  }
});

// Helper function for Gemini fallback
async function handleGeminiFallback(message) {
  if (!model) {
    return 'Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau.';
  }

  if (!isHealthRelatedQuestion(message)) {
    return 'Xin lỗi, câu hỏi của bạn không thuộc lĩnh vực tôi có thể trả lời. Vui lòng hỏi câu hỏi khác. Xin cảm ơn!';
  }

  const prompt = `
Bạn là trợ lý y tế AI của bệnh viện. Hãy trả lời ngắn gọn (80-120 từ) câu hỏi sau bằng tiếng Việt:

"${message}"

Yêu cầu:
- Tư vấn sức khỏe cơ bản
- Không chẩn đoán cụ thể
- Khuyến nghị gặp bác sĩ khi cần
- Thân thiện và chuyên nghiệp
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
}

// Test endpoint
app.get('/api/health/test', (req, res) => {
  res.json({
    success: true,
    message: 'Chatbot Service đang hoạt động bình thường',
    data: {
      service: 'Hospital Chatbot Service',
      version: '1.0.0',
      features: [
        'Chat với Gemini AI',
        'Tư vấn sức khỏe tiếng Việt',
        'Phân tích triệu chứng cơ bản',
        'Khuyến nghị chuyên khoa'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// Kiểm tra câu hỏi có thuộc lĩnh vực y tế không
function isHealthRelatedQuestion(userInput) {
  // Sửa lỗi chính tả trước khi kiểm tra
  const normalizedInput = normalizeVietnameseText(userInput);
  const healthKeywords = [
    // Triệu chứng cơ bản
    'đau', 'nhức', 'mệt', 'sốt', 'ho', 'khó thở', 'chóng mặt', 'buồn nôn', 'nôn', 'tiêu chảy',
    'táo bón', 'đau bụng', 'đau đầu', 'đau ngực', 'đau lưng', 'đau khớp', 'sưng', 'viêm',
    'ngứa', 'phát ban', 'dị ứng', 'cảm lạnh', 'cúm', 'ho khan', 'ho có đờm', 'khàn tiếng',

    // Bộ phận cơ thể
    'đầu', 'mắt', 'tai', 'mũi', 'họng', 'cổ', 'vai', 'tay', 'ngực', 'lưng', 'bụng', 'chân',
    'tim', 'phổi', 'gan', 'thận', 'dạ dày', 'ruột', 'xương', 'khớp', 'da', 'tóc', 'móng',

    // Y tế chung
    'bệnh', 'thuốc', 'điều trị', 'khám', 'bác sĩ', 'bệnh viện', 'phòng khám', 'xét nghiệm',
    'chẩn đoán', 'triệu chứng', 'dấu hiệu', 'sức khỏe', 'y tế', 'chữa', 'uống thuốc',
    'tái khám', 'cấp cứu', 'khẩn cấp', 'nguy hiểm', 'nghiêm trọng',

    // Chuyên khoa
    'nội khoa', 'ngoại khoa', 'sản phụ khoa', 'nhi khoa', 'tim mạch', 'thần kinh',
    'tiêu hóa', 'hô hấp', 'da liễu', 'mắt', 'tai mũi họng', 'răng hàm mặt',
    'chấn thương chỉnh hình', 'tâm thần', 'dinh dưỡng',

    // Câu trả lời ngắn trong context y tế
    'có', 'không', 'rồi', 'chưa', 'được', 'ừ', 'uh', 'vâng', 'dạ', 'à', 'ơ',
    'nhiều', 'ít', 'lâu', 'mới', 'thỉnh thoảng', 'thường xuyên', 'hôm qua', 'hôm nay'
  ];

  return healthKeywords.some(keyword => normalizedInput.includes(keyword));
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Hospital Chatbot Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    description: 'AI-powered chatbot service với Gemini AI',
    endpoints: {
      health_check: '/health',
      chat_with_ai: '/api/health/chat',
      rasa_chat: '/api/health/rasa-chat',
      test: '/api/health/test'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🏥 ===================================
🤖 HOSPITAL CHATBOT SERVICE STARTED
🏥 ===================================
🌐 Server: http://localhost:${PORT}
📊 Health: http://localhost:${PORT}/health
🤖 Chat: http://localhost:${PORT}/api/health/chat
📚 Test: http://localhost:${PORT}/api/health/test
🏥 ===================================
  `);
});
