/**
 * Script để cập nhật patient_id cho các thanh toán hiện có
 * Chạy script này sau khi đã thêm cột patient_id vào database
 */

import { createClient } from '@supabase/supabase-js';

// Cấu hình Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Payment {
    id: string;
    order_code: string;
    record_id: string | null;
    patient_id: string | null;
}

interface MedicalRecord {
    record_id: string;
    patient_id: string;
}

async function updatePaymentPatientIds() {
    console.log('🚀 Starting payment patient_id update script...');
    
    try {
        // 1. Lấy tất cả payments chưa có patient_id nhưng có record_id
        console.log('📋 Fetching payments without patient_id...');
        const { data: paymentsWithoutPatientId, error: paymentsError } = await supabase
            .from('payments')
            .select('id, order_code, record_id, patient_id')
            .is('patient_id', null)
            .not('record_id', 'is', null);

        if (paymentsError) {
            console.error('❌ Error fetching payments:', paymentsError);
            return;
        }

        if (!paymentsWithoutPatientId || paymentsWithoutPatientId.length === 0) {
            console.log('✅ No payments need patient_id update');
            return;
        }

        console.log(`📊 Found ${paymentsWithoutPatientId.length} payments without patient_id`);

        // 2. Lấy tất cả medical records để mapping
        console.log('📋 Fetching medical records for mapping...');
        const { data: medicalRecords, error: recordsError } = await supabase
            .from('medical_records')
            .select('record_id, patient_id');

        if (recordsError) {
            console.error('❌ Error fetching medical records:', recordsError);
            return;
        }

        if (!medicalRecords || medicalRecords.length === 0) {
            console.log('⚠️ No medical records found for mapping');
            return;
        }

        // 3. Tạo mapping từ record_id -> patient_id
        const recordToPatientMap = new Map<string, string>();
        medicalRecords.forEach((record: MedicalRecord) => {
            recordToPatientMap.set(record.record_id, record.patient_id);
        });

        console.log(`📊 Created mapping for ${recordToPatientMap.size} medical records`);

        // 4. Cập nhật từng payment
        let updatedCount = 0;
        let skippedCount = 0;

        for (const payment of paymentsWithoutPatientId) {
            if (!payment.record_id) {
                skippedCount++;
                continue;
            }

            const patientId = recordToPatientMap.get(payment.record_id);
            if (!patientId) {
                console.log(`⚠️ No patient_id found for record_id: ${payment.record_id} (payment: ${payment.order_code})`);
                skippedCount++;
                continue;
            }

            // Cập nhật payment với patient_id
            const { error: updateError } = await supabase
                .from('payments')
                .update({ patient_id: patientId })
                .eq('id', payment.id);

            if (updateError) {
                console.error(`❌ Error updating payment ${payment.order_code}:`, updateError);
                skippedCount++;
            } else {
                console.log(`✅ Updated payment ${payment.order_code} with patient_id: ${patientId}`);
                updatedCount++;
            }

            // Delay nhỏ để tránh rate limit
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // 5. Báo cáo kết quả
        console.log('\n📊 Update Summary:');
        console.log(`✅ Successfully updated: ${updatedCount} payments`);
        console.log(`⚠️ Skipped: ${skippedCount} payments`);
        console.log(`📋 Total processed: ${paymentsWithoutPatientId.length} payments`);

        // 6. Kiểm tra kết quả sau khi cập nhật
        console.log('\n🔍 Verifying results...');
        const { data: remainingPayments, error: verifyError } = await supabase
            .from('payments')
            .select('id')
            .is('patient_id', null)
            .not('record_id', 'is', null);

        if (verifyError) {
            console.error('❌ Error verifying results:', verifyError);
        } else {
            console.log(`📊 Remaining payments without patient_id: ${remainingPayments?.length || 0}`);
        }

        // 7. Thống kê tổng quan
        const { data: allPayments, error: statsError } = await supabase
            .from('payments')
            .select('patient_id');

        if (!statsError && allPayments) {
            const totalPayments = allPayments.length;
            const paymentsWithPatientId = allPayments.filter(p => p.patient_id).length;
            const coverageRate = totalPayments > 0 ? (paymentsWithPatientId / totalPayments) * 100 : 0;

            console.log('\n📈 Final Statistics:');
            console.log(`📊 Total payments: ${totalPayments}`);
            console.log(`✅ Payments with patient_id: ${paymentsWithPatientId}`);
            console.log(`📊 Coverage rate: ${coverageRate.toFixed(1)}%`);
        }

        console.log('\n🎉 Script completed successfully!');

    } catch (error) {
        console.error('❌ Script failed:', error);
        process.exit(1);
    }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
    updatePaymentPatientIds()
        .then(() => {
            console.log('✅ Script finished');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script error:', error);
            process.exit(1);
        });
}

export { updatePaymentPatientIds };
