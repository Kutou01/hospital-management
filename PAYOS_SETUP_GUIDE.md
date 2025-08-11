# 🏦 **PAYOS SETUP GUIDE - HƯỚNG DẪN THIẾT LẬP PAYOS**

## 📋 **TỔNG QUAN**

PayOS là cổng thanh toán trực tuyến của Việt Nam, hỗ trợ thanh toán qua:
- 🏦 **Chuyển khoản ngân hàng** (QR Code)
- 💳 **Thẻ tín dụng/ghi nợ** (Visa, Mastercard)
- 📱 **Ví điện tử** (MoMo, ZaloPay, ViettelPay, etc.)

---

## 🚀 **BƯỚC 1: ĐĂNG KÝ TÀI KHOẢN PAYOS**

### **1.1 Truy cập PayOS**
- **Website**: https://payos.vn/
- **Click "Đăng ký"** ở góc phải màn hình

### **1.2 Chọn loại tài khoản**
- **Doanh nghiệp**: Cho công ty, bệnh viện
- **Cá nhân**: Cho freelancer, cá nhân kinh doanh

### **1.3 Điền thông tin đăng ký**
```
- Tên doanh nghiệp: Bệnh viện ABC
- Mã số thuế: (nếu có)
- Địa chỉ: Địa chỉ bệnh viện
- Số điện thoại: Số điện thoại liên hệ
- Email: Email chính thức
- Website: http://localhost:3000 (cho development)
```

### **1.4 Xác thực thông tin**
- **Upload giấy tờ**: CMND/CCCD, Giấy phép kinh doanh
- **Xác thực ngân hàng**: Tài khoản nhận tiền
- **Chờ duyệt**: 1-3 ngày làm việc

---

## 🔑 **BƯỚC 2: LẤY THÔNG TIN API**

### **2.1 Đăng nhập PayOS Dashboard**
- Truy cập: https://my.payos.vn/
- Đăng nhập bằng tài khoản đã đăng ký

### **2.2 Lấy API Keys**
1. **Vào "Cài đặt" → "Thông tin tích hợp"**
2. **Copy các thông tin sau:**
   ```
   Client ID: PAYOS_CLIENT_ID
   API Key: PAYOS_API_KEY  
   Checksum Key: PAYOS_CHECKSUM_KEY
   Partner Code: PAYOS_PARTNER_CODE
   ```

### **2.3 Cấu hình Webhook URL**
- **Webhook URL**: `http://your-domain.com/api/payments/payos/webhook`
- **Cho development**: Sử dụng ngrok hoặc để trống

---

## ⚙️ **BƯỚC 3: CẤU HÌNH HỆ THỐNG**

### **3.1 Cập nhật Environment Variables**

**Frontend (.env.local):**
```bash
# PayOS Configuration
NEXT_PUBLIC_PAYOS_CLIENT_ID=your_client_id_here
NEXT_PUBLIC_PAYOS_API_KEY=your_api_key_here
NEXT_PUBLIC_PAYOS_CHECKSUM_KEY=your_checksum_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3100
```

**Backend (.env):**
```bash
# PayOS Configuration
PAYOS_CLIENT_ID=your_client_id_here
PAYOS_API_KEY=your_api_key_here
PAYOS_CHECKSUM_KEY=your_checksum_key_here
PAYOS_PARTNER_CODE=your_partner_code_here

# PayOS URLs
PAYOS_SANDBOX_URL=https://api-merchant-sandbox.payos.vn
PAYOS_PRODUCTION_URL=https://api-merchant.payos.vn

# Frontend URL for redirects
FRONTEND_URL=http://localhost:3000
```

### **3.2 Restart Services**
```bash
# Restart backend services
cd backend
docker-compose restart payment-service

# Restart frontend
cd frontend
npm run dev
```

---

## 🧪 **BƯỚC 4: TEST PAYOS INTEGRATION**

### **4.1 Test Environment**
- **Sandbox Mode**: Tự động khi chưa có tài khoản production
- **Test Cards**: PayOS cung cấp thẻ test
- **Test Bank**: Sử dụng QR code test

### **4.2 Test Payment Flow**
1. **Tạo appointment** trong hệ thống
2. **Chọn "Thanh toán PayOS"** 
3. **Kiểm tra redirect** đến PayOS
4. **Test thanh toán** với thông tin test
5. **Verify callback** về hệ thống

### **4.3 Test Cases**
```bash
✅ Thanh toán thành công
✅ Thanh toán thất bại  
✅ Hủy thanh toán
✅ Timeout thanh toán
✅ Webhook processing
```

---

## 🔧 **BƯỚC 5: TROUBLESHOOTING**

### **5.1 Lỗi thường gặp**

**❌ "Invalid API Key"**
```bash
# Kiểm tra:
- API Key đúng format
- Không có space thừa
- Environment variables loaded đúng
```

**❌ "Invalid Signature"**
```bash
# Kiểm tra:
- Checksum Key đúng
- Request body không bị modify
- Encoding UTF-8
```

**❌ "Amount Invalid"**
```bash
# Kiểm tra:
- Minimum: 1,000 VND
- Maximum: 500,000,000 VND
- Phải là số nguyên
```

### **5.2 Debug Commands**
```bash
# Check environment variables
cd backend/services/payment-service
node -e "console.log(process.env.PAYOS_CLIENT_ID)"

# Test PayOS connection
curl -X POST http://localhost:3009/api/payments/payos/test

# Check logs
docker logs hospital-payment-service
```

---

## 📊 **BƯỚC 6: MONITORING & ANALYTICS**

### **6.1 PayOS Dashboard**
- **Theo dõi giao dịch** real-time
- **Báo cáo doanh thu** theo ngày/tháng
- **Tỷ lệ thành công** thanh toán
- **Phân tích phương thức** thanh toán

### **6.2 System Monitoring**
- **Payment success rate**: >95%
- **Response time**: <3 seconds
- **Error rate**: <1%
- **Webhook delivery**: >99%

---

## 🚀 **BƯỚC 7: GO LIVE**

### **7.1 Production Checklist**
```bash
✅ Tài khoản PayOS approved
✅ Production API keys configured
✅ SSL certificate installed
✅ Webhook URL accessible
✅ Error handling implemented
✅ Logging configured
✅ Monitoring setup
```

### **7.2 Production Configuration**
```bash
# Update environment to production
NODE_ENV=production
PAYOS_ENVIRONMENT=production

# Use production URLs
PAYOS_API_URL=https://api-merchant.payos.vn
FRONTEND_URL=https://your-domain.com
```

---

## 📞 **HỖ TRỢ**

### **PayOS Support**
- **Email**: support@payos.vn
- **Hotline**: 1900 6173
- **Documentation**: https://docs.payos.vn/
- **Telegram**: @payos_support

### **Integration Support**
- **Test Environment**: Luôn sẵn sàng
- **Sample Code**: Có sẵn trong docs
- **Postman Collection**: Download từ docs
- **SDK**: Node.js, PHP, Python, Java

---

## 🎯 **KẾT QUẢ MONG ĐỢI**

Sau khi setup thành công:

✅ **Patients có thể:**
- Thanh toán appointment qua PayOS
- Nhận QR code thanh toán
- Thanh toán bằng banking app
- Nhận confirmation tự động

✅ **System có thể:**
- Tạo payment links
- Xử lý webhooks
- Track payment status
- Generate receipts
- Handle refunds

✅ **Admins có thể:**
- Monitor transactions
- View payment analytics
- Handle disputes
- Export reports

**🎉 Hệ thống thanh toán hoàn chỉnh và sẵn sàng production!**
