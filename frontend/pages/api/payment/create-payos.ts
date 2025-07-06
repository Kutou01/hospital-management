import { NextApiRequest, NextApiResponse } from 'next';

interface PaymentRequest {
  appointmentId: string;
  amount: number;
  patientInfo: {
    name: string;
    phone: string;
    email: string;
  };
  serviceInfo: {
    specialty: string;
    doctorName: string;
    date: string;
    time: string;
  };
}

interface PaymentResponse {
  success: boolean;
  data?: {
    paymentUrl: string;
    orderCode: string;
  };
  error?: string;
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PaymentResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { appointmentId, amount, patientInfo, serviceInfo }: PaymentRequest = req.body;

    // Validate required fields
    if (!appointmentId || !amount || !patientInfo?.name || !patientInfo?.phone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'appointmentId, amount, patientInfo.name, and patientInfo.phone are required'
      });
    }

    const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID;
    const PAYOS_API_KEY = process.env.PAYOS_API_KEY;
    const PAYOS_API_URL = process.env.PAYOS_API_URL || 'https://api-merchant.payos.vn';
    const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'http://localhost:3000';

    console.log('🔑 PayOS Configuration Check:', {
      hasClientId: !!PAYOS_CLIENT_ID,
      hasApiKey: !!PAYOS_API_KEY,
      apiUrl: PAYOS_API_URL,
      appointmentId,
      amount
    });

    if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY) {
      console.warn('⚠️ PayOS credentials not configured, using mock payment URL');
      const mockUrl = `${APP_DOMAIN}/payment/mock?appointmentId=${appointmentId}&amount=${amount}`;
      return res.json({
        success: true,
        data: {
          paymentUrl: mockUrl,
          orderCode: `MOCK-${Date.now()}`
        },
        message: 'Using mock payment (PayOS not configured)'
      });
    }

    const orderCode = Date.now(); // Use timestamp as orderCode (integer)
    const returnUrl = `${APP_DOMAIN}/payment/success?appointmentId=${appointmentId}`;
    const cancelUrl = `${APP_DOMAIN}/payment/cancel?appointmentId=${appointmentId}`;
    const description = `KHAM${appointmentId}`; // Shorter description for bank compatibility

    // Create signature according to PayOS format
    const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY;
    if (!PAYOS_CHECKSUM_KEY) {
      throw new Error('PAYOS_CHECKSUM_KEY not configured');
    }

    const signatureData = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
    const crypto = require('crypto');
    const signature = crypto.createHmac('sha256', PAYOS_CHECKSUM_KEY).update(signatureData).digest('hex');

    const payosPaymentData = {
      orderCode: orderCode,
      amount: amount,
      description: description,
      items: [{
        name: `Khám ${serviceInfo.specialty}`,
        quantity: 1,
        price: amount
      }],
      returnUrl: returnUrl,
      cancelUrl: cancelUrl,
      buyerName: patientInfo.name,
      buyerPhone: patientInfo.phone,
      buyerEmail: patientInfo.email || '',
      expiredAt: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
      signature: signature
    };

    console.log('💳 Creating PayOS payment request...', {
      orderCode: orderCode,
      amount: amount,
      patientName: patientInfo.name
    });

    const response = await fetch(`${PAYOS_API_URL}/v2/payment-requests`, {
      method: 'POST',
      headers: {
        'x-client-id': PAYOS_CLIENT_ID,
        'x-api-key': PAYOS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payosPaymentData)
    });

    const result = await response.json();
    console.log('📋 PayOS Response:', { 
      status: response.status, 
      code: result.code,
      message: result.desc || result.message
    });

    if (response.ok && result.code === '00') {
      console.log('✅ PayOS payment created successfully:', result.data.checkoutUrl);
      return res.json({
        success: true,
        data: {
          paymentUrl: result.data.checkoutUrl,
          orderCode: orderCode
        },
        message: 'PayOS payment created successfully'
      });
    } else {
      console.error('❌ PayOS payment creation failed:', result);
      // Fallback to mock payment
      const mockUrl = `${APP_DOMAIN}/payment/mock?appointmentId=${appointmentId}&amount=${amount}`;
      return res.json({
        success: true,
        data: {
          paymentUrl: mockUrl,
          orderCode: `FALLBACK-${Date.now()}`
        },
        message: `PayOS failed (${result.desc || result.message}), using mock payment`
      });
    }

  } catch (error: any) {
    console.error('PayOS payment creation error:', error);
    
    // Fallback to mock payment
    const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'http://localhost:3000';
    const mockUrl = `${APP_DOMAIN}/payment/mock?appointmentId=${req.body.appointmentId}&amount=${req.body.amount}`;
    
    return res.json({
      success: true,
      data: {
        paymentUrl: mockUrl,
        orderCode: `ERROR-${Date.now()}`
      },
      message: `Error occurred (${error.message}), using mock payment`
    });
  }
}
