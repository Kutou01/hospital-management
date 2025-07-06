import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// PayOS configuration - thông tin thực từ tài khoản PayOS của bạn
const PAYOS_CLIENT_ID = process.env.NEXT_PUBLIC_PAYOS_CLIENT_ID || '4b646577-61a4-4b8a-a2d4-e7efdf2521b3';
const PAYOS_API_KEY = process.env.NEXT_PUBLIC_PAYOS_API_KEY || 'f3a0c9de-f25e-48d8-90cd-1c21d102b883';
const PAYOS_CHECKSUM_KEY = process.env.NEXT_PUBLIC_PAYOS_CHECKSUM_KEY || '907a6570-c321-4f62-87e3-9c49f426f5b1';
const PAYOS_API_URL = 'https://api-merchant.payos.vn/v2/payment-requests';

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const orderCode = url.searchParams.get('orderCode');

        if (!orderCode) {
            return NextResponse.json(
                { code: '400', message: 'Thiếu mã đơn hàng' },
                { status: 400 }
            );
        }

        console.log('Querying payment status for order:', orderCode);

        try {
            // Call the PayOS API to check payment status
            const response = await axios.get(`${PAYOS_API_URL}/${orderCode}`, {
                headers: {
                    'x-client-id': PAYOS_CLIENT_ID,
                    'x-api-key': PAYOS_API_KEY
                },
                timeout: 30000 // 10 seconds timeout
            });

            const payosResponse = response.data;
            console.log('PayOS API query response:', JSON.stringify(payosResponse));

            if (payosResponse.code === '00') {
                return NextResponse.json({
                    code: '00',
                    message: 'Truy vấn thành công',
                    data: {
                        status: payosResponse.data.status,
                        amount: payosResponse.data.amount,
                        amountPaid: payosResponse.data.amountPaid,
                        orderCode: payosResponse.data.orderCode,
                        transactionId: payosResponse.data.paymentLinkId || payosResponse.data.id
                    }
                });
            } else {
                return NextResponse.json(
                    { code: payosResponse.code, message: payosResponse.desc || 'Lỗi khi truy vấn thanh toán' },
                    { status: 400 }
                );
            }
        } catch (apiError: any) {
            console.error('PayOS API query error:', apiError.response?.data || apiError.message);

            // Trong môi trường phát triển, giả lập phản hồi thành công
            // Trong môi trường thực tế, xóa đoạn mã này và trả về lỗi thật
            if (process.env.NODE_ENV !== 'production') {
                console.log('Returning mock payment status for development');
                return NextResponse.json({
                    code: '00',
                    message: 'Truy vấn thành công (mock)',
                    data: {
                        status: 'PAID',
                        amount: 500000,
                        amountPaid: 500000,
                        orderCode: orderCode,
                        transactionId: `PAYID-${Date.now()}`
                    }
                });
            }

            return NextResponse.json(
                { code: 'ERROR', message: 'Lỗi khi truy vấn API PayOS: ' + (apiError.response?.data?.message || apiError.message) },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error('Query payment error:', error.message);
        return NextResponse.json(
            { code: '500', message: 'Lỗi hệ thống: ' + error.message },
            { status: 500 }
        );
    }
} 