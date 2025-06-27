"use client"

import React from 'react';
import { Bot, User, Heart, AlertTriangle, Phone } from 'lucide-react';

interface FriendlyChatMessageProps {
  message: {
    id: string;
    type: 'user' | 'bot';
    content: string;
    severity?: 'normal' | 'high' | 'emergency';
    timestamp: Date;
    isTyping?: boolean;
  };
  primaryColor?: string;
}

export default function FriendlyChatMessage({ message, primaryColor = '#06b6d4' }: FriendlyChatMessageProps) {
  const isBot = message.type === 'bot';
  const isEmergency = message.severity === 'emergency';
  const isHighPriority = message.severity === 'high';

  // Parse structured content
  const parseContent = (content: string) => {
    const sections = content.split('\n\n');
    return sections.map((section, index) => {
      // Emergency warning
      if (section.includes('🚨') || section.includes('⚠️')) {
        return (
          <div key={index} className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg mb-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-red-800 font-medium">
                {section.replace(/🚨|⚠️/g, '').trim()}
              </div>
            </div>
          </div>
        );
      }

      // Emergency phone number
      if (section.includes('115') || section.includes('gọi')) {
        return (
          <div key={index} className="bg-red-100 border border-red-300 rounded-lg p-3 mb-3">
            <div className="flex items-center space-x-2">
              <Phone className="w-5 h-5 text-red-600" />
              <div className="text-red-800 font-semibold">
                {section}
              </div>
            </div>
          </div>
        );
      }

      // Advice sections with bullets
      if (section.includes('💡') || section.includes('**')) {
        const lines = section.split('\n');
        return (
          <div key={index} className="mb-3">
            {lines.map((line, lineIndex) => {
              if (line.includes('**')) {
                return (
                  <div key={lineIndex} className="font-semibold text-gray-800 mb-2">
                    {line.replace(/\*\*/g, '')}
                  </div>
                );
              }
              if (line.trim().startsWith('🍵') || line.trim().startsWith('💧') || 
                  line.trim().startsWith('🛌') || line.trim().startsWith('🌿') ||
                  line.trim().startsWith('🤲') || line.trim().startsWith('🍎')) {
                return (
                  <div key={lineIndex} className="flex items-start space-x-2 mb-1 ml-4">
                    <span className="text-cyan-500">•</span>
                    <span className="text-gray-700">{line.trim()}</span>
                  </div>
                );
              }
              return line.trim() ? (
                <div key={lineIndex} className="text-gray-700 mb-1">{line}</div>
              ) : null;
            })}
          </div>
        );
      }

      // Follow-up questions
      if (section.includes('❓')) {
        return (
          <div key={index} className="bg-cyan-50 border-l-4 border-cyan-400 p-3 rounded-r-lg mb-3">
            <div className="text-cyan-800 font-medium">
              {section.replace('❓', '').trim()}
            </div>
          </div>
        );
      }

      // Hospital recommendations
      if (section.includes('🏥')) {
        return (
          <div key={index} className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg mb-3">
            <div className="text-blue-800">
              {section}
            </div>
          </div>
        );
      }

      // Regular content
      return section.trim() ? (
        <div key={index} className="text-gray-700 mb-2 whitespace-pre-wrap">
          {section}
        </div>
      ) : null;
    });
  };

  if (!isBot) {
    // User message
    return (
      <div className="flex justify-end mb-4">
        <div className="flex items-end space-x-2 max-w-[80%]">
          <div className="bg-blue-500 text-white px-4 py-3 rounded-lg rounded-br-none shadow-sm">
            <div className="text-sm">{message.content}</div>
            <div className="text-xs text-blue-100 mt-1">
              {message.timestamp.toLocaleTimeString('vi-VN', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    );
  }

  // Bot message
  return (
    <div className="flex justify-start mb-4">
      <div className="flex items-start space-x-3 max-w-[85%]">
        {/* Bot Avatar */}
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
          style={{ backgroundColor: primaryColor }}
        >
          <Bot className="w-4 h-4 text-white" />
        </div>
        
        {/* Message Content */}
        <div className="flex-1">
          <div
            className={`px-4 py-3 rounded-lg rounded-bl-none shadow-sm border ${
              isEmergency 
                ? 'bg-red-50 border-red-200' 
                : isHighPriority 
                ? 'bg-cyan-50 border-cyan-200'
                : 'bg-white border-cyan-200'
            } ${message.isTyping ? 'animate-pulse' : ''}`}
          >
            {/* Empathy indicator for bot messages */}
            {!message.isTyping && (
              <div className="flex items-center space-x-1 mb-2">
                <Heart className="w-3 h-3 text-pink-400" />
                <span className="text-xs text-gray-500">Trợ lý sức khỏe</span>
              </div>
            )}
            
            {/* Message content */}
            <div className="text-sm">
              {message.isTyping ? (
                <div className="flex items-center space-x-1">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-gray-500 ml-2">Đang suy nghĩ...</span>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{parseContent(message.content)}</div>
              )}
            </div>
            
            {/* Timestamp */}
            {!message.isTyping && (
              <div className="text-xs text-gray-500 mt-2 flex items-center justify-between">
                <span>
                  {message.timestamp.toLocaleTimeString('vi-VN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
                {(isEmergency || isHighPriority) && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isEmergency 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-cyan-100 text-cyan-700'
                  }`}>
                    {isEmergency ? 'Cấp cứu' : 'Quan trọng'}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Quick action buttons for emergency */}
          {isEmergency && !message.isTyping && (
            <div className="mt-2 flex space-x-2">
              <button 
                onClick={() => window.open('tel:115')}
                className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium hover:bg-red-600 transition-colors flex items-center space-x-1"
              >
                <Phone className="w-3 h-3" />
                <span>Gọi 115</span>
              </button>
              <button 
                onClick={() => window.open('https://maps.google.com/?q=bệnh viện gần nhất')}
                className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium hover:bg-blue-600 transition-colors"
              >
                Tìm bệnh viện
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
