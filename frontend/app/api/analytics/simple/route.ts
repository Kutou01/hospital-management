import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
    try {
        // Get simple analytics data
        const [
            overallStats,
            revenueAnalytics,
            patientAnalytics,
            doctorPerformance,
            departmentAnalytics,
            appointmentTrends,
            paymentAnalytics
        ] = await Promise.all([
            getSimpleOverallStats(),
            getSimpleRevenueAnalytics(),
            getSimplePatientAnalytics(),
            getSimpleDoctorPerformance(),
            getSimpleDepartmentAnalytics(),
            getSimpleAppointmentTrends(),
            getSimplePaymentAnalytics()
        ]);

        return NextResponse.json({
            success: true,
            data: {
                overallStats,
                revenueAnalytics,
                patientAnalytics,
                doctorPerformance,
                departmentAnalytics,
                appointmentTrends,
                paymentAnalytics,
                medicalRecordsInsights: {},
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Simple Analytics API error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch analytics data',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

async function getSimpleOverallStats() {
    try {
        // Get completed payments for revenue
        const { data: paymentsData } = await supabase
            .from('payments')
            .select('amount')
            .eq('status', 'completed');

        const totalRevenue = paymentsData?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

        // Get patients count
        const { count: patientsCount } = await supabase
            .from('patients')
            .select('*', { count: 'exact', head: true });

        // Get doctors count
        const { count: doctorsCount } = await supabase
            .from('doctors')
            .select('*', { count: 'exact', head: true });

        // Get appointments count
        const { count: appointmentsCount } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed');

        return {
            total_revenue: totalRevenue,
            total_patients: patientsCount || 0,
            active_doctors: doctorsCount || 0,
            completed_appointments: appointmentsCount || 0,
            medical_records_created: 0,
            unique_patients_served: appointmentsCount || 0
        };
    } catch (error) {
        console.error('Error in getSimpleOverallStats:', error);
        return {
            total_revenue: 0,
            total_patients: 0,
            active_doctors: 0,
            completed_appointments: 0,
            medical_records_created: 0,
            unique_patients_served: 0
        };
    }
}

async function getSimpleRevenueAnalytics() {
    try {
        const { data: paymentsData } = await supabase
            .from('payments')
            .select('created_at, amount')
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(30);

        // Group by date
        const revenueByDate: { [key: string]: { revenue: number; count: number } } = {};
        
        paymentsData?.forEach(payment => {
            const date = new Date(payment.created_at).toISOString().split('T')[0];
            if (!revenueByDate[date]) {
                revenueByDate[date] = { revenue: 0, count: 0 };
            }
            revenueByDate[date].revenue += payment.amount || 0;
            revenueByDate[date].count += 1;
        });

        return Object.entries(revenueByDate).map(([date, data]) => ({
            date,
            daily_revenue: data.revenue,
            transaction_count: data.count,
            avg_transaction_value: data.count > 0 ? data.revenue / data.count : 0
        }));
    } catch (error) {
        console.error('Error in getSimpleRevenueAnalytics:', error);
        return [];
    }
}

async function getSimplePatientAnalytics() {
    try {
        const { data: patientsData } = await supabase
            .from('patients')
            .select('gender, date_of_birth');

        console.log('Patients data sample:', patientsData?.slice(0, 2));

        // Group by gender
        const genderStats: { [key: string]: { count: number; ages: number[] } } = {};

        patientsData?.forEach(patient => {
            const gender = patient.gender || 'other';
            if (!genderStats[gender]) {
                genderStats[gender] = { count: 0, ages: [] };
            }
            genderStats[gender].count += 1;

            // Use correct field name for date of birth
            const birthDate = patient.date_of_birth;
            if (birthDate) {
                const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
                genderStats[gender].ages.push(age);
            }
        });

        return Object.entries(genderStats).map(([gender, data]) => ({
            gender,
            count: data.count,
            avg_age: data.ages.length > 0 ? data.ages.reduce((sum, age) => sum + age, 0) / data.ages.length : 0
        }));
    } catch (error) {
        console.error('Error in getSimplePatientAnalytics:', error);
        return [];
    }
}

async function getSimpleDoctorPerformance() {
    try {
        // Get payments with doctor info
        const { data: paymentsData } = await supabase
            .from('payments')
            .select('doctor_id, doctor_name, amount')
            .eq('status', 'completed');

        // Group by doctor
        const doctorStats: { [key: string]: any } = {};
        
        paymentsData?.forEach(payment => {
            const doctorId = payment.doctor_id;
            if (!doctorId) return;
            
            if (!doctorStats[doctorId]) {
                doctorStats[doctorId] = {
                    doctor_id: doctorId,
                    full_name: payment.doctor_name || doctorId,
                    specialty: 'Chưa xác định',
                    total_appointments: 0,
                    completed_appointments: 0,
                    total_revenue: 0,
                    avg_rating: 0,
                    total_reviews: 0
                };
            }
            
            doctorStats[doctorId].total_revenue += payment.amount || 0;
            doctorStats[doctorId].completed_appointments += 1;
            doctorStats[doctorId].total_appointments += 1;
        });

        return Object.values(doctorStats)
            .sort((a: any, b: any) => b.total_revenue - a.total_revenue)
            .slice(0, 10);
    } catch (error) {
        console.error('Error in getSimpleDoctorPerformance:', error);
        return [];
    }
}

async function getSimplePaymentAnalytics() {
    try {
        const { data: paymentsData } = await supabase
            .from('payments')
            .select('payment_method, amount, status');

        // Group by payment method
        const methodStats: { [key: string]: any } = {};
        
        paymentsData?.forEach(payment => {
            const method = payment.payment_method || 'Unknown';
            if (!methodStats[method]) {
                methodStats[method] = {
                    payment_method: method,
                    transaction_count: 0,
                    total_amount: 0,
                    amounts: []
                };
            }
            methodStats[method].transaction_count += 1;
            methodStats[method].total_amount += payment.amount || 0;
            methodStats[method].amounts.push(payment.amount || 0);
        });

        return Object.values(methodStats).map((method: any) => ({
            ...method,
            avg_amount: method.amounts.length > 0 ? method.total_amount / method.amounts.length : 0
        })).sort((a: any, b: any) => b.total_amount - a.total_amount);
    } catch (error) {
        console.error('Error in getSimplePaymentAnalytics:', error);
        return [];
    }
}

async function getSimpleDepartmentAnalytics() {
    try {
        // Get departments - try both possible field names
        const { data: departmentsData } = await supabase
            .from('departments')
            .select('department_id, department_name, name, department_code');

        console.log('Departments data sample:', departmentsData?.slice(0, 2));

        // Get doctors by department
        const { data: doctorsData } = await supabase
            .from('doctors')
            .select('doctor_id, department_id, specialty');

        // Get payments
        const { data: paymentsData } = await supabase
            .from('payments')
            .select('doctor_id, amount')
            .eq('status', 'completed');

        // Group by department
        const departmentStats: { [key: string]: any } = {};

        departmentsData?.forEach(dept => {
            const deptName = dept.department_name || dept.name || `Department ${dept.department_id}`;
            departmentStats[dept.department_id] = {
                department_name: deptName,
                department_code: dept.department_code || '',
                total_appointments: 0,
                total_revenue: 0,
                avg_rating: 4.5 // Default rating
            };
        });

        // Add payment data by matching doctor to department
        paymentsData?.forEach(payment => {
            const doctor = doctorsData?.find(d => d.doctor_id === payment.doctor_id);
            if (doctor && departmentStats[doctor.department_id]) {
                departmentStats[doctor.department_id].total_revenue += payment.amount || 0;
                departmentStats[doctor.department_id].total_appointments += 1;
            }
        });

        return Object.values(departmentStats)
            .sort((a: any, b: any) => b.total_revenue - a.total_revenue);
    } catch (error) {
        console.error('Error in getSimpleDepartmentAnalytics:', error);
        return [];
    }
}

async function getSimpleAppointmentTrends() {
    try {
        const { data: appointmentsData } = await supabase
            .from('appointments')
            .select('appointment_date, status, created_at')
            .order('appointment_date', { ascending: false })
            .limit(30);

        console.log('Appointments data sample:', appointmentsData?.slice(0, 2));

        // Group by date
        const trendsByDate: { [key: string]: any } = {};

        appointmentsData?.forEach(appointment => {
            const date = appointment.appointment_date || new Date(appointment.created_at).toISOString().split('T')[0];
            if (!trendsByDate[date]) {
                trendsByDate[date] = {
                    date,
                    total_appointments: 0,
                    completed_appointments: 0,
                    cancelled_appointments: 0
                };
            }
            trendsByDate[date].total_appointments += 1;
            if (appointment.status === 'completed') {
                trendsByDate[date].completed_appointments += 1;
            } else if (appointment.status === 'cancelled') {
                trendsByDate[date].cancelled_appointments += 1;
            }
        });

        return Object.values(trendsByDate)
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10);
    } catch (error) {
        console.error('Error in getSimpleAppointmentTrends:', error);
        return [];
    }
}
