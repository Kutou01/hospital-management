import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { amount, description, patient_id } = await request.json();
        
        console.log('🧪 [Create Test Payment] Creating payment...');
        
        // If no patient_id provided, find the most recent test patient
        let targetPatientId = patient_id;
        if (!targetPatientId) {
            const { data: testPatients } = await supabase
                .from('patients')
                .select('patient_id')
                .like('patient_id', 'PAT-TEST-%')
                .order('created_at', { ascending: false })
                .limit(1);
                
            if (testPatients && testPatients.length > 0) {
                targetPatientId = testPatients[0].patient_id;
            } else {
                return NextResponse.json({
                    success: false,
                    error: 'No test patient found. Create a test user first.'
                }, { status: 400 });
            }
        }
        
        console.log('🎯 [Create Test Payment] Using patient_id:', targetPatientId);
        
        // Generate order code
        const orderCode = Date.now().toString();
        
        // Create payment record
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .insert({
                order_code: orderCode,
                amount: amount || 250000,
                description: description || 'Test Payment for Privacy Check',
                status: 'completed',
                payment_method: 'payos',
                patient_id: targetPatientId,
                doctor_id: 'DOC-001',
                doctor_name: 'Dr. Test',
                transaction_id: `TXN-${orderCode}`,
                payment_link_id: `LINK-${orderCode}`,
                paid_at: new Date().toISOString(),
                record_id: `MR-${orderCode}`
            })
            .select()
            .single();

        if (paymentError) {
            console.error('❌ [Create Test Payment] Payment error:', paymentError);
            return NextResponse.json({
                success: false,
                error: paymentError.message
            }, { status: 400 });
        }

        console.log('✅ [Create Test Payment] Payment created:', orderCode);

        return NextResponse.json({
            success: true,
            message: 'Test payment created successfully',
            data: {
                order_code: orderCode,
                amount: payment.amount,
                patient_id: targetPatientId,
                status: payment.status,
                created_at: payment.created_at
            }
        });

    } catch (error) {
        console.error('❌ [Create Test Payment] Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
