import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const patientId = searchParams.get('patientId');

        if (!patientId) {
            return NextResponse.json({
                success: false,
                error: {
                    code: 'MISSING_PATIENT_ID',
                    message: 'Patient ID is required'
                }
            }, { status: 400 });
        }

        console.log('🔍 [Patient Email API] Fetching email for patient:', patientId);

        // Lấy thông tin bệnh nhân và email từ bảng profiles
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
            console.error('❌ [Patient Email API] Database error:', error);
            return NextResponse.json({
                success: false,
                error: {
                    code: 'DATABASE_ERROR',
                    message: 'Không thể lấy thông tin bệnh nhân'
                }
            }, { status: 500 });
        }

        if (!patient) {
            console.log('⚠️ [Patient Email API] Patient not found:', patientId);
            return NextResponse.json({
                success: false,
                error: {
                    code: 'PATIENT_NOT_FOUND',
                    message: 'Không tìm thấy bệnh nhân'
                }
            }, { status: 404 });
        }

        if (!patient.profile?.email) {
            console.log('⚠️ [Patient Email API] No email found for patient:', patientId);
            return NextResponse.json({
                success: false,
                error: {
                    code: 'NO_EMAIL',
                    message: 'Bệnh nhân chưa có email'
                }
            }, { status: 404 });
        }

        console.log('✅ [Patient Email API] Email found for patient:', {
            patientId,
            email: patient.profile.email,
            name: patient.full_name
        });

        return NextResponse.json({
            success: true,
            data: {
                patientId: patient.patient_id,
                email: patient.profile.email,
                fullName: patient.full_name,
                phoneNumber: patient.profile.phone_number
            }
        });

    } catch (error) {
        console.error('💥 [Patient Email API] Unexpected error:', error);
        return NextResponse.json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Lỗi hệ thống'
            }
        }, { status: 500 });
    }
}
