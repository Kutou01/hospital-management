import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * 🧪 SIMPLE TEST ENDPOINTS
 * Basic endpoints to test system functionality
 */

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
    try {
        // Test database connection
        const { data: testQuery, error } = await supabase
            .from('patients')
            .select('patient_id')
            .limit(1);

        if (error) {
            return NextResponse.json({
                success: false,
                message: 'Database connection failed',
                error: error.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Test endpoints are working',
            timestamp: new Date().toISOString(),
            database: 'Connected',
            patients_count: testQuery?.length || 0
        });

    } catch (error) {
        return NextResponse.json({
            success: false,
            message: 'Test endpoint error',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        // Simple booking test without complex logic
        if (body.test_type === 'booking') {
            const appointmentId = `TEST-APT-${Date.now()}`;
            const orderCode = `TEST-ORDER-${Date.now()}`;

            // Just return success without database operations for now
            return NextResponse.json({
                success: true,
                message: 'Test booking successful',
                data: {
                    appointment_id: appointmentId,
                    order_code: orderCode,
                    patient_name: body.patient_name || 'Test Patient',
                    doctor_name: 'Test Doctor',
                    appointment_date: body.appointment_date || new Date().toISOString().split('T')[0],
                    appointment_time: body.start_time || '10:00',
                    consultation_fee: 250000,
                    payment_url: null
                }
            });
        }

        // Simple webhook test
        if (body.test_type === 'webhook') {
            return NextResponse.json({
                success: true,
                message: 'Test webhook processed successfully',
                data: {
                    order_code: body.data?.orderCode || 'TEST-ORDER',
                    payment_id: 'TEST-PAYMENT-ID',
                    appointment_id: 'TEST-APPOINTMENT-ID',
                    status: 'completed'
                }
            });
        }

        return NextResponse.json({
            success: false,
            message: 'Unknown test type',
            available_types: ['booking', 'webhook']
        }, { status: 400 });

    } catch (error) {
        return NextResponse.json({
            success: false,
            message: 'Test POST endpoint error',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
