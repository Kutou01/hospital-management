import emailjs from '@emailjs/browser';

// Cấu hình EmailJS từ biến môi trường
const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '';
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || '';
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '';

// Interface cho dữ liệu email appointment
export interface AppointmentEmailData {
    patientName: string;
    patientEmail: string;
    patientPhone: string;
    appointmentId: string;
    doctorName: string;
    specialty: string;
    appointmentDate: string;
    appointmentTime: string;
    symptoms: string;
    hospitalName?: string;
    hospitalAddress?: string;
    hospitalPhone?: string;
}

// Interface cho response
export interface EmailResponse {
    success: boolean;
    message: string;
    error?: string;
}

/**
 * Service để gửi email xác nhận đặt lịch khám
 */
export class AppointmentEmailService {
    
    /**
     * Khởi tạo EmailJS với public key
     */
    static init() {
        if (EMAILJS_PUBLIC_KEY) {
            emailjs.init(EMAILJS_PUBLIC_KEY);
            console.log('✅ EmailJS initialized successfully for appointments');
        } else {
            console.warn('⚠️ EmailJS public key not found in environment variables');
        }
    }

    /**
     * Kiểm tra cấu hình EmailJS
     */
    static checkConfiguration(): boolean {
        return !!(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);
    }

    /**
     * Gửi email xác nhận đặt lịch khám
     */
    static async sendAppointmentConfirmationEmail(data: AppointmentEmailData): Promise<EmailResponse> {
        try {
            // Kiểm tra môi trường - EmailJS chỉ hoạt động trong browser
            if (typeof window === 'undefined') {
                console.warn('⚠️ EmailJS chỉ hoạt động trong browser, không thể gửi từ server-side');
                
                // Fallback: Gửi email từ server-side bằng cách gọi API route
                try {
                    const response = await fetch('/api/email/send-appointment-confirmation', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data)
                    });

                    if (response.ok) {
                        return {
                            success: true,
                            message: 'Email đã được gửi thành công từ server'
                        };
                    }
                } catch (serverError) {
                    console.error('Server-side email fallback failed:', serverError);
                }

                return {
                    success: false,
                    message: 'Không thể gửi email',
                    error: 'EMAIL_SEND_FAILED'
                };
            }

            // Kiểm tra cấu hình
            if (!this.checkConfiguration()) {
                console.error('❌ EmailJS configuration missing');
                return {
                    success: false,
                    message: 'Cấu hình email chưa được thiết lập',
                    error: 'MISSING_CONFIG'
                };
            }

            // Khởi tạo EmailJS nếu chưa được khởi tạo
            emailjs.init(EMAILJS_PUBLIC_KEY);

            // Chuẩn bị dữ liệu template - PHẢI MATCH với EmailJS template variables
            const templateParams = {
                // Thông tin người nhận - QUAN TRỌNG cho EmailJS
                to_email: data.patientEmail,
                to_name: data.patientName,

                // Thông tin bệnh nhân
                patient_name: data.patientName,
                patient_phone: data.patientPhone,

                // Thông tin lịch khám - MATCH với template
                order_code: data.appointmentId, // Mã đơn hàng
                appointment_id: data.appointmentId,
                doctor_name: data.doctorName,
                specialty: data.specialty,
                appointment_date: new Date(data.appointmentDate).toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                appointment_time: data.appointmentTime,
                symptoms: data.symptoms,

                // Thông tin thanh toán
                payment_date: new Date().toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                record_id: data.appointmentId, // Mã hồ sơ
                amount: '200,000', // Số tiền formatted

                // Thông tin bệnh viện
                hospital_name: data.hospitalName || 'Bệnh viện Đa khoa',
                hospital_address: data.hospitalAddress || '123 Đường ABC, Quận XYZ, TP.HCM',
                hospital_phone: data.hospitalPhone || '(028) 1234 5678',

                // Thông tin gửi email
                from_name: data.hospitalName || 'Bệnh viện Đa khoa',
                reply_to: 'support@hospital.com',

                // Thời gian gửi
                sent_time: new Date().toLocaleString('vi-VN'),

                // Lời nhắn
                message: `Xác nhận đặt lịch khám thành công cho ${data.patientName}`,

                // Lưu ý quan trọng
                important_notes: `
• Vui lòng đến trước giờ hẹn 15 phút
• Mang theo CMND/CCCD và thẻ BHYT (nếu có)
• Liên hệ hotline nếu cần thay đổi lịch hẹn
• Có thể hủy lịch trước 24h mà không mất phí
                `.trim()
            };

            console.log('📧 [AppointmentEmailService] Sending appointment confirmation email:', {
                to: data.patientEmail,
                appointmentId: data.appointmentId,
                doctorName: data.doctorName,
                appointmentDate: data.appointmentDate
            });

            // Gửi email
            const response = await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                templateParams
            );

            console.log('✅ [AppointmentEmailService] Email sent successfully:', response);

            return {
                success: true,
                message: 'Email xác nhận đặt lịch đã được gửi thành công'
            };

        } catch (error: any) {
            console.error('❌ [AppointmentEmailService] Error sending email:', error);
            
            return {
                success: false,
                message: 'Không thể gửi email xác nhận',
                error: error.message || 'UNKNOWN_ERROR'
            };
        }
    }

    /**
     * Gửi email nhắc nhở trước 24h
     */
    static async sendAppointmentReminderEmail(data: AppointmentEmailData): Promise<EmailResponse> {
        // Tương tự như sendAppointmentConfirmationEmail nhưng với template khác
        // Có thể implement sau nếu cần
        return {
            success: false,
            message: 'Reminder email feature not implemented yet'
        };
    }
}

// Khởi tạo EmailJS khi import module
if (typeof window !== 'undefined') {
    AppointmentEmailService.init();
}
