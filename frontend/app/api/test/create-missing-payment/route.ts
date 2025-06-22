import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        
        const { orderCode, amount, patientId } = body;

        if (!orderCode || !amount || !patientId) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields: orderCode, amount, patientId'
            }, { status: 400 });
        }

        // Kiểm tra xem payment đã tồn tại chưa
        const { data: existingPayment } = await supabase
            .from('payments')
            .select('id')
            .eq('order_code', orderCode)
            .single();

        if (existingPayment) {
            return NextResponse.json({
                success: false,
                error: 'Payment already exists'
            }, { status: 400 });
        }

        // Tạo payment mới
        const newPayment = {
            order_code: orderCode,
            amount: amount,
            description: 'Thanh toan kham benh',
            status: 'completed',
            payment_method: 'payos',
            doctor_name: 'BS. Hoàng Văn E',
            doctor_id: 'DOC-005',
            patient_id: patientId,
            transaction_id: `TXN_${Date.now()}`,
            payment_link_id: `PL_${Date.now()}`,
            paid_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data: payment, error } = await supabase
            .from('payments')
            .insert([newPayment])
            .select()
            .single();

        if (error) {
            console.error('Error creating payment:', error);
            return NextResponse.json({
                success: false,
                error: error.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Payment created successfully',
            data: payment
        });

    } catch (error) {
        console.error('Create missing payment error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
