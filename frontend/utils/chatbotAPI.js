// Chatbot API utility functions
// Use enhanced chatbot API with fixed Vietnamese NLP (port 3021)
const CHATBOT_API_URL = process.env.NEXT_PUBLIC_ENHANCED_CHATBOT_API_URL || 'http://localhost:3021';

export const chatbotAPI = {
  // Send message to Gemini AI chatbot
  async sendMessage(message, conversationHistory = []) {
    try {
      const response = await fetch(`${CHATBOT_API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          message: message,
          conversation_history: conversationHistory
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          response: data.data.ai_response,
          timestamp: data.data.timestamp
        };
      } else {
        throw new Error(data.message || 'API response error');
      }
    } catch (error) {
      console.error('Chatbot API error:', error);
      return {
        success: false,
        error: error.message,
        response: 'Xin lỗi, có lỗi xảy ra khi kết nối với hệ thống tư vấn. Vui lòng thử lại sau.'
      };
    }
  },

  // Check chatbot service health
  async checkHealth() {
    try {
      const response = await fetch(`${CHATBOT_API_URL}/health`);
      const data = await response.json();
      return {
        healthy: data.status === 'healthy',
        geminiConnected: data.features?.gemini_ai || false,
        service: data.service
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        healthy: false,
        geminiConnected: false,
        error: error.message
      };
    }
  },

  // Get welcome message
  getWelcomeMessage() {
    return `Xin chào! Tôi là trợ lý y tế AI của bệnh viện. 👋

Tôi có thể giúp bạn:
🩺 Tư vấn triệu chứng cơ bản
🏥 Khuyến nghị chuyên khoa phù hợp
💊 Hướng dẫn chuẩn bị khám bệnh
🚨 Nhận diện tình huống cấp cứu

Hãy mô tả triệu chứng hoặc vấn đề sức khỏe bạn đang gặp phải nhé!

⚠️ Lưu ý: Tôi chỉ tư vấn cơ bản, không thay thế việc khám bác sĩ.`;
  },

  // Quick reply suggestions
  getQuickReplies() {
    return [
      'Tôi bị đau đầu',
      'Tôi bị sốt',
      'Tôi bị ho và khó thở',
      'Tôi bị đau bụng',
      'Tôi cần khám chuyên khoa nào?',
      'Chuẩn bị gì khi đi khám?'
    ];
  }
};

export default chatbotAPI;
