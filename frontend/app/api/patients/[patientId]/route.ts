import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
    request: NextRequest,
    { params }: { params: { patientId: string } }
) {
    try {
        const { patientId } = params;

        if (!patientId) {
            return NextResponse.json({
                success: false,
                error: 'Patient ID is required'
            }, { status: 400 });
        }

        console.log('🔍 [Patient API] Fetching patient:', patientId);

        // Lấy thông tin patient với profile
        const { data: patient, error } = await supabase
            .from('patients')
            .select(`
                patient_id,
                full_name,
                profile:profiles!patients_profile_id_fkey (
                    id,
                    email,
                    phone_number
                )
            `)
            .eq('patient_id', patientId)
            .single();

        if (error) {
            console.error('❌ [Patient API] Error fetching patient:', error);
            return NextResponse.json({
                success: false,
                error: 'Patient not found'
            }, { status: 404 });
        }

        // Flatten profile data
        const patientData = {
            patient_id: patient.patient_id,
            full_name: patient.full_name,
            email: patient.profile?.email,
            phone_number: patient.profile?.phone_number
        };

        console.log('✅ [Patient API] Patient found:', patientData);

        return NextResponse.json({
            success: true,
            patient: patientData
        });

    } catch (error: any) {
        console.error('❌ [Patient API] Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
