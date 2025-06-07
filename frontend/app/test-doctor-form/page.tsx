'use client';

// =====================================================
// TEST PAGE FOR DOCTOR REGISTRATION FORM
// =====================================================
// Trang test để kiểm tra form đăng ký bác sĩ với enum system

import React from 'react';
import { DoctorRegistrationForm } from '@/components/forms/DoctorRegistrationForm';
import { EnumProvider } from '@/lib/contexts/EnumContext';

export default function TestDoctorFormPage() {
  return (
    <EnumProvider>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🧪 Test Doctor Registration Form
            </h1>
            <p className="text-gray-600">
              Kiểm tra form đăng ký bác sĩ với hệ thống enum Vietnamese-only
            </p>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">🏥 Departments</h3>
              <p className="text-sm text-blue-600">
                Sử dụng bảng departments thay vì departments_enum
              </p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">🇻🇳 Vietnamese Only</h3>
              <p className="text-sm text-green-600">
                Tất cả enum đều hiển thị bằng tiếng Việt
              </p>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 mb-2">⚡ Simplified</h3>
              <p className="text-sm text-purple-600">
                Đã loại bỏ hệ thống bilingual phức tạp
              </p>
            </div>
          </div>

          {/* Form */}
          <DoctorRegistrationForm />

          {/* Debug Info */}
          <div className="mt-8 bg-gray-100 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">🔍 Debug Info</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Form sử dụng EnumContext để load dữ liệu enum</p>
              <p>• Departments được convert từ bảng departments sang format enum</p>
              <p>• Specialties, room_types, diagnosis, medications, status_values, payment_methods từ bảng enum</p>
              <p>• Tất cả validation đã được cập nhật để bao gồm departmentId</p>
              <p>• Form reset bao gồm departmentId field</p>
            </div>
          </div>

          {/* Test Instructions */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">📋 Test Instructions</h3>
            <div className="text-sm text-yellow-700 space-y-2">
              <p><strong>1. Kiểm tra dropdowns:</strong></p>
              <ul className="ml-4 space-y-1">
                <li>• Chuyên khoa: Nên có 12 options (Tim mạch, Thần kinh, etc.)</li>
                <li>• Khoa/Phòng ban: Nên có 12 departments (DEPT001-DEPT012)</li>
                <li>• Giới tính: Nam, Nữ, Khác</li>
                <li>• Trạng thái: Hoạt động, Không hoạt động, etc.</li>
              </ul>
              
              <p><strong>2. Test validation:</strong></p>
              <ul className="ml-4 space-y-1">
                <li>• Submit form trống để xem validation errors</li>
                <li>• Nhập email sai format</li>
                <li>• Nhập số điện thoại sai format (phải 10 số, bắt đầu bằng 0)</li>
                <li>• Nhập license number sai format (phải VN-XX-0000)</li>
              </ul>
              
              <p><strong>3. Test submit:</strong></p>
              <ul className="ml-4 space-y-1">
                <li>• Điền đầy đủ thông tin hợp lệ</li>
                <li>• Submit và xem alert hiển thị thông tin đã chọn</li>
                <li>• Form sẽ reset sau khi submit thành công</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </EnumProvider>
  );
}
