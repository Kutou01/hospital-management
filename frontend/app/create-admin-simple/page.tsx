'use client';

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CreateAdminSimplePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const createAdminDirect = async () => {
    try {
      setLoading(true);
      setResult('Đang tạo admin...');

      // Generate proper UUID for admin
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      const adminId = generateUUID();

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: adminId,
          email: 'admin@hospital.com',
          full_name: 'Hospital Admin',
          role: 'admin',
          phone_number: '0123456789',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        setResult(`❌ Lỗi: ${error.message}`);
        return;
      }

      setResult(`✅ Tạo admin thành công!
      
📧 Email: admin@hospital.com
👤 Tên: Hospital Admin  
🔑 ID: ${adminId}

🎯 Bây giờ bạn có thể:
1. Truy cập: http://localhost:3000/admin/dashboard
2. Hoặc xem dữ liệu: http://localhost:3000/test-database
3. Hoặc truy cập Supabase Dashboard trực tiếp

⚠️ Lưu ý: Đây là tài khoản test, không cần password`);

    } catch (error) {
      setResult(`❌ Lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8 text-center">🔐 Tạo Admin Đơn Giản</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Tạo tài khoản Admin</h2>
          
          <div className="text-center">
            <button
              onClick={createAdminDirect}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '⏳ Đang tạo...' : '➕ Tạo Admin Ngay'}
            </button>
          </div>

          {result && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">{result}</pre>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">📋 Hướng dẫn xem dữ liệu</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Cách 1: Qua Test Database</strong></p>
            <p>• Truy cập: <code className="bg-gray-200 px-2 py-1 rounded">http://localhost:3000/test-database</code></p>
            <p>• Xem appointments từ chatbot với "Created by: CHATBOT_AI"</p>
            
            <p className="mt-4"><strong>Cách 2: Qua Supabase Dashboard</strong></p>
            <p>• Truy cập: <a href="https://supabase.com/dashboard" target="_blank" className="text-blue-600 underline">https://supabase.com/dashboard</a></p>
            <p>• Đăng nhập với tài khoản Supabase</p>
            <p>• Vào project: cjnmppmblfcibhkahljh</p>
            <p>• Xem bảng: appointments, patients, payments</p>
            
            <p className="mt-4"><strong>Cách 3: Qua Admin Dashboard (nếu auth hoạt động)</strong></p>
            <p>• Truy cập: <code className="bg-gray-200 px-2 py-1 rounded">http://localhost:3000/admin/dashboard</code></p>
            <p>• Đăng nhập với admin@hospital.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
