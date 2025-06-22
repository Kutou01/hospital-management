import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized - Please login'
            }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({
                success: false,
                error: 'Invalid token'
            }, { status: 401 });
        }

        // Check profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, role, full_name, email, phone_number')
            .eq('id', user.id)
            .single();

        // Check patient record
        let patient = null;
        if (profile) {
            const { data: patientData, error: patientError } = await supabase
                .from('patients')
                .select('patient_id, full_name, status')
                .eq('profile_id', profile.id)
                .single();
            
            patient = patientData;
        }

        // Check existing payments
        const { data: payments, error: paymentsError } = await supabase
            .from('payments')
            .select('id, order_code, amount, status, patient_id, record_id')
            .limit(10);

        // Check existing medical records
        const { data: medicalRecords, error: recordsError } = await supabase
            .from('medical_records')
            .select('record_id, patient_id, diagnosis')
            .limit(10);

        return NextResponse.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    created_at: user.created_at
                },
                profile: profile || null,
                patient: patient || null,
                database_stats: {
                    total_payments: payments?.length || 0,
                    total_medical_records: medicalRecords?.length || 0,
                    payments_with_patient_id: payments?.filter(p => p.patient_id)?.length || 0,
                    payments_with_record_id: payments?.filter(p => p.record_id)?.length || 0
                },
                setup_needed: {
                    profile: !profile,
                    patient: !patient,
                    test_data: (payments?.length || 0) === 0
                }
            }
        });

    } catch (error) {
        console.error('Check user setup error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized - Please login'
            }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({
                success: false,
                error: 'Invalid token'
            }, { status: 401 });
        }

        console.log('🔧 [Setup User] Setting up user:', user.id);

        // Use raw SQL to bypass RLS policies
        const profileData = {
            id: user.id,
            email: user.email,
            full_name: user.email?.split('@')[0] || 'Test User',
            role: 'patient',
            phone_number: '0123456789',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // 1. Try to create profile directly (may fail due to RLS)
        let profile = null;

        // First try to get existing profile
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (existingProfile) {
            profile = existingProfile;
            console.log('✅ [Setup User] Profile already exists:', profile.id);
        } else {
            // Try to create new profile
            const { data: newProfile, error: profileError } = await supabase
                .from('profiles')
                .insert(profileData)
                .select()
                .single();

            if (profileError) {
                console.error('Profile creation error:', profileError);

                // If RLS error, provide instructions
                if (profileError.message.includes('row-level security') || profileError.message.includes('policy')) {
                    return NextResponse.json({
                        success: false,
                        error: 'RLS Policy Error - Cần chạy SQL script để fix policies. Chi tiết: ' + profileError.message,
                        fix_instructions: 'Chạy file fix-profiles-rls-policy.sql trên Supabase SQL Editor'
                    }, { status: 500 });
                }

                return NextResponse.json({
                    success: false,
                    error: 'Failed to create profile: ' + profileError.message
                }, { status: 500 });
            }

            profile = newProfile;
        }

        console.log('✅ [Setup User] Profile created/updated:', profile.id);

        // 2. Create patient record
        const patientId = `PAT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Date.now()).slice(-3)}`;

        const { data: patient, error: patientError } = await supabase
            .from('patients')
            .upsert({
                patient_id: patientId,
                profile_id: profile.id,
                full_name: profile.full_name,
                date_of_birth: '1990-01-01', // Default date of birth
                gender: 'male', // Default gender
                blood_type: 'O+',
                address: JSON.stringify({
                    street: '123 Test Street',
                    city: 'TP.HCM',
                    district: 'Quận 1',
                    zipcode: '70000'
                }),
                emergency_contact: JSON.stringify({
                    name: 'Emergency Contact',
                    relationship: 'Family',
                    phone: '0987654321'
                }),
                insurance_info: JSON.stringify({
                    provider: 'BHYT',
                    policy_number: 'TEST123456',
                    expiry_date: '2025-12-31'
                }),
                allergies: ['Không có'],
                chronic_conditions: ['Không có'],
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'profile_id'
            })
            .select()
            .single();

        if (patientError) {
            console.error('Patient creation error:', patientError);
            return NextResponse.json({
                success: false,
                error: 'Failed to create patient: ' + patientError.message
            }, { status: 500 });
        }

        console.log('✅ [Setup User] Patient created/updated:', patient.patient_id);

        return NextResponse.json({
            success: true,
            message: 'User setup completed successfully',
            data: {
                profile: profile,
                patient: patient
            }
        });

    } catch (error) {
        console.error('Setup user error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
