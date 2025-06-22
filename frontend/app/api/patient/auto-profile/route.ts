import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Kiểm tra session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            console.log('❌ [Auto Profile] No valid session found');
            return NextResponse.json({
                success: false,
                message: 'Không tìm thấy phiên đăng nhập',
            }, { status: 401 });
        }

        const userId = session.user.id;
        const userEmail = session.user.email;

        console.log('🔄 [Auto Profile] Processing for user:', userId, userEmail);

        // 1. Kiểm tra và tạo profile nếu chưa có
        const { data: existingProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        let profile = existingProfile;

        if (profileError || !existingProfile) {
            console.log('🔄 [Auto Profile] Creating new profile for user:', userId);

            // Tạo profile mới
            const { data: newProfile, error: createProfileError } = await supabase
                .from('profiles')
                .insert([{
                    id: userId,
                    email: userEmail,
                    full_name: userEmail?.split('@')[0] || 'Bệnh nhân',
                    role: 'patient'
                }])
                .select()
                .single();

            if (createProfileError) {
                console.error('❌ [Auto Profile] Error creating profile:', createProfileError);
                return NextResponse.json({
                    success: false,
                    message: 'Không thể tạo hồ sơ người dùng',
                }, { status: 500 });
            }

            profile = newProfile;
            console.log('✅ [Auto Profile] Profile created successfully');
        } else {
            console.log('✅ [Auto Profile] Profile already exists');
        }

        // 2. Kiểm tra và tạo hồ sơ bệnh nhân nếu chưa có
        const { data: existingPatient, error: patientError } = await supabase
            .from('patients')
            .select('*')
            .eq('profile_id', userId)
            .single();

        let patient = existingPatient;

        if (patientError || !existingPatient) {
            console.log('🔄 [Auto Profile] Creating new patient record for user:', userId);

            // Tạo ID bệnh nhân mới
            const timestamp = Date.now();
            const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            const patientId = `PAT-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${randomSuffix}`;

            // Tạo hồ sơ bệnh nhân mới
            const { data: newPatient, error: createPatientError } = await supabase
                .from('patients')
                .insert([{
                    patient_id: patientId,
                    full_name: profile.full_name,
                    profile_id: userId,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (createPatientError) {
                console.error('❌ [Auto Profile] Error creating patient record:', createPatientError);
                return NextResponse.json({
                    success: false,
                    message: 'Không thể tạo hồ sơ bệnh nhân',
                }, { status: 500 });
            }

            patient = newPatient;
            console.log('✅ [Auto Profile] Patient record created successfully with ID:', patientId);
        } else {
            console.log('✅ [Auto Profile] Patient record already exists with ID:', patient.patient_id);
        }

        return NextResponse.json({
            success: true,
            message: 'Hồ sơ đã được tự động cập nhật',
            data: {
                profile: profile,
                patient: patient,
                isNewProfile: !existingProfile,
                isNewPatient: !existingPatient
            }
        });

    } catch (error: any) {
        console.error('❌ [Auto Profile] Error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Có lỗi xảy ra khi tự động cập nhật hồ sơ',
        }, { status: 500 });
    }
} 