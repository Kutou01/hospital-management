import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID || 'demo';
const PAYOS_API_KEY = process.env.PAYOS_API_KEY || 'demo_key';
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || 'demo_checksum';
const PAYOS_API_URL = process.env.PAYOS_API_URL || 'https://api-merchant-dev.payos.vn';
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'http://localhost:3000';

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await request.json();
        const { amount, description, appointmentId, doctorName, redirectUrl = '/payment/success' } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json({
                success: false,
                error: {
                    code: 'INVALID_AMOUNT',
                    message: 'Invalid payment amount'
                }
            }, { status: 400 });
        }

        // Create a unique order code
        const orderCode = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        try {
            // Call PayOS API to create payment order
            const paymentData = {
                orderCode,
                amount,
                description: description || `Hospital appointment payment`,
                cancelUrl: `${APP_DOMAIN}/payment/cancel`,
                returnUrl: `${APP_DOMAIN}${redirectUrl}?orderCode=${orderCode}&amount=${amount}`,
                signature: generateSignature(orderCode, amount), // In production, implement proper signature generation
                items: [
                    {
                        name: doctorName ? `Appointment with Dr. ${doctorName}` : 'Medical appointment',
                        quantity: 1,
                        price: amount
                    }
                ]
            };

            // Simulate PayOS API response for demo
            // In production, replace with actual API call
            // const response = await axios.post(
            //   `${PAYOS_API_URL}/v1/payment-requests`, 
            //   paymentData,
            //   {
            //     headers: {
            //       'x-client-id': PAYOS_CLIENT_ID,
            //       'x-api-key': PAYOS_API_KEY,
            //     }
            //   }
            // );

            // Mock response for demo
            const mockResponse = {
                code: '00',
                desc: 'Success',
                data: {
                    id: `pay_${Date.now()}`,
                    orderCode: orderCode,
                    amount: amount,
                    amountPaid: 0,
                    status: 'CREATED',
                    checkoutUrl: `${APP_DOMAIN}/payment/demo?orderCode=${orderCode}&amount=${amount}`,
                    qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://demo-payment.payos.vn/${orderCode}`,
                    checkoutSupported: ['BANK_TRANSFER', 'CREDIT_CARD', 'VNPAY', 'MOMO'],
                    paymentLinkId: `link_${Date.now()}`,
                    description: description,
                    cancelUrl: `${APP_DOMAIN}/payment/cancel`,
                    returnUrl: `${APP_DOMAIN}${redirectUrl}?orderCode=${orderCode}&amount=${amount}`,
                    expiredAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                }
            };

            // Store payment data in database or cache for later reference
            // This is a critical step for actual implementation
            // await db.payments.create({
            //   orderCode,
            //   amount,
            //   appointmentId,
            //   doctorName,
            //   status: 'CREATED',
            //   createdAt: new Date()
            // });

            return NextResponse.json({
                success: true,
                data: mockResponse.data
            });

        } catch (apiError: any) {
            console.error('Error calling payment API:', apiError);

            return NextResponse.json({
                success: false,
                error: {
                    code: 'PAYMENT_SERVICE_ERROR',
                    message: apiError.message || 'Error creating payment'
                }
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Payment creation error:', error);

        return NextResponse.json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: error.message || 'Internal server error'
            }
        }, { status: 500 });
    }
}

// Simple signature generation function for demo purposes
// In production, implement proper signature generation according to PayOS docs
function generateSignature(orderCode: string, amount: number): string {
    // This is just a placeholder for demo
    // In production, use a proper HMAC signature using the checksum key
    const data = `${orderCode}${amount}${PAYOS_CHECKSUM_KEY}`;
    return Buffer.from(data).toString('base64');
}