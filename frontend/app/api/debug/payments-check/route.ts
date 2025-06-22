import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Lấy ID người dùng từ query params nếu có
        const { searchParams } = new URL(request.url);
        const patientId = searchParams.get('patientId');
        const orderCode = searchParams.get('orderCode');

        console.log('🔍 [Payments Debug] Request params:', { patientId, orderCode });

        // Xác thực để đảm bảo chỉ admin hoặc chính người dùng được xem
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 });
        }

        const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (!user) {
            return NextResponse.json({
                success: false,
                error: 'Invalid token'
            }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        // Chỉ cho phép admin xem tất cả
        const isAdmin = profile?.role === 'admin';

        // 1. Lấy thông tin tất cả các thanh toán gần nhất
        let paymentsQuery = supabase.from('payments').select('*');

        // Nếu không phải admin và có patientId, chỉ lấy thanh toán của bệnh nhân đó
        if (!isAdmin && patientId) {
            paymentsQuery = paymentsQuery.eq('patient_id', patientId);
        }

        // Nếu có orderCode, lọc theo orderCode
        if (orderCode) {
            paymentsQuery = paymentsQuery.eq('order_code', orderCode);
        }

        // Sắp xếp theo thời gian tạo giảm dần và giới hạn 30 thanh toán
        paymentsQuery = paymentsQuery.order('created_at', { ascending: false }).limit(30);

        const { data: payments, error: paymentsError } = await paymentsQuery;

        if (paymentsError) {
            console.error('❌ [Payments Debug] Error fetching payments:', paymentsError);
            return NextResponse.json({
                success: false,
                error: paymentsError.message
            }, { status: 500 });
        }

        // 2. Nếu là admin, lấy thêm thanh toán không có patient_id
        let paymentsWithoutPatientId = [];
        if (isAdmin) {
            const { data: nullPatientPayments } = await supabase
                .from('payments')
                .select('*')
                .is('patient_id', null)
                .order('created_at', { ascending: false })
                .limit(20);

            paymentsWithoutPatientId = nullPatientPayments || [];
        }

        // 3. Lấy thông tin hồ sơ bệnh nhân
        let patientInfo = null;
        if (patientId) {
            const { data: patient } = await supabase
                .from('patients')
                .select(`
                    patient_id,
                    full_name,
                    profile:profiles!patients_profile_id_fkey (
                        id,
                        email
                    )
                `)
                .eq('patient_id', patientId)
                .single();

            patientInfo = patient;
        }

        // 4. Tìm tất cả các hồ sơ bệnh nhân liên quan đến người dùng hiện tại
        const { data: userPatients } = await supabase
            .from('patients')
            .select(`
                patient_id,
                full_name,
                profile:profiles!patients_profile_id_fkey (
                    id,
                    email
                )
            `)
            .eq('profile_id', user.id);

        // 5. Lấy thông tin về người dùng hiện tại
        const { data: currentUserProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        // 6. Lấy tất cả các thanh toán liên quan đến người dùng hiện tại
        const relatedPayments = [];
        if (userPatients && userPatients.length > 0) {
            const patientIds = userPatients.map(p => p.patient_id);

            const { data: userRelatedPayments } = await supabase
                .from('payments')
                .select('*')
                .in('patient_id', patientIds)
                .order('created_at', { ascending: false });

            if (userRelatedPayments) {
                relatedPayments.push(...userRelatedPayments);
            }
        }

        // Tìm các thanh toán có thể liên quan đến email người dùng
        if (currentUserProfile?.email) {
            const { data: emailRelatedPayments } = await supabase
                .from('payments')
                .select('*')
                .ilike('description', `%${currentUserProfile.email}%`)
                .order('created_at', { ascending: false });

            if (emailRelatedPayments) {
                relatedPayments.push(...emailRelatedPayments);
            }
        }

        // Trả về kết quả
        return NextResponse.json({
            success: true,
            data: {
                userInfo: {
                    id: user.id,
                    email: user.email,
                    isAdmin
                },
                patients: userPatients || [],
                currentUserProfile,
                payments: payments || [],
                paymentsWithoutPatientId,
                relatedPayments,
                patientInfo
            }
        });

    } catch (error: any) {
        console.error('❌ [Payments Debug] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
} 