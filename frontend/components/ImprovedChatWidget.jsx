import React, { useState, useRef, useEffect } from 'react';
import { chatbotAPI } from '../utils/chatbotAPI';

const ImprovedChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHealthy, setIsHealthy] = useState(true);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize with welcome message and health check
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message
      setMessages([{
        id: 1,
        text: chatbotAPI.getWelcomeMessage(),
        sender: 'bot',
        timestamp: new Date(),
        isWelcome: true
      }]);

      // Check health
      chatbotAPI.checkHealth().then(health => {
        setIsHealthy(health.healthy && health.geminiConnected);
        if (!health.healthy) {
          setMessages(prev => [...prev, {
            id: Date.now(),
            text: '⚠️ Hệ thống tư vấn đang gặp sự cố. Một số tính năng có thể không hoạt động.',
            sender: 'system',
            timestamp: new Date(),
            isError: true
          }]);
        }
      });
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputText;
    setInputText('');
    setIsLoading(true);

    try {
      // Get conversation history for context
      const conversationHistory = messages.slice(-6).map(msg => 
        `${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.text}`
      );

      // Call our Gemini AI chatbot
      const result = await chatbotAPI.sendMessage(messageToSend, conversationHistory);

      const botMessage = {
        id: Date.now() + 1,
        text: result.response,
        sender: 'bot',
        timestamp: new Date(),
        isError: !result.success
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.',
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickReply = (reply) => {
    setInputText(reply);
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 relative"
          title="Tư vấn sức khỏe AI"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {/* Status indicator */}
          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${isHealthy ? 'bg-green-400' : 'bg-red-400'}`}></div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl w-96 h-[600px] flex flex-col border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isHealthy ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="font-semibold">🏥 Healthbot AI</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : message.isError
                      ? 'bg-red-100 text-red-800 border border-red-200 rounded-bl-none'
                      : message.sender === 'system'
                      ? 'bg-cyan-50 text-cyan-800 border border-cyan-200 rounded-bl-none'
                      : 'bg-white text-gray-800 border border-cyan-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.text}</div>
                  <div className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg rounded-bl-none px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length <= 1 && (
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
              <div className="text-xs text-gray-600 mb-2">Câu hỏi gợi ý:</div>
              <div className="flex flex-wrap gap-1">
                {chatbotAPI.getQuickReplies().slice(0, 3).map((reply, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickReply(reply)}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex space-x-2">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Mô tả triệu chứng của bạn..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="2"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputText.trim()}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-2 flex justify-between">
              <span>Nhấn Enter để gửi</span>
              <span className={`${isHealthy ? 'text-green-600' : 'text-red-600'}`}>
                {isHealthy ? '🟢 Gemini AI' : '🔴 Offline'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImprovedChatWidget;
