import { apiClient } from "./client";

export interface PaymentResponse {
    success: boolean;
    data?: any;
    error?: {
        code: string;
        message: string;
    };
}

export interface CreatePaymentParams {
    amount: number;
    description: string;
    appointmentId?: string;
    doctorName?: string;
    redirectUrl?: string;
}

/**
 * API helper để tương tác với PayOS payment gateway
 */
export const paymentApi = {
    /**
     * Create a new payment request
     */
    async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
        try {
            const response = await apiClient.post('/api/payment/create', params);
            return {
                success: true,
                data: response.data
            };
        } catch (error: any) {
            console.error('API Error - Create Payment:', error);
            return {
                success: false,
                error: {
                    code: error.code || 'PAYMENT_CREATE_ERROR',
                    message: error.message || 'Failed to create payment'
                }
            };
        }
    },

    /**
     * Verify a payment's status
     */
    async verifyPayment(orderCode: string): Promise<PaymentResponse> {
        try {
            const response = await apiClient.get(`/api/payment/verify?orderCode=${orderCode}`);
            return {
                success: true,
                data: response.data
            };
        } catch (error: any) {
            console.error('API Error - Verify Payment:', error);
            return {
                success: false,
                error: {
                    code: error.code || 'PAYMENT_VERIFY_ERROR',
                    message: error.message || 'Failed to verify payment'
                }
            };
        }
    },

    /**
     * Process payment callback (for webhook handling)
     */
    async handlePaymentCallback(callbackData: any): Promise<PaymentResponse> {
        try {
            const response = await apiClient.post('/api/payment/callback', callbackData);
            return {
                success: true,
                data: response.data
            };
        } catch (error: any) {
            console.error('API Error - Payment Callback:', error);
            return {
                success: false,
                error: {
                    code: error.code || 'PAYMENT_CALLBACK_ERROR',
                    message: error.message || 'Failed to process payment callback'
                }
            };
        }
    }
};