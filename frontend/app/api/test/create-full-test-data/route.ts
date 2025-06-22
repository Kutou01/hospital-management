import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get current user để tạo data cho user hiện tại
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized - Please login'
            }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({
                success: false,
                error: 'Invalid token'
            }, { status: 401 });
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, role, full_name')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({
                success: false,
                error: 'Profile not found'
            }, { status: 404 });
        }

        // Get or create patient record
        let currentPatientId: string | null = null;

        const { data: patient, error: patientError } = await supabase
            .from('patients')
            .select('patient_id')
            .eq('profile_id', profile.id)
            .single();

        if (patientError) {
            // Create patient record if not exists
            const newPatientId = `PAT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Date.now()).slice(-3)}`;

            const { data: newPatient, error: createError } = await supabase
                .from('patients')
                .insert({
                    patient_id: newPatientId,
                    profile_id: profile.id,
                    full_name: profile.full_name || user.email?.split('@')[0],
                    status: 'active'
                })
                .select('patient_id')
                .single();

            if (createError) {
                return NextResponse.json({
                    success: false,
                    error: 'Failed to create patient record'
                }, { status: 500 });
            }

            currentPatientId = newPatient.patient_id;
        } else {
            currentPatientId = patient.patient_id;
        }

        console.log('🧪 [Create Test Data] Creating for patient:', currentPatientId);

        // 1. Tạo medical records trước (sử dụng schema đúng)
        const medicalRecords = [
            {
                record_id: `MR-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-001`,
                patient_id: currentPatientId,
                doctor_id: 'DOC-001',
                visit_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Chỉ lấy date
                chief_complaint: 'Đau đầu và chóng mặt',
                // Sử dụng 'diagnosis' thay vì 'diagnosis_ids' theo schema thực tế
                diagnosis: 'Tăng huyết áp nguyên phát',
                treatment_plan: 'Uống thuốc hạ huyết áp, tái khám sau 1 tuần',
                vital_signs: {
                    blood_pressure: '140/90',
                    heart_rate: '85',
                    temperature: '36.8'
                },
                physical_examination: {
                    general: 'Tỉnh táo, tiếp xúc tốt',
                    cardiovascular: 'Tim đều, không tiếng thổi'
                },
                status: 'active',
                payment_status: 'pending',
                payment_amount: 300000,
                created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                record_id: `MR-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-002`,
                patient_id: currentPatientId,
                doctor_id: 'DOC-002',
                visit_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                chief_complaint: 'Ho khan kéo dài',
                diagnosis: 'Viêm đường hô hấp trên',
                treatment_plan: 'Kháng sinh và thuốc ho, nghỉ ngơi',
                vital_signs: {
                    blood_pressure: '120/80',
                    heart_rate: '72',
                    temperature: '37.2'
                },
                physical_examination: {
                    general: 'Tỉnh táo',
                    respiratory: 'Phổi có ran ẩm'
                },
                status: 'active',
                payment_status: 'pending',
                payment_amount: 250000,
                created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                record_id: `MR-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-003`,
                patient_id: currentPatientId,
                doctor_id: 'DOC-003',
                visit_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                chief_complaint: 'Khám tổng quát định kỳ',
                diagnosis: 'Sức khỏe bình thường',
                treatment_plan: 'Duy trì lối sống lành mạnh, tái khám sau 6 tháng',
                vital_signs: {
                    blood_pressure: '115/75',
                    heart_rate: '68',
                    temperature: '36.5'
                },
                physical_examination: {
                    general: 'Tốt',
                    cardiovascular: 'Bình thường',
                    respiratory: 'Bình thường'
                },
                status: 'active',
                payment_status: 'pending',
                payment_amount: 200000,
                created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date().toISOString()
            }
        ];

        // Xóa medical records cũ của user này
        await supabase
            .from('medical_records')
            .delete()
            .eq('patient_id', currentPatientId);

        // Tạo medical records mới
        const { data: createdRecords, error: recordsError } = await supabase
            .from('medical_records')
            .insert(medicalRecords)
            .select();

        if (recordsError) {
            console.error('Error creating medical records:', recordsError);
            return NextResponse.json({
                success: false,
                error: 'Failed to create medical records'
            }, { status: 500 });
        }

        // 2. Tạo payments với record_id
        const payments = [
            {
                order_code: `${Date.now()}001`,
                amount: 300000,
                description: 'Khám nội khoa - Huyết áp cao',
                status: 'completed',
                payment_method: 'payos',
                doctor_name: 'BS. Nguyễn Văn A',
                doctor_id: 'DOC-001',
                patient_id: currentPatientId,
                record_id: medicalRecords[0].record_id,
                transaction_id: `TXN_${Date.now()}_1`,
                payment_link_id: `PL_${Date.now()}_1`,
                paid_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                order_code: `${Date.now()}002`,
                amount: 250000,
                description: 'Khám tai mũi họng - Viêm họng',
                status: 'completed',
                payment_method: 'payos',
                doctor_name: 'BS. Trần Thị B',
                doctor_id: 'DOC-002',
                patient_id: currentPatientId,
                record_id: medicalRecords[1].record_id,
                transaction_id: `TXN_${Date.now()}_2`,
                payment_link_id: `PL_${Date.now()}_2`,
                paid_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                order_code: `${Date.now()}003`,
                amount: 200000,
                description: 'Khám tổng quát định kỳ',
                status: 'completed',
                payment_method: 'payos',
                doctor_name: 'BS. Lê Văn C',
                doctor_id: 'DOC-003',
                patient_id: currentPatientId,
                record_id: medicalRecords[2].record_id,
                transaction_id: `TXN_${Date.now()}_3`,
                payment_link_id: `PL_${Date.now()}_3`,
                paid_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                order_code: `${Date.now()}004`,
                amount: 150000,
                description: 'Thanh toán không có hồ sơ bệnh án',
                status: 'completed',
                payment_method: 'payos',
                doctor_name: 'BS. Phạm Thị D',
                doctor_id: 'DOC-004',
                patient_id: currentPatientId,
                record_id: null, // Không có record_id để test sự khác biệt
                transaction_id: `TXN_${Date.now()}_4`,
                payment_link_id: `PL_${Date.now()}_4`,
                paid_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date().toISOString()
            }
        ];

        // Xóa payments cũ của user này
        await supabase
            .from('payments')
            .delete()
            .eq('patient_id', currentPatientId);

        // Tạo payments mới
        const { data: createdPayments, error: paymentsError } = await supabase
            .from('payments')
            .insert(payments)
            .select();

        if (paymentsError) {
            console.error('Error creating payments:', paymentsError);
            return NextResponse.json({
                success: false,
                error: 'Failed to create payments'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Full test data created successfully',
            data: {
                patient_id: currentPatientId,
                medical_records_created: createdRecords?.length || 0,
                payments_created: createdPayments?.length || 0,
                payments_with_records: createdPayments?.filter(p => p.record_id).length || 0,
                payments_without_records: createdPayments?.filter(p => !p.record_id).length || 0
            }
        });

    } catch (error) {
        console.error('Create full test data error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
