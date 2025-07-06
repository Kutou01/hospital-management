/**
 * Enhanced PayOS Payment Service
 * Improved error handling, retry logic, and fallback mechanisms
 */

import axios, { AxiosError } from 'axios';
import crypto from 'crypto';

// PayOS Configuration
const PAYOS_CONFIG = {
  CLIENT_ID: process.env.PAYOS_CLIENT_ID || '',
  API_KEY: process.env.PAYOS_API_KEY || '',
  CHECKSUM_KEY: process.env.PAYOS_CHECKSUM_KEY || '',
  API_URL: process.env.PAYOS_API_URL || 'https://api-merchant.payos.vn/v2/payment-requests',
  WEBHOOK_URL: process.env.PAYOS_WEBHOOK_URL || '',
  RETURN_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  CANCEL_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
};

// Interfaces
export interface PayOSPaymentRequest {
  appointmentId: string;
  amount: number;
  patientInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  serviceInfo: {
    specialty: string;
    doctorName: string;
    date: string;
    time: string;
    description?: string;
  };
}

export interface PayOSPaymentResponse {
  success: boolean;
  paymentUrl?: string;
  orderCode?: string;
  error?: string;
  fallbackUsed?: boolean;
}

export interface PayOSWebhookData {
  code: string;
  desc: string;
  data: {
    orderCode: string;
    amount: number;
    description: string;
    accountNumber?: string;
    reference?: string;
    transactionDateTime?: string;
    currency?: string;
    paymentLinkId?: string;
    status?: string;
  };
  signature?: string;
}

export class EnhancedPayOSService {
  private static instance: EnhancedPayOSService;
  private retryCount = 3;
  private retryDelay = 1000; // 1 second

  private constructor() {}

  public static getInstance(): EnhancedPayOSService {
    if (!EnhancedPayOSService.instance) {
      EnhancedPayOSService.instance = new EnhancedPayOSService();
    }
    return EnhancedPayOSService.instance;
  }

  /**
   * Check if PayOS is properly configured
   */
  public isConfigured(): boolean {
    return !!(PAYOS_CONFIG.CLIENT_ID && PAYOS_CONFIG.API_KEY && PAYOS_CONFIG.CHECKSUM_KEY);
  }

  /**
   * Generate order code for PayOS
   */
  private generateOrderCode(appointmentId: string): string {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORDER${timestamp}${random}`;
  }

  /**
   * Calculate PayOS checksum
   */
  private calculateChecksum(data: any): string {
    try {
      const sortedKeys = Object.keys(data).sort();
      const queryString = sortedKeys
        .map(key => `${key}=${data[key]}`)
        .join('&');
      
      return crypto
        .createHmac('sha256', PAYOS_CONFIG.CHECKSUM_KEY)
        .update(queryString)
        .digest('hex');
    } catch (error) {
      console.error('❌ Error calculating checksum:', error);
      return '';
    }
  }

  /**
   * Create payment with retry logic
   */
  public async createPayment(request: PayOSPaymentRequest): Promise<PayOSPaymentResponse> {
    console.log('🔄 [PayOS] Creating payment for appointment:', request.appointmentId);

    // Check configuration
    if (!this.isConfigured()) {
      console.warn('⚠️ [PayOS] Not configured, using fallback');
      return this.createFallbackPayment(request);
    }

    // Generate order code
    const orderCode = this.generateOrderCode(request.appointmentId);

    // Prepare payment data
    const paymentData = {
      orderCode: orderCode,
      amount: request.amount,
      description: `Khám ${request.serviceInfo.specialty} - BS ${request.serviceInfo.doctorName}`,
      items: [{
        name: `Khám ${request.serviceInfo.specialty}`,
        quantity: 1,
        price: request.amount
      }],
      returnUrl: `${PAYOS_CONFIG.RETURN_URL}/payment/success?appointmentId=${request.appointmentId}&orderCode=${orderCode}`,
      cancelUrl: `${PAYOS_CONFIG.CANCEL_URL}/payment/cancel?appointmentId=${request.appointmentId}&orderCode=${orderCode}`,
      buyerName: request.patientInfo.name,
      buyerPhone: request.patientInfo.phone,
      buyerEmail: request.patientInfo.email || '',
      expiredAt: Math.floor(Date.now() / 1000) + (30 * 60) // 30 minutes
    };

    // Calculate signature
    const signature = this.calculateChecksum(paymentData);

    // Try to create payment with retry
    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        console.log(`🔄 [PayOS] Attempt ${attempt}/${this.retryCount} for order: ${orderCode}`);

        const response = await axios({
          method: 'POST',
          url: PAYOS_CONFIG.API_URL,
          headers: {
            'Content-Type': 'application/json',
            'x-client-id': PAYOS_CONFIG.CLIENT_ID,
            'x-api-key': PAYOS_CONFIG.API_KEY
          },
          data: {
            ...paymentData,
            signature: signature
          },
          timeout: 10000 // 10 seconds timeout
        });

        console.log(`📋 [PayOS] Response status: ${response.status}, code: ${response.data?.code}`);

        if (response.status === 200 && response.data?.code === '00') {
          console.log('✅ [PayOS] Payment created successfully');
          return {
            success: true,
            paymentUrl: response.data.data.checkoutUrl,
            orderCode: orderCode
          };
        } else {
          throw new Error(`PayOS API error: ${response.data?.desc || 'Unknown error'}`);
        }

      } catch (error) {
        console.error(`❌ [PayOS] Attempt ${attempt} failed:`, error);

        if (attempt === this.retryCount) {
          console.warn('⚠️ [PayOS] All attempts failed, using fallback');
          return this.createFallbackPayment(request, orderCode);
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }

    // This should never be reached, but just in case
    return this.createFallbackPayment(request, orderCode);
  }

  /**
   * Create fallback payment (mock payment for testing)
   */
  private createFallbackPayment(request: PayOSPaymentRequest, orderCode?: string): PayOSPaymentResponse {
    const fallbackOrderCode = orderCode || this.generateOrderCode(request.appointmentId);
    const fallbackUrl = `${PAYOS_CONFIG.RETURN_URL}/payment/mock?appointmentId=${request.appointmentId}&orderCode=${fallbackOrderCode}&amount=${request.amount}`;

    console.log('🔄 [PayOS] Using fallback payment URL:', fallbackUrl);

    return {
      success: true,
      paymentUrl: fallbackUrl,
      orderCode: fallbackOrderCode,
      fallbackUsed: true
    };
  }

  /**
   * Verify webhook signature
   */
  public verifyWebhookSignature(data: PayOSWebhookData): boolean {
    try {
      if (!data.signature) {
        console.warn('⚠️ [PayOS] Webhook missing signature');
        return false;
      }

      const calculatedSignature = this.calculateChecksum(data.data);
      const isValid = calculatedSignature === data.signature;

      console.log(`🔐 [PayOS] Webhook signature ${isValid ? 'valid' : 'invalid'}`);
      return isValid;
    } catch (error) {
      console.error('❌ [PayOS] Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Process webhook data
   */
  public processWebhook(webhookData: PayOSWebhookData): {
    isValid: boolean;
    isSuccess: boolean;
    orderCode: string;
    amount: number;
    transactionId?: string;
  } {
    console.log('📥 [PayOS] Processing webhook for order:', webhookData.data?.orderCode);

    // Verify signature (optional for development)
    const isValid = process.env.NODE_ENV === 'development' || this.verifyWebhookSignature(webhookData);
    
    // Check if payment is successful
    const isSuccess = webhookData.code === '00' && webhookData.desc === 'success';

    return {
      isValid,
      isSuccess,
      orderCode: webhookData.data.orderCode,
      amount: webhookData.data.amount,
      transactionId: webhookData.data.reference
    };
  }

  /**
   * Query payment status
   */
  public async queryPaymentStatus(orderCode: string): Promise<{
    success: boolean;
    status?: string;
    amount?: number;
    paidAt?: string;
    error?: string;
  }> {
    try {
      if (!this.isConfigured()) {
        return { success: false, error: 'PayOS not configured' };
      }

      const response = await axios({
        method: 'GET',
        url: `${PAYOS_CONFIG.API_URL}/${orderCode}`,
        headers: {
          'x-client-id': PAYOS_CONFIG.CLIENT_ID,
          'x-api-key': PAYOS_CONFIG.API_KEY
        },
        timeout: 10000
      });

      if (response.status === 200 && response.data?.code === '00') {
        const paymentData = response.data.data;
        return {
          success: true,
          status: paymentData.status,
          amount: paymentData.amount,
          paidAt: paymentData.paidAt
        };
      } else {
        return {
          success: false,
          error: response.data?.desc || 'Query failed'
        };
      }

    } catch (error) {
      console.error('❌ [PayOS] Query payment status error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const payOSService = EnhancedPayOSService.getInstance();
