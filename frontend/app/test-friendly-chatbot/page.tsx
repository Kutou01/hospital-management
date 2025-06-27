"use client"

import React from 'react';
import FriendlyChatbotTest from '@/components/test/FriendlyChatbotTest';

export default function TestFriendlyChatbotPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          🤗 Test Chatbot Thân Thiện & Dễ Tiếp Cận
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Phong cách cũ */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center">
              ❌ Phong Cách Cũ (Lạnh Lùng)
            </h2>
            <div className="bg-gray-100 p-4 rounded-lg text-sm">
              <div className="font-medium text-gray-700 mb-2">🩺 Phân tích triệu chứng:</div>
              <div className="text-gray-600 mb-3">
                Vị trí đau bụng giúp xác định nguyên nhân. Đau thượng vị có thể do dạ dày, 
                đau hạ vị phải có thể do ruột thừa, đau lan tỏa có thể do ruột.
              </div>
              <div className="font-medium text-gray-700 mb-2">🔍 Nguyên nhân có thể:</div>
              <div className="text-gray-600 mb-3">
                • Ăn uống không hợp vệ sinh<br/>
                • Viêm dạ dày do stress, cay nóng<br/>
                • Viêm ruột thừa<br/>
                • Sỏi mật, viêm túi mật
              </div>
              <div className="font-medium text-gray-700">👨‍⚕️ Khuyến nghị khám: Chuyên khoa Tiêu hóa</div>
            </div>
            
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">❌ Vấn đề:</h3>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Ngôn ngữ y khoa phức tạp</li>
                <li>• Thiếu sự đồng cảm</li>
                <li>• Không ưu tiên an toàn</li>
                <li>• Cấu trúc khó theo dõi</li>
                <li>• Thiếu tương tác</li>
              </ul>
            </div>
          </div>

          {/* Phong cách mới */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center">
              ✅ Phong Cách Mới (Thân Thiện)
            </h2>
            <div className="bg-cyan-50 p-4 rounded-lg text-sm border border-cyan-200">
              <div className="text-cyan-800 mb-3 font-medium">
                💙 Tôi thấy bạn đang khó chịu vì đau bụng 🤗 Tôi sẽ giúp bạn tìm hiểu nguyên nhân nhé!
              </div>
              
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg mb-3">
                <div className="text-red-800 font-medium">
                  ⚠️ An toàn trước tiên: Nếu đau bụng dữ dội, cứng bụng hoặc sốt cao, hãy gọi 115!
                </div>
              </div>
              
              <div className="mb-3">
                <div className="font-semibold text-gray-800 mb-2">🤗 Hiểu về đau bụng:</div>
                <div className="text-gray-700">Đau bụng có thể do nhiều nguyên nhân khác nhau tùy vị trí đau.</div>
              </div>
              
              <div className="mb-3">
                <div className="font-semibold text-gray-800 mb-2">💡 Những gì bạn có thể làm:</div>
                <div className="ml-4 space-y-1 text-gray-700">
                  <div>• 🍵 Uống nước ấm, tránh đồ lạnh</div>
                  <div>• 🤲 Chườm ấm bụng nhẹ nhàng</div>
                  <div>• 🍎 Ăn nhẹ, dễ tiêu</div>
                </div>
              </div>
              
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg mb-3">
                <div className="text-blue-800">
                  🏥 Bạn nên đến khám Tiêu hóa nếu đau kéo dài hoặc có dấu hiệu bất thường
                </div>
              </div>
              
              <div className="bg-cyan-50 border-l-4 border-cyan-400 p-3 rounded-r-lg">
                <div className="text-cyan-800 font-medium">
                  ❓ Bạn có thể cho tôi biết đau ở vị trí nào và mức độ từ 1-10 không?
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">✅ Cải thiện:</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Thân thiện: "Tôi hiểu bạn đang cảm thấy..."</li>
                <li>• Ưu tiên an toàn: Cảnh báo cấp cứu lên đầu</li>
                <li>• Tương tác dễ dàng: Emoji và cấu trúc rõ ràng</li>
                <li>• Ngôn ngữ đơn giản: Tránh thuật ngữ y khoa</li>
                <li>• Cá nhân hóa: Sử dụng "bạn" và "tôi"</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Nguyên tắc thiết kế */}
        <div className="bg-white rounded-lg p-6 shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">🎯 Nguyên Tắc Thiết Kế Thân Thiện</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg">
              <div className="text-pink-600 font-semibold mb-2">💙 1. Thân Thiện Hơn</div>
              <div className="text-sm text-gray-700">
                "Tôi hiểu bạn đang cảm thấy khó chịu" thay vì "Phân tích triệu chứng"
              </div>
            </div>
            
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-600 font-semibold mb-2">⚠️ 2. Ưu Tiên An Toàn</div>
              <div className="text-sm text-gray-700">
                Đặt cảnh báo cấp cứu lên đầu, số điện thoại 115 rõ ràng
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-blue-600 font-semibold mb-2">🤗 3. Tương Tác Dễ Dàng</div>
              <div className="text-sm text-gray-700">
                Dùng emoji và cấu trúc rõ ràng thay vì chỉ liệt kê
              </div>
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-green-600 font-semibold mb-2">📝 4. Ngôn Ngữ Đơn Giản</div>
              <div className="text-sm text-gray-700">
                Tránh thuật ngữ y khoa phức tạp, dùng từ dễ hiểu
              </div>
            </div>
            
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="text-purple-600 font-semibold mb-2">🎯 5. Cấu Trúc Rõ Ràng</div>
              <div className="text-sm text-gray-700">
                Mỗi phần có mục đích cụ thể, dễ theo dõi
              </div>
            </div>
            
            <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
              <div className="text-cyan-600 font-semibold mb-2">👥 6. Cá Nhân Hóa</div>
              <div className="text-sm text-gray-700">
                Sử dụng "bạn" và "tôi" để tạo cảm giác thân thiện
              </div>
            </div>
          </div>
        </div>

        {/* Hướng dẫn test */}
        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-cyan-800">🧪 Hướng Dẫn Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium text-cyan-700 mb-2">Test Cases Thường:</h3>
              <ul className="space-y-1 text-cyan-600">
                <li>• "tôi bị đau đầu"</li>
                <li>• "sốt và mệt mỏi"</li>
                <li>• "đau bụng từ sáng"</li>
                <li>• "ho không ngừng"</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-cyan-700 mb-2">Test Cases Cấp Cứu:</h3>
              <ul className="space-y-1 text-cyan-600">
                <li>• "đau ngực và khó thở"</li>
                <li>• "chảy máu không cầm được"</li>
                <li>• "bất tỉnh"</li>
                <li>• "sốt cao co giật"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Test Chatbot Component */}
      <FriendlyChatbotTest />
    </div>
  );
}
