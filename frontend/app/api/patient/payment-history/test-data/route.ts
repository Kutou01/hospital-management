import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Lấy patient_id đầu tiên từ database để gán cho test data
        const { data: patients } = await supabase
            .from('patients')
            .select('patient_id')
            .limit(1);

        const testPatientId = patients?.[0]?.patient_id || 'PAT001'; // Fallback nếu không có patient

        // Tạo dữ liệu mẫu cho payments với patient_id
        const samplePayments = [
            {
                order_code: '1234567890',
                amount: 300000,
                description: 'Khám tổng quát - Bác sĩ Nguyễn Văn A',
                status: 'completed',
                payment_method: 'PayOS',
                doctor_name: 'Bác sĩ Nguyễn Văn A',
                doctor_id: 'DOC001',
                patient_id: testPatientId,
                transaction_id: 'TXN_' + Date.now() + '_1',
                payment_link_id: 'PL_' + Date.now() + '_1',
                paid_at: new Date().toISOString(),
                created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 ngày trước
                updated_at: new Date().toISOString()
            },
            {
                order_code: '1234567891',
                amount: 500000,
                description: 'Khám chuyên khoa tim mạch - Bác sĩ Trần Thị B',
                status: 'completed',
                payment_method: 'PayOS',
                doctor_name: 'Bác sĩ Trần Thị B',
                doctor_id: 'DOC002',
                patient_id: testPatientId,
                transaction_id: 'TXN_' + Date.now() + '_2',
                payment_link_id: 'PL_' + Date.now() + '_2',
                paid_at: new Date().toISOString(),
                created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 ngày trước
                updated_at: new Date().toISOString()
            },
            {
                order_code: '1234567892',
                amount: 200000,
                description: 'Tái khám - Bác sĩ Lê Văn C',
                status: 'pending',
                payment_method: 'PayOS',
                doctor_name: 'Bác sĩ Lê Văn C',
                doctor_id: 'DOC003',
                patient_id: testPatientId,
                transaction_id: null,
                payment_link_id: 'PL_' + Date.now() + '_3',
                paid_at: null,
                created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 giờ trước
                updated_at: new Date().toISOString()
            },
            {
                order_code: '1234567893',
                amount: 750000,
                description: 'Khám nhi khoa - Bác sĩ Phạm Thị D',
                status: 'completed',
                payment_method: 'PayOS',
                doctor_name: 'Bác sĩ Phạm Thị D',
                doctor_id: 'DOC004',
                patient_id: testPatientId,
                transaction_id: 'TXN_' + Date.now() + '_4',
                payment_link_id: 'PL_' + Date.now() + '_4',
                paid_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 ngày trước
                created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 ngày trước
                updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                order_code: '1234567894',
                amount: 400000,
                description: 'Khám da liễu - Bác sĩ Hoàng Văn E',
                status: 'failed',
                payment_method: 'PayOS',
                doctor_name: 'Bác sĩ Hoàng Văn E',
                doctor_id: 'DOC005',
                patient_id: testPatientId,
                transaction_id: null,
                payment_link_id: 'PL_' + Date.now() + '_5',
                paid_at: null,
                created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 ngày trước
                updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        // Xóa dữ liệu cũ (nếu có)
        await supabase
            .from('payments')
            .delete()
            .in('order_code', samplePayments.map(p => p.order_code));

        // Thêm dữ liệu mẫu
        const { data, error } = await supabase
            .from('payments')
            .insert(samplePayments)
            .select();

        if (error) {
            console.error('Error inserting sample data:', error);
            return NextResponse.json({
                success: false,
                error: 'Failed to insert sample data',
                details: error
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Sample payment data created successfully',
            data: {
                inserted: data?.length || 0,
                payments: data
            }
        });

    } catch (error) {
        console.error('Test data API error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}

// GET method để xem dữ liệu hiện tại
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        
        const { data: payments, error } = await supabase
            .from('payments')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch payments'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: {
                total: payments?.length || 0,
                payments: payments || []
            }
        });

    } catch (error) {
        console.error('Get test data error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}

// DELETE method để xóa dữ liệu test
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();
        
        const { error } = await supabase
            .from('payments')
            .delete()
            .like('order_code', '123456789%');

        if (error) {
            return NextResponse.json({
                success: false,
                error: 'Failed to delete test data'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Test data deleted successfully'
        });

    } catch (error) {
        console.error('Delete test data error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
