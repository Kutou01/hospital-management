import emailjs from '@emailjs/browser';

// Cấu hình EmailJS từ biến môi trường
const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '';
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || '';
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '';

// Interface cho dữ liệu email thanh toán
export interface PaymentEmailData {
    patientName: string;
    patientEmail: string;
    orderCode: string;
    amount: number;
    doctorName: string;
    paymentDate: string;
    recordId?: string;
}

// Interface cho response
export interface EmailResponse {
    success: boolean;
    message: string;
    error?: string;
}

/**
 * Service để gửi email thông báo thanh toán thành công
 */
export class EmailService {
    
    /**
     * Khởi tạo EmailJS với public key
     */
    static init() {
        if (EMAILJS_PUBLIC_KEY) {
            emailjs.init(EMAILJS_PUBLIC_KEY);
            console.log('✅ EmailJS initialized successfully');
        } else {
            console.warn('⚠️ EmailJS public key not found in environment variables');
        }
    }

    /**
     * Gửi email thông báo thanh toán thành công
     */
    static async sendPaymentSuccessEmail(data: PaymentEmailData): Promise<EmailResponse> {
        try {
            // Kiểm tra môi trường - EmailJS chỉ hoạt động trong browser
            if (typeof window === 'undefined') {
                console.warn('⚠️ EmailJS chỉ hoạt động trong browser, không thể gửi từ server-side');
                return {
                    success: false,
                    message: 'EmailJS chỉ hoạt động trong browser',
                    error: 'SERVER_SIDE_NOT_SUPPORTED'
                };
            }

            // Kiểm tra cấu hình
            if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
                console.error('❌ EmailJS configuration missing');
                return {
                    success: false,
                    message: 'Cấu hình email chưa được thiết lập',
                    error: 'MISSING_CONFIG'
                };
            }

            // Khởi tạo EmailJS nếu chưa được khởi tạo
            emailjs.init(EMAILJS_PUBLIC_KEY);

            // Chuẩn bị dữ liệu template
            const templateParams = {
                // Thông tin người nhận - QUAN TRỌNG cho EmailJS
                to_email: data.patientEmail,
                to_name: data.patientName,

                // Thông tin bệnh nhân
                patient_name: data.patientName,

                // Thông tin giao dịch
                order_code: data.orderCode,
                amount: data.amount.toLocaleString('vi-VN'),
                doctor_name: data.doctorName,
                payment_date: new Date(data.paymentDate).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                record_id: data.recordId || 'N/A',

                // Thông tin bệnh viện
                hospital_name: 'Bệnh viện Đa khoa',
                hospital_address: '123 Đường ABC, Quận XYZ, TP.HCM',
                hospital_phone: '(028) 1234 5678',

                // Thông tin gửi email (có thể cần thiết cho một số template)
                from_name: 'Bệnh viện Đa khoa',
                reply_to: 'support@hospital.com'
            };

            console.log('📧 [EmailService] Sending payment success email:', {
                to: data.patientEmail,
                orderCode: data.orderCode,
                amount: data.amount
            });

            // Gửi email
            const response = await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                templateParams
            );

            console.log('✅ [EmailService] Email sent successfully:', response);

            return {
                success: true,
                message: 'Email đã được gửi thành công'
            };

        } catch (error: any) {
            console.error('❌ [EmailService] Failed to send email:', error);
            
            let errorMessage = 'Không thể gửi email thông báo';
            
            if (error.status === 400) {
                errorMessage = 'Thông tin email không hợp lệ';
            } else if (error.status === 401) {
                errorMessage = 'Lỗi xác thực email service';
            } else if (error.status === 403) {
                errorMessage = 'Không có quyền gửi email';
            } else if (error.status === 404) {
                errorMessage = 'Template email không tồn tại';
            } else if (error.status >= 500) {
                errorMessage = 'Lỗi server email service';
            }

            return {
                success: false,
                message: errorMessage,
                error: error.message || 'UNKNOWN_ERROR'
            };
        }
    }

    /**
     * Kiểm tra cấu hình EmailJS
     */
    static checkConfiguration(): boolean {
        const isConfigured = !!(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);
        
        if (!isConfigured) {
            console.warn('⚠️ EmailJS configuration incomplete:', {
                serviceId: !!EMAILJS_SERVICE_ID,
                templateId: !!EMAILJS_TEMPLATE_ID,
                publicKey: !!EMAILJS_PUBLIC_KEY
            });
        }
        
        return isConfigured;
    }
}

// Khởi tạo EmailJS khi import module
if (typeof window !== 'undefined') {
    EmailService.init();
}
