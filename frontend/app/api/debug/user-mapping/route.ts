import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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
        
        console.log('🔍 [Debug User Mapping] Current user:', user.email);
        
        // Get profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
        if (profileError) {
            console.error('❌ [Debug User Mapping] Profile error:', profileError);
        }
        
        // Get patient record(s) for this user
        const { data: patients, error: patientsError } = await supabase
            .from('patients')
            .select('*')
            .eq('profile_id', user.id);
            
        if (patientsError) {
            console.error('❌ [Debug User Mapping] Patients error:', patientsError);
        }
        
        // Get all patients with same email (if any)
        const { data: allPatientsWithEmail, error: emailError } = await supabase
            .from('patients')
            .select(`
                *,
                profile:profiles!patients_profile_id_fkey (
                    id,
                    email,
                    full_name
                )
            `)
            .eq('profiles.email', user.email);
            
        // Get payments for each patient_id found
        let paymentsData = [];
        if (patients && patients.length > 0) {
            for (const patient of patients) {
                const { data: payments } = await supabase
                    .from('payments')
                    .select('*')
                    .eq('patient_id', patient.patient_id)
                    .order('created_at', { ascending: false });
                    
                paymentsData.push({
                    patient_id: patient.patient_id,
                    payments: payments || []
                });
            }
        }
        
        // Get all payments that might belong to this user (by email pattern)
        const { data: allPayments } = await supabase
            .from('payments')
            .select('*')
            .order('created_at', { ascending: false });
            
        // Check for payments with null patient_id
        const { data: orphanPayments } = await supabase
            .from('payments')
            .select('*')
            .is('patient_id', null)
            .order('created_at', { ascending: false });
        
        return NextResponse.json({
            success: true,
            data: {
                current_user: {
                    id: user.id,
                    email: user.email,
                    created_at: user.created_at
                },
                profile: profile,
                patient_records: patients || [],
                patients_with_same_email: allPatientsWithEmail || [],
                payments_by_patient: paymentsData,
                total_payments_in_db: allPayments?.length || 0,
                orphan_payments: orphanPayments || [],
                debug_info: {
                    profile_found: !!profile,
                    patient_records_count: patients?.length || 0,
                    has_payments: paymentsData.some(p => p.payments.length > 0)
                }
            }
        });
        
    } catch (error) {
        console.error('❌ [Debug User Mapping] Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
