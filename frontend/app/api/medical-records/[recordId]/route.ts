import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
    request: NextRequest,
    { params }: { params: { recordId: string } }
) {
    try {
        const { recordId } = params;

        if (!recordId) {
            return NextResponse.json({
                success: false,
                error: 'Record ID is required'
            }, { status: 400 });
        }

        console.log('🔍 [Medical Record API] Fetching record:', recordId);

        // Lấy thông tin medical record với patient và profile
        const { data: record, error } = await supabase
            .from('medical_records')
            .select(`
                *,
                patients (
                    patient_id,
                    full_name,
                    profile:profiles!patients_profile_id_fkey (
                        id,
                        email,
                        phone_number
                    )
                )
            `)
            .eq('record_id', recordId)
            .single();

        if (error) {
            console.error('❌ [Medical Record API] Error fetching record:', error);
            return NextResponse.json({
                success: false,
                error: 'Medical record not found'
            }, { status: 404 });
        }

        // Flatten patient data
        if (record.patients && record.patients.profile) {
            record.patients = {
                ...record.patients,
                email: record.patients.profile.email,
                phone_number: record.patients.profile.phone_number
            };
            delete record.patients.profile;
        }

        console.log('✅ [Medical Record API] Record found:', record);

        return NextResponse.json({
            success: true,
            record: record
        });

    } catch (error: any) {
        console.error('❌ [Medical Record API] Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
