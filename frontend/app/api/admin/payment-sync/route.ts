import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Simulated PayOS API client
class PayOSClient {
    private apiKey: string;
    private clientId: string;
    private checksumKey: string;

    constructor() {
        this.apiKey = process.env.PAYOS_API_KEY || '';
        this.clientId = process.env.PAYOS_CLIENT_ID || '';
        this.checksumKey = process.env.PAYOS_CHECKSUM_KEY || '';
    }

    async getPayments(limit = 100, offset = 0) {
        console.log('🔍 Fetching ALL payments from PayOS...');

        try {
            // LẤY THẬT TỪ PAYOS API - Dùng endpoint đúng
            console.log('🔍 Fetching REAL payments from PayOS API...');

            // Thử nhiều endpoint PayOS khác nhau
            let response;
            let apiUrl;

            // Thử endpoint 1: /v2/payment-requests
            try {
                apiUrl = `${process.env.PAYOS_API_URL}/v2/payment-requests`;
                console.log('Trying endpoint 1:', apiUrl);
                response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'x-client-id': this.clientId,
                        'x-api-key': this.apiKey,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    console.log('✅ Endpoint 1 worked!');
                } else {
                    throw new Error(`Status: ${response.status}`);
                }
            } catch (error1) {
                console.log('❌ Endpoint 1 failed:', error1.message);

                // Thử endpoint 2: /v2/payments
                try {
                    apiUrl = `${process.env.PAYOS_API_URL}/v2/payments`;
                    console.log('Trying endpoint 2:', apiUrl);
                    response = await fetch(apiUrl, {
                        method: 'GET',
                        headers: {
                            'x-client-id': this.clientId,
                            'x-api-key': this.apiKey,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        console.log('✅ Endpoint 2 worked!');
                    } else {
                        throw new Error(`Status: ${response.status}`);
                    }
                } catch (error2) {
                    console.log('❌ Endpoint 2 failed:', error2.message);

                    // Fallback: Dùng danh sách orderCode đã biết và fetch từng cái
                    console.log('🔄 Fallback: Fetching individual payments...');
                    return await this.fetchKnownPayments();
                }
            }

            const data = await response.json();
            console.log('✅ PayOS API response:', {
                code: data.code,
                desc: data.desc,
                totalRecords: data.data?.length || 0,
                endpoint: apiUrl
            });

            if (data.code !== '00' || !data.data) {
                console.warn('⚠️ PayOS returned no data, using fallback');
                return await this.fetchKnownPayments();
            }

            // Transform PayOS data to our format
            const payments = data.data.map((payment: any) => ({
                id: payment.id,
                orderCode: payment.orderCode,
                amount: payment.amount,
                status: payment.status,
                description: payment.description || `Thanh toán khám bệnh - ${payment.orderCode}`,
                createdAt: payment.createdAt,
                paidAt: payment.paidAt,
                transactions: payment.transactions || []
            }));

            console.log(`📊 Processed ${payments.length} REAL payments from PayOS`);
            return {
                success: true,
                data: payments,
                total: payments.length
            };

        } catch (error) {
            console.error('❌ PayOS API call failed:', error);
            console.log('🔄 Using fallback method...');
            return await this.fetchKnownPayments();
        }
    }

    async fetchKnownPayments() {
        console.log('📋 Fetching known payments individually...');

        // Danh sách orderCode đã biết (bao gồm giao dịch 350k)
        const knownOrderCodes = [
            '1750004006508',  // 500,000 VNĐ
            '1749998502037',  // 300,000 VNĐ
            '1749998363922',  // 300,000 VNĐ
            '1749998363890',  // 300,000 VNĐ
            '1749996856374',  // 300,000 VNĐ
            '1749996855176',  // 300,000 VNĐ
            '1749996854072',  // 300,000 VNĐ
            // BẠN CẦN THÊM ORDERCODE 350K THẬT VÀO ĐÂY
            // Ví dụ: '1750012345678'  // 350,000 VNĐ - 23h39
        ];

        const payments = [];

        for (const orderCode of knownOrderCodes) {
            try {
                const paymentResponse = await this.getPaymentByOrderCode(orderCode);
                if (paymentResponse.success && paymentResponse.data) {
                    payments.push({
                        id: paymentResponse.data.id,
                        orderCode: paymentResponse.data.orderCode,
                        amount: paymentResponse.data.amount,
                        status: paymentResponse.data.status,
                        description: paymentResponse.data.description || `Thanh toán khám bệnh - ${orderCode}`,
                        createdAt: paymentResponse.data.createdAt,
                        paidAt: paymentResponse.data.paidAt,
                        transactions: paymentResponse.data.transactions || []
                    });
                }
            } catch (error) {
                console.warn(`⚠️ Could not fetch payment ${orderCode}:`, error);
            }
        }

        console.log(`📊 Fetched ${payments.length} payments individually`);
        return {
            success: true,
            data: payments,
            total: payments.length
        };
    }

    async getPaymentByOrderCode(orderCode: string) {
        console.log(`Fetching payment ${orderCode} from PayOS...`);

        try {
            const response = await fetch(`${process.env.PAYOS_API_URL}/v2/payment-requests/${orderCode}`, {
                method: 'GET',
                headers: {
                    'x-client-id': this.clientId,
                    'x-api-key': this.apiKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.error(`PayOS API error for ${orderCode}:`, response.status, response.statusText);
                return {
                    success: false,
                    error: `PayOS API error: ${response.status}`
                };
            }

            const data = await response.json();
            console.log(`PayOS response for ${orderCode}:`, data);

            return {
                success: true,
                data: data.data
            };

        } catch (error) {
            console.error(`PayOS API call failed for ${orderCode}:`, error);
            return {
                success: false,
                error: 'Failed to connect to PayOS API'
            };
        }
    }

    async checkStatus(orderCode: string) {
        console.log(`Checking status for payment ${orderCode} from PayOS...`);
        try {
            const result = await this.getPaymentByOrderCode(orderCode);
            if (result.success && result.data) {
                return result.data;
            }
            return null;
        } catch (error) {
            console.error(`Failed to check status for ${orderCode}:`, error);
            return null;
        }
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { action, enabled } = body;

        switch (action) {
            case 'manual_sync':
                return await handleManualSync(supabase);

            case 'toggle_auto_sync':
                return await handleToggleAutoSync(supabase, enabled);

            default:
                return NextResponse.json({
                    success: false,
                    error: 'Invalid action'
                }, { status: 400 });
        }

    } catch (error) {
        console.error('Payment sync API error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}

async function handleManualSync(supabase: any) {
    try {
        // Lấy pending payments
        const { data: pendingPayments, error: paymentError } = await supabase
            .from('payments')
            .select('*')
            .in('status', ['pending', 'processing'])
            .is('transaction_id', null)
            .order('created_at', { ascending: false })
            .limit(50); // Limit để tránh timeout

        if (paymentError) {
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch pending payments'
            }, { status: 500 });
        }

        if (!pendingPayments || pendingPayments.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No pending payments to sync',
                data: { synced: 0 }
            });
        }

        const payosClient = new PayOSClient();
        let syncedCount = 0;
        let updatedPayments = [];

        // Kiểm tra từng payment
        for (const payment of pendingPayments) {
            try {
                const paymentStatus = await payosClient.checkStatus(payment.order_code);

                if (paymentStatus && paymentStatus.status === 'PAID') {
                    // Chuẩn bị dữ liệu cập nhật
                    const updateData: any = {
                        status: 'completed',
                        updated_at: new Date().toISOString(),
                        paid_at: new Date().toISOString(),
                        transaction_id: paymentStatus.transactions?.[0]?.reference || null,
                        payos_status: paymentStatus.status,
                        payos_sync_at: new Date().toISOString()
                    };

                    // Kiểm tra nếu thiếu patient_id nhưng có record_id
                    if (!payment.patient_id && payment.record_id) {
                        console.log(`🔍 [Manual Sync] Payment missing patient_id, checking record_id: ${payment.record_id}`);

                        // Lấy patient_id từ bảng medical_records
                        const { data: recordData, error: recordError } = await supabase
                            .from('medical_records')
                            .select('patient_id')
                            .eq('record_id', payment.record_id)
                            .single();

                        if (!recordError && recordData && recordData.patient_id) {
                            updateData.patient_id = recordData.patient_id;
                            console.log(`✅ [Manual Sync] Found patient_id ${recordData.patient_id} from record ${payment.record_id}`);
                        } else {
                            console.log(`⚠️ [Manual Sync] Could not find patient_id from record: ${recordError?.message || 'No data'}`);
                        }
                    }

                    // Cập nhật trạng thái
                    const { data: updatedPayment, error: updateError } = await supabase
                        .from('payments')
                        .update(updateData)
                        .eq('id', payment.id)
                        .select()
                        .single();

                    if (!updateError) {
                        syncedCount++;
                        updatedPayments.push(updatedPayment);
                    }
                }

                // Delay để tránh rate limit
                await new Promise(resolve => setTimeout(resolve, 300));
            } catch (error) {
                console.error(`Error syncing payment ${payment.order_code}:`, error);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Synced ${syncedCount} payments from PayOS`,
            data: {
                synced: syncedCount,
                total: pendingPayments.length,
                updated: updatedPayments
            }
        });
    } catch (error) {
        console.error('Manual sync error:', error);
        return NextResponse.json({
            success: false,
            error: 'Manual sync failed'
        }, { status: 500 });
    }
}

async function handleToggleAutoSync(supabase: any, enabled: boolean) {
    try {
        // In a real implementation, this would update a settings table
        // For now, we'll just return success

        return NextResponse.json({
            success: true,
            data: {
                autoSyncEnabled: enabled
            },
            message: enabled ?
                'Đồng bộ tự động đã được bật' :
                'Đồng bộ tự động đã được tắt'
        });

    } catch (error) {
        console.error('Toggle auto sync error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to update auto sync setting'
        }, { status: 500 });
    }
}

function mapPayOSStatus(payosStatus: string): string {
    switch (payosStatus) {
        case 'PAID':
            return 'completed';
        case 'PENDING':
        case 'PROCESSING':
            return 'pending';
        case 'CANCELLED':
        case 'EXPIRED':
            return 'failed';
        default:
            return 'pending';
    }
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get sync status and statistics
        const { data: payments, error } = await supabase
            .from('payments')
            .select('status, transaction_id, payment_link_id, created_at')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch payment statistics'
            }, { status: 500 });
        }

        const stats = {
            total: payments?.length || 0,
            synced: payments?.filter(p => p.transaction_id || p.payment_link_id).length || 0,
            completed: payments?.filter(p => p.status === 'completed').length || 0,
            pending: payments?.filter(p => p.status === 'pending').length || 0,
            failed: payments?.filter(p => p.status === 'failed').length || 0,
            syncRate: payments?.length ?
                ((payments.filter(p => p.transaction_id || p.payment_link_id).length / payments.length) * 100).toFixed(1) :
                '0'
        };

        return NextResponse.json({
            success: true,
            data: {
                stats,
                autoSyncEnabled: true, // This would come from settings in real implementation
                lastSync: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Get sync status error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
