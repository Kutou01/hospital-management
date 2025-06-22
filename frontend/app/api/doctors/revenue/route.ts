import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        
        // Skip authentication for development
        // TODO: Re-enable authentication in production
        // const { data: { user }, error: authError } = await supabase.auth.getUser();
        // if (authError || !user) {
        //     return NextResponse.json({
        //         success: false,
        //         error: 'Unauthorized'
        //     }, { status: 401 });
        // }

        // Get doctor ID from user profile or query params
        const doctorId = searchParams.get('doctorId');
        const period = searchParams.get('period') || 'month'; // day, week, month, year
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!doctorId) {
            return NextResponse.json({
                success: false,
                error: 'Doctor ID is required'
            }, { status: 400 });
        }

        // Skip doctor verification for now - use mock doctor data
        const doctor = {
            doctor_id: doctorId,
            full_name: 'Dr. Nguyễn Văn A',
            specialty: 'Nội khoa',
            consultation_fee: 500000
        };

        // Build date filter
        let dateFilter = '';
        const now = new Date();
        
        if (startDate && endDate) {
            dateFilter = `created_at.gte.${startDate},created_at.lte.${endDate}`;
        } else {
            switch (period) {
                case 'day':
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    dateFilter = `created_at.gte.${today.toISOString()}`;
                    break;
                case 'week':
                    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
                    dateFilter = `created_at.gte.${weekStart.toISOString()}`;
                    break;
                case 'month':
                    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                    dateFilter = `created_at.gte.${monthStart.toISOString()}`;
                    break;
                case 'year':
                    const yearStart = new Date(now.getFullYear(), 0, 1);
                    dateFilter = `created_at.gte.${yearStart.toISOString()}`;
                    break;
            }
        }

        // Get completed payments for this doctor - simplified
        let paymentsQuery = supabase
            .from('payments')
            .select('*')
            .eq('doctor_id', doctorId)
            .eq('status', 'completed')
            .order('created_at', { ascending: false });

        if (dateFilter) {
            const [field, operator, value] = dateFilter.split('.');
            if (operator === 'gte') {
                paymentsQuery = paymentsQuery.gte(field, value);
            } else if (operator === 'lte') {
                paymentsQuery = paymentsQuery.lte(field, value);
            }
        }

        const { data: payments, error: paymentsError } = await paymentsQuery;

        if (paymentsError) {
            console.error('Error fetching doctor payments:', paymentsError);
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch revenue data'
            }, { status: 500 });
        }

        // Calculate revenue statistics
        const totalRevenue = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
        const totalPatients = new Set(payments?.map(p => p.patient_id).filter(Boolean)).size;
        const totalAppointments = payments?.length || 0;
        const averagePerAppointment = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;

        // Group by date for chart data
        const revenueByDate = payments?.reduce((acc: any, payment) => {
            const date = new Date(payment.created_at).toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = { date, revenue: 0, appointments: 0 };
            }
            acc[date].revenue += payment.amount || 0;
            acc[date].appointments += 1;
            return acc;
        }, {}) || {};

        const chartData = Object.values(revenueByDate).sort((a: any, b: any) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // Mock top diagnoses for now
        const topDiagnoses = [
            { diagnosis: 'Cảm cúm', count: 15 },
            { diagnosis: 'Đau đầu', count: 12 },
            { diagnosis: 'Đau bụng', count: 8 },
            { diagnosis: 'Khám tổng quát', count: 6 },
            { diagnosis: 'Tư vấn sức khỏe', count: 4 }
        ];

        // Recent payments
        const recentPayments = payments?.slice(0, 10) || [];

        return NextResponse.json({
            success: true,
            data: {
                doctor: {
                    id: doctor.doctor_id,
                    name: doctor.full_name,
                    specialty: doctor.specialty,
                    consultation_fee: doctor.consultation_fee
                },
                summary: {
                    totalRevenue,
                    totalPatients,
                    totalAppointments,
                    averagePerAppointment,
                    period
                },
                chartData,
                topDiagnoses,
                recentPayments: recentPayments.map(payment => ({
                    id: payment.id,
                    orderCode: payment.order_code,
                    amount: payment.amount,
                    date: payment.created_at,
                    patientId: payment.patient_id || 'PAT001',
                    diagnosis: 'Khám tổng quát'
                }))
            }
        });

    } catch (error) {
        console.error('Doctor revenue API error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
