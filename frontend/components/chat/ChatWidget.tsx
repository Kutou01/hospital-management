'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Bot, User, Wifi, WifiOff, Maximize2, Minimize2, X } from 'lucide-react';
import './chat-widget.css';
import { useChat, Message } from '@/hooks/useChat';
import FriendlyChatMessage from './FriendlyChatMessage';

interface ChatWidgetProps {
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
}

export default function ChatWidget({
  position = 'bottom-right',
  primaryColor = '#06b6d4'
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const { messages, isLoading, isConnected, isFullscreen, sendMessage, clearChat, toggleFullscreen } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWidgetRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const messageContent = inputValue;
    setInputValue('');
    await sendMessage(messageContent);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getSeverityColor = (severity?: Message['severity']) => {
    switch (severity) {
      case 'emergency': return 'border-l-4 border-red-500 bg-red-50';
      case 'high': return 'border-l-4 border-cyan-600 bg-cyan-50';
      case 'medium': return 'border-l-4 border-cyan-500 bg-cyan-50';
      default: return '';
    }
  };

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`} ref={chatWidgetRef}>
      {/* Chat Window */}
      {isOpen && (
        <div className={`chat-widget ${isFullscreen ? 'chat-widget-fullscreen' : 'fixed bottom-20 right-4 w-96 h-[500px] sm:chat-widget-mobile md:chat-widget-tablet chat-widget-container'} bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden chat-widget-enter flex flex-col`}>
          {/* Header */}
          <div
            className="flex-shrink-0 p-4 text-white flex items-center justify-between"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <h3 className="font-semibold text-sm flex items-center space-x-1">
                  <span>HealthBot</span>
                  {isConnected ? (
                    <Wifi className="w-3 h-3" />
                  ) : (
                    <WifiOff className="w-3 h-3 text-red-300" />
                  )}
                </h3>
                <p className="text-xs opacity-90">
                  {isConnected ? 'Tư vấn sức khỏe AI' : 'Mất kết nối'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={toggleFullscreen}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
                title={isFullscreen ? "Thu nhỏ" : "Phóng to toàn màn hình"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
                title="Đóng chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 bg-gray-50 overflow-y-auto">
            <div className="p-4">
            {messages.map((message) => (
              <FriendlyChatMessage
                key={message.id}
                message={message}
                primaryColor={primaryColor}
              />
            ))}
            <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="flex-shrink-0 p-3 border-t bg-white">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Mô tả triệu chứng của bạn..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading || !isConnected}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            

          </div>
        </div>
      )}

      {/* Chat Button - Only show when chat is closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group chat-button-pulse"
          style={{ backgroundColor: primaryColor }}
        >
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
      )}
    </div>
  );
}
