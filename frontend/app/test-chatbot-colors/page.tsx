"use client"

import React from 'react';
import ChatbotColorTest from '@/components/test/ChatbotColorTest';

export default function TestChatbotColorsPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          🎨 Test Màu Sắc Chatbot - Xanh Nước Biển
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Color Palette */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Bảng Màu Mới</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-cyan-500 rounded"></div>
                <div>
                  <p className="font-medium">Cyan-500 (Header)</p>
                  <p className="text-sm text-gray-500">#06b6d4</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white border border-cyan-200 rounded"></div>
                <div>
                  <p className="font-medium">White (Bot Messages)</p>
                  <p className="text-sm text-gray-500">#ffffff</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-cyan-50 border border-cyan-500 rounded"></div>
                <div>
                  <p className="font-medium">Cyan-50 (Highlights)</p>
                  <p className="text-sm text-gray-500">#ecfeff</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-cyan-600 rounded"></div>
                <div>
                  <p className="font-medium">Cyan-600 (High Severity)</p>
                  <p className="text-sm text-gray-500">#0891b2</p>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-cyan-800">Hướng Dẫn Test</h2>
            <ul className="space-y-2 text-cyan-700">
              <li className="flex items-start space-x-2">
                <span className="text-cyan-500">•</span>
                <span>Chatbot test sẽ hiển thị ở góc phải màn hình</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-cyan-500">•</span>
                <span>Kiểm tra tin nhắn bot có nền trắng với viền xanh</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-cyan-500">•</span>
                <span>Severity "high" phải hiển thị màu cyan thay vì cam</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-cyan-500">•</span>
                <span>Header và icon phải có màu xanh nước biển</span>
              </li>
            </ul>
          </div>
        </div>

        {/* CSS Override Test */}
        <div className="bg-white rounded-lg p-6 shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">CSS Override Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Before */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2 text-gray-700">Trước (Màu Cam)</h3>
              <div className="space-y-2">
                <div className="p-2 bg-orange-50 border-l-4 border-orange-500 rounded text-sm">
                  Tin nhắn với severity high (cam)
                </div>
                <div className="p-2 bg-orange-100 border border-orange-200 rounded text-sm">
                  Background cam
                </div>
              </div>
            </div>

            {/* After */}
            <div className="p-4 border rounded-lg chat-widget">
              <h3 className="font-medium mb-2 text-gray-700">Sau (Màu Xanh)</h3>
              <div className="space-y-2">
                <div className="p-2 bg-cyan-50 border-l-4 border-cyan-600 rounded text-sm">
                  Tin nhắn với severity high (xanh)
                </div>
                <div className="p-2 bg-white border border-cyan-200 rounded text-sm shadow-sm">
                  Background trắng với viền xanh
                </div>
              </div>
            </div>

            {/* Test Override */}
            <div className="p-4 border rounded-lg chat-widget">
              <h3 className="font-medium mb-2 text-gray-700">Test Override</h3>
              <div className="space-y-2">
                <div className="p-2 bg-orange-50 border-l-4 border-orange-500 rounded text-sm">
                  Này sẽ được override thành xanh
                </div>
                <div className="p-2 bg-orange-100 border border-orange-200 rounded text-sm">
                  CSS sẽ force thành màu xanh
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="bg-gray-800 text-green-400 rounded-lg p-4 font-mono text-sm">
          <h3 className="text-white font-semibold mb-2">Debug Console:</h3>
          <div>✅ CSS overrides loaded</div>
          <div>✅ Chat widget class applied</div>
          <div>✅ Cyan color palette active</div>
          <div>🎨 Orange → Cyan conversion: ACTIVE</div>
        </div>
      </div>

      {/* Test Chatbot Component */}
      <ChatbotColorTest />
    </div>
  );
}
