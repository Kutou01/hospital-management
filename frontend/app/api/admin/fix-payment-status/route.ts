import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { orderCodes } = await request.json();

        if (!orderCodes || !Array.isArray(orderCodes)) {
            return NextResponse.json({
                success: false,
                error: 'Order codes array is required'
            }, { status: 400 });
        }

        console.log('🔧 [Fix Payment Status] Updating payment status for:', orderCodes);

        // Kiểm tra payments hiện tại
        const { data: currentPayments, error: checkError } = await supabase
            .from('payments')
            .select('*')
            .in('order_code', orderCodes);

        if (checkError) {
            console.error('Error checking current payments:', checkError);
            return NextResponse.json({
                success: false,
                error: 'Failed to check current payments'
            }, { status: 500 });
        }

        console.log('📊 [Fix Payment Status] Current payments:', currentPayments);

        // Cập nhật trạng thái thành completed
        const updateData = {
            status: 'completed',
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data: updatedPayments, error: updateError } = await supabase
            .from('payments')
            .update(updateData)
            .in('order_code', orderCodes)
            .eq('status', 'pending')
            .select();

        if (updateError) {
            console.error('Error updating payments:', updateError);
            return NextResponse.json({
                success: false,
                error: 'Failed to update payments'
            }, { status: 500 });
        }

        console.log('✅ [Fix Payment Status] Updated payments:', updatedPayments);

        return NextResponse.json({
            success: true,
            data: {
                updated: updatedPayments?.length || 0,
                payments: updatedPayments
            },
            message: `Đã cập nhật ${updatedPayments?.length || 0} giao dịch thành công`
        });

    } catch (error) {
        console.error('Fix payment status error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}

// GET method để kiểm tra trạng thái
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const orderCodes = searchParams.get('orderCodes')?.split(',') || [];

        if (orderCodes.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'Order codes are required'
            }, { status: 400 });
        }

        const { data: payments, error } = await supabase
            .from('payments')
            .select('*')
            .in('order_code', orderCodes)
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch payments'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: payments
        });

    } catch (error) {
        console.error('Get payment status error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
