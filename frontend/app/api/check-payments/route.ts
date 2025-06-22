import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const amount = searchParams.get('amount');
        const timeFilter = searchParams.get('time'); // today, hour, etc.

        // Tính toán thời gian filter
        let timeQuery = '';
        const now = new Date();

        if (timeFilter === 'today') {
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            timeQuery = today.toISOString();
        } else if (timeFilter === 'hour') {
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
            timeQuery = oneHourAgo.toISOString();
        } else if (timeFilter === '2hours') {
            const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
            timeQuery = twoHoursAgo.toISOString();
        }

        // Lấy tất cả payments gần nhất
        let query = supabase
            .from('payments')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        // Nếu có amount, lọc theo số tiền
        if (amount) {
            query = query.eq('amount', parseInt(amount));
        }

        // Nếu có time filter
        if (timeQuery) {
            query = query.gte('created_at', timeQuery);
        }

        const { data: payments, error: paymentsError } = await query;

        // Lấy payments theo số tiền 300000 (300k) trong 3 giờ qua
        const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
        const { data: payments300k, error: error300k } = await supabase
            .from('payments')
            .select('*')
            .eq('amount', 300000)
            .gte('created_at', threeHoursAgo.toISOString())
            .order('created_at', { ascending: false });

        // Lấy tất cả payments hôm nay
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const { data: paymentsToday, error: errorToday } = await supabase
            .from('payments')
            .select('*')
            .gte('created_at', todayStart.toISOString())
            .order('created_at', { ascending: false });

        // Thống kê payments
        const { data: paymentStats, error: statsError } = await supabase
            .from('payments')
            .select('status, amount, created_at, payment_method')
            .order('created_at', { ascending: false })
            .limit(100);

        // Đếm số lượng theo trạng thái
        const statusCounts = paymentStats?.reduce((acc: any, payment: any) => {
            acc[payment.status] = (acc[payment.status] || 0) + 1;
            return acc;
        }, {}) || {};

        // Đếm theo payment method
        const methodCounts = paymentStats?.reduce((acc: any, payment: any) => {
            acc[payment.payment_method || 'unknown'] = (acc[payment.payment_method || 'unknown'] || 0) + 1;
            return acc;
        }, {}) || {};

        return NextResponse.json({
            success: true,
            data: {
                all_payments: payments || [],
                payments_300k: payments300k || [],
                payments_today: paymentsToday || [],
                payment_stats: {
                    total: paymentStats?.length || 0,
                    status_counts: statusCounts,
                    method_counts: methodCounts,
                    recent_amounts: paymentStats?.slice(0, 15).map((p: any) => ({
                        amount: p.amount,
                        status: p.status,
                        payment_method: p.payment_method,
                        created_at: p.created_at
                    })) || []
                },
                filters: {
                    amount: amount,
                    time_filter: timeFilter,
                    time_query: timeQuery
                },
                errors: {
                    payments_error: paymentsError,
                    payments_300k_error: error300k,
                    payments_today_error: errorToday,
                    stats_error: statsError
                }
            }
        });
    } catch (error) {
        console.error('Error checking payments:', error);
        return NextResponse.json({
            success: false,
            error: error
        }, { status: 500 });
    }
}
