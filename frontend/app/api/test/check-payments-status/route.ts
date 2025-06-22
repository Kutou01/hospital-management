import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();

        // Get all payments with status info
        const { data: payments, error } = await supabase
            .from('payments')
            .select('id, order_code, amount, status, patient_id, doctor_name, created_at, paid_at')
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({
                success: false,
                error: error.message
            }, { status: 500 });
        }

        // Count by status
        const statusCounts = payments?.reduce((acc, payment) => {
            acc[payment.status] = (acc[payment.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>) || {};

        return NextResponse.json({
            success: true,
            data: {
                total: payments?.length || 0,
                statusCounts,
                payments: payments || []
            }
        });

    } catch (error) {
        console.error('Check payments status error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
