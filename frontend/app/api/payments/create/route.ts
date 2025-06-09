import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import crypto from 'crypto';

// Thông tin xác thực PayOS thực tế từ tài khoản của bạn
const PAYOS_CLIENT_ID = 'a6ff10b9-a42f-421c-be06-4b729419d902';
const PAYOS_API_KEY = 'b326bebf-985a-49e8-8fb5-96f28742807';
const PAYOS_CHECKSUM_KEY = '4744c2448a415110065d3c6cb0172f8dd02b9d923dbe5';
const PAYOS_API_URL = 'https://api-merchant.payos.vn/v2/payment-requests';

// Thông tin tài khoản ngân hàng backup (dùng khi PayOS không hoạt động)
const BANK_ACCOUNT = {
    accountNumber: "0867600311",
    accountName: "NGUYEN TRUNG HIEU",
    bankName: "Ngân hàng TMCP Phương Đông (OCB)",
    bankId: "970448"
};

// Tính toán checksum theo tài liệu của PayOS
function calculateChecksum(payload: any, checksumKey: string): string {
    const dataStr = JSON.stringify(payload);
    return crypto.createHmac('sha256', checksumKey).update(dataStr).digest('hex');
}

export async function POST(req: NextRequest) {
    try {
        // Parse request body
        const body = await req.json();
        const { amount, description, appointmentId, doctorName } = body;

        // Validate parameters
        if (!amount || amount <= 0) {
            return NextResponse.json(
                { success: false, message: 'Số tiền thanh toán không hợp lệ' },
                { status: 400 }
            );
        }

        // Generate order code
        const orderCode = `ORDER-${uuidv4().substring(0, 8)}-${Date.now()}`;
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

        console.log('===== THANH TOÁN PAYOS =====');
        console.log('1. Bắt đầu tạo yêu cầu thanh toán');
        console.log(`- OrderCode: ${orderCode}`);
        console.log(`- Amount: ${amount} VNĐ`);

        try {
            // Tạo payload cho PayOS API theo tài liệu
            const paymentData = {
                orderCode: orderCode,
                amount: parseInt(amount.toString()),
                description: description || `Thanh toán khám bệnh ${doctorName ? 'với BS ' + doctorName : ''}`,
                cancelUrl: `${baseUrl}/payment/cancel`,
                returnUrl: `${baseUrl}/payment/success?orderCode=${orderCode}&amount=${amount}`,
                expiredAt: Math.floor(Date.now() / 1000) + 15 * 60
            };

            // Tính toán signature
            const signature = calculateChecksum(paymentData, PAYOS_CHECKSUM_KEY);

            console.log('2. Thông tin API PayOS:');
            console.log('- URL:', PAYOS_API_URL);
            console.log('- Client ID:', PAYOS_CLIENT_ID);
            console.log('- OrderCode:', orderCode);

            // Gọi trực tiếp API PayOS
            const response = await axios({
                method: 'post',
                url: PAYOS_API_URL,
                headers: {
                    'Content-Type': 'application/json',
                    'x-client-id': PAYOS_CLIENT_ID,
                    'x-api-key': PAYOS_API_KEY
                },
                data: {
                    ...paymentData,
                    signature: signature
                }
            });

            console.log('3. Kết quả từ PayOS:');
            console.log('- Status:', response.status);
            console.log('- Response:', JSON.stringify(response.data).substring(0, 500) + '...');

            // Kiểm tra kết quả
            if (response.data && response.data.code === '00') {
                console.log('4. THÀNH CÔNG! URL thanh toán:', response.data.data.checkoutUrl);

                return NextResponse.json({
                    success: true,
                    message: 'Tạo thanh toán thành công',
                    data: {
                        orderCode: orderCode,
                        amount: amount,
                        description: paymentData.description,
                        checkoutUrl: response.data.data.checkoutUrl,
                        qrCode: response.data.data.qrCode,
                        responseCode: response.data.code,
                        responseMessage: response.data.desc
                    }
                });
            } else {
                console.log('4. LỖI:', response.data.desc);
                throw new Error(`PayOS không thành công: ${response.data.code} - ${response.data.desc}`);
            }
        } catch (error: any) {
            console.error('5. LỖI KHI GỌI PAYOS API:');
            console.error('- Message:', error.message);
            if (error.response) {
                console.error('- Status:', error.response.status);
                console.error('- Data:', JSON.stringify(error.response.data));
            }

            return NextResponse.json({
                success: false,
                message: `Lỗi khi gọi PayOS: ${error.message}`,
                error: error.response?.data || { message: error.message }
            }, { status: 502 });
        }
    } catch (error: any) {
        console.error('Lỗi tổng quát:', error.message);
        return NextResponse.json(
            { success: false, message: `Lỗi hệ thống: ${error.message}` },
            { status: 500 }
        );
    }
} 