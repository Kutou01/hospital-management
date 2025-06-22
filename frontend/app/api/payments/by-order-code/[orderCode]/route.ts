import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
    request: NextRequest,
    { params }: { params: { orderCode: string } }
) {
    try {
        const { orderCode } = params;

        if (!orderCode) {
            return NextResponse.json({
                success: false,
                error: 'Order code is required'
            }, { status: 400 });
        }

        console.log('🔍 [Payment API] Fetching payment by order code:', orderCode);

        // Lấy thông tin payment
        const { data: payment, error } = await supabase
            .from('payments')
            .select('*')
            .eq('order_code', orderCode)
            .single();

        if (error) {
            console.error('❌ [Payment API] Error fetching payment:', error);
            return NextResponse.json({
                success: false,
                error: 'Payment not found'
            }, { status: 404 });
        }

        console.log('✅ [Payment API] Payment found:', payment);

        return NextResponse.json({
            success: true,
            payment: payment
        });

    } catch (error: any) {
        console.error('❌ [Payment API] Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
