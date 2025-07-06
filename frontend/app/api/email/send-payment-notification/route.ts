import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Create transporter (configure with your email service)
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: data.patientEmail,
      subject: 'Xác nhận thanh toán thành công',
      html: `
        <h2>Thanh toán thành công</h2>
        <p>Xin chào ${data.patientName},</p>
        <p>Thanh toán của bạn đã được xử lý thành công:</p>
        <ul>
          <li>Mã đơn hàng: ${data.orderCode}</li>
          <li>Số tiền: ${data.amount.toLocaleString('vi-VN')} VNĐ</li>
          <li>Bác sĩ: ${data.doctorName}</li>
          <li>Ngày thanh toán: ${new Date(data.paymentDate).toLocaleDateString('vi-VN')}</li>
        </ul>
        <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi.</p>
      `
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}