'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, MessageCircle, X, Maximize2, Minimize2 } from 'lucide-react';
import AIRobotIcon from '@/components/ui/AIRobotIcon';
import ChatbotBookingWidget from './ChatbotBookingWidget';
import ChatWidget from '@/components/chat/ChatWidget';

const AIAssistantButtons = () => {
  const [showBookingWidget, setShowBookingWidget] = useState(false);
  const [showConsultationWidget, setShowConsultationWidget] = useState(false);
  const [isConsultationFullscreen, setIsConsultationFullscreen] = useState(false);
  const [consultationMessages, setConsultationMessages] = useState([
    {
      id: '1',
      type: 'bot',
      content: `Xin chào! Tôi là trợ lý AI tư vấn sức khỏe.

🩺 Tôi có thể giúp bạn:
• Tư vấn triệu chứng cơ bản
• Khuyến nghị chuyên khoa
• Hướng dẫn chuẩn bị khám
• Nhận diện tình huống cấp cứu

Hãy mô tả triệu chứng bạn đang gặp phải nhé!`,
      timestamp: new Date()
    }
  ]);
  const [isConsultationLoading, setIsConsultationLoading] = useState(false);

  const handleConsultationClick = () => {
    console.log('Opening AI Consultation...');
    setShowConsultationWidget(true);
  };

  const handleBookingClick = () => {
    setShowBookingWidget(true);
  };

  const toggleConsultationFullscreen = () => {
    setIsConsultationFullscreen(!isConsultationFullscreen);
  };

  const handleSendConsultationMessage = async (message: string) => {
    if (!message.trim() || isConsultationLoading) return;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: message,
      timestamp: new Date()
    };

    setConsultationMessages(prev => [...prev, userMessage]);
    setIsConsultationLoading(true);

    try {
      // Call chatbot API
      const CHATBOT_API_URL = process.env.NEXT_PUBLIC_CHATBOT_API_URL || 'http://localhost:3020';
      const response = await fetch(`${CHATBOT_API_URL}/api/health/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          conversation_history: consultationMessages.slice(-6).map(msg =>
            `${msg.type === 'user' ? 'User' : 'AI'}: ${msg.content}`
          )
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const botMessage = {
          id: (Date.now() + 1).toString(),
          type: 'bot' as const,
          content: data.data.ai_response || data.data.response || 'Xin lỗi, tôi không thể trả lời câu hỏi này.',
          timestamp: new Date()
        };
        setConsultationMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(data.message || 'Chatbot response error');
      }
    } catch (error) {
      console.error('Consultation error:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot' as const,
        content: 'Xin lỗi, có lỗi xảy ra khi kết nối với hệ thống tư vấn. Vui lòng thử lại sau.',
        timestamp: new Date()
      };
      setConsultationMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsConsultationLoading(false);
    }
  };

  return (
    <>
      {/* AI Assistant Buttons - Circular Design */}
      {!showBookingWidget && !showConsultationWidget && (
        <div className="fixed bottom-4 right-4 flex flex-col space-y-3 z-40">
          {/* Tư vấn AI Button - Purple */}
          <div className="relative group">
            <Button
              onClick={handleConsultationClick}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 hover:from-purple-700 hover:via-purple-800 hover:to-indigo-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex flex-col items-center justify-center p-0 border-2 border-white/20"
            >
              {/* Chat Icon */}
              <MessageCircle className="h-5 w-5 text-white mb-0.5" />
              <span className="text-[10px] text-white font-semibold leading-tight">Tư vấn AI</span>

              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full bg-purple-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
            </Button>

            {/* Tooltip */}
            <div className="absolute right-20 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                Tư vấn sức khỏe AI 24/7
                <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-800"></div>
              </div>
            </div>
          </div>

          {/* Đặt lịch AI Button - Teal */}
          <div className="relative group">
            <Button
              onClick={handleBookingClick}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-700 hover:from-teal-700 hover:via-teal-800 hover:to-cyan-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex flex-col items-center justify-center p-0 border-2 border-white/20"
            >
              {/* Calendar Icon */}
              <Calendar className="h-5 w-5 text-white mb-0.5" />
              <span className="text-[10px] text-white font-semibold leading-tight">Đặt lịch AI</span>

              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full bg-teal-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
            </Button>

            {/* Tooltip */}
            <div className="absolute right-20 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                Đặt lịch khám nhanh chóng
                <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-800"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Widget */}
      {showBookingWidget && (
        <ChatbotBookingWidget
          isOpen={showBookingWidget}
          onClose={() => setShowBookingWidget(false)}
        />
      )}

      {/* Medical Consultation Widget */}
      {showConsultationWidget && (
        <div className={`fixed z-50 ${isConsultationFullscreen ? 'inset-4' : 'bottom-4 right-4'}`}>
          {/* Custom Medical Chat Widget */}
          <div className={`bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden flex flex-col ${isConsultationFullscreen ? 'w-full h-full' : 'w-96 h-[500px]'}`}>
            {/* Header */}
            <div className="p-4 text-white flex items-center justify-between bg-gradient-to-r from-purple-600 to-indigo-600">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Tư vấn AI</h3>
                  <p className="text-xs opacity-90">Hỗ trợ sức khỏe 24/7</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* Fullscreen Toggle */}
                <button
                  onClick={toggleConsultationFullscreen}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded p-1 transition-colors"
                  title={isConsultationFullscreen ? "Thu nhỏ" : "Mở rộng"}
                >
                  {isConsultationFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
                {/* Close Button */}
                <button
                  onClick={() => setShowConsultationWidget(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded p-1 transition-colors"
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              <div className="space-y-4">
                {consultationMessages.map((message) => (
                  <div key={message.id} className={`flex items-start space-x-2 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user'
                        ? 'bg-purple-600'
                        : 'bg-purple-100'
                    }`}>
                      {message.type === 'user' ? (
                        <span className="text-white text-xs font-bold">U</span>
                      ) : (
                        <MessageCircle className="w-4 h-4 text-purple-600" />
                      )}
                    </div>
                    <div className={`p-3 rounded-lg shadow-sm max-w-xs ${
                      message.type === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-800'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isConsultationLoading && (
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-white">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Mô tả triệu chứng của bạn..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement;
                      if (input.value.trim()) {
                        handleSendConsultationMessage(input.value);
                        input.value = '';
                      }
                    }
                  }}
                />
                <button
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Mô tả triệu chứng của bạn..."]') as HTMLInputElement;
                    if (input && input.value.trim()) {
                      handleSendConsultationMessage(input.value);
                      input.value = '';
                    }
                  }}
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                ⚠️ Chỉ tư vấn cơ bản, không thay thế việc khám bác sĩ
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistantButtons;
