import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        // Tạo một số thanh toán mẫu để test
        const samplePayments = [
            {
                order_code: '1749974387280',
                amount: 300000,
                description: 'Khám nội khoa tổng quát',
                status: 'completed',
                payment_method: 'bank_transfer',
                doctor_id: 'DOC000001',
                doctor_name: 'BS. Nguyễn Văn A',
                patient_id: 'PAT000001',
                paid_at: new Date().toISOString(),
                created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 ngày trước
            },
            {
                order_code: '1749974387336',
                amount: 500000,
                description: 'Khám tim mạch chuyên sâu',
                status: 'completed',
                payment_method: 'bank_transfer',
                doctor_id: 'DOC000001',
                doctor_name: 'BS. Nguyễn Văn A',
                patient_id: 'PAT000002',
                paid_at: new Date().toISOString(),
                created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 ngày trước
            },
            {
                order_code: '1749974387400',
                amount: 250000,
                description: 'Tư vấn sức khỏe',
                status: 'completed',
                payment_method: 'bank_transfer',
                doctor_id: 'DOC000001',
                doctor_name: 'BS. Nguyễn Văn A',
                patient_id: 'PAT000003',
                paid_at: new Date().toISOString(),
                created_at: new Date().toISOString() // Hôm nay
            },
            {
                order_code: '1749974387500',
                amount: 400000,
                description: 'Khám da liễu',
                status: 'pending',
                payment_method: 'bank_transfer',
                doctor_id: 'DOC000002',
                doctor_name: 'BS. Trần Thị B',
                patient_id: 'PAT000004',
                created_at: new Date().toISOString()
            }
        ];

        // Insert sample payments
        const { data, error } = await supabase
            .from('payments')
            .insert(samplePayments)
            .select();

        if (error) {
            console.error('Error creating sample payments:', error);
            return NextResponse.json({
                success: false,
                error: error.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Sample payments created successfully',
            data: {
                created: data?.length || 0,
                payments: data
            }
        });

    } catch (error) {
        console.error('Error in create sample payments API:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        // Xóa tất cả thanh toán test
        const { error } = await supabase
            .from('payments')
            .delete()
            .like('order_code', '174997438%');

        if (error) {
            console.error('Error deleting sample payments:', error);
            return NextResponse.json({
                success: false,
                error: error.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Sample payments deleted successfully'
        });

    } catch (error) {
        console.error('Error in delete sample payments API:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
