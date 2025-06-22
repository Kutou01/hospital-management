# Cải thiện lịch sử thanh toán cho bệnh nhân

## Tóm tắt vấn đề
Bệnh nhân không thể xem lịch sử thanh toán sau khi thanh toán. Hệ thống hiển thị lỗi "Error: Không tìm thấy thông tin người dùng" khi cố gắng đồng bộ lịch sử thanh toán.

## Các thay đổi đã thực hiện

### 1. Sửa lỗi "relation patients already exists"
- Đã tạo script SQL kiểm tra sự tồn tại của bảng `patients` trước khi tạo
- Thêm khóa ngoại và index cho `patient_id` trong bảng `payments`

### 2. Cập nhật liên kết giữa thanh toán và bệnh nhân
- Tạo script SQL để cập nhật `patient_id` trong bảng `payments` dựa trên email
- Thêm index cho `payment_email` và `patient_id` để tăng hiệu suất truy vấn

### 3. Sửa API trả về thanh toán
- **Sửa lỗi:** API chỉ trả về thanh toán có trạng thái 'completed', bỏ qua các trạng thái khác
- **Giải pháp:** Bỏ filter `.eq('status', 'completed')` để hiển thị tất cả trạng thái thanh toán

## Hướng dẫn triển khai

### Bước 1: Chạy script SQL cập nhật cấu trúc database
```sql
-- Chạy script fix_relation_error.sql trên Supabase SQL Editor
```

### Bước 2: Cập nhật liên kết thanh toán và bệnh nhân
```sql
-- Chạy script fix_payment_link.sql trên Supabase SQL Editor
```

### Bước 3: Kiểm tra dữ liệu sau khi cập nhật
```sql
-- Kiểm tra dữ liệu payments
SELECT 
    status,
    COUNT(*) as total_payments,
    COUNT(*) FILTER (WHERE patient_id IS NOT NULL) as linked_payments,
    COUNT(*) FILTER (WHERE patient_id IS NULL) as unlinked_payments
FROM 
    payments 
GROUP BY 
    status
ORDER BY 
    total_payments DESC;
```

### Bước 4: Sửa mã API ở các file
1. Sửa file `frontend/app/api/patient/payment-history/route.ts`: Bỏ filter `.eq('status', 'completed')`
2. Sửa file `frontend/app/api/patient/payment-history-v2/route.ts` (nếu có): Bỏ filter status

### Bước 5: Kiểm tra chức năng
1. Đăng nhập vào tài khoản bệnh nhân
2. Truy cập trang lịch sử thanh toán
3. Kiểm tra xem có hiển thị tất cả các thanh toán không
4. Đảm bảo nút đồng bộ hoạt động bình thường

## Giải pháp cho những lỗi tiềm ẩn

### Nếu vẫn không hiển thị thanh toán
1. Kiểm tra logs xem `patient_id` đã được truy vấn đúng chưa
2. Kiểm tra API endpoints có trả về dữ liệu không
3. Kiểm tra frontend có hiển thị đúng dữ liệu không

### Nếu gặp lỗi khi đồng bộ
1. Kiểm tra quyền trong RLS (Row Level Security) cho bảng `payments`
2. Đảm bảo user có quyền UPDATE cho bảng `payments`
3. Kiểm tra các thông báo lỗi trong console để xác định nguyên nhân chính xác

## Những cải tiến trong tương lai
1. Tự động gán `patient_id` khi tạo payment mới
2. Thêm tính năng xem chi tiết từng giao dịch
3. Hiển thị biểu đồ thống kê thanh toán theo thời gian
4. Cải thiện hiệu suất query bằng cách tối ưu hóa index 