# Hướng dẫn sửa lỗi Payment History

## Vấn đề
- Bệnh nhân không thể xem lịch sử thanh toán sau khi thanh toán
- Hệ thống hiển thị lỗi "Error: Không tìm thấy thông tin người dùng" khi đồng bộ lịch sử thanh toán
- Lỗi `relation "patients" already exists` khi cố gắng tạo bảng patients

## Nguyên nhân
1. Bảng `patients` đã tồn tại trong cơ sở dữ liệu nên không thể tạo lại
2. Thanh toán không được liên kết với ID bệnh nhân
3. Thiếu cấu trúc phù hợp để liên kết thanh toán với bệnh nhân

## Giải pháp

### 1. Chạy script SQL sửa lỗi
Tôi đã tạo file `fix_relation_error.sql` để sửa lỗi. Script này sẽ:
- Kiểm tra bảng patients đã tồn tại và bỏ qua việc tạo nếu đã có
- Thêm cột patient_id vào bảng payments nếu chưa có
- Tạo foreign key liên kết payments với patients
- Thêm index để tăng hiệu suất truy vấn

### 2. Cập nhật patient_id cho thanh toán hiện có
Sau khi chạy script, bạn cần cập nhật các thanh toán hiện có với patient_id phù hợp:

```sql
-- Cập nhật payments với patient_id
UPDATE payments
SET
    patient_id = 'PAT-001', -- Thay bằng ID bệnh nhân thực tế
    updated_at = NOW()
WHERE 
    patient_id IS NULL AND
    -- Điều kiện để xác định thanh toán thuộc về bệnh nhân nào
    (
        -- Nếu bạn biết email người dùng đã thanh toán
        payment_email = 'email_benh_nhan@example.com'
        -- HOẶC nếu bạn biết order_code của thanh toán
        -- order_code IN ('1750004006508', '1749998502037')
    );
```

### 3. Sửa API để trả về tất cả các thanh toán
Đảm bảo API không lọc theo trạng thái mà trả về tất cả thanh toán:

```typescript
// Thay vì chỉ lấy completed/pending:
// .in('status', ['completed', 'pending'])

// Lấy tất cả thanh toán của bệnh nhân:
.eq('patient_id', patientId)
```

### 4. Tăng cường logging để debug
- Thêm logging chi tiết khi gọi API thanh toán
- Log ID bệnh nhân đang được sử dụng để tìm kiếm
- Kiểm tra cả SQL query được tạo ra

### Kiểm tra sau khi sửa
1. Đăng nhập vào tài khoản bệnh nhân
2. Thử thanh toán một dịch vụ
3. Kiểm tra lịch sử thanh toán xem có hiển thị đúng không

## Ghi chú bổ sung
- Đối với triển khai mới, hãy luôn kiểm tra bảng đã tồn tại trước khi tạo
- Bảng payments cần có cột patient_id để liên kết với bệnh nhân
- Đảm bảo cơ chế đồng bộ tự động hoạt động sau mỗi lần thanh toán 