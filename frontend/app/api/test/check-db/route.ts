import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        
        console.log('🔍 [Check DB] Checking database structure...');

        // 1. Kiểm tra cấu trúc payments table
        const { data: paymentsColumns, error: columnsError } = await supabase
            .rpc('get_table_columns', { table_name: 'payments' });

        if (columnsError) {
            console.error('❌ [Check DB] Error getting columns:', columnsError);
        }

        // 2. Kiểm tra payments có patient_id không
        const { data: samplePayments, error: paymentsError } = await supabase
            .from('payments')
            .select('id, order_code, patient_id, status, amount')
            .limit(5);

        if (paymentsError) {
            console.error('❌ [Check DB] Error getting payments:', paymentsError);
        }

        // 3. Kiểm tra profiles table
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, email, role, full_name')
            .limit(5);

        if (profilesError) {
            console.error('❌ [Check DB] Error getting profiles:', profilesError);
        }

        // 4. Kiểm tra patients table
        const { data: patients, error: patientsError } = await supabase
            .from('patients')
            .select('patient_id, profile_id, full_name')
            .limit(5);

        if (patientsError) {
            console.error('❌ [Check DB] Error getting patients:', patientsError);
        }

        return NextResponse.json({
            success: true,
            data: {
                paymentsColumns: paymentsColumns || 'RPC not available',
                samplePayments: samplePayments || [],
                profiles: profiles || [],
                patients: patients || [],
                errors: {
                    columnsError: columnsError?.message,
                    paymentsError: paymentsError?.message,
                    profilesError: profilesError?.message,
                    patientsError: patientsError?.message
                }
            }
        });

    } catch (error) {
        console.error('❌ [Check DB] Unexpected error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { action } = await request.json();
        
        console.log('🔧 [Check DB] Performing action:', action);

        if (action === 'create_profile_and_patient') {
            // Tạo profile và patient cho user hiện tại
            const userId = '34111382-07b2-40ca-af28-69af7341e594';
            const userEmail = 'namprophunong003@gmail.com';

            // 1. Tạo profile với service role (bypass RLS)
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    email: userEmail,
                    full_name: userEmail.split('@')[0],
                    role: 'patient',
                    email_verified: true,
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'id'
                })
                .select()
                .single();

            if (profileError) {
                console.error('❌ [Check DB] Profile error:', profileError);
                return NextResponse.json({
                    success: false,
                    error: 'Failed to create profile: ' + profileError.message
                }, { status: 500 });
            }

            // 2. Tạo patient record
            const patientId = `PAT-${Date.now()}`;
            const { data: patient, error: patientError } = await supabase
                .from('patients')
                .upsert({
                    patient_id: patientId,
                    profile_id: userId,
                    full_name: userEmail.split('@')[0],
                    date_of_birth: '1990-01-01',
                    gender: 'male',
                    phone: '0123456789',
                    address: { street: 'Test Address', city: 'Ho Chi Minh' },
                    emergency_contact: { name: 'Emergency Contact', phone: '0987654321' },
                    insurance_info: {},
                    chronic_conditions: [],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'profile_id'
                })
                .select()
                .single();

            if (patientError) {
                console.error('❌ [Check DB] Patient error:', patientError);
                return NextResponse.json({
                    success: false,
                    error: 'Failed to create patient: ' + patientError.message
                }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                data: {
                    profile,
                    patient,
                    message: 'Profile and patient created successfully'
                }
            });
        }

        return NextResponse.json({
            success: false,
            error: 'Unknown action'
        }, { status: 400 });

    } catch (error) {
        console.error('❌ [Check DB] POST error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
