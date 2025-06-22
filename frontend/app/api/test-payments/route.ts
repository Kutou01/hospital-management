import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// API để tạo thanh toán test cho việc kiểm tra
export async function POST(request: NextRequest) {
    try {
        console.log('🧪 Starting test payment creation process');

        // Import createClient function dynamically to avoid cookies issues
        const { createClient } = await import('@/lib/supabase/server');

        // Bắt lỗi khi khởi tạo kết nối Supabase
        let supabase;
        try {
            console.log('🔄 Initializing Supabase connection');
            supabase = await createClient();
            console.log('✅ Supabase connection initialized successfully');
        } catch (dbError) {
            console.error('❌ Lỗi kết nối Supabase:', dbError);
            return NextResponse.json({
                success: false,
                error: 'Không thể kết nối đến cơ sở dữ liệu',
                details: dbError instanceof Error ? dbError.message : 'Unknown error'
            }, { status: 500 });
        }

        // Parse body request
        let body;
        try {
            body = await request.json();
            console.log('📦 Received request body:', body);
        } catch (parseError) {
            console.error('❌ Lỗi đọc dữ liệu request:', parseError);
            return NextResponse.json({
                success: false,
                error: 'Không thể đọc dữ liệu request. Vui lòng kiểm tra format JSON',
                details: parseError instanceof Error ? parseError.message : 'Invalid JSON format'
            }, { status: 400 });
        }

        const { withPatientId = true, count = 2 } = body;
        console.log(`🔢 Creating ${count} test payments with patient IDs: ${withPatientId}`);

        // Tạo thanh toán test
        const testPayments = [];
        for (let i = 1; i <= count; i++) {
            // Tạo mô tả thanh toán - cố tình tạo một số có patient_id và một số không có
            let description = `Test payment #${i} for testing recovery tool`;

            // Nếu yêu cầu bao gồm patient_id hoặc đây là thanh toán chẵn
            const includePatientId = withPatientId || (i % 2 === 0);

            if (includePatientId) {
                // Thêm patient_id vào mô tả với định dạng đúng
                description += `, patient_id: TEST-PAT-${Date.now()}-${i}`;
            }

            const paymentData = {
                order_code: `TEST${Date.now()}${i}`,
                amount: 100000 * i,
                status: 'completed',
                description: description,
                payment_method: 'payos',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                paid_at: new Date().toISOString(),
                transaction_id: `TEST-TRANS-${Date.now()}-${i}`,
                // Removed payment_type field that was causing errors
                // Removed patient_id field that was causing foreign key constraint errors
            };

            testPayments.push(paymentData);
        }

        console.log('🧪 Test payments created:', testPayments.length);

        // Thêm vào database
        try {
            console.log('💾 Saving test payments to database...');
            const { data, error } = await supabase
                .from('payments')
                .insert(testPayments)
                .select();

            if (error) {
                console.error('❌ Lỗi khi lưu test payments:', error);
                throw error;
            }

            console.log('✅ Test payments saved successfully:', data?.length || 0);
            return NextResponse.json({
                success: true,
                message: `${testPayments.length} test payments created successfully`,
                data: {
                    payments: data,
                    withPatientId: withPatientId,
                    count: testPayments.length
                }
            });
        } catch (dbError) {
            console.error('❌ Lỗi database:', dbError);
            return NextResponse.json({
                success: false,
                error: 'Lỗi khi lưu dữ liệu vào database',
                details: dbError instanceof Error ? dbError.message : 'Unknown database error'
            }, { status: 500 });
        }

    } catch (error) {
        console.error('❌ Error creating test payments:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// GET endpoint để kiểm tra cách sử dụng API
export async function GET(request: NextRequest) {
    return NextResponse.json({
        success: true,
        message: 'Test Payment API',
        usage: {
            method: 'POST',
            body: {
                withPatientId: 'boolean (optional, default: true)',
                count: 'number (optional, default: 2)'
            },
            description: 'Creates test payments with or without patient_id in description for testing'
        },
        examples: [
            { withPatientId: true, count: 3 },
            { withPatientId: false, count: 5 }
        ]
    });
}
