import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * 🔧 FIXED CHATBOT BOOKING HANDLER
 * Implements proper transaction safety for appointment + payment creation
 */

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
    try {
        console.log('🤖 [Fixed Booking] Chatbot booking request received');

        const body = await request.json();
        console.log('📦 [Fixed Booking] Request data:', JSON.stringify(body, null, 2));

        // Validate required fields
        const {
            patient_name,
            patient_phone,
            patient_email,
            doctor_id,
            appointment_date,
            start_time,
            end_time,
            symptoms,
            consultation_fee = 200000
        } = body;

        if (!patient_name || !patient_phone || !doctor_id || !appointment_date || !start_time) {
            return NextResponse.json({
                success: false,
                error: 'Missing required fields',
                required: ['patient_name', 'patient_phone', 'doctor_id', 'appointment_date', 'start_time']
            }, { status: 400 });
        }

        // Generate unique IDs
        const appointmentId = `APT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        const orderCode = `ORDER-${Date.now()}`;

        // Get or create patient
        let patientId: string;
        
        // Try to find existing patient by phone (use correct column name)
        const { data: existingPatient } = await supabase
            .from('patients')
            .select('patient_id')
            .eq('patient_id', `PAT-${patient_phone}`) // Use a pattern or existing patient_id
            .single();

        if (existingPatient) {
            patientId = existingPatient.patient_id;
            console.log('👤 [Fixed Booking] Using existing patient:', patientId);
        } else {
            // Create new patient
            patientId = `PAT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
            
            const { error: patientError } = await supabase
                .from('patients')
                .insert({
                    patient_id: patientId,
                    full_name: patient_name,
                    phone: patient_phone,
                    email: patient_email,
                    date_of_birth: '1990-01-01', // Default value
                    gender: 'other', // Default value
                    address: 'Chưa cập nhật'
                });

            if (patientError) {
                console.error('❌ [Fixed Booking] Patient creation error:', patientError);
                return NextResponse.json({
                    success: false,
                    error: 'Failed to create patient record',
                    details: patientError.message
                }, { status: 500 });
            }

            console.log('👤 [Fixed Booking] Created new patient:', patientId);
        }

        // Get doctor information
        const { data: doctorData, error: doctorError } = await supabase
            .from('doctors')
            .select('doctor_name, specialty')
            .eq('doctor_id', doctor_id)
            .single();

        if (doctorError || !doctorData) {
            return NextResponse.json({
                success: false,
                error: 'Doctor not found',
                details: doctorError?.message
            }, { status: 404 });
        }

        // Calculate end time if not provided
        const calculatedEndTime = end_time || calculateEndTime(start_time);

        // Prepare appointment data
        const appointmentData = {
            appointment_id: appointmentId,
            patient_id: patientId,
            doctor_id: doctor_id,
            appointment_date: appointment_date,
            start_time: start_time,
            end_time: calculatedEndTime,
            appointment_type: 'consultation',
            status: 'scheduled',
            reason: symptoms || 'Khám bệnh qua chatbot',
            consultation_fee: consultation_fee,
            created_by_system: 'chatbot'
        };

        // Prepare payment data
        const paymentData = {
            order_code: orderCode,
            amount: consultation_fee,
            description: `Thanh toán khám bệnh - ${doctorData.doctor_name}`,
            status: 'pending',
            payment_method: 'payos',
            patient_id: patientId,
            doctor_id: doctor_id,
            doctor_name: doctorData.doctor_name
        };

        console.log('🔄 [Fixed Booking] Creating appointment with payment transaction...');

        // Use the new transaction function to create both appointment and payment
        const { data: result, error: transactionError } = await supabase.rpc(
            'create_appointment_with_payment',
            {
                p_appointment_data: appointmentData,
                p_payment_data: paymentData
            }
        );

        if (transactionError || !result?.success) {
            console.error('❌ [Fixed Booking] Transaction error:', transactionError || result);
            return NextResponse.json({
                success: false,
                error: 'Failed to create appointment and payment',
                details: transactionError?.message || result?.error
            }, { status: 500 });
        }

        console.log('✅ [Fixed Booking] Transaction completed successfully:', result);

        // Create PayOS payment link
        let paymentUrl: string | null = null;
        
        try {
            const { payOSService } = await import('@/lib/services/enhanced-payos.service');

            const paymentResult = await payOSService.createPayment({
                appointmentId: appointmentId,
                amount: consultation_fee,
                patientInfo: {
                    name: patient_name,
                    phone: patient_phone,
                    email: patient_email
                },
                serviceInfo: {
                    specialty: doctorData.specialty,
                    doctorName: doctorData.doctor_name,
                    date: appointment_date,
                    time: start_time,
                    description: `Khám ${doctorData.specialty}`
                }
            });

            if (paymentResult.success && paymentResult.data?.checkoutUrl) {
                paymentUrl = paymentResult.data.checkoutUrl;
                console.log('💳 [Fixed Booking] PayOS payment link created:', paymentUrl);
            } else {
                console.error('❌ [Fixed Booking] PayOS payment creation failed:', paymentResult.error);
            }

        } catch (paymentError) {
            console.error('❌ [Fixed Booking] PayOS integration error:', paymentError);
            // Don't fail the booking if payment link creation fails
        }

        // Send confirmation email
        try {
            const { EmailService } = await import('@/lib/services/email.service');
            
            await EmailService.sendAppointmentConfirmationEmail({
                patientName: patient_name,
                patientEmail: patient_email || '',
                appointmentId: appointmentId,
                doctorName: doctorData.doctor_name,
                specialty: doctorData.specialty,
                appointmentDate: appointment_date,
                appointmentTime: start_time,
                symptoms: symptoms || '',
                hospitalName: 'Bệnh viện Đa khoa',
                hospitalAddress: '123 Đường ABC, TP.HCM',
                hospitalPhone: '028-1234-5678'
            });

            console.log('📧 [Fixed Booking] Confirmation email sent');
        } catch (emailError) {
            console.error('⚠️ [Fixed Booking] Email sending failed:', emailError);
            // Don't fail the booking for email errors
        }

        // Return success response
        return NextResponse.json({
            success: true,
            data: {
                appointment_id: appointmentId,
                patient_id: patientId,
                order_code: orderCode,
                payment_id: result.payment_id,
                payment_url: paymentUrl,
                doctor_name: doctorData.doctor_name,
                appointment_date: appointment_date,
                appointment_time: start_time,
                consultation_fee: consultation_fee,
                message: 'Đặt lịch thành công! Vui lòng thanh toán để xác nhận.'
            }
        });

    } catch (error) {
        console.error('❌ [Fixed Booking] Unexpected error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

/**
 * Calculate end time based on start time (30 minutes later)
 */
function calculateEndTime(startTime: string): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // Add 30 minutes
    
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
}

// Handle GET request for health check
export async function GET() {
    return NextResponse.json({
        success: true,
        message: 'Fixed Chatbot Booking Endpoint',
        timestamp: new Date().toISOString()
    });
}
