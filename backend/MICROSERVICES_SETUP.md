# 🏥 Hospital Management - Microservices Setup Guide

## 📋 Overview

Dự án Hospital Management đã được mở rộng với 8 microservices mới để hỗ trợ đồ án tốt nghiệp của bạn:

### 🔧 Core Services (Đã có)
- **API Gateway** (Port 3000) - Routing và Load Balancing
- **Auth Service** (Port 3001) - Authentication & Authorization  
- **Doctor Service** (Port 3002) - Quản lý bác sĩ
- **Patient Service** (Port 3003) - Quản lý bệnh nhân
- **Appointment Service** (Port 3004) - Đặt lịch khám

### 🆕 New Services (Mới triển khai)
- **Medical Records Service** (Port 3006) - Hồ sơ y tế & Kết quả xét nghiệm
- **Prescription Service** (Port 3007) - Quản lý đơn thuốc
- **Billing Service** (Port 3008) - Thanh toán & Hóa đơn
- **Room Service** (Port 3009) - Quản lý phòng
- **Notification Service** (Port 3011) - Thông báo & Nhắc nhở
- **File Storage Service** (Port 3016) - Lưu trữ file
- **Audit Service** (Port 3017) - Audit & Logging
- **Chatbot Service** (Port 3018) - AI Chatbot Assistant

## 🚀 Quick Start

### 1. Cài đặt Dependencies

```bash
# Cài đặt tất cả dependencies
npm run install:all

# Hoặc cài đặt từng service
npm run install:core      # Core services
npm run install:extended  # New services
```

### 2. Setup Environment

```bash
# Copy environment file
cp .env.example .env

# Cập nhật các biến môi trường:
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
```

### 3. Setup Database Tables

```bash
# Tạo các tables cần thiết trong Supabase
npm run setup:tables
```

### 4. Khởi động Services

```bash
# Khởi động tất cả services (Recommended)
npm run dev

# Hoặc khởi động từng nhóm
npm run dev:core      # Core services only
npm run dev:extended  # New services only

# Hoặc khởi động từng service riêng lẻ
npm run dev:medical-records
npm run dev:prescription
npm run dev:billing
# ... etc
```

## 📊 Service Architecture

```
Frontend (Next.js) 
    ↓
API Gateway (Port 3000)
    ↓
┌─────────────────────────────────────────────────────────┐
│                    Microservices                        │
├─────────────────────────────────────────────────────────┤
│ Auth (3001)    │ Doctor (3002)   │ Patient (3003)      │
│ Appointment    │ Medical Records │ Prescription (3007) │
│ (3004)         │ (3006)          │                     │
├─────────────────────────────────────────────────────────┤
│ Billing (3008) │ Room (3009)     │ Notification (3011) │
│ File Storage   │ Audit (3017)    │ Chatbot (3018)      │
│ (3016)         │                 │                     │
└─────────────────────────────────────────────────────────┘
    ↓
Supabase Database
```

## 🔗 API Endpoints

### Medical Records Service (Port 3006)
```
GET    /api/medical-records              # Lấy danh sách hồ sơ
POST   /api/medical-records              # Tạo hồ sơ mới
GET    /api/medical-records/:id          # Lấy hồ sơ theo ID
PUT    /api/medical-records/:id          # Cập nhật hồ sơ
DELETE /api/medical-records/:id          # Xóa hồ sơ

GET    /api/medical-records/patient/:id  # Hồ sơ theo bệnh nhân
GET    /api/medical-records/doctor/:id   # Hồ sơ theo bác sĩ

POST   /api/medical-records/lab-results  # Thêm kết quả xét nghiệm
POST   /api/medical-records/vital-signs  # Thêm chỉ số sinh hiệu
```

### Prescription Service (Port 3007)
```
GET    /api/prescriptions                # Danh sách đơn thuốc
POST   /api/prescriptions                # Tạo đơn thuốc mới
GET    /api/prescriptions/:id            # Chi tiết đơn thuốc
PUT    /api/prescriptions/:id            # Cập nhật đơn thuốc

GET    /api/medications                  # Danh sách thuốc
POST   /api/medications                  # Thêm thuốc mới
GET    /api/medications/search?q=term    # Tìm kiếm thuốc

POST   /api/prescriptions/check-interactions  # Kiểm tra tương tác thuốc
```

### Billing Service (Port 3008)
```
GET    /api/bills                       # Danh sách hóa đơn
POST   /api/bills                       # Tạo hóa đơn mới
GET    /api/bills/:id                   # Chi tiết hóa đơn
PUT    /api/bills/:id                   # Cập nhật hóa đơn

POST   /api/payments                    # Xử lý thanh toán
GET    /api/payments/:billId            # Lịch sử thanh toán
```

### Notification Service (Port 3011)
```
GET    /api/notifications               # Danh sách thông báo
POST   /api/notifications               # Gửi thông báo
PUT    /api/notifications/:id/read      # Đánh dấu đã đọc

POST   /api/notifications/email         # Gửi email
POST   /api/notifications/sms           # Gửi SMS
```

## 🧪 Testing

### Unit Tests
```bash
npm run test                    # Chạy tất cả tests
npm run test:medical-records    # Test Medical Records Service
npm run test:prescription       # Test Prescription Service
npm run test:billing           # Test Billing Service
```

### API Testing
```bash
# Sử dụng curl hoặc Postman
curl http://localhost:3006/health
curl http://localhost:3007/health
curl http://localhost:3008/health
```

## 📚 Documentation

### Swagger API Docs
- Medical Records: http://localhost:3006/docs
- Prescription: http://localhost:3007/docs  
- Billing: http://localhost:3008/docs
- Notification: http://localhost:3011/docs

### Health Checks
- API Gateway: http://localhost:3000/health
- All Services: http://localhost:PORT/health

## 🐳 Docker Deployment

```bash
# Build và chạy với Docker
npm run docker:up

# Xem logs
npm run docker:logs

# Dừng services
npm run docker:down
```

## 🔧 Development Tips

### 1. Debugging
```bash
# Xem logs của service cụ thể
npm run logs:medical-records
npm run logs:prescription
```

### 2. Database Migration
```bash
# Chạy lại setup tables nếu cần
npm run setup:tables
```

### 3. Code Generation
```bash
# Build tất cả services
npm run build

# Build service cụ thể
npm run build:medical-records
```

## 🎯 Điểm mạnh cho Đồ án

### Technical Skills Demonstrated:
✅ **Microservices Architecture** - Phân tách services độc lập  
✅ **RESTful API Design** - API chuẩn REST  
✅ **Database Design** - Thiết kế database phức tạp  
✅ **Authentication & Authorization** - Bảo mật hệ thống  
✅ **File Upload & Storage** - Xử lý file  
✅ **Real-time Notifications** - Thông báo real-time  
✅ **PDF Generation** - Tạo báo cáo PDF  
✅ **Data Validation** - Validation dữ liệu  
✅ **Error Handling** - Xử lý lỗi  
✅ **Docker Containerization** - Containerization  

### Business Logic Complexity:
✅ **Healthcare Domain** - Kiến thức y tế  
✅ **Complex Relationships** - Quan hệ dữ liệu phức tạp  
✅ **Business Rules** - Quy tắc nghiệp vụ  
✅ **Workflow Management** - Quản lý quy trình  

## 🆘 Troubleshooting

### Common Issues:

1. **Port conflicts**
   ```bash
   # Kiểm tra port đang sử dụng
   netstat -ano | findstr :3006
   ```

2. **Supabase connection issues**
   ```bash
   # Kiểm tra environment variables
   echo $SUPABASE_URL
   ```

3. **Service startup failures**
   ```bash
   # Chạy service riêng lẻ để debug
   npm run dev:medical-records
   ```

## 📞 Support

Nếu gặp vấn đề, hãy:
1. Kiểm tra logs của service
2. Verify environment variables
3. Đảm bảo Supabase tables đã được tạo
4. Check port conflicts

---

**Good luck với đồ án tốt nghiệp! 🎓**
