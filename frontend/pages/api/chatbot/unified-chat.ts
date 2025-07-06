import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Unified Chatbot API with Fallback Mechanism
 * Primary: Enhanced Chatbot API (Rasa + Gemini)
 * Fallback: Simple Gemini API
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
    booking_data?: any;
    next_step?: string;
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

  try {
    const { message, conversation_history, user_id, session_id, chat_type = 'consultation' }: ChatRequest = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        message: 'Message is required and must be a non-empty string'
      });
    }

    // Enhanced Vietnamese text processing
    const VIETNAMESE_CORRECTIONS = [
      { wrong: 'sot xuat huyet', correct: 'sốt xuất huyết' },
      { wrong: 'dau dau', correct: 'đau đầu' },
      { wrong: 'kho tho', correct: 'khó thở' },
      { wrong: 'buon non', correct: 'buồn nôn' },
      { wrong: 'toi', correct: 'tôi' },
      { wrong: 'bi', correct: 'bị' },
      { wrong: 'muon', correct: 'muốn' },
      { wrong: 'bac si', correct: 'bác sĩ' },
      { wrong: 'dat lich', correct: 'đặt lịch' }
    ];

    let processedMessage = message
      .toLowerCase()
      .trim()
      .replace(/t�i/gi, 'tôi')
      .replace(/b?/gi, 'bị')
      .replace(/s?t/gi, 'sốt')
      .replace(/�/g, '')
      .replace(/\s+/g, ' ');

    VIETNAMESE_CORRECTIONS.forEach(correction => {
      const regex = new RegExp(`\\b${correction.wrong}\\b`, 'gi');
      processedMessage = processedMessage.replace(regex, correction.correct);
    });

    // Enhanced Chatbot API URL - Fixed to use correct port
    const enhancedChatbotUrl = process.env.NEXT_PUBLIC_ENHANCED_CHATBOT_API_URL || 'http://localhost:3021';

    // Prepare payload for Enhanced Chatbot API
    const payload = {
      message: processedMessage,
      conversation_history: conversation_history || [],
      user_id: user_id || `user_${Date.now()}`,
      session_id: session_id || `session_${Date.now()}`,
      chat_type,
      timestamp: new Date().toISOString()
    };

    console.log(`🤖 Unified Chat Request:`, {
      message: message.substring(0, 50) + '...',
      chat_type,
      user_id: payload.user_id,
      session_id: payload.session_id
    });

    let chatbotResponse: any;
    let responseSource = 'enhanced-api';

    try {
      // Try Enhanced Chatbot API first
      const response = await fetch(`${enhancedChatbotUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json; charset=utf-8',
          'User-Agent': 'Hospital-Frontend/2.0'
        },
        body: JSON.stringify(payload),
        timeout: 10000 // 10 second timeout for primary service
      });

      if (response.ok) {
        chatbotResponse = await response.json();
      } else {
        throw new Error(`Enhanced API error: ${response.status}`);
      }
    } catch (enhancedApiError) {
      console.warn(`⚠️ Enhanced Chatbot API unavailable, falling back to Simple Gemini:`, enhancedApiError);
      
      // Fallback to Simple Gemini API
      try {
        const fallbackResponse = await fetch(`${req.headers.origin || 'http://localhost:3050'}/api/chatbot/simple-gemini`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: payload.message,
            conversation_history: payload.conversation_history,
            user_id: payload.user_id,
            session_id: payload.session_id,
            chat_type: payload.chat_type
          })
        });

        if (fallbackResponse.ok) {
          chatbotResponse = await fallbackResponse.json();
          responseSource = 'gemini-fallback';
        } else {
          throw new Error(`Fallback API error: ${fallbackResponse.status}`);
        }
      } catch (fallbackError) {
        console.error(`❌ Both Enhanced and Fallback APIs failed:`, fallbackError);
        return res.status(503).json({
          success: false,
          error: 'All chatbot services unavailable',
          message: 'Hệ thống chatbot tạm thời không khả dụng. Vui lòng thử lại sau.'
        });
      }
    }

    console.log(`✅ Unified Chatbot Response:`, {
      success: chatbotResponse.success,
      response_source: responseSource,
      response_length: chatbotResponse.data?.ai_response?.length || 0,
      response_time: chatbotResponse.data?.response_time_ms
    });

    // Return the response
    return res.status(200).json({
      success: true,
      data: {
        ai_response: chatbotResponse.data?.ai_response || 'Xin lỗi, tôi không thể trả lời lúc này.',
        response_source: responseSource,
        symptoms: chatbotResponse.data?.symptoms || [],
        severity: chatbotResponse.data?.severity || 'medium',
        user_id: chatbotResponse.data?.user_id || payload.user_id,
        session_id: chatbotResponse.data?.session_id || payload.session_id,
        response_time_ms: chatbotResponse.data?.response_time_ms || 0,
        timestamp: chatbotResponse.data?.timestamp || new Date().toISOString(),
        booking_data: chatbotResponse.data?.booking_data,
        next_step: chatbotResponse.data?.next_step
      }
    });

  } catch (error: any) {
    console.error('❌ Unified Chat API Error:', error);

    let errorMessage = 'Có lỗi xảy ra trong hệ thống chatbot';
    let statusCode = 500;

    if (error.message?.includes('timeout')) {
      errorMessage = 'Hệ thống phản hồi chậm. Vui lòng thử lại.';
      statusCode = 504;
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      errorMessage = 'Kết nối mạng không ổn định. Vui lòng thử lại.';
      statusCode = 503;
    }

    return res.status(statusCode).json({
      success: false,
      error: 'Unified chatbot service error',
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
