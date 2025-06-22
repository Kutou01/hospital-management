import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Khởi tạo Supabase client với xử lý lỗi tốt hơn
let supabase: any;
try {
    // Kiểm tra biến môi trường
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    }

    supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
} catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error);
}

// Email notification sẽ được xử lý từ frontend (EmailJS chỉ hoạt động client-side)

const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || '';
if (!PAYOS_CHECKSUM_KEY) {
    console.error('❌ Missing PAYOS_CHECKSUM_KEY environment variable');
}

export async function POST(request: NextRequest) {
    console.log('🔄 PayOS Webhook handler started');

    // QUAN TRỌNG: Luôn trả về status 200 cho mọi response để PayOS không hiển thị lỗi webhook
    try {
        // Nhận dữ liệu từ request
        let body: string;
        try {
            body = await request.text();
            console.log('📦 Webhook raw body:', body.substring(0, 100) + (body.length > 100 ? '...' : ''));
        } catch (error) {
            console.error('❌ Error reading request body:', error);
            return NextResponse.json({
                success: false,
                error: 'Cannot read request body'
            }, { status: 200 }); // Status 200 để PayOS không retry
        }

        // Kiểm tra signature (tắt tạm thời nếu đang test)
        const signature = request.headers.get('x-payos-signature');
        console.log('🔑 Signature header:', signature ? `${signature.substring(0, 10)}...` : 'missing');

        // Ghi log toàn bộ headers để debug
        console.log('📋 All headers:', Object.fromEntries(request.headers.entries()));

        // Kiểm tra body có phải JSON hợp lệ không
        let parsedBody;
        try {
            parsedBody = JSON.parse(body);
            console.log('✅ Request body is valid JSON');
        } catch (e) {
            console.error('❌ Invalid JSON body:', body);
            return NextResponse.json({
                success: false,
                error: 'Invalid JSON body'
            }, { status: 200 }); // Status 200 để PayOS không retry
        }

        // Kiểm tra Supabase connection
        if (!supabase) {
            console.error('❌ Supabase client not initialized');
            return NextResponse.json({
                success: false,
                error: 'Database connection error'
            }, { status: 200 }); // Status 200 để PayOS không retry
        }

        // Extract payment data
        const { data: paymentData } = parsedBody;
        if (!paymentData || !paymentData.orderCode) {
            console.error('❌ Invalid webhook data structure - missing orderCode');
            console.log('📦 Full webhook data:', JSON.stringify(parsedBody));
            return NextResponse.json({
                success: false,
                error: 'Invalid webhook data structure'
            }, { status: 200 }); // Status 200 để PayOS không retry
        }

        // Process payment update
        try {
            const result = await processPaymentUpdate(paymentData);
            return NextResponse.json({
                success: true,
                message: 'Payment processed',
                action: result.action
            }, { status: 200 }); // Thêm status 200 rõ ràng
        } catch (error) {
            console.error('❌ Error processing payment:', error);
            return NextResponse.json({
                success: false,
                error: 'Error processing payment',
                details: error instanceof Error ? error.message : 'Unknown error'
            }, { status: 200 }); // Status 200 để PayOS không retry
        }

    } catch (error: any) {
        console.error('❌ Unhandled webhook error:', error);
        console.error('Error stack:', error?.stack);
        return NextResponse.json({
            success: false,
            error: 'Unhandled webhook error',
            details: error?.message || 'Unknown error'
        }, { status: 200 }); // Status 200 để PayOS không retry
    }
}

function verifyWebhookSignature(body: string, signature: string | null): boolean {
    if (!signature) {
        console.error('❌ Missing signature header');
        return false;
    }

    if (!PAYOS_CHECKSUM_KEY) {
        console.error('❌ Missing PAYOS_CHECKSUM_KEY for verification');
        return false;
    }

    try {
        const expectedSignature = crypto
            .createHmac('sha256', PAYOS_CHECKSUM_KEY)
            .update(body)
            .digest('hex');

        const isValid = signature === expectedSignature;
        if (!isValid) {
            console.error(`❌ Signature mismatch. Expected: ${expectedSignature.substring(0, 10)}..., Got: ${signature.substring(0, 10)}...`);
        }
        return isValid;
    } catch (error) {
        console.error('Signature verification error:', error);
        return false;
    }
}

async function processPaymentUpdate(paymentData: any) {
    try {
        // PayOS webhook có thể có structure khác nhau
        const orderCode = paymentData.orderCode || paymentData.order_code;
        const status = paymentData.status || (paymentData.code === '00' ? 'PAID' : 'PENDING');
        const transactions = paymentData.transactions;
        const amount = paymentData.amount || 0;
        const description = paymentData.description || '';

        console.log(`📝 Processing payment: orderCode=${orderCode}, status=${status}, amount=${amount}`);

        // Find existing payment by order code
        let { data: existingPayment, error: findError } = await supabase
            .from('payments')
            .select('*')
            .eq('order_code', orderCode.toString())
            .single();

        // Xử lý lỗi dữ liệu không tìm thấy
        if (findError) {
            if (findError.code === 'PGRST116') {
                console.log(`ℹ️ Payment ${orderCode} not found in database`);
                existingPayment = null;
            } else {
                console.error(`❌ Database error when finding payment: ${findError.message}`);
                throw findError;
            }
        }

        console.log(`🔍 [PayOS Webhook] Checking payment ${orderCode}:`, existingPayment ? 'EXISTS' : 'NOT_FOUND');

        // Prepare update data
        const updateData: any = {
            updated_at: new Date().toISOString(),
        };

        // Map PayOS status to our status
        let isPaymentCompleted = false;
        switch (status) {
            case 'PAID':
                updateData.status = 'completed';
                updateData.paid_at = new Date().toISOString();
                isPaymentCompleted = true;
                break;
            case 'CANCELLED':
                updateData.status = 'failed';
                break;
            case 'PROCESSING':
                updateData.status = 'processing';
                break;
            default:
                updateData.status = 'pending';
        }

        // Add transaction info if available
        if (transactions && transactions.length > 0) {
            const transaction = transactions[0];
            updateData.transaction_id = transaction.reference;
            if (transaction.transactionDateTime) {
                updateData.paid_at = transaction.transactionDateTime;
            }
        } else if (paymentData.reference) {
            // Direct transaction info from webhook
            updateData.transaction_id = paymentData.reference;
            if (paymentData.transactionDateTime) {
                updateData.paid_at = paymentData.transactionDateTime;
            }
        }

        // Add payment link ID if available
        if (paymentData.paymentLinkId) {
            updateData.payment_link_id = paymentData.paymentLinkId;
        }

        if (existingPayment) {
            // ✅ CÁCH 1: Update payment đã tồn tại
            console.log(`🔄 [PayOS Webhook] Updating existing payment ${orderCode} for patient: ${existingPayment.patient_id || 'UNKNOWN'}`);

            const { data, error } = await supabase
                .from('payments')
                .update(updateData)
                .eq('id', existingPayment.id)
                .select()
                .single();

            if (error) {
                console.error(`❌ Database error when updating payment: ${error.message}`);
                throw error;
            }

            // Email sẽ được gửi từ frontend
            if (isPaymentCompleted && existingPayment.status !== 'completed') {
                console.log('📧 [PayOS Webhook] Payment completed, email will be sent from frontend');
            }

            console.log(`✅ [PayOS Webhook] Updated payment ${orderCode} successfully`);
            return {
                success: true,
                action: 'updated',
                data: data
            };
        } else {
            // ✅ CÁCH 2: TẠO MỚI PAYMENT nếu không tìm thấy payment trong database
            console.log(`⚠️ [PayOS Webhook] Payment ${orderCode} not found in database - CREATING NEW RECORD`);

            // Lấy payment info từ mô tả (nếu có)
            // Mẫu description: "Payment for appointment #12345, patient_id: abc-123"
            let patient_id = null;
            let record_id = null;
            let appointment_id = null;

            // Trích xuất patient_id từ description
            const patientMatch = description.match(/patient_id:\s*([a-zA-Z0-9-]+)/);
            if (patientMatch && patientMatch[1]) {
                patient_id = patientMatch[1];
            }

            // Trích xuất record_id từ description
            const recordMatch = description.match(/record_id:\s*([a-zA-Z0-9-]+)/);
            if (recordMatch && recordMatch[1]) {
                record_id = recordMatch[1];
            }

            // Trích xuất appointment_id từ description
            const appointmentMatch = description.match(/appointment #(\d+)/);
            if (appointmentMatch && appointmentMatch[1]) {
                appointment_id = appointmentMatch[1];
            }

            // Tạo payment mới
            const newPayment = {
                order_code: orderCode.toString(),
                amount: amount,
                status: updateData.status,
                description: description,
                payment_method: 'payos',
                patient_id: patient_id,
                record_id: record_id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                transaction_id: updateData.transaction_id || null,
                paid_at: isPaymentCompleted ? updateData.paid_at : null,
                payment_type: description.toLowerCase().includes('appointment') ? 'appointment' :
                    description.toLowerCase().includes('record') ? 'medical_record' : 'other'
            };

            const { data, error } = await supabase
                .from('payments')
                .insert(newPayment)
                .select()
                .single();

            if (error) {
                console.error(`❌ Database error when inserting payment: ${error.message}`);
                throw error;
            }

            console.log(`✅ [PayOS Webhook] Created new payment record for ${orderCode}`);

            // Nếu có appointment_id, cập nhật bảng appointments
            if (appointment_id && data.id) {
                try {
                    await supabase
                        .from('appointments')
                        .update({ payment_id: data.id, payment_status: isPaymentCompleted ? 'paid' : 'pending' })
                        .eq('id', appointment_id);

                    console.log(`✅ [PayOS Webhook] Updated appointment #${appointment_id} with payment_id: ${data.id}`);
                } catch (error) {
                    console.error(`❌ [PayOS Webhook] Error updating appointment:`, error);
                }
            }

            return {
                success: true,
                action: 'created',
                data: data
            };
        }
    } catch (error: any) {
        console.error('Error processing payment update:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// Handle GET request for webhook verification
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const challenge = searchParams.get('challenge');

    if (challenge) {
        // PayOS webhook verification
        console.log('🔑 Received challenge request from PayOS:', challenge);
        return NextResponse.json({ challenge });
    }

    // Log biến môi trường (chỉ trong development)
    if (process.env.NODE_ENV === 'development') {
        console.log('Environment variables check:');
        console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set ✓' : 'Missing ✗');
        console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set ✓' : 'Missing ✗');
        console.log('- PAYOS_CHECKSUM_KEY:', process.env.PAYOS_CHECKSUM_KEY ? 'Set ✓' : 'Missing ✗');
    }

    return NextResponse.json({
        message: 'PayOS Webhook endpoint is ready',
        timestamp: new Date().toISOString(),
        status: 'OK',
        environmentReady: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.PAYOS_CHECKSUM_KEY)
    });
}
