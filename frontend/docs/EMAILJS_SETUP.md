# Hướng dẫn cấu hình EmailJS cho thông báo thanh toán

## Tổng quan
EmailJS cho phép gửi email trực tiếp từ frontend mà không cần backend email server. Hệ thống sẽ tự động gửi email thông báo cho bệnh nhân khi thanh toán thành công.

## Bước 1: Tạo tài khoản EmailJS

1. Truy cập [https://www.emailjs.com/](https://www.emailjs.com/)
2. Đăng ký tài khoản miễn phí
3. Xác nhận email đăng ký

## Bước 2: Tạo Email Service

1. Đăng nhập vào EmailJS Dashboard
2. Chọn **Email Services** từ menu bên trái
3. Nhấn **Add New Service**
4. Chọn nhà cung cấp email (Gmail, Outlook, Yahoo, etc.)
5. Làm theo hướng dẫn để kết nối tài khoản email
6. Lưu lại **Service ID** (ví dụ: `service_abc123`)

## Bước 3: Tạo Email Template

1. Chọn **Email Templates** từ menu bên trái
2. Nhấn **Create New Template**
3. Sử dụng template sau:

### Template Settings:
- **Template Name**: `Payment Success Notification`
- **Subject**: `Xác nhận thanh toán thành công - {{order_code}}`
- **From Name**: `{{hospital_name}}`
- **From Email**: `noreply@hospital.com`
- **Reply To**: `support@hospital.com`

### Template Content (HTML):
```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xác nhận thanh toán thành công</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #4CAF50;
            margin: 0;
            font-size: 28px;
        }
        .success-icon {
            font-size: 48px;
            color: #4CAF50;
            margin-bottom: 10px;
        }
        .payment-details {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #4CAF50;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 5px 0;
            border-bottom: 1px solid #eee;
        }
        .detail-row:last-child {
            border-bottom: none;
            font-weight: bold;
            font-size: 16px;
        }
        .label {
            font-weight: 600;
            color: #555;
        }
        .value {
            color: #333;
        }
        .amount {
            color: #4CAF50;
            font-weight: bold;
            font-size: 18px;
        }
        .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
        }
        .hospital-info {
            background-color: #e8f5e8;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
        }
        .note {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="success-icon">✅</div>
            <h1>Thanh toán thành công!</h1>
            <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi</p>
        </div>

        <div class="content">
            <p>Xin chào <strong>{{patient_name}}</strong>,</p>
            
            <p>Chúng tôi xác nhận rằng khoản thanh toán của bạn đã được xử lý thành công. Dưới đây là chi tiết giao dịch:</p>

            <div class="payment-details">
                <div class="detail-row">
                    <span class="label">Mã đơn hàng:</span>
                    <span class="value">{{order_code}}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Bác sĩ:</span>
                    <span class="value">{{doctor_name}}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Ngày thanh toán:</span>
                    <span class="value">{{payment_date}}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Mã hồ sơ:</span>
                    <span class="value">{{record_id}}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Số tiền:</span>
                    <span class="value amount">{{amount}} VNĐ</span>
                </div>
            </div>

            <div class="note">
                <strong>Lưu ý:</strong> Vui lòng lưu giữ email này làm bằng chứng thanh toán. Bạn có thể sử dụng mã đơn hàng để tra cứu giao dịch trong hệ thống.
            </div>

            <p>Nếu bạn có bất kỳ câu hỏi nào về giao dịch này, vui lòng liên hệ với chúng tôi qua thông tin bên dưới.</p>
        </div>

        <div class="hospital-info">
            <h3 style="margin-top: 0; color: #4CAF50;">{{hospital_name}}</h3>
            <p style="margin: 5px 0;"><strong>Địa chỉ:</strong> {{hospital_address}}</p>
            <p style="margin: 5px 0;"><strong>Điện thoại:</strong> {{hospital_phone}}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> support@hospital.com</p>
        </div>

        <div class="footer">
            <p>Email này được gửi tự động từ hệ thống quản lý bệnh viện.</p>
            <p>Vui lòng không trả lời email này.</p>
            <p style="margin-top: 15px; font-size: 12px; color: #999;">
                © 2024 {{hospital_name}}. Tất cả quyền được bảo lưu.
            </p>
        </div>
    </div>
</body>
</html>
```

4. Lưu template và ghi nhận **Template ID** (ví dụ: `template_xyz789`)

## Bước 4: Lấy Public Key

1. Chọn **Account** từ menu bên trái
2. Trong phần **API Keys**, copy **Public Key**
3. Lưu lại **Public Key** (ví dụ: `user_abcdefghijk`)

## Bước 5: Cập nhật cấu hình

Cập nhật file `.env.local` với thông tin vừa lấy được:

```env
# EmailJS Configuration
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_abc123
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_xyz789
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=user_abcdefghijk
```

## Bước 6: Test thử nghiệm

1. Khởi động lại ứng dụng: `npm run dev`
2. Thực hiện một giao dịch thanh toán test
3. Kiểm tra email trong hộp thư của bệnh nhân
4. Kiểm tra console log để debug nếu cần

## Giới hạn miễn phí

- **EmailJS Free Plan**: 200 emails/tháng
- **Nâng cấp**: Có thể nâng cấp lên gói trả phí để tăng giới hạn

## Troubleshooting

### Lỗi thường gặp:

1. **Email không được gửi**:
   - Kiểm tra cấu hình Service ID, Template ID, Public Key
   - Kiểm tra console log để xem lỗi chi tiết

2. **Template không hiển thị đúng**:
   - Kiểm tra các biến template có đúng tên không
   - Kiểm tra HTML template có lỗi syntax không

3. **Email vào spam**:
   - Cấu hình SPF, DKIM cho domain email
   - Sử dụng email service uy tín (Gmail, Outlook)

## Bảo mật

- **Không bao giờ** để lộ Private Key trong frontend
- Chỉ sử dụng Public Key trong client-side code
- Cấu hình domain restrictions trong EmailJS dashboard
- Giới hạn rate limiting để tránh spam

## Liên hệ hỗ trợ

Nếu gặp vấn đề trong quá trình cấu hình, vui lòng liên hệ team phát triển.
