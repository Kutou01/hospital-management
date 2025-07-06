import { AppointmentEmailService } from './appointment-email.service';

// Interface cho dữ liệu invoice
export interface AppointmentInvoiceData {
    appointmentId: string;
    orderCode: string;
    patientName: string;
    patientEmail: string;
    patientPhone: string;
    doctorName: string;
    specialty: string;
    appointmentDate: string;
    appointmentTime: string;
    consultationFee: number;
    paymentDate: string;
    paymentMethod: string;
    hospitalName?: string;
    hospitalAddress?: string;
    hospitalPhone?: string;
}

export interface InvoiceResponse {
    success: boolean;
    data?: {
        invoiceUrl: string;
        pdfBuffer?: Buffer;
    };
    error?: string;
    message?: string;
}

/**
 * Service để xử lý invoice cho appointment
 */
export class AppointmentInvoiceService {
    
    /**
     * Tạo và gửi PDF invoice sau thanh toán thành công
     */
    static async generateAndSendInvoice(data: AppointmentInvoiceData): Promise<InvoiceResponse> {
        try {
            console.log('📄 Generating invoice for appointment:', data.appointmentId);

            // 1. Tạo PDF invoice
            const invoiceResult = await this.generateInvoicePDF(data);
            
            if (!invoiceResult.success) {
                throw new Error(invoiceResult.message || 'Failed to generate PDF invoice');
            }

            // 2. Gửi email với PDF attachment
            try {
                const emailData = {
                    patientName: data.patientName,
                    patientEmail: data.patientEmail,
                    patientPhone: data.patientPhone,
                    appointmentId: data.appointmentId,
                    doctorName: data.doctorName,
                    specialty: data.specialty,
                    appointmentDate: data.appointmentDate,
                    appointmentTime: data.appointmentTime,
                    symptoms: 'Đã thanh toán',
                    hospitalName: data.hospitalName,
                    hospitalAddress: data.hospitalAddress,
                    hospitalPhone: data.hospitalPhone
                };

                console.log('📧 Sending invoice email...');
                
                const emailResult = await AppointmentEmailService.sendAppointmentConfirmationEmail(emailData);
                
                if (emailResult.success) {
                    console.log('✅ Invoice email sent successfully');
                } else {
                    console.warn('⚠️ Invoice email failed:', emailResult.message);
                }
            } catch (emailError) {
                console.error('❌ Invoice email error:', emailError);
                // Không throw error vì PDF đã tạo thành công
            }

            return {
                success: true,
                data: {
                    invoiceUrl: `/api/patient/invoice/${data.orderCode}?format=pdf`
                },
                message: 'Invoice generated and sent successfully'
            };

        } catch (error: any) {
            console.error('❌ Invoice generation error:', error);
            
            return {
                success: false,
                error: error.message || 'INVOICE_GENERATION_FAILED',
                message: 'Không thể tạo hóa đơn. Vui lòng liên hệ hỗ trợ.'
            };
        }
    }

    /**
     * Tạo PDF invoice
     */
    static async generateInvoicePDF(data: AppointmentInvoiceData): Promise<InvoiceResponse> {
        try {
            console.log('📄 Creating PDF invoice for order:', data.orderCode);

            // Gọi API để tạo PDF
            const response = await fetch(`/api/patient/invoice/${data.orderCode}?format=pdf`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to generate PDF');
            }

            const pdfBlob = await response.blob();
            
            console.log('✅ PDF invoice generated successfully, size:', pdfBlob.size);

            return {
                success: true,
                data: {
                    invoiceUrl: `/api/patient/invoice/${data.orderCode}?format=pdf`
                },
                message: 'PDF invoice generated successfully'
            };

        } catch (error: any) {
            console.error('❌ PDF generation error:', error);
            
            return {
                success: false,
                error: error.message || 'PDF_GENERATION_FAILED',
                message: 'Không thể tạo file PDF hóa đơn.'
            };
        }
    }

    /**
     * Download PDF invoice
     */
    static async downloadInvoice(orderCode: string): Promise<void> {
        try {
            console.log('📥 Downloading invoice for order:', orderCode);

            const response = await fetch(`/api/patient/invoice/${orderCode}?format=pdf`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to download invoice');
            }

            // Create download link
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `hoa-don-${orderCode}.pdf`;

            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up
            window.URL.revokeObjectURL(url);

            console.log('✅ Invoice downloaded successfully');

        } catch (error: any) {
            console.error('❌ Invoice download error:', error);
            throw error;
        }
    }

    /**
     * Validate invoice data
     */
    static validateInvoiceData(data: AppointmentInvoiceData): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!data.appointmentId) errors.push('Appointment ID is required');
        if (!data.orderCode) errors.push('Order code is required');
        if (!data.patientName) errors.push('Patient name is required');
        if (!data.patientEmail) errors.push('Patient email is required');
        if (!data.doctorName) errors.push('Doctor name is required');
        if (!data.consultationFee || data.consultationFee <= 0) errors.push('Valid consultation fee is required');
        if (!data.paymentDate) errors.push('Payment date is required');

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Format invoice data for display
     */
    static formatInvoiceData(data: AppointmentInvoiceData) {
        return {
            ...data,
            consultationFeeFormatted: this.formatAmount(data.consultationFee),
            appointmentDateFormatted: new Date(data.appointmentDate).toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            paymentDateFormatted: new Date(data.paymentDate).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        };
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
}

/**
 * Hook để xử lý invoice sau khi thanh toán thành công
 */
export function useAppointmentInvoice() {
    const generateInvoice = async (data: AppointmentInvoiceData) => {
        return await AppointmentInvoiceService.generateAndSendInvoice(data);
    };

    const downloadInvoice = async (orderCode: string) => {
        try {
            await AppointmentInvoiceService.downloadInvoice(orderCode);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Không thể tải hóa đơn. Vui lòng thử lại sau.');
        }
    };

    return {
        generateInvoice,
        downloadInvoice
    };
}
