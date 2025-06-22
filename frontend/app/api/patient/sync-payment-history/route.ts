import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getProfile, UserProfile } from '@/lib/auth/auth-utils';

interface Payment {
    id: string;
    order_code: string;
    amount: number;
    description: string;
    patient_id: string | null;
    status: string;
    created_at: string;
    completed_at?: string;
    payment_method?: string;
}

export async function POST() {
    try {
        const supabase = await createClient();

        // Xác thực người dùng
        const profile = await getProfile();
        if (!profile) {
            console.error('❌ [Sync Payment History] User profile not found');
            return NextResponse.json({
                success: false,
                message: 'Không tìm thấy thông tin người dùng. Vui lòng tải lại trang và thử lại. Nếu vẫn gặp lỗi, hãy đăng xuất và đăng nhập lại.'
            }, { status: 401 });
        }

        console.log('🔄 [Sync Payment History] Starting sync for user:', profile.id);

        // Lấy thông tin bệnh nhân của người dùng hiện tại
        const { data: patients, error: patientError } = await supabase
            .from('patients')
            .select('patient_id')
            .eq('profile_id', profile.id);

        if (patientError) {
            console.error('❌ [Sync Payment History] Error fetching patient info:', patientError);
            return NextResponse.json({
                success: false,
                message: 'Không thể lấy thông tin bệnh nhân. Lỗi cơ sở dữ liệu.'
            }, { status: 500 });
        }

        if (!patients || patients.length === 0) {
            console.error('❌ [Sync Payment History] No patient record found for user:', profile.id);
            return NextResponse.json({
                success: false,
                message: 'Không tìm thấy hồ sơ bệnh nhân cho email này. Vui lòng cập nhật hồ sơ bệnh nhân trước khi xem lịch sử thanh toán.'
            }, { status: 404 });
        }

        const patientId = patients[0].patient_id;
        console.log('🔍 [Sync Payment History] Found patient ID:', patientId);

        // Tìm tất cả các thanh toán không có patient_id
        const { data: unlinkedPayments, error: unlinkedError } = await supabase
            .from('payments')
            .select('*')
            .is('patient_id', null);

        if (unlinkedError) {
            console.error('❌ [Sync Payment History] Error fetching unlinked payments:', unlinkedError);
            return NextResponse.json({
                success: false,
                message: 'Không thể lấy danh sách thanh toán chưa liên kết'
            }, { status: 500 });
        }

        console.log(`🔍 [Sync Payment History] Found ${unlinkedPayments?.length || 0} unlinked payments`);

        // Tìm các thanh toán có thể liên quan đến người dùng này
        const relatedPayments: Payment[] = [];

        // 1. Kiểm tra description có chứa email của người dùng không
        if (profile.email) {
            const { data: emailRelatedPayments } = await supabase
                .from('payments')
                .select('*')
                .is('patient_id', null)
                .ilike('description', `%${profile.email}%`);

            if (emailRelatedPayments && emailRelatedPayments.length > 0) {
                console.log(`✅ [Sync Payment History] Found ${emailRelatedPayments.length} payments related to email: ${profile.email}`);
                relatedPayments.push(...(emailRelatedPayments as Payment[]));
            }
        }

        // 2. Kiểm tra description có chứa họ tên của người dùng không
        if (profile.full_name) {
            const { data: nameRelatedPayments } = await supabase
                .from('payments')
                .select('*')
                .is('patient_id', null)
                .ilike('description', `%${profile.full_name}%`);

            if (nameRelatedPayments && nameRelatedPayments.length > 0) {
                console.log(`✅ [Sync Payment History] Found ${nameRelatedPayments.length} payments related to name: ${profile.full_name}`);

                // Lọc bỏ các thanh toán trùng
                const uniquePayments = (nameRelatedPayments as Payment[]).filter(payment =>
                    !relatedPayments.some(p => p.id === payment.id)
                );

                relatedPayments.push(...uniquePayments);
            }
        }

        // 3. Kiểm tra description có chứa SDT của người dùng không
        if (profile.phone) {
            const { data: phoneRelatedPayments } = await supabase
                .from('payments')
                .select('*')
                .is('patient_id', null)
                .ilike('description', `%${profile.phone}%`);

            if (phoneRelatedPayments && phoneRelatedPayments.length > 0) {
                console.log(`✅ [Sync Payment History] Found ${phoneRelatedPayments.length} payments related to phone: ${profile.phone}`);

                // Lọc bỏ các thanh toán trùng
                const uniquePayments = (phoneRelatedPayments as Payment[]).filter(payment =>
                    !relatedPayments.some(p => p.id === payment.id)
                );

                relatedPayments.push(...uniquePayments);
            }
        }

        // 4. THÊM MỚI: Tìm thanh toán của mã bệnh nhân cũ "PAT-202506-001"
        const { data: oldPatientPayments, error: oldPatientError } = await supabase
            .from('payments')
            .select('*')
            .eq('patient_id', 'PAT-202506-001');

        if (oldPatientError) {
            console.error('❌ [Sync Payment History] Error fetching old patient payments:', oldPatientError);
        } else if (oldPatientPayments && oldPatientPayments.length > 0) {
            console.log(`✅ [Sync Payment History] Found ${oldPatientPayments.length} payments with old patient ID: PAT-202506-001`);

            // Cập nhật các thanh toán với mã bệnh nhân cũ
            let updatedOldCount = 0;
            for (const payment of oldPatientPayments) {
                const { error: updateError } = await supabase
                    .from('payments')
                    .update({ patient_id: patientId })
                    .eq('id', payment.id);

                if (!updateError) {
                    updatedOldCount++;
                    console.log(`✅ [Sync Payment History] Updated payment ${payment.order_code} from old patient ID to ${patientId}`);
                } else {
                    console.error(`❌ [Sync Payment History] Error updating payment ${payment.id} from old patient ID:`, updateError);
                }
            }
            console.log(`✅ [Sync Payment History] Updated ${updatedOldCount} payments from old patient ID`);
        }

        console.log(`🔄 [Sync Payment History] Found total ${relatedPayments.length} payments to link to patient: ${patientId}`);

        let updatedCount = 0;

        // Cập nhật patient_id cho các thanh toán liên quan
        if (relatedPayments.length > 0) {
            for (const payment of relatedPayments) {
                const { error: updateError } = await supabase
                    .from('payments')
                    .update({ patient_id: patientId })
                    .eq('id', payment.id);

                if (!updateError) {
                    updatedCount++;
                    console.log(`✅ [Sync Payment History] Linked payment ${payment.order_code} to patient ${patientId}`);
                } else {
                    console.error(`❌ [Sync Payment History] Error linking payment ${payment.id}:`, updateError);
                }
            }
        }

        // THÊM MỚI: Thực hiện việc sync manual từ DB
        const manualSyncResult = await syncManually(supabase, patientId);

        return NextResponse.json({
            success: true,
            data: {
                patientId,
                totalUnlinked: unlinkedPayments?.length || 0,
                relatedFound: relatedPayments.length,
                updatedCount,
                manualSync: manualSyncResult
            }
        });

    } catch (error: any) {
        console.error('❌ [Sync Payment History] Error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Có lỗi xảy ra khi đồng bộ lịch sử thanh toán'
        }, { status: 500 });
    }
}

// Hàm đồng bộ thủ công để sửa các trường hợp đặc biệt
async function syncManually(supabase: any, patientId: string) {
    try {
        // Cập nhật tất cả các thanh toán có mã bệnh nhân cũ "PAT-202506-001"
        const { data, error } = await supabase
            .from('payments')
            .update({ patient_id: patientId })
            .eq('patient_id', 'PAT-202506-001')
            .select('id, order_code');

        if (error) {
            console.error('❌ [Manual Sync] Error updating old patient payments:', error);
            return { success: false, error: error.message, count: 0 };
        }

        console.log(`✅ [Manual Sync] Successfully updated ${data?.length || 0} payments from old patient ID`);

        return {
            success: true,
            count: data?.length || 0,
            payments: data
        };
    } catch (syncError: any) {
        console.error('❌ [Manual Sync] Error:', syncError);
        return { success: false, error: syncError.message, count: 0 };
    }
} 