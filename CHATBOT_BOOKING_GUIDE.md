# 🤖 HƯỚNG DẪN CHATBOT BOOKING SYSTEM

## 📋 **Tổng quan**

Hệ thống chatbot booking cho phép bệnh nhân đặt lịch khám bệnh thông qua giao diện chat tương tác. Hệ thống bao gồm:

- **Backend API Service** (Node.js + Express)
- **Database Functions** (PostgreSQL/Supabase)
- **Frontend Chat Widget** (React + TypeScript)
- **Session Management** (Quản lý phiên đặt lịch)

---

## 🚀 **Cài đặt và Chạy**

### **Bước 1: Setup Database Functions**
```sql
-- Chạy file chatbot-booking-functions.sql trong Supabase SQL Editor
\i chatbot-booking-functions.sql
```

### **Bước 2: Setup Backend Service**
```bash
# Di chuyển vào thư mục service
cd backend/services/chatbot-booking-service

# Cài đặt dependencies
npm install

# Tạo file .env từ .env.example
copy .env.example .env

# Cập nhật .env với thông tin Supabase
# SUPABASE_URL=http://localhost:54321
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Build và chạy service
npm run build
npm run dev
```

### **Bước 3: Tích hợp Frontend Widget**
```tsx
// Thêm vào trang web (ví dụ: layout.tsx hoặc page.tsx)
import ChatbotBookingWidget from '@/components/chatbot/ChatbotBookingWidget';

export default function Layout() {
  return (
    <div>
      {/* Nội dung trang web */}
      
      {/* Chat widget sẽ hiển thị ở góc phải dưới */}
      <ChatbotBookingWidget />
    </div>
  );
}
```

---

## 🔧 **Cấu trúc Hệ thống**

### **Database Functions:**
- `get_doctors_by_specialty()` - Lấy danh sách bác sĩ theo chuyên khoa
- `get_chatbot_available_slots()` - Lấy time slots cho chatbot
- `update_booking_session()` - Cập nhật session booking
- `create_appointment_from_session()` - Tạo appointment từ session
- `get_session_info()` - Lấy thông tin session
- `cleanup_expired_sessions()` - Dọn dẹp session hết hạn

### **API Endpoints:**
- `GET /health` - Health check
- `GET /api/specialties` - Lấy danh sách chuyên khoa
- `GET /api/doctors?specialty_id=X` - Lấy bác sĩ theo chuyên khoa
- `GET /api/slots/:doctorId/:date` - Lấy time slots
- `POST /api/session` - Tạo session mới
- `PUT /api/session/:sessionId` - Cập nhật session
- `GET /api/session/:sessionId` - Lấy thông tin session
- `POST /api/appointment/:sessionId` - Tạo appointment

### **Frontend Components:**
- `ChatbotBookingWidget` - Widget chat chính
- Quản lý state với React hooks
- Tích hợp với backend APIs
- UI/UX thân thiện với người dùng

---

## 🎯 **Flow Đặt lịch**

### **1. Khởi tạo Chat**
- User click vào chat widget
- Load danh sách chuyên khoa
- Hiển thị welcome message

### **2. Chọn Chuyên khoa**
- User chọn chuyên khoa
- Tạo booking session
- Load danh sách bác sĩ

### **3. Chọn Bác sĩ**
- User chọn bác sĩ
- Cập nhật session
- Hiển thị danh sách ngày

### **4. Chọn Ngày**
- User chọn ngày khám
- Load time slots available
- Hiển thị giờ trống

### **5. Chọn Giờ**
- User chọn giờ khám
- Hiển thị summary booking
- Xác nhận thông tin

### **6. Xác nhận Đặt lịch**
- User xác nhận
- Tạo appointment trong database
- Cập nhật slot availability
- Hiển thị thông tin appointment

---

## 🧪 **Testing**

### **Test Backend APIs:**
```bash
# Health check
curl http://localhost:3005/health

# Get specialties
curl http://localhost:3005/api/specialties

# Get doctors
curl http://localhost:3005/api/doctors

# Get time slots
curl http://localhost:3005/api/slots/DOC-TEST-001/2025-06-28

# Create session
curl -X POST http://localhost:3005/api/session \
  -H "Content-Type: application/json" \
  -d '{"patient_id": "PAT-TEST-001"}'
```

### **Test Database Functions:**
```sql
-- Test get doctors
SELECT * FROM hospital_dev.get_doctors_by_specialty();

-- Test get slots
SELECT * FROM hospital_dev.get_chatbot_available_slots('DOC-TEST-001', CURRENT_DATE + 1);

-- Test create session
SELECT * FROM hospital_dev.create_booking_session('PAT-TEST-001');
```

---

## 🔒 **Bảo mật**

- Sử dụng Supabase Service Role Key
- Validate input data
- Session timeout (30 phút)
- Rate limiting
- CORS configuration
- Error handling

---

## 📊 **Monitoring**

- Winston logging
- Health check endpoint
- Error tracking
- Session cleanup job
- Performance monitoring

---

## 🚨 **Troubleshooting**

### **Lỗi thường gặp:**

1. **Service không start được:**
   - Kiểm tra .env file
   - Đảm bảo SUPABASE_SERVICE_ROLE_KEY đúng
   - Kiểm tra port 3005 có bị chiếm không

2. **Database functions lỗi:**
   - Chạy lại chatbot-booking-functions.sql
   - Kiểm tra schema hospital_dev tồn tại
   - Verify test data có đầy đủ không

3. **Frontend widget không hiển thị:**
   - Kiểm tra import component đúng
   - Verify API URL trong .env.local
   - Check browser console for errors

4. **Booking không thành công:**
   - Kiểm tra session chưa hết hạn
   - Verify time slot còn available
   - Check database constraints

---

## 📞 **Support**

Nếu gặp vấn đề:
1. Kiểm tra logs trong `backend/services/chatbot-booking-service/logs/`
2. Test API endpoints với curl/Postman
3. Verify database functions hoạt động
4. Check browser developer tools

**Hệ thống Chatbot Booking đã sẵn sàng! 🎉**
