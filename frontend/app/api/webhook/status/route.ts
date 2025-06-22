import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

/**
 * Kiểm tra trạng thái ngrok tunnel và webhook
 * API này giúp xác nhận xem webhook URL có hoạt động được không
 */
export async function GET(request: NextRequest) {
    try {
        // Lấy thông tin ngrok URL từ biến môi trường hoặc query params
        const { searchParams } = new URL(request.url);
        const ngrokUrl = searchParams.get('url') ||
            process.env.NGROK_WEBHOOK_URL ||
            'https://a6c3-116-106-199-244.ngrok-free.app';

        const webhookPath = '/api/webhook/payos';
        const fullWebhookUrl = `${ngrokUrl}${webhookPath}`;

        console.log(`🔍 Checking webhook status for: ${fullWebhookUrl}`);

        // Kiểm tra endpoint có hoạt động không
        let webhookStatus = 'unknown';
        let webhookResponse = null;
        let webhookError = null;

        try {
            const response = await axios.get(fullWebhookUrl, {
                timeout: 5000, // 5 seconds timeout
                headers: {
                    'User-Agent': 'Hospital-Management-Webhook-Test',
                    'X-Source': 'internal-status-check'
                }
            });

            webhookStatus = 'active';
            webhookResponse = response.data;
        } catch (error: any) {
            webhookStatus = 'error';
            webhookError = {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            };
        }

        // Kiểm tra biến môi trường webhook
        const environmentStatus = {
            PAYOS_CLIENT_ID: !!process.env.PAYOS_CLIENT_ID ? 'set' : 'missing',
            PAYOS_API_KEY: !!process.env.PAYOS_API_KEY ? 'set' : 'missing',
            PAYOS_CHECKSUM_KEY: !!process.env.PAYOS_CHECKSUM_KEY ? 'set' : 'missing',
            NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'missing',
            SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'missing'
        };

        // Kiểm tra response và trả về kết quả
        return NextResponse.json({
            status: 'success',
            timestamp: new Date().toISOString(),
            webhook: {
                url: fullWebhookUrl,
                status: webhookStatus,
                response: webhookResponse,
                error: webhookError
            },
            environment: environmentStatus,
            conclusion: webhookStatus === 'active'
                ? 'Webhook URL có thể truy cập nhưng cần xác thực thêm với PayOS'
                : 'Webhook URL không thể truy cập, kiểm tra ngrok và mở port 3000'
        });

    } catch (error: any) {
        console.error('Error checking webhook status:', error);

        return NextResponse.json({
            status: 'error',
            message: 'Lỗi khi kiểm tra trạng thái webhook',
            error: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
} 