import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Mock Email API for Appointment Confirmation
 * This is a placeholder that simulates sending confirmation emails
 */

interface EmailRequest {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  appointmentId: string;
  doctorName: string;
  specialty: string;
  appointmentDate: string;
  appointmentTime: string;
  symptoms: string;
  hospitalName: string;
  hospitalAddress: string;
  hospitalPhone: string;
}

interface EmailResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EmailResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const emailData: EmailRequest = req.body;
    
    console.log('📧 Mock Email Service - Sending appointment confirmation:', {
      to: emailData.patientEmail,
      patient: emailData.patientName,
      appointmentId: emailData.appointmentId,
      doctor: emailData.doctorName,
      date: emailData.appointmentDate,
      time: emailData.appointmentTime
    });

    // Validate required fields
    const requiredFields = [
      'patientName', 'patientEmail', 'appointmentId', 
      'doctorName', 'appointmentDate', 'appointmentTime'
    ];
    
    for (const field of requiredFields) {
      if (!emailData[field as keyof EmailRequest]) {
        return res.status(400).json({
          success: false,
          error: `Missing required field: ${field}`
        });
      }
    }

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock email content
    const emailContent = `
    Kính chào ${emailData.patientName},

    Cảm ơn bạn đã đặt lịch khám tại ${emailData.hospitalName || 'Bệnh viện Đa khoa'}.

    THÔNG TIN LỊCH HẸN:
    - Mã lịch hẹn: ${emailData.appointmentId}
    - Bác sĩ: ${emailData.doctorName}
    - Chuyên khoa: ${emailData.specialty}
    - Ngày khám: ${emailData.appointmentDate}
    - Giờ khám: ${emailData.appointmentTime}
    - Triệu chứng: ${emailData.symptoms}

    THÔNG TIN LIÊN HỆ:
    - Địa chỉ: ${emailData.hospitalAddress || '123 Đường ABC, Quận XYZ, TP.HCM'}
    - Điện thoại: ${emailData.hospitalPhone || '(028) 1234 5678'}

    Vui lòng đến đúng giờ và mang theo giấy tờ tùy thân.

    Trân trọng,
    ${emailData.hospitalName || 'Bệnh viện Đa khoa'}
    `;

    console.log('✅ Mock email sent successfully:', {
      to: emailData.patientEmail,
      subject: `Xác nhận lịch khám - ${emailData.appointmentId}`,
      contentLength: emailContent.length
    });

    // In a real implementation, you would use a service like:
    // - EmailJS (client-side)
    // - SendGrid
    // - AWS SES
    // - Nodemailer with SMTP
    // - Resend
    // etc.

    return res.json({
      success: true,
      message: 'Email xác nhận đã được gửi thành công (mock)'
    });

  } catch (error: any) {
    console.error('❌ Mock email service error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send confirmation email',
      message: error.message
    });
  }
}

// Example of how to integrate with EmailJS (client-side service)
/*
import emailjs from '@emailjs/nodejs';

// Initialize EmailJS
emailjs.init({
  publicKey: process.env.EMAILJS_PUBLIC_KEY,
  privateKey: process.env.EMAILJS_PRIVATE_KEY,
});

// Send email using EmailJS
const emailResult = await emailjs.send(
  process.env.EMAILJS_SERVICE_ID!,
  process.env.EMAILJS_TEMPLATE_ID!,
  {
    to_email: emailData.patientEmail,
    to_name: emailData.patientName,
    appointment_id: emailData.appointmentId,
    doctor_name: emailData.doctorName,
    specialty: emailData.specialty,
    appointment_date: emailData.appointmentDate,
    appointment_time: emailData.appointmentTime,
    symptoms: emailData.symptoms,
    hospital_name: emailData.hospitalName,
    hospital_address: emailData.hospitalAddress,
    hospital_phone: emailData.hospitalPhone
  }
);
*/

// Example of how to integrate with SendGrid
/*
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const msg = {
  to: emailData.patientEmail,
  from: process.env.FROM_EMAIL!,
  subject: `Xác nhận lịch khám - ${emailData.appointmentId}`,
  text: emailContent,
  html: emailContent.replace(/\n/g, '<br>')
};

await sgMail.send(msg);
*/
