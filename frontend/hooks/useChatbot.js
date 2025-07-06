import { useState, useCallback } from 'react';

// Configuration
// Use enhanced chatbot API with fixed Vietnamese NLP (port 3021)
const CHATBOT_API_URL = process.env.NEXT_PUBLIC_ENHANCED_CHATBOT_API_URL || 'http://localhost:3021';

export const useChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Send message to chatbot
  const sendMessage = useCallback(async (message) => {
    if (!message.trim()) return;

    setIsLoading(true);
    setError(null);

    // Add user message immediately
    const userMessage = {
      id: Date.now(),
      text: message,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      // Prepare conversation history for context
      const conversationHistory = messages.slice(-6).map(msg => 
        `${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.text}`
      );

      // Call unified chatbot API
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
        const botMessage = {
          id: Date.now() + 1,
          text: data.data.response || data.data.ai_response,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(data.message || 'Chatbot response error');
      }

    } catch (err) {
      console.error('Chatbot error:', err);
      setError(err.message);
      
      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Xin lỗi, có lỗi xảy ra khi kết nối với hệ thống tư vấn. Vui lòng thử lại sau.',
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  // Clear conversation
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  // Check chatbot health
  const checkHealth = useCallback(async () => {
    try {
      const response = await fetch(`${CHATBOT_API_URL}/health`);
      const data = await response.json();
      return data.status === 'healthy';
    } catch (err) {
      console.error('Health check failed:', err);
      return false;
    }
  }, []);

  // Get welcome message
  const getWelcomeMessage = useCallback(() => {
    return {
      id: 0,
      text: `Xin chào! Tôi là trợ lý y tế AI của bệnh viện. 👋

Tôi có thể giúp bạn:
🩺 Tư vấn triệu chứng cơ bản
🏥 Khuyến nghị chuyên khoa phù hợp
💊 Hướng dẫn chuẩn bị khám bệnh
🚨 Nhận diện tình huống cấp cứu

Hãy mô tả triệu chứng hoặc vấn đề sức khỏe bạn đang gặp phải nhé!

⚠️ Lưu ý: Tôi chỉ tư vấn cơ bản, không thay thế việc khám bác sĩ.`,
      sender: 'bot',
      timestamp: new Date(),
      isWelcome: true
    };
  }, []);

  // Initialize with welcome message
  const initializeChat = useCallback(() => {
    if (messages.length === 0) {
      setMessages([getWelcomeMessage()]);
    }
  }, [messages.length, getWelcomeMessage]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    checkHealth,
    initializeChat,
    getWelcomeMessage
  };
};

// Utility functions for message formatting
export const formatMessageTime = (timestamp) => {
  return timestamp.toLocaleTimeString('vi-VN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export const formatMessageDate = (timestamp) => {
  return timestamp.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Message types for better UX
export const MESSAGE_TYPES = {
  USER: 'user',
  BOT: 'bot',
  SYSTEM: 'system',
  ERROR: 'error'
};

// Quick reply suggestions
export const QUICK_REPLIES = [
  'Tôi bị đau đầu',
  'Tôi bị sốt',
  'Tôi bị ho và khó thở',
  'Tôi bị đau bụng',
  'Tôi cần khám chuyên khoa nào?',
  'Chuẩn bị gì khi đi khám?'
];

export default useChatbot;
