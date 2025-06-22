import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
    try {
        const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID;
        const PAYOS_API_KEY = process.env.PAYOS_API_KEY;
        const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY;
        const PAYOS_API_URL = process.env.PAYOS_API_URL || 'https://api-merchant.payos.vn';

        console.log('=== PAYOS DIAGNOSTIC TEST ===');
        console.log('Environment variables:');
        console.log('PAYOS_CLIENT_ID:', PAYOS_CLIENT_ID ? `${PAYOS_CLIENT_ID.substring(0, 8)}...` : 'NOT SET');
        console.log('PAYOS_API_KEY:', PAYOS_API_KEY ? `${PAYOS_API_KEY.substring(0, 8)}...` : 'NOT SET');
        console.log('PAYOS_CHECKSUM_KEY:', PAYOS_CHECKSUM_KEY ? `${PAYOS_CHECKSUM_KEY.substring(0, 8)}...` : 'NOT SET');
        console.log('PAYOS_API_URL:', PAYOS_API_URL);

        if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY || !PAYOS_CHECKSUM_KEY) {
            return NextResponse.json({
                success: false,
                error: 'Missing PayOS credentials',
                details: {
                    hasClientId: !!PAYOS_CLIENT_ID,
                    hasApiKey: !!PAYOS_API_KEY,
                    hasChecksumKey: !!PAYOS_CHECKSUM_KEY
                }
            }, { status: 400 });
        }

        // Test 1: Check PayOS API connectivity
        console.log('\n=== TEST 1: API Connectivity ===');
        try {
            const connectivityTest = await axios.get(`${PAYOS_API_URL}/health`, {
                timeout: 5000
            });
            console.log('Connectivity test result:', connectivityTest.status);
        } catch (connectError: any) {
            console.log('Connectivity test failed:', connectError.message);
        }

        // Test 2: Check payment gateway status
        console.log('\n=== TEST 2: Payment Gateway Status ===');
        try {
            const gatewayTest = await axios.get(
                `${PAYOS_API_URL}/v2/payment-gateways`,
                {
                    headers: {
                        'x-client-id': PAYOS_CLIENT_ID,
                        'x-api-key': PAYOS_API_KEY,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );
            console.log('Gateway status:', gatewayTest.data);
        } catch (gatewayError: any) {
            console.log('Gateway check failed:', gatewayError.response?.data || gatewayError.message);
        }

        // Test 3: Check account info
        console.log('\n=== TEST 3: Account Info ===');
        try {
            const accountTest = await axios.get(
                `${PAYOS_API_URL}/v2/merchant-info`,
                {
                    headers: {
                        'x-client-id': PAYOS_CLIENT_ID,
                        'x-api-key': PAYOS_API_KEY,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );
            console.log('Account info:', accountTest.data);
        } catch (accountError: any) {
            console.log('Account check failed:', accountError.response?.data || accountError.message);
        }

        // Test 4: Test authentication with minimal payment request
        console.log('\n=== TEST 4: Authentication Test ===');
        const testPaymentData = {
            orderCode: `TEST-${Date.now()}`,
            amount: 1000, // Minimum amount
            description: 'Test payment for authentication',
            cancelUrl: 'http://localhost:3000/payment/cancel',
            returnUrl: 'http://localhost:3000/payment/success',
            items: [
                {
                    name: 'Test item',
                    quantity: 1,
                    price: 1000
                }
            ]
        };

        console.log('Sending test payment request...');
        try {
            const authTest = await axios.post(
                `${PAYOS_API_URL}/v2/payment-requests`,
                testPaymentData,
                {
                    headers: {
                        'x-client-id': PAYOS_CLIENT_ID,
                        'x-api-key': PAYOS_API_KEY,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );

            console.log('Auth test SUCCESS:', authTest.data);
            return NextResponse.json({
                success: true,
                message: 'PayOS authentication successful!',
                data: {
                    testResult: 'PASSED',
                    payosResponse: authTest.data,
                    credentials: {
                        clientId: `${PAYOS_CLIENT_ID.substring(0, 8)}...`,
                        apiUrl: PAYOS_API_URL
                    }
                }
            });

        } catch (authError: any) {
            console.log('Auth test FAILED:', authError.response?.data || authError.message);
            
            const errorResponse = authError.response?.data;
            const errorCode = errorResponse?.code;
            const errorDesc = errorResponse?.desc || errorResponse?.message;

            // Analyze specific error codes
            let diagnosis = '';
            let solution = '';

            switch (errorCode) {
                case '214':
                    diagnosis = 'Cổng thanh toán không tồn tại hoặc đã tạm dừng';
                    solution = 'Kiểm tra lại thông tin Client ID và API Key. Đảm bảo tài khoản PayOS đã được kích hoạt và có cổng thanh toán hợp lệ.';
                    break;
                case '401':
                    diagnosis = 'Thông tin xác thực không hợp lệ';
                    solution = 'Kiểm tra lại PAYOS_CLIENT_ID và PAYOS_API_KEY trong file .env.local';
                    break;
                case '403':
                    diagnosis = 'Không có quyền truy cập';
                    solution = 'Tài khoản PayOS có thể chưa được phê duyệt hoặc bị hạn chế';
                    break;
                default:
                    diagnosis = errorDesc || 'Lỗi không xác định';
                    solution = 'Liên hệ support PayOS để được hỗ trợ';
            }

            return NextResponse.json({
                success: false,
                message: 'PayOS authentication failed',
                error: {
                    code: errorCode,
                    description: errorDesc,
                    diagnosis: diagnosis,
                    solution: solution,
                    fullError: errorResponse
                },
                credentials: {
                    clientId: `${PAYOS_CLIENT_ID.substring(0, 8)}...`,
                    apiUrl: PAYOS_API_URL,
                    hasValidFormat: {
                        clientId: /^[a-f0-9-]{36}$/.test(PAYOS_CLIENT_ID),
                        apiKey: /^[a-f0-9-]{36}$/.test(PAYOS_API_KEY)
                    }
                }
            }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Test error:', error);
        return NextResponse.json({
            success: false,
            error: 'Test execution failed',
            details: error.message
        }, { status: 500 });
    }
}
