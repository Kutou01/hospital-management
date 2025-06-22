import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '10');
        const patientId = searchParams.get('patient_id');
        
        console.log('🔍 [Debug List Payments] Starting...');
        const supabase = await createClient();
        
        let query = supabase
            .from('payments')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
            
        if (patientId) {
            query = query.eq('patient_id', patientId);
        }
        
        const { data: payments, error } = await query;

        if (error) {
            throw error;
        }

        console.log(`📊 [Debug List Payments] Found ${payments?.length || 0} payments`);

        // Get current user info
        const { data: { user } } = await supabase.auth.getUser();
        
        // Get patient info for current user
        let currentPatientId = null;
        if (user) {
            const { data: patient } = await supabase
                .from('patients')
                .select('patient_id')
                .eq('profile_id', user.id)
                .single();
            currentPatientId = patient?.patient_id;
        }

        return NextResponse.json({
            success: true,
            data: {
                payments: payments || [],
                total: payments?.length || 0,
                current_user: user?.email,
                current_patient_id: currentPatientId,
                filter: patientId ? `patient_id = ${patientId}` : 'all payments'
            }
        });

    } catch (error) {
        console.error('❌ [Debug List Payments] Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
