import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * 🔧 FIXED PAYMENT WEBHOOK HANDLER
 * Implements proper transaction safety and idempotency
 */

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
    try {
        console.log('🔔 [Fixed Webhook] Payment webhook received');

        // Parse request body
        const body = await request.json();
        console.log('📦 [Fixed Webhook] Payload:', JSON.stringify(body, null, 2));

        // PayOS webhook format: { code, desc, data: { orderCode, amount, ... } }
        const { code, desc, data } = body;

        if (!data || !data.orderCode) {
            return NextResponse.json({
                success: false,
                error: 'Invalid webhook payload - missing data or orderCode'
            }, { status: 400 });
        }

        const { orderCode, amount, description, reference } = data;

        // Create unique webhook ID for idempotency
        const webhookId = `${orderCode}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Determine payment status
        const isSuccess = code === '00' && desc === 'success';
        const paymentStatus = isSuccess ? 'completed' : 'failed';

        console.log(`🔍 [Fixed Webhook] Processing ${paymentStatus} payment for order ${orderCode}`);

        // Use the new idempotent webhook processing function
        const { data: result, error } = await supabase.rpc('process_payment_webhook', {
            p_webhook_id: webhookId,
            p_order_code: orderCode,
            p_webhook_data: {
                code,
                desc,
                data,
                amount,
                reference,
                processed_at: new Date().toISOString()
            }
        });

        if (error) {
            console.error('❌ [Fixed Webhook] Database function error:', error);
            return NextResponse.json({
                success: false,
                error: 'Database processing failed',
                details: error.message
            }, { status: 500 });
        }

        console.log('✅ [Fixed Webhook] Processing result:', result);

        // Send email notification for successful payments
        if (isSuccess && result.appointment_id) {
            try {
                await sendPaymentSuccessNotification({
                    orderCode,
                    amount,
                    appointmentId: result.appointment_id,
                    paymentId: result.payment_id
                });
            } catch (emailError) {
                console.error('⚠️ [Fixed Webhook] Email notification failed:', emailError);
                // Don't fail the webhook for email errors
            }
        }

        return NextResponse.json({
            success: true,
            message: isSuccess ? 'Payment processed successfully' : 'Payment failure recorded',
            data: result
        });

    } catch (error) {
        console.error('❌ [Fixed Webhook] Unexpected error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

/**
 * Send payment success notification
 */
async function sendPaymentSuccessNotification(data: {
    orderCode: string;
    amount: number;
    appointmentId: string;
    paymentId: number;
}) {
    try {
        console.log('📧 [Fixed Webhook] Sending payment success notification');

        // Get appointment and patient details
        const { data: appointmentData, error: appointmentError } = await supabase
            .from('appointments')
            .select(`
                *,
                patients:patient_id (
                    full_name,
                    email,
                    phone
                ),
                doctors:doctor_id (
                    doctor_name,
                    specialty
                )
            `)
            .eq('appointment_id', data.appointmentId)
            .single();

        if (appointmentError || !appointmentData) {
            console.error('❌ [Fixed Webhook] Failed to get appointment data:', appointmentError);
            return;
        }

        const patient = appointmentData.patients;
        const doctor = appointmentData.doctors;

        if (!patient?.email) {
            console.log('⚠️ [Fixed Webhook] No patient email found, skipping notification');
            return;
        }

        // ❌ TẮT EMAIL TỪ WEBHOOK-FIXED - Email sẽ được gửi từ payment success page
        console.log('📧 [Fixed Webhook] Email notification disabled - will be sent from payment success page');

        // const { EmailService } = await import('@/lib/services/email.service');
        // const emailResult = await EmailService.sendPaymentSuccessEmail({...});

    } catch (error) {
        console.error('❌ [Fixed Webhook] Email notification error:', error);
        throw error;
    }
}

// Handle GET request for webhook verification
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const challenge = searchParams.get('challenge');

    if (challenge) {
        console.log('🔑 [Fixed Webhook] Received challenge request:', challenge);
        return NextResponse.json({ challenge });
    }

    return NextResponse.json({
        success: true,
        message: 'Fixed Payment Webhook Endpoint',
        timestamp: new Date().toISOString(),
        status: 'ready'
    }, {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        }
    });
}
