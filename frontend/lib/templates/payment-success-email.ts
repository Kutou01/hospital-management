/**
 * Template email thông báo thanh toán thành công
 * Sử dụng cho EmailJS template
 */

export const PAYMENT_SUCCESS_EMAIL_TEMPLATE = `
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
        .content {
            margin-bottom: 30px;
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
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 0;
            font-weight: bold;
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
`;

/**
 * Template text đơn giản cho email (fallback)
 */
export const PAYMENT_SUCCESS_TEXT_TEMPLATE = `
Xin chào {{patient_name}},

Chúng tôi xác nhận rằng khoản thanh toán của bạn đã được xử lý thành công.

Chi tiết giao dịch:
- Mã đơn hàng: {{order_code}}
- Bác sĩ: {{doctor_name}}
- Ngày thanh toán: {{payment_date}}
- Mã hồ sơ: {{record_id}}
- Số tiền: {{amount}} VNĐ

Vui lòng lưu giữ email này làm bằng chứng thanh toán.

Nếu có câu hỏi, vui lòng liên hệ:
{{hospital_name}}
{{hospital_address}}
{{hospital_phone}}

Trân trọng,
Đội ngũ {{hospital_name}}
`;

/**
 * Cấu hình mặc định cho EmailJS template
 */
export const EMAIL_TEMPLATE_CONFIG = {
    subject: 'Xác nhận thanh toán thành công - {{order_code}}',
    from_name: '{{hospital_name}}',
    from_email: 'noreply@hospital.com',
    reply_to: 'support@hospital.com'
};
