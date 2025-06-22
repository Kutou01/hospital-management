# 🔧 Khắc phục vấn đề giao dịch trùng lặp PayOS

## 🚨 **Vấn đề đã được khắc phục:**

### **1. Vấn đề gốc:**
- Có nhiều giao dịch PayOS được tạo cho cùng một lần thanh toán
- Trên PayOS hiển thị 2-3 giao dịch trong khi chỉ thanh toán 1 lần
- Trang lịch sử thanh toán hiển thị cả giao dịch pending và completed

### **2. Nguyên nhân:**
- Có nhiều API endpoint tạo payment song song
- Không có cơ chế kiểm tra trùng lặp trước khi tạo PayOS request
- Webhook và sync job có thể tạo duplicate records
- Thiếu unique constraint trong database

## ✅ **Các khắc phục đã thực hiện:**

### **1. Thống nhất API endpoints:**
- ❌ Xóa `/api/payment/create` (trùng lặp)
- ❌ Xóa `/api/payments/create` (trùng lặp)  
- ✅ Chỉ sử dụng `/api/payment/checkout` làm endpoint chính

### **2. Cải thiện logic tạo order_code:**
- ✅ Kiểm tra trùng lặp trong database trước khi tạo
- ✅ Kiểm tra trùng lặp trên PayOS trước khi tạo
- ✅ Retry mechanism với orderCode mới nếu bị trùng
- ✅ Thêm random number để tránh collision

### **3. Cải thiện webhook PayOS:**
- ✅ Thêm double-check để tránh race condition
- ✅ Handle duplicate key error gracefully
- ✅ Đổi payment_method từ 'bank_transfer' thành 'payos'

### **4. Lọc hiển thị chỉ giao dịch thành công:**
- ✅ API `/api/patient/payment-history` chỉ trả về status='completed'
- ✅ Không hiển thị giao dịch pending/failed trong lịch sử

### **5. Tools dọn dẹp:**
- ✅ Tạo API `/api/admin/cleanup-duplicates` để xóa duplicates
- ✅ Tạo trang admin `/admin/cleanup-duplicates` để quản lý
- ✅ Script SQL để thêm unique constraint

## 🛠️ **Cách sử dụng:**

### **1. Dọn dẹp giao dịch trùng lặp hiện tại:**
```bash
# Truy cập trang admin
http://localhost:3000/admin/cleanup-duplicates

# Hoặc chạy API trực tiếp
POST /api/admin/cleanup-duplicates
```

### **2. Thêm unique constraint vào database:**
```sql
-- Chạy script này trên Supabase SQL Editor
-- File: frontend/database/add-unique-constraint.sql
```

### **3. Kiểm tra kết quả:**
- Truy cập trang lịch sử thanh toán: `/patient/payment-history`
- Chỉ hiển thị giao dịch đã thanh toán thành công
- Không còn giao dịch trùng lặp

## 📊 **Kết quả mong đợi:**

### **Trước khi khắc phục:**
- PayOS: 3 giao dịch cho 1 lần thanh toán 500k
- Lịch sử: Hiển thị cả pending và completed
- Database: Có nhiều records trùng order_code

### **Sau khi khắc phục:**
- PayOS: 1 giao dịch duy nhất cho 1 lần thanh toán
- Lịch sử: Chỉ hiển thị giao dịch thành công
- Database: Unique constraint đảm bảo không trùng lặp

## ⚠️ **Lưu ý quan trọng:**

### **1. Backup trước khi dọn dẹp:**
- Xuất dữ liệu payments trước khi chạy cleanup
- Kiểm tra kỹ trước khi xóa

### **2. Chạy unique constraint:**
- Phải chạy script SQL để thêm constraint
- Đảm bảo không có duplicates trước khi thêm constraint

### **3. Monitoring:**
- Theo dõi logs để đảm bảo không còn duplicates mới
- Kiểm tra PayOS dashboard thường xuyên

## 🔍 **Cách kiểm tra:**

### **1. Kiểm tra duplicates:**
```bash
GET /api/admin/cleanup-duplicates
```

### **2. Kiểm tra lịch sử thanh toán:**
```bash
GET /api/patient/payment-history
```

### **3. Kiểm tra PayOS:**
- Truy cập PayOS merchant dashboard
- Xác nhận chỉ có 1 giao dịch cho mỗi order

## 📞 **Hỗ trợ:**
Nếu vẫn gặp vấn đề giao dịch trùng lặp, hãy:
1. Kiểm tra logs trong console
2. Chạy cleanup duplicates
3. Xác nhận unique constraint đã được thêm
4. Liên hệ để được hỗ trợ thêm
