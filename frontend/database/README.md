# Database Scripts

Các script SQL để quản lý và bảo trì cơ sở dữ liệu của hệ thống quản lý bệnh viện.

## Danh sách script

1. **add-unique-constraint.sql**
   - Thêm unique constraint cho `order_code` trong bảng `payments`
   - Xóa các bản ghi trùng lặp (giữ lại bản ghi mới nhất)
   - Tạo các index cần thiết để tăng tốc độ truy vấn

2. **payment-patient-link.sql**
   - Liên kết payments với patients thông qua medical_records
   - Tạo foreign key từ payments.patient_id đến patients.patient_id
   - Cập nhật patient_id cho payments chưa có, thông qua medical_records
   - Tạo các index quan trọng
   - Kiểm tra tính nhất quán dữ liệu

3. **fix-payment-patient-sync.sql**
   - Khắc phục lỗi đồng bộ thanh toán cho bệnh nhân cụ thể
   - Kiểm tra và cập nhật thanh toán cho email 'namprophunong006@gmail.com'
   - Liên kết thanh toán dựa trên thông tin mô tả và record_id
   - Thống kê kết quả sau khi cập nhật

4. **auto-payment-link-trigger.sql**
   - Tạo trigger tự động liên kết thanh toán với bệnh nhân
   - Tự động cập nhật patient_id khi có thanh toán mới
   - Tự động cập nhật khi thanh toán chuyển sang trạng thái completed
   - Tìm bệnh nhân dựa trên record_id, email hoặc số điện thoại trong description

5. **check-unlinked-payments.sql**
   - Kiểm tra chi tiết các thanh toán chưa được liên kết
   - Tìm các liên kết tiềm năng qua medical_records
   - Tìm các liên kết tiềm năng qua email trong description
   - Tìm các liên kết tiềm năng qua số điện thoại trong description
   - Mẫu câu lệnh để liên kết thủ công các thanh toán còn lại

6. **auto-create-profile-trigger.sql**
   - Tạo trigger tự động tạo hồ sơ người dùng và bệnh nhân khi đăng nhập
   - Tự động tạo hồ sơ trong bảng profiles nếu chưa có
   - Tự động tạo hồ sơ bệnh nhân trong bảng patients nếu chưa có
   - Tự động đồng bộ thanh toán cho bệnh nhân
   - Tạo API endpoint để tự động tạo hồ sơ từ frontend

## Hướng dẫn sử dụng

1. Đăng nhập vào [Supabase Dashboard](https://app.supabase.io/)
2. Chọn dự án của bạn
3. Vào phần "SQL Editor"
4. Copy nội dung của script cần chạy
5. Dán vào SQL Editor và nhấn "Run"

## Lưu ý quan trọng

- Luôn sao lưu dữ liệu trước khi chạy các script thay đổi cấu trúc bảng
- Kiểm tra kết quả sau khi chạy script để đảm bảo dữ liệu được cập nhật đúng
- Các script đã được thiết kế để chạy an toàn và có kiểm tra điều kiện trước khi thực hiện các thay đổi lớn 