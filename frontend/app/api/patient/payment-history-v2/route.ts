import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import axios from 'axios';

// Service URLs - Service-to-Service Architecture
const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || 'http://localhost:3003';
const BILLING_SERVICE_URL = process.env.BILLING_SERVICE_URL || 'http://localhost:3004';
const MEDICAL_RECORDS_SERVICE_URL = process.env.MEDICAL_RECORDS_SERVICE_URL || 'http://localhost:3006';

// Cấu hình timeout ngắn hơn để tránh đợi quá lâu khi services không phản hồi
const SERVICE_TIMEOUT = 2000; // 2 giây thay vì 5 giây

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);

        // Get authorization header
        const authHeader = request.headers.get('authorization');
        console.log('🔐 [Payment History V2 API] Auth header check:', {
            hasAuthHeader: !!authHeader,
            headerStart: authHeader?.substring(0, 20),
            headerLength: authHeader?.length
        });

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ [Payment History V2 API] No valid auth header found');
            return NextResponse.json(
                { success: false, error: 'Unauthorized - Please login' },
                { status: 401 }
            );
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify user authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            console.log('❌ [Payment History V2 API] Invalid token:', authError?.message);
            return NextResponse.json(
                { success: false, error: 'Invalid token' },
                { status: 401 }
            );
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, role, full_name')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            console.log('❌ [Payment History V2 API] Profile not found:', profileError?.message);
            return NextResponse.json(
                { success: false, error: 'Profile not found' },
                { status: 404 }
            );
        }

        console.log('👤 [Payment History V2 API] Profile found:', {
            id: profile.id,
            role: profile.role,
            full_name: profile.full_name
        });

        // Get patient_id for the user
        let currentPatientId: string | null = null;

        if (profile.role === 'patient') {
            // Truy vấn trực tiếp bảng patients để lấy patient_id
            const { data: patient, error: patientError } = await supabase
                .from('patients')
                .select('patient_id, full_name')
                .eq('profile_id', profile.id)
                .single();

            console.log('🔍 [Payment History V2 API] Patient lookup:', {
                profile_id: profile.id,
                patient_found: !!patient,
                patient_error: patientError?.message,
                patient_data: patient
            });

            if (patientError) {
                console.log('❌ [Payment History V2 API] Patient record not found:', patientError.message);

                // Trả về danh sách trống thay vì báo lỗi
                return NextResponse.json({
                    success: true,
                    data: {
                        patient: {
                            patient_id: null,
                            full_name: profile.full_name
                        },
                        payments: [],
                        pagination: {
                            page: 1,
                            limit: 10,
                            total: 0
                        },
                        service_flow: {
                            status: 'patient_not_found'
                        }
                    },
                    source: 'service-to-service-v2'
                });
            }

            // QUAN TRỌNG: Lưu lại patient_id để đảm bảo người dùng chỉ xem được
            // thanh toán của chính họ, không thấy thanh toán của người khác
            currentPatientId = patient.patient_id;
        } else if (profile.role !== 'admin') {
            // Người dùng không phải patient hoặc admin thì từ chối truy cập
            console.log('🚫 [Payment History V2 API] Access denied - User role:', profile.role);
            return NextResponse.json({
                success: false,
                error: 'Access denied - Invalid role'
            }, { status: 403 });
        }

        console.log('👤 [Payment History V2 API] User info:', {
            userId: user.id,
            role: profile.role,
            patientId: currentPatientId,
            fullName: profile.full_name
        });

        // Extract query parameters
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const orderCode = searchParams.get('orderCode');
        const doctorId = searchParams.get('doctorId');

        // LUÔN BẮT ĐẦU BẰNG TRUY VẤN TRỰC TIẾP DATABASE
        // Điều này đảm bảo luồng chính luôn hoạt động ngay cả khi microservices chết
        if (profile.role === 'patient' && currentPatientId) {
            try {
                // Truy vấn trực tiếp bảng payments cho bệnh nhân hiện tại
                const query = supabase
                    .from('payments')
                    .select(`
                        id,
                        order_code,
                        amount,
                        description,
                        status,
                        payment_method,
                        doctor_name,
                        doctor_id,
                        patient_id,
                        transaction_id,
                        payment_link_id,
                        created_at,
                        updated_at,
                        paid_at,
                        record_id
                    `)
                    .eq('patient_id', currentPatientId)
                    .order('created_at', { ascending: false })
                    .range((page - 1) * limit, page * limit - 1);

                // Apply other filters
                if (startDate) query.gte('created_at', startDate);
                if (endDate) query.lte('created_at', endDate);
                if (doctorId) query.eq('doctor_id', doctorId);
                if (orderCode) query.ilike('order_code', `%${orderCode}%`);

                const { data: payments, error: paymentsError } = await query;

                if (paymentsError) {
                    console.error('❌ [Payment History V2 API] Database error:', paymentsError);
                    throw paymentsError;
                }

                // Thêm log chi tiết để debug
                console.log(`🔍 [Payment History V2 API] Found ${payments?.length || 0} payments for patient ${currentPatientId}`);
                if (payments && payments.length > 0) {
                    const statuses = payments.map(p => p.status);
                    const uniqueStatuses = [...new Set(statuses)];
                    console.log(`📊 [Payment History V2 API] Payment statuses found:`, uniqueStatuses);
                    console.log(`📅 [Payment History V2 API] Latest payment:`, payments[0]);
                }

                // Thêm log chi tiết nếu không tìm thấy thanh toán nào
                if (!payments || payments.length === 0) {
                    console.error('❌ [Payment History V2 API] No patient record found for user:', profile.id);
                    return NextResponse.json({
                        success: false,
                        message: 'Không tìm thấy hồ sơ bệnh nhân cho email này. Vui lòng cập nhật hồ sơ bệnh nhân trước khi xem lịch sử thanh toán.'
                    }, { status: 404 });
                }

                const patientId = payments[0].patient_id;
                console.log('🔍 [Payment History V2 API] Found patient ID:', patientId);

                // Kiểm tra và log các thanh toán hiện có của bệnh nhân 
                const { data: existingPayments, error: existingPaymentsError } = await supabase
                    .from('payments')
                    .select('id, order_code, status, patient_id')
                    .eq('patient_id', patientId);

                if (existingPaymentsError) {
                    console.error('❌ [Payment History V2 API] Error checking existing payments:', existingPaymentsError);
                } else {
                    console.log(`✅ [Payment History V2 API] Found ${existingPayments?.length || 0} existing payments for patient ${patientId}`);
                    if (existingPayments && existingPayments.length > 0) {
                        console.log('📊 [Payment History V2 API] First few payments:', existingPayments.slice(0, 3));
                    } else {
                        console.log('⚠️ [Payment History V2 API] No existing payments found for this patient!');

                        // Kiểm tra các thanh toán không có patient_id
                        const { data: unlinkedPayments, error: unlinkedError } = await supabase
                            .from('payments')
                            .select('id, order_code, description, status')
                            .is('patient_id', null)
                            .limit(5);

                        if (!unlinkedError && unlinkedPayments) {
                            console.log(`ℹ️ [Payment History V2 API] Found ${unlinkedPayments.length} unlinked payments that could be linked`);
                            console.log('📊 [Payment History V2 API] Sample unlinked payments:', unlinkedPayments);
                        }
                    }
                }

                // Get count for pagination - sửa để lấy tất cả thanh toán
                const { count, error: countError } = await supabase
                    .from('payments')
                    .select('*', { count: 'exact', head: true })
                    .eq('patient_id', currentPatientId);

                if (countError) throw countError;

                // Lấy thông tin patient
                const { data: patientInfo } = await supabase
                    .from('patients')
                    .select('patient_id, full_name, profile:profiles!patients_profile_id_fkey(email, phone_number)')
                    .eq('patient_id', currentPatientId)
                    .single();

                // Thêm thông tin invoice cho mỗi payment
                const enrichedPayments = payments?.map((payment) => ({
                    ...payment,
                    invoice_data: createBasicInvoiceData(payment, patientInfo || {
                        full_name: profile.full_name,
                        profile: { email: 'N/A' }
                    })
                }));

                return NextResponse.json({
                    success: true,
                    data: {
                        patient: patientInfo || {
                            patient_id: currentPatientId,
                            full_name: profile.full_name
                        },
                        payments: enrichedPayments || [],
                        pagination: {
                            page,
                            limit,
                            total: count || 0,
                            totalPages: Math.ceil((count || 0) / limit)
                        },
                        service_flow: {
                            status: 'direct_database_query'
                        }
                    },
                    source: 'direct-database-query'
                });

            } catch (error) {
                console.error('❌ [Payment History V2 API] Direct database query error:', error);
                // Trả về danh sách trống nếu có lỗi nặng
                return NextResponse.json({
                    success: true,
                    data: {
                        patient: {
                            patient_id: currentPatientId,
                            full_name: profile.full_name
                        },
                        payments: [],
                        pagination: {
                            page,
                            limit,
                            total: 0
                        },
                        service_flow: {
                            status: 'error_fallback'
                        }
                    },
                    source: 'error-fallback'
                });
            }
        } else if (profile.role === 'admin') {
            // Admin có thể xem tất cả payments - gọi trực tiếp database
            console.log('👨‍💼 [Payment History V2 API] Admin access - showing all payments');
            return await fallbackDirectQuery(supabase, null, {
                page, limit, startDate, endDate, orderCode, doctorId
            });
        }

        return NextResponse.json({
            success: false,
            error: 'Invalid request'
        }, { status: 400 });

    } catch (error) {
        console.error('❌ [Payment History V2 API] Unexpected error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}

// Helper functions để tạo invoice data
function createBasicInvoiceData(payment: any, patientInfo: any) {
    return {
        patient_name: patientInfo.full_name || 'N/A',
        patient_email: patientInfo.profile?.email || 'N/A',
        doctor_name: payment.doctor_name || 'N/A',
        service_description: payment.description || 'Dịch vụ y tế',
        amount: payment.amount,
        payment_date: payment.paid_at || payment.created_at,
        order_code: payment.order_code,
        transaction_id: payment.transaction_id
    };
}

function createDetailedInvoiceData(payment: any, patientInfo: any, medicalRecord: any) {
    return {
        patient_name: patientInfo.full_name || 'N/A',
        patient_email: patientInfo.profile?.email || 'N/A',
        doctor_name: payment.doctor_name || 'N/A',
        service_description: medicalRecord.chief_complaint || payment.description || 'Dịch vụ y tế',
        diagnosis: medicalRecord.diagnosis || 'N/A',
        treatment_plan: medicalRecord.treatment_plan || 'N/A',
        visit_date: medicalRecord.visit_date,
        amount: payment.amount,
        payment_date: payment.paid_at || payment.created_at,
        order_code: payment.order_code,
        transaction_id: payment.transaction_id,
        record_id: payment.record_id
    };
}

// Fallback function để query trực tiếp database
async function fallbackDirectQuery(
    supabase: any,
    patientId: string | null,
    filters: {
        page: number;
        limit: number;
        startDate?: string | null;
        endDate?: string | null;
        orderCode?: string | null;
        doctorId?: string | null;
    }
) {
    const { page, limit, startDate, endDate, orderCode, doctorId } = filters;
    const offset = (page - 1) * limit;

    // Build query cơ bản trước
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
            doctor_id,
            patient_id,
            transaction_id,
            payment_link_id,
            created_at,
            updated_at,
            paid_at,
            record_id
        `);

    // Apply patient filter for security
    if (patientId) {
        query = query.eq('patient_id', patientId);
    }

    // Apply other filters
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);
    if (doctorId) query = query.eq('doctor_id', doctorId);
    if (orderCode) query = query.ilike('order_code', `%${orderCode}%`);

    // Execute query with pagination
    const { data: payments, error: paymentsError } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (paymentsError) {
        console.error('❌ [Payment History V2 API] Database error:', paymentsError);
        throw paymentsError;
    }

    // Thêm log chi tiết
    console.log(`🔍 [Payment History V2 API] Fallback query found ${payments?.length || 0} payments`);
    if (payments && payments.length > 0) {
        const statuses = payments.map((p: any) => p.status);
        const uniqueStatuses = [...new Set(statuses)];
        console.log(`📊 [Payment History V2 API] Fallback payment statuses:`, uniqueStatuses);
    }

    // Lấy medical records riêng biệt cho các payments có record_id
    const paymentsWithRecords = await Promise.all(
        (payments || []).map(async (payment: any) => {
            if (payment.record_id) {
                try {
                    // Lấy medical record với patient info
                    const { data: medicalRecord, error: recordError } = await supabase
                        .from('medical_records')
                        .select(`
                            record_id,
                            visit_date,
                            diagnosis,
                            treatment_plan,
                            chief_complaint,
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
                        .eq('record_id', payment.record_id)
                        .single();

                    if (!recordError && medicalRecord) {
                        return {
                            ...payment,
                            medical_records: medicalRecord
                        };
                    }
                } catch (error) {
                    console.error('Error fetching medical record for payment:', error);
                }
            }

            return payment;
        })
    );

    // Get total count
    let countQuery = supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

    if (patientId) countQuery = countQuery.eq('patient_id', patientId);
    if (startDate) countQuery = countQuery.gte('created_at', startDate);
    if (endDate) countQuery = countQuery.lte('created_at', endDate);
    if (doctorId) countQuery = countQuery.eq('doctor_id', doctorId);
    if (orderCode) countQuery = countQuery.ilike('order_code', `%${orderCode}%`);

    const { count, error: countError } = await countQuery;
    if (countError) throw countError;

    // Calculate summary
    let summaryQuery = supabase
        .from('payments')
        .select('amount')
        .eq('status', 'completed');

    if (patientId) summaryQuery = summaryQuery.eq('patient_id', patientId);

    const { data: summaryData, error: summaryError } = await summaryQuery;
    if (summaryError) throw summaryError;

    const totalPaid = summaryData?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
    const totalTransactions = summaryData?.length || 0;
    const averageAmount = totalTransactions > 0 ? totalPaid / totalTransactions : 0;

    return NextResponse.json({
        success: true,
        data: {
            payments: paymentsWithRecords || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            },
            summary: {
                totalPaid,
                totalTransactions,
                averageAmount,
                syncedPayments: totalTransactions, // Fallback mode
                syncRate: 100 // Fallback mode
            }
        },
        source: 'direct-database-fallback'
    });
}
