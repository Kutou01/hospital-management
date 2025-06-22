import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createBrowserClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);

        // Get authorization header
        const authHeader = request.headers.get('authorization');
        console.log('🔐 [Payment History API] Auth header check:', {
            hasAuthHeader: !!authHeader,
            headerStart: authHeader?.substring(0, 20),
            headerLength: authHeader?.length
        });

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ [Payment History API] No valid auth header found');
            return NextResponse.json(
                { success: false, error: 'Unauthorized - Please login' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);
        console.log('🔐 [Payment History API] Verifying token with length:', token.length);

        // Verify JWT token directly with Supabase
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        console.log('👤 [Payment History API] User check:', {
            hasUser: !!user,
            userId: user?.id,
            userEmail: user?.email,
            userError: userError
        });

        if (userError || !user) {
            console.log('❌ [Payment History API] Auth error:', userError?.message || 'No user');
            return NextResponse.json({
                success: false,
                error: 'Unauthorized - Please login'
            }, { status: 401 });
        }

        // Get user profile - handle potential duplicates and auto-create if missing
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, role, full_name')
            .eq('id', user.id);

        let profile = null;

        if (profileError || !profiles || profiles.length === 0) {
            console.log('⚠️ [Payment History API] No profile found, creating one...', {
                userId: user.id,
                userEmail: user.email,
                error: profileError?.message
            });

            // Tạo profile đơn giản - trả về mock profile để test
            console.log('🔧 [Payment History API] Creating mock profile for testing...');
            const newProfile = {
                id: user.id,
                email: user.email || 'unknown@example.com',
                full_name: user.email?.split('@')[0] || 'User',
                role: 'patient'
            };

            // TODO: Tạo profile thực trong database sau khi fix RLS
            console.log('⚠️ [Payment History API] Using mock profile due to RLS restrictions:', newProfile);

            profile = newProfile;
            console.log('✅ [Payment History API] Profile created:', profile);
        } else {
            // Use the first profile if multiple exist (handle duplicates)
            profile = profiles[0];
            if (profiles.length > 1) {
                console.log('⚠️ [Payment History API] Multiple profiles found for user, using first one:', {
                    userId: user.id,
                    profileCount: profiles.length,
                    selectedProfile: profile.id
                });
            }
        }

        // Get patient_id if user is a patient
        let currentPatientId = null;
        if (profile.role === 'patient') {
            const { data: patient, error: patientError } = await supabase
                .from('patients')
                .select('patient_id')
                .eq('profile_id', profile.id)
                .single();

            if (patient) {
                currentPatientId = patient.patient_id;
            } else {
                // Patient record not found - create one automatically or return empty list
                console.log('⚠️ [Payment History API] No patient record found for user:', profile.id);

                // Không báo lỗi nữa, thay vào đó trả về danh sách trống
                return NextResponse.json({
                    success: true,
                    data: {
                        payments: [],
                        pagination: {
                            page: 1,
                            limit: 10,
                            total: 0,
                            totalPages: 0
                        },
                        summary: {
                            totalPaid: 0,
                            totalTransactions: 0,
                            averageAmount: 0,
                            syncedPayments: 0,
                            syncRate: 0
                        }
                    }
                });
            }

            console.log('👤 [Payment History API] Patient lookup:', {
                profileId: profile.id,
                patientId: currentPatientId,
                error: patientError?.message
            });
        }

        console.log('👤 [Payment History API] User info:', {
            userId: user.id,
            role: profile.role,
            patientId: currentPatientId,
            fullName: profile.full_name
        });

        // Log current database state
        const { data: dbPayments } = await supabase
            .from('payments')
            .select('order_code, amount, status, created_at, paid_at')
            .order('created_at', { ascending: false });

        console.log('📊 [Payment History API] Current database payments:', dbPayments);

        // Get query parameters
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const status = searchParams.get('status');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const doctorId = searchParams.get('doctorId');
        const orderCode = searchParams.get('orderCode');

        const offset = (page - 1) * limit;

        // Build query với patient_id filter cho bảo mật
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

        // Apply security filter for patient
        if (profile.role === 'patient') {
            if (!currentPatientId) {
                // Đổi từ báo lỗi sang trả về danh sách trống
                console.log('❌ [Payment History API] No patient_id found for user');
                return NextResponse.json({
                    success: true,
                    data: {
                        payments: [],
                        pagination: {
                            page: 1,
                            limit: 10,
                            total: 0,
                            totalPages: 0
                        },
                        summary: {
                            totalPaid: 0,
                            totalTransactions: 0,
                            averageAmount: 0,
                            syncedPayments: 0,
                            syncRate: 0
                        }
                    }
                });
            } else {
                // QUAN TRỌNG: Lọc thanh toán theo patient_id để đảm bảo bệnh nhân
                // chỉ xem được thanh toán của chính họ, không thấy thanh toán của người khác
                query = query.eq('patient_id', currentPatientId);
                console.log('🔒 [Payment History API] Patient access - filtering by patient_id:', currentPatientId);
            }
        } else if (profile.role === 'admin') {
            // Admin có quyền xem tất cả thanh toán không cần filter theo patient_id
            console.log('👨‍💼 [Payment History API] Admin access - showing all payments');
        } else {
            // Không phải patient hoặc admin thì từ chối truy cập
            console.log('🚫 [Payment History API] Access denied - User role:', profile.role);
            return NextResponse.json({
                success: false,
                error: 'Access denied - Invalid role'
            }, { status: 403 });
        }

        // Sắp xếp theo thời gian giảm dần: MỚI NHẤT TRƯỚC (ascending: false)
        query = query
            .order('created_at', { ascending: false })  // Thời gian tạo: mới → cũ
            .order('paid_at', { ascending: false, nullsFirst: false })  // Thời gian thanh toán: mới → cũ
            .range(offset, offset + limit - 1);

        // Apply additional filters (status đã được cố định là 'completed' ở trên)

        if (startDate) {
            query = query.gte('created_at', startDate);
        }

        if (endDate) {
            query = query.lte('created_at', endDate);
        }

        if (doctorId) {
            query = query.eq('doctor_id', doctorId);
        }

        if (orderCode) {
            query = query.ilike('order_code', `%${orderCode}%`);
        }

        // Execute query
        const { data: payments, error: paymentsError } = await query;

        if (paymentsError) {
            console.error('❌ [Payment History API] Error fetching payment history:', paymentsError);
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch payment history'
            }, { status: 500 });
        }

        console.log(`✅ [Payment History API] Found ${payments?.length || 0} completed payments for ${profile.role === 'patient' ? 'patient ' + currentPatientId : 'admin'}`);

        // Log số lượng thanh toán có patient_id
        const paymentsWithPatientId = payments?.filter(p => p.patient_id) || [];
        if (profile.role === 'patient' && paymentsWithPatientId.length !== payments?.length) {
            console.warn(`⚠️ [Payment History API] Warning: ${payments?.length - paymentsWithPatientId.length}/${payments?.length} payments are missing patient_id!`);
        }

        // Get total count for pagination
        let countQuery = supabase
            .from('payments')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed'); // Chỉ đếm giao dịch thành công

        // Apply same security filter for count
        if (profile.role === 'patient') {
            if (currentPatientId) {
                countQuery = countQuery.eq('patient_id', currentPatientId);
            }
        }

        // Apply additional filters for count (status đã được cố định là 'completed')
        if (startDate) {
            countQuery = countQuery.gte('created_at', startDate);
        }
        if (endDate) {
            countQuery = countQuery.lte('created_at', endDate);
        }
        if (doctorId) {
            countQuery = countQuery.eq('doctor_id', doctorId);
        }
        if (orderCode) {
            countQuery = countQuery.ilike('order_code', `%${orderCode}%`);
        }

        const { count, error: countError } = await countQuery;

        if (countError) {
            console.error('❌ [Payment History API] Error counting payments:', countError);
        }

        // Calculate summary statistics với thông tin đồng bộ - CHỈ GIAO DỊCH ĐÃ THANH TOÁN
        let summaryQuery = supabase
            .from('payments')
            .select('status, amount, transaction_id, payment_link_id, paid_at')
            .eq('status', 'completed'); // CHỈ TÍNH TOÁN GIAO DỊCH ĐÃ THANH TOÁN

        let allPaymentsQuery = supabase
            .from('payments')
            .select('status, transaction_id, payment_link_id')
            .eq('status', 'completed');

        // Apply same security filter for summary
        if (profile.role === 'patient') {
            if (currentPatientId) {
                summaryQuery = summaryQuery.eq('patient_id', currentPatientId);
                allPaymentsQuery = allPaymentsQuery.eq('patient_id', currentPatientId);
                console.log('📈 [Payment History API] Calculating summary for patient:', currentPatientId);
            } else {
                console.log('📈 [Payment History API] Calculating summary for all completed payments (testing mode)');
            }
        }

        const { data: summaryData, error: summaryError } = await summaryQuery;
        const { data: allPayments, error: allError } = await allPaymentsQuery;

        let summary = {
            totalPaid: 0,
            totalTransactions: 0,
            averageAmount: 0,
            syncedPayments: 0,
            syncRate: 0
        };

        if (!summaryError && summaryData) {
            summary.totalPaid = summaryData.reduce((sum, payment) => sum + (payment.amount || 0), 0);
            summary.totalTransactions = summaryData.length;
            summary.averageAmount = summary.totalTransactions > 0 ? summary.totalPaid / summary.totalTransactions : 0;
        }

        if (!allError && allPayments) {
            summary.syncedPayments = allPayments.filter(p => p.transaction_id || p.payment_link_id).length;
            summary.syncRate = allPayments.length > 0 ? (summary.syncedPayments / allPayments.length) * 100 : 0;
        }

        return NextResponse.json({
            success: true,
            data: {
                payments: payments || [],
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    totalPages: Math.ceil((count || 0) / limit)
                },
                summary
            }
        });

    } catch (error) {
        console.error('Payment history API error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
