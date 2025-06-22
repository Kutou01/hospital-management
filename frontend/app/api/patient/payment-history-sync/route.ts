import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * API để đồng bộ lại toàn bộ lịch sử thanh toán cho một người dùng cụ thể
 * Route: /api/patient/payment-history-sync
 * Method: POST
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { patientId } = body;

        // Kiểm tra xác thực
        const authHeader = request.headers.get('authorization');
        console.log('🔐 [Payment History Sync] Auth header check:', {
            hasAuthHeader: !!authHeader,
            headerStart: authHeader?.substring(0, 20),
            headerLength: authHeader?.length
        });

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ [Payment History Sync] No valid auth header found');
            return NextResponse.json(
                { success: false, error: 'Unauthorized - Please login' },
                { status: 401 }
            );
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify user authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            console.log('❌ [Payment History Sync] Invalid token:', authError?.message);
            return NextResponse.json(
                { success: false, error: 'Invalid token' },
                { status: 401 }
            );
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, role, full_name')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            console.log('❌ [Payment History Sync] Profile not found:', profileError?.message);
            return NextResponse.json(
                { success: false, error: 'Profile not found' },
                { status: 404 }
            );
        }

        console.log('👤 [Payment History Sync] Profile found:', {
            id: profile.id,
            role: profile.role,
            full_name: profile.full_name
        });

        // Xác định patient_id từ profile
        let currentPatientId: string | null = patientId || null;

        if (!currentPatientId && profile.role === 'patient') {
            // Truy vấn trực tiếp bảng patients để lấy patient_id
            const { data: patient, error: patientError } = await supabase
                .from('patients')
                .select('patient_id, full_name')
                .eq('profile_id', profile.id)
                .single();

            if (!patientError && patient) {
                currentPatientId = patient.patient_id;
            }
        }

        // Xác thực quyền
        if (!currentPatientId && profile.role !== 'admin') {
            return NextResponse.json({
                success: false,
                error: 'Patient ID is required'
            }, { status: 400 });
        }

        // Chỉ admin hoặc chính người dùng đó mới được phép đồng bộ lịch sử thanh toán
        if (profile.role !== 'admin') {
            const { data: patientCheck } = await supabase
                .from('patients')
                .select('patient_id')
                .eq('profile_id', profile.id)
                .eq('patient_id', currentPatientId)
                .single();

            if (!patientCheck) {
                return NextResponse.json({
                    success: false,
                    error: 'Unauthorized to sync this patient history'
                }, { status: 403 });
            }
        }

        console.log('🔄 [Payment History Sync] Starting sync for patient:', currentPatientId);

        // 1. Lấy tất cả các giao dịch từ bảng payments với patient_id tương ứng
        let query = supabase
            .from('payments')
            .select('id, order_code, patient_id, status')
            .eq('status', 'completed');

        // Nếu không phải admin, chỉ lấy giao dịch của patient cụ thể
        if (profile.role !== 'admin' && currentPatientId) {
            query = query.eq('patient_id', currentPatientId);
        }

        const { data: completedPayments, error: paymentsError } = await query;

        if (paymentsError) {
            console.error('❌ [Payment History Sync] Error fetching payments:', paymentsError);
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch payments'
            }, { status: 500 });
        }

        // Lấy danh sách tất cả các giao dịch từ bảng order_history mà chưa có trong bảng payments
        const { data: orderHistory, error: orderError } = await supabase
            .from('order_history')
            .select('id, order_id, patient_id, amount, status, created_at');

        if (orderError) {
            console.error('❌ [Payment History Sync] Error fetching order history:', orderError);
        }

        // 2. Phân tích dữ liệu để gán patient_id cho các giao dịch chưa có
        const paymentsWithoutPatientId = await supabase
            .from('payments')
            .select('id, order_code, description')
            .is('patient_id', null)
            .not('description', 'is', null);

        // Số lượng giao dịch cần xử lý
        const syncStats = {
            totalPayments: completedPayments?.length || 0,
            paymentsWithoutPatientId: paymentsWithoutPatientId?.data?.length || 0,
            orderHistoryEntries: orderHistory?.length || 0,
            updated: 0,
            errors: 0
        };

        // 3. Đồng bộ lại tất cả các giao dịch
        // Tìm giao dịch từ mô tả có chứa ID bệnh nhân
        if (paymentsWithoutPatientId?.data) {
            for (const payment of paymentsWithoutPatientId.data) {
                try {
                    if (payment.description && payment.description.includes('patient_id:')) {
                        const patientIdMatch = payment.description.match(/patient_id:\s*([^,\s]+)/);
                        if (patientIdMatch && patientIdMatch[1]) {
                            const extractedPatientId = patientIdMatch[1];

                            // Cập nhật patient_id cho giao dịch
                            const { error: updateError } = await supabase
                                .from('payments')
                                .update({ patient_id: extractedPatientId })
                                .eq('id', payment.id);

                            if (!updateError) {
                                syncStats.updated++;
                                console.log(`✅ [Payment History Sync] Updated payment ${payment.id} with patient_id ${extractedPatientId}`);
                            } else {
                                syncStats.errors++;
                                console.error(`❌ [Payment History Sync] Error updating payment ${payment.id}:`, updateError);
                            }
                        }
                    }
                } catch (error) {
                    syncStats.errors++;
                    console.error(`❌ [Payment History Sync] Error processing payment ${payment.id}:`, error);
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                syncStats,
                patientId: currentPatientId
            },
            message: `Payment history sync completed for ${syncStats.updated} payments`
        });

    } catch (error) {
        console.error('❌ [Payment History Sync] Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
} 