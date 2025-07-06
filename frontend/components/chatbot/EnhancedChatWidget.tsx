'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  X, 
  Maximize2, 
  Minimize2, 
  Send, 
  ArrowLeft,
  Download,
  ThumbsUp,
  ThumbsDown,
  Loader2
} from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  options?: ChatOption[];
  symptoms?: any[];
  severity?: string;
  isTyping?: boolean;
}

interface ChatOption {
  id: string;
  label: string;
  value: string;
  action: string;
  icon?: React.ReactNode;
}

interface QuickReply {
  id: string;
  text: string;
  category: 'symptom' | 'followup' | 'booking';
}

const QUICK_REPLIES: QuickReply[] = [
  { id: '1', text: 'Đau đầu', category: 'symptom' },
  { id: '2', text: 'Sốt', category: 'symptom' },
  { id: '3', text: 'Ho', category: 'symptom' },
  { id: '4', text: 'Khó thở', category: 'symptom' },
  { id: '5', text: 'Buồn nôn', category: 'symptom' },
  { id: '6', text: 'Có', category: 'followup' },
  { id: '7', text: 'Không', category: 'followup' },
  { id: '8', text: 'Không chắc', category: 'followup' },
  { id: '9', text: 'Đặt lịch ngay', category: 'booking' },
  { id: '10', text: 'Xem thêm thông tin', category: 'booking' }
];

export default function EnhancedChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [userId] = useState(() => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [currentCategory, setCurrentCategory] = useState<'symptom' | 'followup' | 'booking'>('symptom');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      showWelcomeMessage();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const showWelcomeMessage = () => {
    const welcomeMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'bot',
      content: 'Xin chào! Tôi là AI Hỗ Trợ Y Tế của bệnh viện. Tôi có thể giúp bạn:',
      timestamp: new Date(),
      options: [
        {
          id: 'consultation',
          label: '🩺 Tư vấn sức khỏe',
          value: 'consultation',
          action: 'consultation'
        },
        {
          id: 'booking',
          label: '📅 Đặt lịch khám',
          value: 'booking',
          action: 'booking'
        }
      ]
    };
    setMessages([welcomeMessage]);
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setShowQuickReplies(false);

    // Show typing indicator
    showTypingIndicator();

    try {
      // Call enhanced chatbot API directly
      const CHATBOT_API_URL = process.env.NEXT_PUBLIC_ENHANCED_CHATBOT_API_URL || 'http://localhost:3021';
      const response = await fetch(`${CHATBOT_API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          message,
          conversation_history: conversationHistory,
          user_id: userId
        }),
      });

      const data = await response.json();

      // Remove typing indicator
      setMessages(prev => prev.filter(msg => !msg.isTyping));

      if (data.success) {
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: data.data.botResponse || data.data.ai_response || data.data.response,
          timestamp: new Date(),
          symptoms: data.data.symptoms,
          severity: data.data.severity
        };

        setMessages(prev => [...prev, botMessage]);
        
        // Update conversation history
        setConversationHistory(prev => [
          ...prev,
          `User: ${message}`,
          `AI: ${data.data.botResponse || data.data.ai_response || data.data.response}`
        ].slice(-10)); // Keep last 10 exchanges

        // Show appropriate quick replies
        updateQuickRepliesCategory(data.data.severity, data.data.symptoms);
        setShowQuickReplies(true);

      } else {
        throw new Error(data.message || 'API Error');
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => !msg.isTyping));

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau hoặc liên hệ hotline: (028) 1234 5678',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const showTypingIndicator = () => {
    setIsTyping(true);
    const typingMessage: ChatMessage = {
      id: 'typing',
      type: 'bot',
      content: '',
      timestamp: new Date(),
      isTyping: true
    };
    
    setTimeout(() => {
      setMessages(prev => [...prev, typingMessage]);
    }, 500);
  };

  const updateQuickRepliesCategory = (severity?: string, symptoms?: any[]) => {
    if (severity === 'emergency') {
      setCurrentCategory('booking');
    } else if (symptoms && symptoms.length > 0) {
      setCurrentCategory('followup');
    } else {
      setCurrentCategory('symptom');
    }
  };

  const handleQuickReply = (reply: QuickReply) => {
    handleSendMessage(reply.text);
  };

  const handleOptionClick = (option: ChatOption) => {
    handleSendMessage(option.label);
  };

  const handleRating = async (messageId: string, rating: 'positive' | 'negative') => {
    try {
      await fetch('/api/chatbot/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message_id: messageId,
          user_id: userId,
          rating,
          conversation_id: userId, // Use userId as conversation_id for now
          feedback_text: null
        }),
      });
    } catch (error) {
      console.error('Failed to submit rating:', error);
    }
  };

  const exportConversation = () => {
    const conversationText = messages
      .filter(msg => !msg.isTyping)
      .map(msg => `[${msg.timestamp.toLocaleTimeString()}] ${msg.type.toUpperCase()}: ${msg.content}`)
      .join('\n');
    
    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-conversation-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredQuickReplies = QUICK_REPLIES.filter(reply => reply.category === currentCategory);

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 z-50 flex items-center justify-center"
        >
          <MessageCircle className="w-8 h-8" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className={`fixed ${isFullscreen ? 'inset-0' : 'bottom-6 right-6 w-96 h-[600px]'} bg-white rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-200`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">AI Hỗ Trợ Y Tế</h3>
                <p className="text-xs opacity-90">Luôn sẵn sàng hỗ trợ bạn</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={exportConversation}
                className="p-1 hover:bg-white/20 rounded"
                title="Xuất cuộc trò chuyện"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1 hover:bg-white/20 rounded"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${message.type === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'} rounded-lg p-3 shadow-sm`}>
                  {message.isTyping ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Đang trả lời...</span>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      
                      {/* Options */}
                      {message.options && (
                        <div className="mt-3 space-y-2">
                          {message.options.map((option) => (
                            <button
                              key={option.id}
                              onClick={() => handleOptionClick(option)}
                              className="w-full text-left p-2 bg-blue-50 hover:bg-blue-100 rounded border text-sm transition-colors"
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Rating buttons for bot messages */}
                      {message.type === 'bot' && !message.isTyping && (
                        <div className="mt-2 flex items-center space-x-2">
                          <button
                            onClick={() => handleRating(message.id, 'positive')}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Hữu ích"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleRating(message.id, 'negative')}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Không hữu ích"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {showQuickReplies && filteredQuickReplies.length > 0 && (
            <div className="p-3 bg-white border-t">
              <p className="text-xs text-gray-500 mb-2">Gợi ý nhanh:</p>
              <div className="flex flex-wrap gap-2">
                {filteredQuickReplies.map((reply) => (
                  <button
                    key={reply.id}
                    onClick={() => handleQuickReply(reply)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs transition-colors"
                  >
                    {reply.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 bg-white border-t">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage(inputValue)}
                placeholder="Nhập tin nhắn..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                onClick={() => handleSendMessage(inputValue)}
                disabled={isLoading || !inputValue.trim()}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
