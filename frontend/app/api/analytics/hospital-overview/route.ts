import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'month'; // day, week, month, year
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Calculate date range
        const now = new Date();
        let dateFilter = '';
        
        if (startDate && endDate) {
            dateFilter = `AND created_at BETWEEN '${startDate}' AND '${endDate}'`;
        } else {
            switch (period) {
                case 'day':
                    dateFilter = `AND created_at >= '${new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()}'`;
                    break;
                case 'week':
                    dateFilter = `AND created_at >= '${new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()}'`;
                    break;
                case 'month':
                    dateFilter = `AND created_at >= '${new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()}'`;
                    break;
                case 'year':
                    dateFilter = `AND created_at >= '${new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString()}'`;
                    break;
            }
        }

        // Get comprehensive analytics data
        const analytics = await Promise.all([
            // 1. Overall statistics
            getOverallStats(dateFilter),
            // 2. Revenue analytics
            getRevenueAnalytics(dateFilter),
            // 3. Patient analytics
            getPatientAnalytics(dateFilter),
            // 4. Doctor performance
            getDoctorPerformance(dateFilter),
            // 5. Department analytics
            getDepartmentAnalytics(dateFilter),
            // 6. Appointment trends
            getAppointmentTrends(dateFilter),
            // 7. Payment analytics
            getPaymentAnalytics(dateFilter),
            // 8. Medical records insights
            getMedicalRecordsInsights(dateFilter)
        ]);

        const [
            overallStats,
            revenueAnalytics,
            patientAnalytics,
            doctorPerformance,
            departmentAnalytics,
            appointmentTrends,
            paymentAnalytics,
            medicalRecordsInsights
        ] = analytics;

        return NextResponse.json({
            success: true,
            data: {
                period,
                dateRange: { startDate: startDate.toISOString(), endDate: now.toISOString() },
                overallStats,
                revenueAnalytics,
                patientAnalytics,
                doctorPerformance,
                departmentAnalytics,
                appointmentTrends,
                paymentAnalytics,
                medicalRecordsInsights,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Analytics API error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch analytics data'
        }, { status: 500 });
    }
}

async function getOverallStats(startDate: Date) {
    try {
        // Get total patients
        const { data: patientsData } = await supabase
            .from('patients')
            .select('patient_id', { count: 'exact' })
            .eq('status', 'active');

        // Get active doctors
        const { data: doctorsData } = await supabase
            .from('doctors')
            .select('doctor_id', { count: 'exact' })
            .eq('availability_status', 'available');

        // Get completed appointments
        const { data: appointmentsData } = await supabase
            .from('appointments')
            .select('appointment_id', { count: 'exact' })
            .eq('status', 'completed')
            .gte('created_at', startDate.toISOString());

        // Get total revenue from completed payments
        const { data: paymentsData } = await supabase
            .from('payments')
            .select('amount')
            .eq('status', 'completed')
            .gte('created_at', startDate.toISOString());

        const totalRevenue = paymentsData?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

        // Get medical records count
        const { data: recordsData } = await supabase
            .from('medical_records')
            .select('record_id', { count: 'exact' })
            .gte('created_at', startDate.toISOString());

        return {
            total_patients: patientsData?.length || 0,
            active_doctors: doctorsData?.length || 0,
            completed_appointments: appointmentsData?.length || 0,
            total_revenue: totalRevenue,
            medical_records_created: recordsData?.length || 0,
            unique_patients_served: appointmentsData?.length || 0
        };
    } catch (error) {
        console.error('Error in getOverallStats:', error);
        return {
            total_patients: 0,
            active_doctors: 0,
            completed_appointments: 0,
            total_revenue: 0,
            medical_records_created: 0,
            unique_patients_served: 0
        };
    }
}

async function getRevenueAnalytics(startDate: Date) {
    try {
        const { data: paymentsData } = await supabase
            .from('payments')
            .select('created_at, amount')
            .eq('status', 'completed')
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: false });

        // Group by date
        const revenueByDate: { [key: string]: { revenue: number; count: number; amounts: number[] } } = {};

        paymentsData?.forEach(payment => {
            const date = new Date(payment.created_at).toISOString().split('T')[0];
            if (!revenueByDate[date]) {
                revenueByDate[date] = { revenue: 0, count: 0, amounts: [] };
            }
            revenueByDate[date].revenue += payment.amount || 0;
            revenueByDate[date].count += 1;
            revenueByDate[date].amounts.push(payment.amount || 0);
        });

        return Object.entries(revenueByDate).map(([date, data]) => ({
            date,
            daily_revenue: data.revenue,
            transaction_count: data.count,
            avg_transaction_value: data.amounts.length > 0 ? data.revenue / data.amounts.length : 0
        })).slice(0, 30);
    } catch (error) {
        console.error('Error in getRevenueAnalytics:', error);
        return [];
    }
}

async function getPatientAnalytics() {
    try {
        const { data: patientsData } = await supabase
            .from('patients')
            .select('gender, dateofbirth')
            .eq('status', 'active');

        // Group by gender and calculate average age
        const genderStats: { [key: string]: { count: number; ages: number[] } } = {};

        patientsData?.forEach(patient => {
            const gender = patient.gender || 'other';
            if (!genderStats[gender]) {
                genderStats[gender] = { count: 0, ages: [] };
            }
            genderStats[gender].count += 1;

            // Calculate age if dateofbirth exists
            if (patient.dateofbirth) {
                const age = new Date().getFullYear() - new Date(patient.dateofbirth).getFullYear();
                genderStats[gender].ages.push(age);
            }
        });

        return Object.entries(genderStats).map(([gender, data]) => ({
            gender,
            count: data.count,
            avg_age: data.ages.length > 0 ? data.ages.reduce((sum, age) => sum + age, 0) / data.ages.length : 0
        }));
    } catch (error) {
        console.error('Error in getPatientAnalytics:', error);
        return [];
    }
}

async function getDoctorPerformance(startDate: Date) {
    try {
        // Get doctors
        const { data: doctorsData } = await supabase
            .from('doctors')
            .select('doctor_id, full_name, specialty')
            .eq('availability_status', 'available');

        // Get payments with doctor info
        const { data: paymentsData } = await supabase
            .from('payments')
            .select('doctor_id, doctor_name, amount')
            .eq('status', 'completed')
            .gte('created_at', startDate.toISOString());

        // Group by doctor
        const doctorStats: { [key: string]: any } = {};

        doctorsData?.forEach(doctor => {
            doctorStats[doctor.doctor_id] = {
                doctor_id: doctor.doctor_id,
                full_name: doctor.full_name || doctor.doctor_id,
                specialty: doctor.specialty || 'Chưa xác định',
                total_appointments: 0,
                completed_appointments: 0,
                total_revenue: 0,
                avg_rating: 0,
                total_reviews: 0
            };
        });

        // Add payment data
        paymentsData?.forEach(payment => {
            if (payment.doctor_id && doctorStats[payment.doctor_id]) {
                doctorStats[payment.doctor_id].total_revenue += payment.amount || 0;
                doctorStats[payment.doctor_id].completed_appointments += 1;
                doctorStats[payment.doctor_id].total_appointments += 1;
            }
        });

        return Object.values(doctorStats)
            .sort((a: any, b: any) => b.total_revenue - a.total_revenue)
            .slice(0, 20);
    } catch (error) {
        console.error('Error in getDoctorPerformance:', error);
        return [];
    }
}

async function getDepartmentAnalytics(startDate: Date) {
    try {
        // Get departments
        const { data: departmentsData } = await supabase
            .from('departments')
            .select('department_id, department_name, department_code');

        // Get doctors by department
        const { data: doctorsData } = await supabase
            .from('doctors')
            .select('doctor_id, department_id, specialty');

        // Get payments
        const { data: paymentsData } = await supabase
            .from('payments')
            .select('doctor_id, amount')
            .eq('status', 'completed')
            .gte('created_at', startDate.toISOString());

        // Group by department
        const departmentStats: { [key: string]: any } = {};

        departmentsData?.forEach(dept => {
            departmentStats[dept.department_id] = {
                department_name: dept.department_name,
                department_code: dept.department_code,
                total_appointments: 0,
                total_revenue: 0,
                avg_rating: 0
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
        console.error('Error in getDepartmentAnalytics:', error);
        return [];
    }
}

async function getAppointmentTrends(startDate: Date) {
    try {
        const { data: appointmentsData } = await supabase
            .from('appointments')
            .select('appointment_date, status')
            .gte('appointment_date', startDate.toISOString().split('T')[0]);

        // Group by date
        const trendsByDate: { [key: string]: any } = {};

        appointmentsData?.forEach(appointment => {
            const date = appointment.appointment_date;
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
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
        console.error('Error in getAppointmentTrends:', error);
        return [];
    }
}

async function getPaymentAnalytics(startDate: Date) {
    try {
        const { data: paymentsData } = await supabase
            .from('payments')
            .select('payment_method, amount, status')
            .gte('created_at', startDate.toISOString());

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
        console.error('Error in getPaymentAnalytics:', error);
        return [];
    }
}

async function getMedicalRecordsInsights(startDate: Date) {
    try {
        const { data: recordsData } = await supabase
            .from('medical_records')
            .select('record_id, patient_id, doctor_id, status')
            .gte('created_at', startDate.toISOString());

        const uniquePatients = new Set(recordsData?.map(r => r.patient_id).filter(Boolean));
        const uniqueDoctors = new Set(recordsData?.map(r => r.doctor_id).filter(Boolean));
        const activeRecords = recordsData?.filter(r => r.status === 'active').length || 0;

        return {
            total_records: recordsData?.length || 0,
            active_records: activeRecords,
            unique_patients: uniquePatients.size,
            doctors_involved: uniqueDoctors.size,
            avg_treatment_cost: 0
        };
    } catch (error) {
        console.error('Error in getMedicalRecordsInsights:', error);
        return {
            total_records: 0,
            active_records: 0,
            unique_patients: 0,
            doctors_involved: 0,
            avg_treatment_cost: 0
        };
    }
}
