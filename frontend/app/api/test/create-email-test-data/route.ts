import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        console.log('🧪 [Email Test] Creating test data for email notification...');

        // 1. Tạo profile trước
        const profileId = uuidv4();
        const testProfile = {
            id: profileId,
            email: 'gpt2k4@gmail.com', // Email thật để test
            phone_number: '0901234567',
            full_name: 'Nguyễn Văn Test',
            role: 'patient'
        };

        // Sử dụng auth.users để tạo user trước
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: 'gpt2k4@gmail.com',
            password: 'TestPassword123!',
            email_confirm: true,
            user_metadata: {
                full_name: 'Nguyễn Văn Test',
                role: 'patient'
            }
        });

        if (authError) {
            console.error('❌ [Email Test] Failed to create auth user:', authError);
            // Có thể user đã tồn tại, tiếp tục với profile
        }

        // Tạo profile với user ID
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .upsert({
                ...testProfile,
                id: authUser?.user?.id || profileId
            })
            .select()
            .single();

        if (profileError) {
            console.error('❌ [Email Test] Failed to create profile:', profileError);
            return NextResponse.json({
                success: false,
                error: 'Failed to create profile',
                details: profileError
            }, { status: 500 });
        }

        console.log('✅ [Email Test] Profile created:', profile.id);

        // 2. Tạo patient với profile_id
        const testPatient = {
            patient_id: `PAT-TEST-${Date.now()}`,
            profile_id: profile.id,
            full_name: 'Nguyễn Văn Test',
            date_of_birth: '1990-01-01',
            gender: 'male',
            blood_type: 'O+',
            phone_number: '0901234567',
            address: JSON.stringify({
                street: '123 Test Street',
                city: 'TP.HCM',
                district: 'Quận 1',
                zipcode: '70000'
            }),
            emergency_contact: JSON.stringify({
                name: 'Nguyễn Thị Test',
                relationship: 'Vợ',
                phone: '0907654321'
            }),
            insurance_info: JSON.stringify({
                provider: 'BHYT',
                policy_number: 'TEST123456',
                expiry_date: '2025-12-31'
            }),
            allergies: ['Không có'],
            chronic_conditions: ['Không có'],
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data: patient, error: patientError } = await supabase
            .from('patients')
            .insert(testPatient)
            .select()
            .single();

        if (patientError) {
            console.error('❌ [Email Test] Failed to create patient:', patientError);
            return NextResponse.json({
                success: false,
                error: 'Failed to create patient',
                details: patientError
            }, { status: 500 });
        }

        console.log('✅ [Email Test] Patient created:', patient.patient_id);

        // 3. Tạo medical record
        const testRecord = {
            record_id: `REC-TEST-${Date.now()}`,
            patient_id: patient.patient_id,
            doctor_id: 'DOC000001',
            visit_date: new Date().toISOString(),
            chief_complaint: 'Khám tổng quát',
            diagnosis: 'Khỏe mạnh',
            treatment_plan: 'Theo dõi định kỳ',
            status: 'active',
            payment_status: 'pending',
            payment_amount: 300000,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'SYSTEM'
        };

        const { data: medicalRecord, error: recordError } = await supabase
            .from('medical_records')
            .insert(testRecord)
            .select()
            .single();

        if (recordError) {
            console.error('❌ [Email Test] Failed to create medical record:', recordError);
            return NextResponse.json({
                success: false,
                error: 'Failed to create medical record',
                details: recordError
            }, { status: 500 });
        }

        console.log('✅ [Email Test] Medical record created:', medicalRecord.record_id);

        // 4. Tạo payment và trigger email
        const testPayment = {
            order_code: `TEST-EMAIL-${Date.now()}`,
            amount: 300000,
            description: 'Test payment for email notification',
            status: 'completed',
            payment_method: 'payos',
            record_id: medicalRecord.record_id,
            doctor_id: 'DOC000001',
            doctor_name: 'Bác sĩ Test Email',
            patient_id: patient.patient_id,
            transaction_id: `TXN-${Date.now()}`,
            paid_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .insert(testPayment)
            .select()
            .single();

        if (paymentError) {
            console.error('❌ [Email Test] Failed to create payment:', paymentError);
            return NextResponse.json({
                success: false,
                error: 'Failed to create payment',
                details: paymentError
            }, { status: 500 });
        }

        console.log('✅ [Email Test] Payment created:', payment.order_code);

        // 5. Gửi email test
        try {
            const { EmailService } = await import('@/lib/services/email.service');

            const emailResult = await EmailService.sendPaymentSuccessEmail({
                patientName: patient.full_name,
                patientEmail: profile.email,
                orderCode: payment.order_code,
                amount: payment.amount,
                doctorName: payment.doctor_name,
                paymentDate: payment.paid_at,
                recordId: payment.record_id
            });

            console.log('📧 [Email Test] Email result:', emailResult);

            return NextResponse.json({
                success: true,
                message: 'Test data created and email sent successfully',
                data: {
                    profile: profile,
                    patient: patient,
                    medicalRecord: medicalRecord,
                    payment: payment,
                    emailResult: emailResult
                }
            });

        } catch (emailError) {
            console.error('❌ [Email Test] Failed to send email:', emailError);
            return NextResponse.json({
                success: true,
                message: 'Test data created but email failed',
                data: {
                    profile: profile,
                    patient: patient,
                    medicalRecord: medicalRecord,
                    payment: payment,
                    emailError: emailError.message
                }
            });
        }

    } catch (error) {
        console.error('💥 [Email Test] Error creating test data:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to create test data',
            details: error.message
        }, { status: 500 });
    }
}
