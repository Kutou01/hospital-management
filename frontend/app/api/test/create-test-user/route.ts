import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { email, password, full_name } = await request.json();
        
        console.log('🧪 [Create Test User] Creating user:', email);
        
        // 1. Create auth user first
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
                full_name: full_name,
                role: 'patient'
            }
        });

        if (authError) {
            console.error('❌ [Create Test User] Auth error:', authError);
            return NextResponse.json({
                success: false,
                error: authError.message
            }, { status: 400 });
        }

        const userId = authData.user.id;
        console.log('✅ [Create Test User] Auth user created:', userId);

        // 2. Create profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: userId,
                email: email,
                full_name: full_name,
                role: 'patient',
                email_verified: true,
                is_active: true
            })
            .select()
            .single();

        if (profileError) {
            console.error('❌ [Create Test User] Profile error:', profileError);
            return NextResponse.json({
                success: false,
                error: profileError.message
            }, { status: 400 });
        }

        console.log('✅ [Create Test User] Profile created');

        // 3. Create patient record
        const patientId = `PAT-TEST-${Date.now()}`;
        const { data: patient, error: patientError } = await supabase
            .from('patients')
            .insert({
                patient_id: patientId,
                profile_id: userId,
                full_name: full_name,
                date_of_birth: '1995-01-01',
                gender: 'male',
                phone: '0901234567',
                address: JSON.stringify({
                    street: '123 Test Street',
                    city: 'TP.HCM',
                    district: 'Quận 1'
                }),
                emergency_contact: JSON.stringify({
                    name: 'Emergency Contact',
                    phone: '0987654321',
                    relationship: 'Family'
                }),
                insurance_info: JSON.stringify({
                    provider: 'BHYT',
                    policy_number: 'TEST123456'
                }),
                chronic_conditions: [],
                status: 'active'
            })
            .select()
            .single();

        if (patientError) {
            console.error('❌ [Create Test User] Patient error:', patientError);
            return NextResponse.json({
                success: false,
                error: patientError.message
            }, { status: 400 });
        }

        console.log('✅ [Create Test User] Patient created:', patientId);

        return NextResponse.json({
            success: true,
            message: 'Test user created successfully',
            data: {
                user_id: userId,
                email: email,
                patient_id: patientId,
                full_name: full_name,
                login_info: {
                    email: email,
                    password: password
                }
            }
        });

    } catch (error) {
        console.error('❌ [Create Test User] Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
