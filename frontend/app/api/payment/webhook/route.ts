import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// Cấu hình thông tin PayOS
const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID;
const PAYOS_API_KEY = process.env.PAYOS_API_KEY;
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY;

// Hàm tạo hoặc cập nhật thông tin thanh toán
async function createOrUpdatePayment(paymentData: any) {
    try {
        const supabase = createClient();

        const { orderCode, amount, description, status, paymentLinkId, recordId, doctorId, doctorName } = paymentData;

        // Lấy patient_id từ record_id nếu có
        let patientId = null;
        if (recordId) {
            console.log(`🔍 [Webhook] Getting patient_id from record_id: ${recordId}`);
            try {
                const { data: medicalRecord, error: recordError } = await supabase
                    .from('medical_records')
                    .select('patient_id')
                    .eq('record_id', recordId)
                    .single();

                if (!recordError && medicalRecord) {
                    patientId = medicalRecord.patient_id;
                    console.log(`✅ [Webhook] Found patient_id: ${patientId} for record: ${recordId}`);
                } else {
                    console.log(`⚠️ [Webhook] No patient_id found for record: ${recordId}`, recordError?.message);
                }
            } catch (error) {
                console.error(`❌ [Webhook] Error getting patient_id from record ${recordId}:`, error);
            }
        }

        // Kiểm tra xem payment đã tồn tại chưa
        const { data: existingPayment, error: checkError } = await supabase
            .from('payments')
            .select('*')
            .eq('order_code', orderCode)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            console.error('Error checking existing payment:', checkError);
            return false;
        }

        if (existingPayment) {
            // Cập nhật payment hiện có - bao gồm patient_id nếu chưa có
            const updateData: any = {
                status: status,
                paid_at: status === 'completed' ? new Date().toISOString() : null,
                updated_at: new Date().toISOString()
            };

            // Nếu payment hiện tại chưa có patient_id và chúng ta tìm được patient_id
            if (!existingPayment.patient_id && patientId) {
                updateData.patient_id = patientId;
                console.log(`🔄 [Webhook] Adding patient_id ${patientId} to existing payment ${orderCode}`);
            }

            const { error: updateError } = await supabase
                .from('payments')
                .update(updateData)
                .eq('order_code', orderCode);

            if (updateError) {
                console.error('Error updating payment:', updateError);
                return false;
            }
        } else {
            // Tạo payment mới - bao gồm patient_id
            const insertData: any = {
                order_code: orderCode,
                amount: amount,
                description: description,
                status: status,
                payment_method: 'payos',
                record_id: recordId,
                doctor_id: doctorId,
                doctor_name: doctorName,
                payment_link_id: paymentLinkId,
                paid_at: status === 'completed' ? new Date().toISOString() : null
            };

            // Thêm patient_id nếu có
            if (patientId) {
                insertData.patient_id = patientId;
                console.log(`✅ [Webhook] Creating payment ${orderCode} with patient_id: ${patientId}`);
            } else {
                console.log(`⚠️ [Webhook] Creating payment ${orderCode} without patient_id`);
            }

            const { error: insertError } = await supabase
                .from('payments')
                .insert(insertData);

            if (insertError) {
                console.error('Error creating payment:', insertError);
                return false;
            }
        }

        console.log(`Payment ${existingPayment ? 'updated' : 'created'} for order ${orderCode}: ${status}`);
        return true;
    } catch (error) {
        console.error('Error in createOrUpdatePayment:', error);
        return false;
    }
}

// Hàm cập nhật trạng thái hồ sơ y tế
async function updateMedicalRecordPaymentStatus(orderCode: string, status: string, amount?: number) {
    try {
        const supabase = createClient();

        // Cập nhật medical_records theo order_code
        const { error } = await supabase
            .from('medical_records')
            .update({
                payment_status: status,
                payment_amount: amount,
                order_code: orderCode,
                updated_at: new Date().toISOString()
            })
            .eq('order_code', orderCode);

        if (error) {
            console.error('Error updating medical record payment status:', error);
            return false;
        }

        console.log(`Medical record payment status updated for order ${orderCode}: ${status}`);
        return true;
    } catch (error) {
        console.error('Error in updateMedicalRecordPaymentStatus:', error);
        return false;
    }
}

// Hàm gửi thông báo thanh toán thành công qua email
async function sendPaymentSuccessNotification(paymentData: {
    orderCode: string;
    amount: number;
    doctorName: string;
    recordId: string | null;
    patientId?: string;
}) {
    try {
        const supabase = createClient();
        console.log('📧 [Webhook] Starting email notification for payment:', paymentData.orderCode);

        // Lấy thông tin bệnh nhân - ưu tiên từ payment record trước
        let patientInfo = null;

        // Cách 1: Lấy từ payment record nếu có patient_id
        if (paymentData.patientId) {
            console.log('🔍 [Webhook] Getting patient info from patient_id:', paymentData.patientId);

            const { data: patient, error: patientError } = await supabase
                .from('patients')
                .select(`
                    patient_id,
                    full_name,
                    profile:profiles!patients_profile_id_fkey (
                        id,
                        email,
                        phone_number
                    )
                `)
                .eq('patient_id', paymentData.patientId)
                .single();

            if (!patientError && patient?.profile?.email) {
                patientInfo = {
                    patient_id: patient.patient_id,
                    full_name: patient.full_name,
                    email: patient.profile.email,
                    phone_number: patient.profile.phone_number
                };
            }
        }

        // Cách 2: Lấy từ medical record nếu có record_id
        if (!patientInfo && paymentData.recordId) {
            console.log('🔍 [Webhook] Getting patient info from medical record:', paymentData.recordId);

            const { data: medicalRecord, error: recordError } = await supabase
                .from('medical_records')
                .select(`
                    *,
                    patients (
                        patient_id,
                        full_name,
                        profile:profiles!patients_profile_id_fkey (
                            id,
                            email,
                            phone_number
                        )
                    )
                `)
                .eq('record_id', paymentData.recordId)
                .single();

            if (!recordError && medicalRecord?.patients?.profile?.email) {
                patientInfo = {
                    patient_id: medicalRecord.patients.patient_id,
                    full_name: medicalRecord.patients.full_name,
                    email: medicalRecord.patients.profile.email,
                    phone_number: medicalRecord.patients.profile.phone_number
                };
            }
        }

        if (!patientInfo?.email) {
            console.log('⚠️ [Webhook] No patient email found, skipping email notification');
            return;
        }

        // Gửi email thông báo thanh toán thành công
        console.log('📧 [Webhook] Sending email to:', patientInfo.email);

        // Import EmailService dynamically để tránh lỗi server-side
        const { EmailService } = await import('@/lib/services/email.service');

        const emailResult = await EmailService.sendPaymentSuccessEmail({
            patientName: patientInfo.full_name,
            patientEmail: patientInfo.email,
            orderCode: paymentData.orderCode,
            amount: paymentData.amount,
            doctorName: paymentData.doctorName || 'Bác sĩ',
            paymentDate: new Date().toISOString(),
            recordId: paymentData.recordId
        });

        if (emailResult.success) {
            console.log('✅ [Webhook] Email notification sent successfully');
        } else {
            console.error('❌ [Webhook] Failed to send email notification:', emailResult.message);
        }

    } catch (error) {
        console.error('💥 [Webhook] Error sending payment notification:', error);
        // Không throw error để không làm fail webhook
    }
}

export async function POST(request: NextRequest) {
    try {
        console.log('Payment webhook received');

        // Parse request body
        const body = await request.json();
        console.log('Webhook payload:', body);

        // PayOS gửi data trong format: { code, desc, data: { orderCode, amount, ... } }
        const { code, desc, data } = body;

        if (!data || !data.orderCode) {
            return NextResponse.json({
                success: false,
                error: 'Invalid webhook payload - missing data or orderCode'
            }, { status: 400 });
        }

        const { orderCode, amount, description } = data;

        // Kiểm tra trạng thái thanh toán từ PayOS
        // code: "00" = thành công, khác "00" = thất bại
        const isSuccess = code === '00' && desc === 'success';

        // Xử lý trạng thái thanh toán
        if (isSuccess) {
            console.log(`Processing successful payment for order ${orderCode}`);

            // Tìm recordId từ description hoặc từ database
            let recordId = null;

            // Thử tìm recordId từ description (ví dụ: "Thanh toán cho hồ sơ MR-123456")
            const recordMatch = description?.match(/MR-[0-9-]+/);
            if (recordMatch) {
                recordId = recordMatch[0];
            } else {
                // Nếu không tìm thấy trong description, có thể tìm trong database
                try {
                    const supabase = createClient();
                    const { data: paymentData, error } = await supabase
                        .from('payments')
                        .select('record_id')
                        .eq('order_code', orderCode)
                        .single();

                    if (!error && paymentData && paymentData.record_id) {
                        recordId = paymentData.record_id;
                    }
                } catch (err) {
                    console.error('Error fetching record ID from database:', err);
                }
            }

            // Tạo hoặc cập nhật payment
            await createOrUpdatePayment({
                orderCode: orderCode,
                amount: amount,
                description: description,
                status: 'completed',
                paymentLinkId: data.paymentLinkId,
                recordId: recordId,
                doctorId: data.doctorId,
                doctorName: data.doctorName
            });

            // Cập nhật medical_records
            await updateMedicalRecordPaymentStatus(orderCode, 'paid', amount);

            // Gửi thông báo thanh toán thành công qua email
            try {
                // Lấy patient_id từ payment record vừa tạo
                const { data: paymentRecord } = await supabase
                    .from('payments')
                    .select('patient_id')
                    .eq('order_code', orderCode)
                    .single();

                await sendPaymentSuccessNotification({
                    orderCode,
                    amount,
                    doctorName: data.doctorName,
                    recordId,
                    patientId: paymentRecord?.patient_id
                });
            } catch (notificationError) {
                console.error('Failed to send payment notification:', notificationError);
                // Không làm fail toàn bộ process nếu notification lỗi
            }

            return NextResponse.json({
                success: true,
                message: 'Payment processed successfully'
            });
        } else {
            console.log(`Processing failed payment for order ${orderCode}, code: ${code}, desc: ${desc}`);

            // Tạo hoặc cập nhật payment thất bại
            await createOrUpdatePayment({
                orderCode: orderCode,
                amount: amount,
                description: description,
                status: 'failed',
                paymentLinkId: data.paymentLinkId,
                recordId: null,
                doctorId: data.doctorId,
                doctorName: data.doctorName
            });

            // Cập nhật medical_records
            await updateMedicalRecordPaymentStatus(orderCode, 'failed', amount);

            return NextResponse.json({
                success: true,
                message: 'Payment failure recorded'
            });
        }

        // Trạng thái khác (PENDING, etc.)
        return NextResponse.json({
            success: true,
            message: 'Webhook received, no action needed'
        });
    } catch (error: any) {
        console.error('Error processing payment webhook:', error);

        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
} 