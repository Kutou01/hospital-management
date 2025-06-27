import { useState, useCallback } from 'react';

export interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  severity?: 'low' | 'medium' | 'high' | 'emergency';
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isConnected: boolean;
}

export interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  isConnected: boolean;
  isFullscreen: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  toggleFullscreen: () => void;
}

const INITIAL_MESSAGE: Message = {
  id: 'welcome',
  type: 'bot',
  content: `Xin chào! Tôi là HealthBot, trợ lý AI sẽ giúp bạn tư vấn sức khỏe ban đầu.\n\nTôi có thể hỗ trợ bạn:\n- Tư vấn triệu chứng\n- Khuyến nghị chuyên khoa\n- Hướng dẫn chuẩn bị khám\n- Nhận diện cấp cứu\n\nBạn đang gặp vấn đề gì về sức khỏe? Hãy mô tả triệu chứng để được tư vấn!`,
  timestamp: new Date(),
  severity: 'low'
};

export function useChat(): UseChatReturn {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [INITIAL_MESSAGE],
    isLoading: false,
    isConnected: true
  });

  const [isFullscreen, setIsFullscreen] = useState(false);

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || chatState.isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true
    }));

    // Add typing indicator
    const typingMessage: Message = {
      id: 'typing-' + Date.now(),
      type: 'bot',
      content: 'Đang phân tích triệu chứng và tìm kiếm thông tin...',
      timestamp: new Date(),
      isTyping: true
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, typingMessage]
    }));

    try {
      console.log('Sending message to chatbot:', content);

      const CHATBOT_API_URL = process.env.NEXT_PUBLIC_CHATBOT_API_URL || 'http://localhost:3020';
      const response = await fetch(`${CHATBOT_API_URL}/api/health/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          conversation_history: chatState.messages.slice(-6).map(msg =>
            `${msg.type === 'user' ? 'User' : 'AI'}: ${msg.content}`
          )
        }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Chatbot response:', data);

      // Remove typing indicator
      setChatState(prev => ({
        ...prev,
        messages: prev.messages.filter(msg => !msg.isTyping),
        isLoading: false
      }));

      if (data.success && data.data) {
        // Determine severity based on response - CHỈ emergency khi thực sự nghiêm trọng
        let severity: Message['severity'] = 'low';
        const responseText = (data.data.ai_response || data.data.response || '').toLowerCase();

        // CHỈ đánh dấu emergency khi có cảnh báo thực sự
        if (responseText.includes('🚨') || responseText.includes('gọi 115') || responseText.includes('đến cấp cứu ngay')) {
          severity = 'emergency';
        } else if (responseText.includes('nên khám') || responseText.includes('cần theo dõi') || responseText.includes('khám ngay')) {
          severity = 'high';
        } else if (responseText.includes('có thể') || responseText.includes('nên chú ý')) {
          severity = 'medium';
        }

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: data.data.ai_response || data.data.response || 'Xin lỗi, tôi không thể trả lời câu hỏi này.',
          timestamp: new Date(),
          severity
        };

        setChatState(prev => ({
          ...prev,
          messages: [...prev.messages, botMessage]
        }));

        // CHỈ hiển thị cảnh báo cấp cứu khi thực sự nghiêm trọng
        if (severity === 'emergency' && (data.data.ai_response || data.data.response || '').includes('🚨')) {
          const emergencyMessage: Message = {
            id: (Date.now() + 2).toString(),
            type: 'bot',
            content: '🚨 **KHUYẾN CÁO KHẨN CẤP**: Vui lòng đến cơ sở y tế gần nhất hoặc gọi 115 ngay lập tức!',
            timestamp: new Date(),
            severity: 'emergency'
          };

          setTimeout(() => {
            setChatState(prev => ({
              ...prev,
              messages: [...prev.messages, emergencyMessage]
            }));
          }, 1000);
        }

      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: '❌ Xin lỗi, tôi gặp sự cố khi phân tích triệu chứng. Vui lòng thử lại hoặc liên hệ trực tiếp với bệnh viện qua hotline: **1900-xxxx**',
          timestamp: new Date(),
          severity: 'medium'
        };

        setChatState(prev => ({
          ...prev,
          messages: [...prev.messages, errorMessage]
        }));
      }

    } catch (error) {
      console.error('Chat error:', error);
      
      // Remove typing indicator
      setChatState(prev => ({
        ...prev,
        messages: prev.messages.filter(msg => !msg.isTyping),
        isLoading: false,
        isConnected: false
      }));

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: '🔌 Không thể kết nối với hệ thống tư vấn. Vui lòng:\n\n• Kiểm tra kết nối mạng\n• Thử lại sau vài phút\n• Liên hệ hotline: **1900-xxxx** nếu cần hỗ trợ khẩn cấp',
        timestamp: new Date(),
        severity: 'medium'
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage]
      }));

      // Try to reconnect after 5 seconds
      setTimeout(() => {
        setChatState(prev => ({
          ...prev,
          isConnected: true
        }));
      }, 5000);
    }
  }, [chatState.isLoading]);

  const clearChat = useCallback(() => {
    setChatState({
      messages: [INITIAL_MESSAGE],
      isLoading: false,
      isConnected: true
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  return {
    messages: chatState.messages,
    isLoading: chatState.isLoading,
    isConnected: chatState.isConnected,
    isFullscreen,
    sendMessage,
    clearChat,
    addMessage,
    toggleFullscreen
  };
}
