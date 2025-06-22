import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        
        // Get the target patient_id from request or use default
        const { targetPatientId } = await request.json().catch(() => ({ targetPatientId: 'PAT-202506-NAM' }));
        
        console.log('🔧 [Fix Payments] Updating payments with patient_id:', targetPatientId);
        
        // Update all payments that have null patient_id
        const { data: updatedPayments, error } = await supabase
            .from('payments')
            .update({ patient_id: targetPatientId })
            .is('patient_id', null)
            .select('id, order_code, patient_id');
            
        if (error) {
            console.error('❌ [Fix Payments] Error updating payments:', error);
            return NextResponse.json({
                success: false,
                error: error.message
            }, { status: 500 });
        }
        
        console.log('✅ [Fix Payments] Updated payments:', updatedPayments?.length || 0);
        
        return NextResponse.json({
            success: true,
            message: `Updated ${updatedPayments?.length || 0} payments with patient_id: ${targetPatientId}`,
            data: {
                updated_count: updatedPayments?.length || 0,
                target_patient_id: targetPatientId,
                updated_payments: updatedPayments
            }
        });
        
    } catch (error) {
        console.error('❌ [Fix Payments] Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}

// GET method to check current status
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        
        // Get payments statistics
        const { data: allPayments } = await supabase
            .from('payments')
            .select('id, patient_id, order_code, status');
            
        const totalPayments = allPayments?.length || 0;
        const paymentsWithPatientId = allPayments?.filter(p => p.patient_id !== null).length || 0;
        const paymentsWithoutPatientId = totalPayments - paymentsWithPatientId;
        
        // Group by patient_id
        const paymentsByPatient = allPayments?.reduce((acc: any, payment) => {
            const patientId = payment.patient_id || 'null';
            if (!acc[patientId]) {
                acc[patientId] = [];
            }
            acc[patientId].push(payment);
            return acc;
        }, {});
        
        return NextResponse.json({
            success: true,
            data: {
                total_payments: totalPayments,
                payments_with_patient_id: paymentsWithPatientId,
                payments_without_patient_id: paymentsWithoutPatientId,
                coverage_percentage: totalPayments > 0 ? ((paymentsWithPatientId / totalPayments) * 100).toFixed(2) : 0,
                payments_by_patient: paymentsByPatient
            }
        });
        
    } catch (error) {
        console.error('❌ [Fix Payments] Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
