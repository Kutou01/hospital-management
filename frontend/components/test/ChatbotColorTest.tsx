"use client"

import React, { useState } from 'react';
import { Bot, X } from 'lucide-react';

// Test component để kiểm tra màu sắc chatbot
export default function ChatbotColorTest() {
  const [isOpen, setIsOpen] = useState(true);

  const testMessages = [
    {
      id: 1,
      type: 'bot',
      content: '🩺 **Phân tích triệu chứng:** Vị trí đau bụng giúp xác định nguyên nhân.',
      severity: 'high',
      timestamp: new Date()
    },
    {
      id: 2,
      type: 'user',
      content: 'tôi đau bụng',
      timestamp: new Date()
    },
    {
      id: 3,
      type: 'bot',
      content: '❓ **Để tư vấn chính xác hơn:** 1. Đau bụng ở vị trí nào?',
      severity: 'medium',
      timestamp: new Date()
    }
  ];

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'emergency': return 'border-l-4 border-red-500 bg-red-50';
      case 'high': return 'border-l-4 border-cyan-600 bg-cyan-50';
      case 'medium': return 'border-l-4 border-cyan-500 bg-cyan-50';
      default: return '';
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-cyan-500 text-white p-3 rounded-full shadow-lg hover:bg-cyan-600 transition-colors"
        >
          <Bot className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="chat-widget w-96 h-[500px] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 text-white flex items-center justify-between bg-cyan-500">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">HealthBot - Test Colors</h3>
              <p className="text-xs opacity-90">Kiểm tra màu xanh nước biển</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 bg-gray-50 overflow-y-auto p-4 space-y-3">
          {testMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-2 max-w-[80%]`}>
                {message.type === 'bot' && (
                  <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                )}
                
                <div
                  className={`px-3 py-2 rounded-lg text-sm ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : `bg-white text-gray-800 rounded-bl-none shadow-sm border border-cyan-200 ${getSeverityColor(message.severity)}`
                  }`}
                >
                  <div>{message.content}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {message.timestamp.toLocaleTimeString('vi-VN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input 
              type="text" 
              placeholder="Test input..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
            <button className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition-colors">
              Send
            </button>
          </div>
        </div>

        {/* Color Test Panel */}
        <div className="p-3 bg-gray-100 border-t">
          <div className="text-xs text-gray-600 mb-2">Test Colors:</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-cyan-50 border border-cyan-200 p-1 rounded text-center">
              Cyan-50
            </div>
            <div className="bg-cyan-500 text-white p-1 rounded text-center">
              Cyan-500
            </div>
            <div className="bg-white border border-cyan-600 p-1 rounded text-center">
              White
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
