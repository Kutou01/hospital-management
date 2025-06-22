import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getProfile, UserProfile } from '@/lib/auth/auth-utils';

export async function GET() {
    try {
        const supabase = await createClient();

        // Kiểm tra session
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            console.log('❌ [Check Auth] No session found');
            return NextResponse.json({
                success: false,
                message: 'Không tìm thấy phiên đăng nhập',
                auth: {
                    isLoggedIn: false
                }
            });
        }

        // Lấy thông tin profile từ hàm getProfile
        const profile = await getProfile();

        if (!profile) {
            console.log('❌ [Check Auth] Profile not found for user:', session.user.id);
            return NextResponse.json({
                success: false,
                message: 'Không tìm thấy thông tin hồ sơ người dùng',
                auth: {
                    isLoggedIn: true,
                    userId: session.user.id,
                    email: session.user.email,
                    hasProfile: false
                }
            });
        }

        // Kiểm tra xem người dùng có hồ sơ bệnh nhân không
        const { data: patients, error: patientError } = await supabase
            .from('patients')
            .select('patient_id, full_name')
            .eq('profile_id', profile.id);

        if (patientError) {
            console.error('❌ [Check Auth] Error fetching patient info:', patientError);
        }

        const hasPatientProfile = patients && patients.length > 0;

        return NextResponse.json({
            success: true,
            auth: {
                isLoggedIn: true,
                userId: profile.id,
                email: profile.email,
                role: profile.role,
                fullName: profile.full_name,
                hasProfile: true,
                hasPatientProfile: hasPatientProfile,
                patientId: hasPatientProfile ? patients[0].patient_id : null
            }
        });

    } catch (error) {
        console.error('❌ [Check Auth] Error:', error);
        return NextResponse.json({
            success: false,
            message: 'Lỗi kiểm tra xác thực',
            error: String(error)
        }, { status: 500 });
    }
} 