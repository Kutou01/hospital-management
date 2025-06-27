"use client"

import React, { useState } from 'react';
import { Bot, X, Send } from 'lucide-react';
import FriendlyChatMessage from '../chat/FriendlyChatMessage';

export default function FriendlyChatbotTest() {
  const [isOpen, setIsOpen] = useState(true);
  const [inputValue, setInputValue] = useState('');

  // Test messages với phong cách thân thiện mới
  const [messages, setMessages] = useState([
    {
      id: '1',
      type: 'bot' as const,
      content: `Xin chào! Tôi là HealthBot, trợ lý AI sẽ giúp bạn tư vấn sức khỏe ban đầu.

Tôi có thể hỗ trợ bạn:
• Tư vấn triệu chứng
• Khuyến nghị chuyên khoa
• Hướng dẫn chuẩn bị khám
• Nhận diện cấp cứu

Bạn đang gặp vấn đề gì về sức khỏe? Hãy mô tả triệu chứng để được tư vấn!`,
      severity: 'normal' as const,
      timestamp: new Date(),
      isTyping: false
    },
    {
      id: '2',
      type: 'user' as const,
      content: 'tôi bị đau đầu',
      timestamp: new Date(),
      isTyping: false
    },
    {
      id: '3',
      type: 'bot' as const,
      content: `Tôi hiểu bạn đang cảm thấy khó chịu vì cơn đau đầu này 💙

🤗 **Hiểu về tình trạng này:**
Đau đầu thường do căng thẳng, thiếu ngủ hoặc mệt mỏi gây ra.

💡 **Những gì bạn có thể làm:**
🛌 Nghỉ ngơi trong phòng tối, yên tĩnh
💧 Uống nhiều nước và massage nhẹ thái dương  
🌿 Chườm ấm hoặc lạnh tùy cảm giác thoải mái

🏥 Nếu đau dữ dội, kèm sốt cao hoặc buồn nôn, bạn nên đến gặp bác sĩ Thần kinh ngay nhé!

❓ Cơn đau đầu của bạn có kèm theo triệu chứng nào khác không?`,
      severity: 'normal' as const,
      timestamp: new Date(),
      isTyping: false
    },
    {
      id: '4',
      type: 'user' as const,
      content: 'đau ngực và khó thở',
      timestamp: new Date(),
      isTyping: false
    },
    {
      id: '5',
      type: 'bot' as const,
      content: `⚠️ Tôi rất lo lắng về tình trạng của bạn!

🚨 Hãy gọi 115 NGAY hoặc đến cấp cứu gần nhất!

🤗 **Hiểu về tình trạng này:**
Đau ngực kèm khó thở có thể là dấu hiệu của tình huống nghiêm trọng cần được chú ý ngay lập tức.

💡 **Những gì bạn có thể làm ngay:**
🪑 Ngồi thẳng, thở chậm và sâu
💊 Nếu có thuốc tim, hãy uống theo chỉ định
📞 Gọi người thân đến hỗ trợ

💙 Đừng lo lắng, bác sĩ sẽ chăm sóc bạn tốt nhất!`,
      severity: 'emergency' as const,
      timestamp: new Date(),
      isTyping: false
    }
  ]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: inputValue,
      timestamp: new Date(),
      isTyping: false
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simulate bot typing
    const typingMessage = {
      id: (Date.now() + 1).toString(),
      type: 'bot' as const,
      content: '',
      severity: 'normal' as const,
      timestamp: new Date(),
      isTyping: true
    };

    setMessages(prev => [...prev, typingMessage]);

    // Simulate response after 2 seconds
    setTimeout(() => {
      const botResponse = {
        id: (Date.now() + 2).toString(),
        type: 'bot' as const,
        content: `Tôi hiểu bạn đang quan tâm về "${inputValue}" 💙

🤗 **Cảm ơn bạn đã chia sẻ:**
Tôi sẽ cố gắng hỗ trợ bạn tốt nhất có thể.

💡 **Gợi ý:**
💧 Hãy mô tả thêm chi tiết về triệu chứng
🩺 Cho tôi biết khi nào bạn bắt đầu cảm thấy như vậy

🏥 Nếu bạn cảm thấy lo lắng, đừng ngần ngại đến gặp bác sĩ nhé!

❓ Bạn có thể mô tả thêm về cảm giác này không?`,
        severity: 'normal' as const,
        timestamp: new Date(),
        isTyping: false
      };

      setMessages(prev => prev.slice(0, -1).concat(botResponse));
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
      <div className="chat-widget w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 text-white flex items-center justify-between bg-cyan-500">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">HealthBot</h3>
              <p className="text-xs opacity-90">Tư vấn sức khỏe AI</p>
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
        <div className="flex-1 bg-gray-50 overflow-y-auto h-[480px]">
          <div className="p-4">
            {messages.map((message) => (
              <FriendlyChatMessage
                key={message.id}
                message={message}
                primaryColor="#06b6d4"
              />
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex space-x-2">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Chia sẻ cảm giác của bạn..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
