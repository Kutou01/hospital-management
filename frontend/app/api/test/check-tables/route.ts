import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
    try {
        // Check patients table
        const { data: patientsData, error: patientsError } = await supabase
            .from('patients')
            .select('patient_id, full_name, gender, dateofbirth, date_of_birth')
            .limit(5);

        // Check doctors table
        const { data: doctorsData, error: doctorsError } = await supabase
            .from('doctors')
            .select('doctor_id, full_name, specialty, department_id')
            .limit(5);

        // Check departments table
        const { data: departmentsData, error: departmentsError } = await supabase
            .from('departments')
            .select('department_id, department_name, name, department_code')
            .limit(5);

        // Check appointments table
        const { data: appointmentsData, error: appointmentsError } = await supabase
            .from('appointments')
            .select('appointment_id, patient_id, doctor_id, appointment_date, status')
            .limit(5);

        // Check payments table
        const { data: paymentsData, error: paymentsError } = await supabase
            .from('payments')
            .select('id, doctor_id, doctor_name, amount, status')
            .limit(5);

        return NextResponse.json({
            success: true,
            data: {
                patients: {
                    count: patientsData?.length || 0,
                    sample: patientsData,
                    error: patientsError?.message
                },
                doctors: {
                    count: doctorsData?.length || 0,
                    sample: doctorsData,
                    error: doctorsError?.message
                },
                departments: {
                    count: departmentsData?.length || 0,
                    sample: departmentsData,
                    error: departmentsError?.message
                },
                appointments: {
                    count: appointmentsData?.length || 0,
                    sample: appointmentsData,
                    error: appointmentsError?.message
                },
                payments: {
                    count: paymentsData?.length || 0,
                    sample: paymentsData,
                    error: paymentsError?.message
                }
            }
        });

    } catch (error) {
        console.error('Check tables error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
