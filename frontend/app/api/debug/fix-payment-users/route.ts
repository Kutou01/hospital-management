import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Xác thực để đảm bảo chỉ admin mới được sử dụng chức năng này
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 });
        }

        const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (!user) {
            return NextResponse.json({
                success: false,
                error: 'Invalid token'
            }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        // Chỉ cho phép admin sử dụng
        if (profile?.role !== 'admin') {
            return NextResponse.json({
                success: false,
                error: 'Admin required'
            }, { status: 403 });
        }

        // Lấy các tham số từ request body
        const { forceAll, patientId, autoAssignAll } = await request.json();

        console.log('🔧 [Fix Payments] Params:', { forceAll, patientId, autoAssignAll });

        // 1. Lấy danh sách các thanh toán cần sửa
        let fixQuery = supabase.from('payments').select('*');

        if (!forceAll) {
            // Mặc định chỉ sửa các thanh toán không có patient_id
            fixQuery = fixQuery.is('patient_id', null);
        }

        const { data: paymentsToFix, error: queryError } = await fixQuery;

        if (queryError) {
            console.error('❌ [Fix Payments] Error querying payments:', queryError);
            return NextResponse.json({
                success: false,
                error: queryError.message
            }, { status: 500 });
        }

        console.log(`🔍 [Fix Payments] Found ${paymentsToFix?.length || 0} payments to process`);

        // 2. Lấy danh sách tất cả các bệnh nhân để đối chiếu
        const { data: allPatients } = await supabase
            .from('patients')
            .select('patient_id, full_name, profile:profiles!patients_profile_id_fkey (email)');

        const patientMap = new Map();
        if (allPatients) {
            allPatients.forEach(patient => {
                patientMap.set(patient.patient_id, patient);
            });
        }

        // 3. Xử lý từng thanh toán
        const results = {
            total: paymentsToFix?.length || 0,
            updated: 0,
            errors: 0,
            skipped: 0,
            details: [] as any[]
        };

        if (paymentsToFix) {
            for (const payment of paymentsToFix) {
                try {
                    let assignedPatientId = null;
                    let method = 'unknown';

                    // Nếu có patientId được chỉ định, gán tất cả thanh toán cho patient đó
                    if (patientId && autoAssignAll) {
                        assignedPatientId = patientId;
                        method = 'forced_assignment';
                    }
                    // Ngược lại, cố gắng phân tích từ mô tả
                    else {
                        // Tìm patient_id từ mô tả
                        if (payment.description && payment.description.includes('patient_id:')) {
                            const patientIdMatch = payment.description.match(/patient_id:\s*([^,\s]+)/);
                            if (patientIdMatch && patientIdMatch[1]) {
                                assignedPatientId = patientIdMatch[1];
                                method = 'from_description';
                            }
                        }
                    }

                    // Nếu không tìm được từ mô tả, thử các phương pháp khác
                    if (!assignedPatientId) {
                        // Phương pháp khác để tìm patient_id...

                        // Nếu vẫn không tìm được và có patientId được chỉ định
                        if (patientId) {
                            assignedPatientId = patientId;
                            method = 'default_assignment';
                        }
                    }

                    // Cập nhật thanh toán nếu tìm được patient_id
                    if (assignedPatientId) {
                        const { error: updateError } = await supabase
                            .from('payments')
                            .update({ patient_id: assignedPatientId })
                            .eq('id', payment.id);

                        if (updateError) {
                            console.error(`❌ [Fix Payments] Error updating payment ${payment.id}:`, updateError);
                            results.errors++;
                            results.details.push({
                                payment_id: payment.id,
                                status: 'error',
                                error: updateError.message
                            });
                        } else {
                            console.log(`✅ [Fix Payments] Updated payment ${payment.id} with patient_id ${assignedPatientId} (${method})`);
                            results.updated++;
                            results.details.push({
                                payment_id: payment.id,
                                order_code: payment.order_code,
                                status: 'updated',
                                patient_id: assignedPatientId,
                                method
                            });
                        }
                    } else {
                        console.log(`⚠️ [Fix Payments] Could not determine patient_id for payment ${payment.id}`);
                        results.skipped++;
                        results.details.push({
                            payment_id: payment.id,
                            order_code: payment.order_code,
                            status: 'skipped',
                            reason: 'no_patient_id_found'
                        });
                    }
                } catch (error: any) {
                    console.error(`❌ [Fix Payments] Error processing payment ${payment.id}:`, error);
                    results.errors++;
                    results.details.push({
                        payment_id: payment.id,
                        order_code: payment.order_code,
                        status: 'error',
                        error: error.message
                    });
                }
            }
        }

        // 4. Trả về kết quả
        return NextResponse.json({
            success: true,
            data: results
        });

    } catch (error: any) {
        console.error('❌ [Fix Payments] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
} 