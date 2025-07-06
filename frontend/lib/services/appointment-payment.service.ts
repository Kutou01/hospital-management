// Service để tạo payment link cho appointment
export interface AppointmentPaymentData {
    appointmentId: string;
    patientName: string;
    patientEmail: string;
    patientPhone: string;
    doctorName: string;
    specialty: string;
    appointmentDate: string;
    appointmentTime: string;
    consultationFee: number;
    description?: string;
}

export interface PaymentResponse {
    success: boolean;
    data?: {
        orderCode: string;
        checkoutUrl: string;
        qrCode?: string;
    };
    error?: string;
    message?: string;
}

/**
 * Service để xử lý thanh toán cho appointment
 */
export class AppointmentPaymentService {
    
    /**
     * Tạo payment link cho appointment
     */
    static async createAppointmentPayment(data: AppointmentPaymentData): Promise<PaymentResponse> {
        try {
            console.log('💳 Creating payment for appointment:', data.appointmentId);

            // Chuẩn bị dữ liệu payment
            const paymentData = {
                amount: data.consultationFee,
                description: data.description || `Thanh toán khám bệnh - ${data.appointmentId}`,
                appointmentId: data.appointmentId,
                doctorName: data.doctorName,
                patientName: data.patientName,
                patientEmail: data.patientEmail,
                patientPhone: data.patientPhone,
                redirectUrl: `/payment/success?appointmentId=${data.appointmentId}`
            };

            console.log('💳 Payment data:', paymentData);

            // Gọi API tạo payment
            const response = await fetch('/api/payment/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paymentData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error?.message || 'Failed to create payment');
            }

            if (result.success && result.data) {
                console.log('✅ Payment created successfully:', result.data.orderCode);
                
                return {
                    success: true,
                    data: {
                        orderCode: result.data.orderCode,
                        checkoutUrl: result.data.checkoutUrl,
                        qrCode: result.data.qrCode
                    }
                };
            } else {
                throw new Error(result.error?.message || 'Payment creation failed');
            }

        } catch (error: any) {
            console.error('❌ Payment creation error:', error);
            
            return {
                success: false,
                error: error.message || 'PAYMENT_CREATION_FAILED',
                message: 'Không thể tạo link thanh toán. Vui lòng thử lại.'
            };
        }
    }

    /**
     * Kiểm tra trạng thái payment
     */
    static async checkPaymentStatus(orderCode: string): Promise<PaymentResponse> {
        try {
            console.log('🔍 Checking payment status for:', orderCode);

            const response = await fetch(`/api/payment/query?orderCode=${orderCode}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error?.message || 'Failed to check payment status');
            }

            return {
                success: true,
                data: result.data,
                message: result.message
            };

        } catch (error: any) {
            console.error('❌ Payment status check error:', error);
            
            return {
                success: false,
                error: error.message || 'PAYMENT_STATUS_CHECK_FAILED',
                message: 'Không thể kiểm tra trạng thái thanh toán.'
            };
        }
    }

    /**
     * Format số tiền VNĐ
     */
    static formatAmount(amount: number): string {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    /**
     * Tạo description cho payment
     */
    static createPaymentDescription(appointmentId: string, doctorName: string, patientName: string): string {
        return `Thanh toán khám bệnh - Mã lịch: ${appointmentId} - BS ${doctorName} - BN ${patientName}`;
    }

    /**
     * Validate payment data
     */
    static validatePaymentData(data: AppointmentPaymentData): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!data.appointmentId) errors.push('Appointment ID is required');
        if (!data.patientName) errors.push('Patient name is required');
        if (!data.patientEmail) errors.push('Patient email is required');
        if (!data.doctorName) errors.push('Doctor name is required');
        if (!data.consultationFee || data.consultationFee <= 0) errors.push('Valid consultation fee is required');

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

/**
 * Default consultation fees by specialty
 */
export const DEFAULT_CONSULTATION_FEES = {
    'Nội Tổng Hợp': 200000,
    'Nhi Khoa': 250000,
    'Tim Mạch': 300000,
    'Tiêu Hóa': 250000,
    'Tai Mũi Họng': 200000,
    'Da Liễu': 200000,
    'Thần Kinh': 300000,
    'Chấn Thương Chỉnh Hình': 250000,
    'Phụ Sản': 250000,
    'Mắt': 200000,
    'default': 200000
};

/**
 * Get consultation fee by specialty
 */
export function getConsultationFee(specialty: string): number {
    return DEFAULT_CONSULTATION_FEES[specialty as keyof typeof DEFAULT_CONSULTATION_FEES] || DEFAULT_CONSULTATION_FEES.default;
}
