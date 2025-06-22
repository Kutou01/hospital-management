import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        console.log('🚀 [Test DB] Checking database connection...');
        const supabase = await createClient();

        // Lấy thông tin phiên đăng nhập hiện tại
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
            console.error('❌ [Test DB] Session error:', sessionError);
            return NextResponse.json({
                success: false,
                error: `Session error: ${sessionError.message}`
            }, { status: 401 });
        }

        // Thông tin người dùng đăng nhập
        let userInfo = null;
        let patientInfo = null;

        if (session) {
            // Lấy thông tin profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            userInfo = profile;

            // Nếu là bệnh nhân, lấy thông tin bệnh nhân
            if (profile && profile.role === 'patient') {
                const { data: patient, error: patientError } = await supabase
                    .from('patients')
                    .select('*')
                    .eq('profile_id', profile.id)
                    .single();

                patientInfo = patient;

                // Nếu tìm thấy bệnh nhân, kiểm tra thanh toán của họ
                if (patient) {
                    const { data: payments, error: paymentsError } = await supabase
                        .from('payments')
                        .select('*')
                        .eq('patient_id', patient.patient_id)
                        .order('created_at', { ascending: false });

                    if (paymentsError) {
                        console.error('❌ [Test DB] Error fetching patient payments:', paymentsError);
                    } else {
                        console.log(`✅ [Test DB] Found ${payments?.length || 0} payments for patient ${patient.patient_id}`);

                        // Trả về kết quả với dữ liệu chi tiết
                        return NextResponse.json({
                            success: true,
                            data: {
                                session: {
                                    user_id: session.user.id,
                                    email: session.user.email
                                },
                                profile: userInfo,
                                patient: patientInfo,
                                payments: payments || [],
                                payment_count: payments?.length || 0
                            }
                        });
                    }
                }
            }
        }

        // Kiểm tra các thanh toán gần đây
        const { data: recentPayments, error: paymentsError } = await supabase
            .from('payments')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (paymentsError) {
            console.error('❌ [Test DB] Error fetching recent payments:', paymentsError);
        }

        // Kiểm tra bảng patients
        const { data: patients, error: patientsError } = await supabase
            .from('patients')
            .select('*')
            .limit(10);

        if (patientsError) {
            console.error('❌ [Test DB] Error fetching patients:', patientsError);
        }

        console.log('✅ [Test DB] Database check completed');
        return NextResponse.json({
            success: true,
            message: 'Database connection successful',
            session: session ? {
                user_id: session.user.id,
                email: session.user.email
            } : null,
            user_info: userInfo,
            patient_info: patientInfo,
            recent_payments: recentPayments || [],
            recent_payments_count: recentPayments?.length || 0,
            patients: patients || [],
            patients_count: patients?.length || 0
        });

    } catch (error) {
        console.error('❌ [Test DB] Unexpected error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
