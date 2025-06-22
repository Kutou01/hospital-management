import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        console.log('🏥 [Create Patient Record] Starting...');
        const supabase = await createClient();
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
            return NextResponse.json({
                success: false,
                error: 'User not authenticated'
            }, { status: 401 });
        }

        console.log('👤 [Create Patient Record] User:', user.email);

        // Check if patient record already exists
        const { data: existingPatient } = await supabase
            .from('patients')
            .select('patient_id')
            .eq('profile_id', user.id)
            .single();

        if (existingPatient) {
            return NextResponse.json({
                success: true,
                message: 'Patient record already exists',
                data: {
                    patient_id: existingPatient.patient_id,
                    user_email: user.email,
                    action: 'existing'
                }
            });
        }

        // Get user profile info
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();

        // Generate patient ID
        const timestamp = Date.now();
        const patientId = `PAT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(timestamp).slice(-6)}`;

        // Create patient record
        const { data: newPatient, error: createError } = await supabase
            .from('patients')
            .insert({
                patient_id: patientId,
                profile_id: user.id,
                full_name: profile?.full_name || user.email?.split('@')[0] || 'Patient',
                email: user.email,
                status: 'active',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (createError) {
            console.error('❌ [Create Patient Record] Error:', createError);
            return NextResponse.json({
                success: false,
                error: createError.message
            }, { status: 500 });
        }

        console.log('✅ [Create Patient Record] Created:', patientId);

        return NextResponse.json({
            success: true,
            message: 'Patient record created successfully',
            data: {
                patient_id: patientId,
                user_email: user.email,
                full_name: newPatient.full_name,
                action: 'created'
            }
        });

    } catch (error) {
        console.error('❌ [Create Patient Record] Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
