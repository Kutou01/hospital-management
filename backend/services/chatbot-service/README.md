# 🤖 Hospital Chatbot Service - Health Advisor

Dịch vụ tư vấn sức khỏe AI cho hệ thống quản lý bệnh viện, hỗ trợ phân tích triệu chứng và khuyến nghị chuyên khoa bằng tiếng Việt.

## 🌟 Tính năng chính

### ✅ **Đã hoàn thành:**
- **Tư vấn sức khỏe cơ bản**: Phân tích triệu chứng từ mô tả của người dùng
- **Khuyến nghị chuyên khoa**: Đề xuất chuyên khoa phù hợp dựa trên triệu chứng
- **Hướng dẫn chuẩn bị khám**: Lời khuyên chuẩn bị trước khi đến bệnh viện
- **Chăm sóc sau điều trị**: Hướng dẫn chăm sóc theo từng chuyên khoa
- **Phát hiện cấp cứu**: Nhận diện triệu chứng cần can thiệp y tế ngay

### 🔄 **Đang phát triển:**
- Tích hợp Rasa NLU cho xử lý ngôn ngữ tự nhiên
- Chat interface real-time
- Machine learning model training

## 🏗️ Kiến trúc

```
chatbot-service/
├── src/
│   ├── controllers/          # API controllers
│   ├── services/            # Business logic
│   ├── routes/              # API routes
│   ├── validators/          # Input validation
│   ├── utils/               # Utilities (logger, etc.)
│   └── index.ts             # Main application
├── database/                # Database scripts & sample data
├── logs/                    # Application logs
├── test-health-advisor.js   # Test script
└── README.md               # This file
```

## 🚀 Cài đặt và chạy

### 1. **Cài đặt dependencies:**
```bash
cd backend/services/chatbot-service
npm install
```

### 2. **Cấu hình môi trường:**
Tạo file `.env` hoặc sử dụng biến môi trường:
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Service Configuration
CHATBOT_SERVICE_PORT=3009
NODE_ENV=development
LOG_LEVEL=info

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000
```

### 3. **Tạo dữ liệu mẫu trong Supabase:**
```sql
-- Chạy script trong database/sample-health-data.sql
-- Hoặc import từ Supabase Dashboard
```

### 4. **Khởi động service:**
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### 5. **Kiểm tra service:**
```bash
# Test tất cả endpoints
node test-health-advisor.js

# Hoặc kiểm tra health check
curl http://localhost:3009/health
```

## 📚 API Documentation

### **Base URL:** `http://localhost:3009`

### **1. Health Check**
```http
GET /health
```
**Response:**
```json
{
  "service": "Hospital Chatbot Service",
  "status": "healthy",
  "features": {
    "health_advisor": true,
    "symptom_analysis": true,
    "vietnamese_language": true
  }
}
```

### **2. Tư vấn nhanh**
```http
POST /api/health/quick-consultation
Content-Type: application/json

{
  "symptoms_text": "đau đầu và chóng mặt",
  "age": 30,
  "gender": "nữ"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "chatbot_response": "Dựa trên triệu chứng bạn mô tả...",
    "detailed_analysis": {
      "symptoms_detected": [...],
      "recommended_specialty": "Thần kinh",
      "confidence_score": 0.85,
      "urgency_level": "medium"
    }
  }
}
```

### **3. Phân tích triệu chứng chi tiết**
```http
POST /api/health/analyze-symptoms
Content-Type: application/json

{
  "user_input": "Tôi bị ho khan kéo dài 2 tuần, có khi khó thở"
}
```

### **4. Danh sách chuyên khoa**
```http
GET /api/health/specialties
```

### **5. Lời khuyên sau điều trị**
```http
POST /api/health/post-treatment-advice
Content-Type: application/json

{
  "specialty": "Tim mạch"
}
```

### **6. Triệu chứng cấp cứu**
```http
GET /api/health/emergency-symptoms
```

## 🧪 Testing

### **Chạy test tự động:**
```bash
node test-health-advisor.js
```

### **Test thủ công với curl:**
```bash
# Tư vấn nhanh
curl -X POST http://localhost:3009/api/health/quick-consultation \
  -H "Content-Type: application/json" \
  -d '{"symptoms_text": "đau bụng và buồn nôn", "age": 25}'

# Kiểm tra chuyên khoa
curl http://localhost:3009/api/health/specialties

# Triệu chứng cấp cứu
curl http://localhost:3009/api/health/emergency-symptoms
```

## 📊 Database Schema

### **Bảng `symptoms`:**
- `symptom_id`: ID triệu chứng
- `name_vi`: Tên tiếng Việt
- `description`: Mô tả
- `severity_level`: Mức độ nghiêm trọng (1-5)
- `category`: Danh mục
- `keywords`: Từ khóa nhận diện

### **Bảng `specialty_recommendations`:**
- `recommendation_id`: ID khuyến nghị
- `symptom_combinations`: Tổ hợp triệu chứng
- `recommended_specialty`: Chuyên khoa đề xuất
- `confidence_score`: Độ tin cậy (0.0-1.0)
- `urgency_level`: Mức độ khẩn cấp

### **Bảng `health_advice`:**
- `advice_id`: ID lời khuyên
- `category`: Loại lời khuyên
- `title_vi`: Tiêu đề
- `content_vi`: Nội dung
- `applicable_specialties`: Chuyên khoa áp dụng

## 🔧 Cấu hình

### **Logging:**
- Logs được lưu trong thư mục `logs/`
- Levels: error, warn, info, debug
- Rotation: 5MB per file, 5 files max

### **CORS:**
- Cho phép origin từ frontend (port 3000)
- Methods: GET, POST, PUT, DELETE, OPTIONS

### **Security:**
- Helmet.js cho security headers
- Input validation với express-validator
- Rate limiting (sẽ thêm)

## 🚀 Deployment

### **Docker (sẽ thêm):**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3009
CMD ["node", "dist/index.js"]
```

### **Environment Variables:**
```env
NODE_ENV=production
CHATBOT_SERVICE_PORT=3009
SUPABASE_URL=your_production_url
SUPABASE_SERVICE_ROLE_KEY=your_production_key
LOG_LEVEL=warn
```

## 🤝 Tích hợp với hệ thống

### **API Gateway Integration:**
Service này sẽ được tích hợp vào API Gateway tại route `/api/chat/*`

### **Frontend Integration:**
```javascript
// Ví dụ gọi API từ frontend
const consultationResult = await fetch('/api/chat/health/quick-consultation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    symptoms_text: userInput,
    age: userAge,
    gender: userGender
  })
});
```

## 📝 Logs và Monitoring

### **Log Files:**
- `chatbot-service.log`: Tất cả logs
- `chatbot-service-error.log`: Chỉ errors
- `health-advisor.log`: Health consultation logs

### **Metrics (sẽ thêm):**
- Response time
- Success/error rates
- Most common symptoms
- Specialty recommendation accuracy

## 🔮 Roadmap

### **Phase 2: Rasa Integration**
- [ ] Rasa NLU training
- [ ] Custom actions
- [ ] Conversation management

### **Phase 3: Advanced Features**
- [ ] Machine learning models
- [ ] Personalized recommendations
- [ ] Integration with appointment system
- [ ] Real-time chat interface

### **Phase 4: Analytics**
- [ ] Usage analytics
- [ ] Accuracy metrics
- [ ] User feedback system

## 🆘 Troubleshooting

### **Common Issues:**

1. **Service không khởi động:**
   - Kiểm tra port 3009 có bị chiếm không
   - Xác nhận biến môi trường Supabase

2. **Database connection error:**
   - Kiểm tra SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY
   - Test với `/test-db` endpoint

3. **Không có kết quả tư vấn:**
   - Kiểm tra dữ liệu trong bảng `symptoms`
   - Chạy script `sample-health-data.sql`

### **Debug Mode:**
```bash
LOG_LEVEL=debug npm run dev
```

## 📞 Support

- **Issues**: Tạo issue trong repository
- **Documentation**: Xem thêm trong `/docs`
- **API Testing**: Sử dụng `test-health-advisor.js`
