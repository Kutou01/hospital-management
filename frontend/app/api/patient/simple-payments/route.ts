import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        
        console.log('🚀 [Simple Payments API] Starting...');

        // Get authorization header
        const authHeader = request.headers.get('authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ [Simple Payments API] No auth header');
            
            // Return all payments for testing (no auth)
            const { data: payments, error } = await supabase
                .from('payments')
                .select(`
                    id,
                    order_code,
                    amount,
                    description,
                    status,
                    payment_method,
                    doctor_name,
                    patient_id,
                    created_at,
                    paid_at
                `)
                .eq('status', 'completed')
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) {
                console.error('❌ [Simple Payments API] Database error:', error);
                return NextResponse.json({
                    success: false,
                    error: error.message
                }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                data: payments || [],
                count: payments?.length || 0,
                message: 'No auth - showing all payments'
            });
        }

        const token = authHeader.substring(7);
        console.log('🔐 [Simple Payments API] Token length:', token.length);

        // Try to get user
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        
        if (userError || !user) {
            console.log('❌ [Simple Payments API] User error:', userError?.message);
            
            // Fallback: return all payments
            const { data: payments, error } = await supabase
                .from('payments')
                .select(`
                    id,
                    order_code,
                    amount,
                    description,
                    status,
                    payment_method,
                    doctor_name,
                    patient_id,
                    created_at,
                    paid_at
                `)
                .eq('status', 'completed')
                .order('created_at', { ascending: false })
                .limit(10);

            return NextResponse.json({
                success: true,
                data: payments || [],
                count: payments?.length || 0,
                message: 'Auth failed - showing all payments',
                authError: userError?.message
            });
        }

        console.log('✅ [Simple Payments API] User authenticated:', user.id);

        // Try to get profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, role, full_name')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            console.log('❌ [Simple Payments API] Profile error:', profileError?.message);
            
            // Fallback: return all payments
            const { data: payments, error } = await supabase
                .from('payments')
                .select(`
                    id,
                    order_code,
                    amount,
                    description,
                    status,
                    payment_method,
                    doctor_name,
                    patient_id,
                    created_at,
                    paid_at
                `)
                .eq('status', 'completed')
                .order('created_at', { ascending: false })
                .limit(10);

            return NextResponse.json({
                success: true,
                data: payments || [],
                count: payments?.length || 0,
                message: 'Profile not found - showing all payments',
                profileError: profileError?.message
            });
        }

        console.log('✅ [Simple Payments API] Profile found:', profile.role);

        // Get patient_id if user is a patient
        let currentPatientId = null;
        if (profile.role === 'patient') {
            const { data: patient, error: patientError } = await supabase
                .from('patients')
                .select('patient_id')
                .eq('profile_id', profile.id)
                .single();

            if (patient) {
                currentPatientId = patient.patient_id;
                console.log('✅ [Simple Payments API] Patient ID found:', currentPatientId);
            } else {
                console.log('❌ [Simple Payments API] Patient record not found:', patientError?.message);
            }
        }

        // Get payments
        let query = supabase
            .from('payments')
            .select(`
                id,
                order_code,
                amount,
                description,
                status,
                payment_method,
                doctor_name,
                patient_id,
                created_at,
                paid_at
            `)
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(10);

        // Filter by patient_id if available
        if (profile.role === 'patient' && currentPatientId) {
            query = query.eq('patient_id', currentPatientId);
            console.log('🔒 [Simple Payments API] Filtering by patient_id:', currentPatientId);
        }

        const { data: payments, error } = await query;

        if (error) {
            console.error('❌ [Simple Payments API] Query error:', error);
            return NextResponse.json({
                success: false,
                error: error.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: payments || [],
            count: payments?.length || 0,
            userInfo: {
                userId: user.id,
                role: profile.role,
                patientId: currentPatientId
            },
            message: currentPatientId ? 
                `Filtered payments for patient: ${currentPatientId}` : 
                'Showing all payments (no patient filter)'
        });

    } catch (error) {
        console.error('❌ [Simple Payments API] Unexpected error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
