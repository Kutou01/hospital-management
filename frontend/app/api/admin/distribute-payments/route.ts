import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        
        console.log('🔄 [Distribute Payments] Starting payment distribution...');
        
        // 1. Get all active patients
        const { data: patients, error: patientsError } = await supabase
            .from('patients')
            .select('patient_id, full_name')
            .eq('status', 'active')
            .order('created_at', { ascending: true });
            
        if (patientsError || !patients || patients.length === 0) {
            console.error('❌ [Distribute Payments] No patients found:', patientsError);
            return NextResponse.json({
                success: false,
                error: 'No active patients found'
            }, { status: 404 });
        }
        
        console.log('✅ [Distribute Payments] Found patients:', patients.length);
        
        // 2. Get all payments
        const { data: payments, error: paymentsError } = await supabase
            .from('payments')
            .select('id, order_code, amount, status, created_at')
            .order('created_at', { ascending: true });
            
        if (paymentsError || !payments || payments.length === 0) {
            console.error('❌ [Distribute Payments] No payments found:', paymentsError);
            return NextResponse.json({
                success: false,
                error: 'No payments found'
            }, { status: 404 });
        }
        
        console.log('✅ [Distribute Payments] Found payments:', payments.length);
        
        // 3. Distribute payments evenly among patients
        const distributionResults = [];
        
        for (let i = 0; i < payments.length; i++) {
            const payment = payments[i];
            const patientIndex = i % patients.length; // Round-robin distribution
            const targetPatient = patients[patientIndex];
            
            // Update payment with patient_id
            const { error: updateError } = await supabase
                .from('payments')
                .update({ patient_id: targetPatient.patient_id })
                .eq('id', payment.id);
                
            if (updateError) {
                console.error(`❌ [Distribute Payments] Error updating payment ${payment.order_code}:`, updateError);
            } else {
                distributionResults.push({
                    payment_id: payment.id,
                    order_code: payment.order_code,
                    amount: payment.amount,
                    assigned_to: targetPatient.patient_id,
                    patient_name: targetPatient.full_name
                });
                console.log(`✅ [Distribute Payments] Assigned payment ${payment.order_code} to ${targetPatient.patient_id}`);
            }
        }
        
        // 4. Get final distribution summary
        const distributionSummary = patients.map(patient => {
            const patientPayments = distributionResults.filter(r => r.assigned_to === patient.patient_id);
            return {
                patient_id: patient.patient_id,
                patient_name: patient.full_name,
                payment_count: patientPayments.length,
                total_amount: patientPayments.reduce((sum, p) => sum + p.amount, 0),
                payments: patientPayments.map(p => ({
                    order_code: p.order_code,
                    amount: p.amount
                }))
            };
        });
        
        return NextResponse.json({
            success: true,
            message: `Successfully distributed ${payments.length} payments among ${patients.length} patients`,
            data: {
                total_payments: payments.length,
                total_patients: patients.length,
                distribution_results: distributionResults,
                distribution_summary: distributionSummary
            }
        });
        
    } catch (error) {
        console.error('❌ [Distribute Payments] Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}

// GET method to view current distribution
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        
        // Get payments grouped by patient
        const { data: payments } = await supabase
            .from('payments')
            .select(`
                id,
                order_code,
                amount,
                status,
                patient_id,
                created_at
            `)
            .order('created_at', { ascending: false });
            
        // Get patients info
        const { data: patients } = await supabase
            .from('patients')
            .select('patient_id, full_name');
            
        // Group payments by patient
        const distributionMap = payments?.reduce((acc: any, payment) => {
            const patientId = payment.patient_id || 'unassigned';
            if (!acc[patientId]) {
                acc[patientId] = [];
            }
            acc[patientId].push(payment);
            return acc;
        }, {});
        
        // Add patient names
        const distributionWithNames = Object.entries(distributionMap || {}).map(([patientId, payments]: [string, any]) => {
            const patient = patients?.find(p => p.patient_id === patientId);
            return {
                patient_id: patientId,
                patient_name: patient?.full_name || 'Unknown',
                payment_count: payments.length,
                total_amount: payments.reduce((sum: number, p: any) => sum + p.amount, 0),
                payments: payments
            };
        });
        
        return NextResponse.json({
            success: true,
            data: {
                total_payments: payments?.length || 0,
                distribution: distributionWithNames
            }
        });
        
    } catch (error) {
        console.error('❌ [Distribute Payments] Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
