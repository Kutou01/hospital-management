import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
            return NextResponse.json({
                success: false,
                error: 'Not authenticated'
            }, { status: 401 });
        }
        
        console.log('🔄 [Clean User Payments] Processing user:', user.email);
        
        // Get profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
        if (profileError || !profile) {
            return NextResponse.json({
                success: false,
                error: 'Profile not found'
            }, { status: 404 });
        }
        
        // Get or create patient record
        let { data: patient, error: patientError } = await supabase
            .from('patients')
            .select('patient_id')
            .eq('profile_id', user.id)
            .single();
            
        if (patientError || !patient) {
            // Create patient record
            const newPatientId = `PAT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${user.email.split('@')[0].toUpperCase()}`;
            
            const { data: newPatient, error: createError } = await supabase
                .from('patients')
                .insert({
                    patient_id: newPatientId,
                    profile_id: user.id,
                    full_name: profile.full_name || user.email.split('@')[0],
                    status: 'active'
                })
                .select('patient_id')
                .single();
                
            if (createError) {
                console.error('❌ [Clean User Payments] Error creating patient:', createError);
                return NextResponse.json({
                    success: false,
                    error: 'Failed to create patient record'
                }, { status: 500 });
            }
            
            patient = newPatient;
            console.log('✅ [Clean User Payments] Created patient:', patient.patient_id);
        }
        
        const patientId = patient.patient_id;
        
        // Clean existing test payments for this user
        const { error: deleteError } = await supabase
            .from('payments')
            .delete()
            .eq('patient_id', patientId);
            
        if (deleteError) {
            console.warn('⚠️ [Clean User Payments] Error deleting old payments:', deleteError);
        }
        
        // Create 1 realistic payment based on user's actual usage
        const realPayment = {
            order_code: `${Date.now()}001`,
            amount: 300000, // Standard consultation fee
            description: `Khám tổng quát - Bác sĩ Nguyễn Văn A`,
            status: 'completed',
            payment_method: 'PayOS',
            doctor_name: 'Bác sĩ Nguyễn Văn A',
            doctor_id: 'DOC000001',
            patient_id: patientId,
            transaction_id: `TXN_${Date.now()}_REAL`,
            payment_link_id: `PL_${Date.now()}_REAL`,
            paid_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
        };
        
        // Insert the real payment
        const { data: insertedPayment, error: insertError } = await supabase
            .from('payments')
            .insert([realPayment])
            .select()
            .single();
            
        if (insertError) {
            console.error('❌ [Clean User Payments] Error creating payment:', insertError);
            return NextResponse.json({
                success: false,
                error: 'Failed to create payment'
            }, { status: 500 });
        }
        
        console.log('✅ [Clean User Payments] Created real payment:', insertedPayment.order_code);
        
        return NextResponse.json({
            success: true,
            message: `Cleaned and created 1 realistic payment for user ${user.email}`,
            data: {
                user_email: user.email,
                patient_id: patientId,
                payment: insertedPayment,
                actions_taken: [
                    'Verified/created patient record',
                    'Cleaned old test payments',
                    'Created 1 realistic payment'
                ]
            }
        });
        
    } catch (error) {
        console.error('❌ [Clean User Payments] Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
