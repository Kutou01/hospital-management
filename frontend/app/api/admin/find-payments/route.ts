import { NextRequest, NextResponse } from 'next/server';

// Tool để tìm giao dịch 350k từ PayOS
export async function GET(request: NextRequest) {
    try {
        console.log('🔍 Searching for 350k payment...');
        
        // Tạo danh sách orderCode có thể có (dựa trên timestamp)
        const now = Date.now();
        const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
        
        // Tạo các orderCode có thể có cho hôm nay
        const possibleOrderCodes = [];
        
        // Dựa trên pattern: 175XXXXXXXXX (13 chữ số)
        // 1750004006508 = 1750 + 004006508
        // Thử các số quanh thời gian 23h39 (23:39 = 2339)
        const baseTime = parseInt(today + '2339'); // YYYYMMDD2339
        
        for (let i = -100; i <= 100; i++) {
            const orderCode = (baseTime + i).toString();
            if (orderCode.length === 13 && orderCode.startsWith('1750')) {
                possibleOrderCodes.push(orderCode);
            }
        }
        
        console.log(`🎯 Generated ${possibleOrderCodes.length} possible orderCodes around 23:39`);
        
        // Thử fetch từng orderCode để tìm giao dịch 350k
        const found350kPayments = [];
        
        for (const orderCode of possibleOrderCodes.slice(0, 20)) { // Chỉ thử 20 cái đầu
            try {
                const response = await fetch(`${process.env.PAYOS_API_URL}/v2/payment-requests/${orderCode}`, {
                    method: 'GET',
                    headers: {
                        'x-client-id': process.env.PAYOS_CLIENT_ID!,
                        'x-api-key': process.env.PAYOS_API_KEY!,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.code === '00' && data.data) {
                        const payment = data.data;
                        
                        // Kiểm tra nếu là giao dịch 350k
                        if (payment.amount === 350000) {
                            console.log(`🎉 Found 350k payment: ${orderCode}`);
                            found350kPayments.push({
                                orderCode: payment.orderCode,
                                amount: payment.amount,
                                status: payment.status,
                                createdAt: payment.createdAt,
                                paidAt: payment.paidAt,
                                description: payment.description
                            });
                        }
                    }
                }
                
                // Delay để tránh rate limit
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                // Bỏ qua lỗi, tiếp tục tìm
            }
        }
        
        return NextResponse.json({
            success: true,
            data: {
                found350kPayments,
                searchedOrderCodes: possibleOrderCodes.slice(0, 20),
                message: found350kPayments.length > 0 ? 
                    `Found ${found350kPayments.length} payment(s) of 350k` : 
                    'No 350k payments found in the searched range'
            }
        });
        
    } catch (error) {
        console.error('Find payments error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to search for payments'
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderCode } = body;
        
        if (!orderCode) {
            return NextResponse.json({
                success: false,
                error: 'orderCode is required'
            }, { status: 400 });
        }
        
        console.log(`🔍 Checking specific orderCode: ${orderCode}`);
        
        const response = await fetch(`${process.env.PAYOS_API_URL}/v2/payment-requests/${orderCode}`, {
            method: 'GET',
            headers: {
                'x-client-id': process.env.PAYOS_CLIENT_ID!,
                'x-api-key': process.env.PAYOS_API_KEY!,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            return NextResponse.json({
                success: false,
                error: `PayOS API error: ${response.status}`
            }, { status: response.status });
        }
        
        const data = await response.json();
        
        return NextResponse.json({
            success: true,
            data: {
                orderCode,
                payosResponse: data,
                isValid: data.code === '00',
                amount: data.data?.amount,
                status: data.data?.status,
                createdAt: data.data?.createdAt,
                paidAt: data.data?.paidAt
            }
        });
        
    } catch (error) {
        console.error('Check orderCode error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to check orderCode'
        }, { status: 500 });
    }
}
