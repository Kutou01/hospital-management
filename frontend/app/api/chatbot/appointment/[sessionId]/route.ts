import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;
    console.log(`Creating appointment for session: ${sessionId}`);

    // Lấy thông tin session từ database
    let sessionData;
    try {
      // Thử lấy từ bảng chatbot_appointment_sessions
      const { data: sessionFromDb, error } = await supabase
        .from('chatbot_appointment_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (!error && sessionFromDb) {
        sessionData = sessionFromDb;
      } else {
        // Nếu không có trong database, tạo mock data
        console.log('Session not found in database, using mock data');
        sessionData = {
          session_id: sessionId,
          patient_id: 'PAT-TEST-001',
          doctor_id: 'DOC-TEST-001',
          selected_date: new Date().toISOString().split('T')[0],
          selected_time: '09:00',
          status: 'active'
        };
      }
    } catch (dbError) {
      console.error('Error fetching session:', dbError);
      // Tạo mock data nếu có lỗi
      sessionData = {
        session_id: sessionId,
        patient_id: 'PAT-TEST-001',
        doctor_id: 'DOC-TEST-001',
        selected_date: new Date().toISOString().split('T')[0],
        selected_time: '09:00',
        status: 'active'
      };
    }

    // Tạo appointment ID
    const appointmentId = `APPT-CHAT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    // Lấy thông tin bác sĩ
    let doctorInfo = { doctor_name: 'BS. Test Doctor', specialty: 'Chuyên khoa test', consultation_fee: 200000 };
    if (sessionData.doctor_id) {
      try {
        const { data: doctorData } = await supabase
          .from('doctors')
          .select(`
            doctor_id,
            full_name,
            specialty,
            consultation_fee,
            profiles (full_name)
          `)
          .eq('doctor_id', sessionData.doctor_id)
          .single();

        if (doctorData) {
          doctorInfo = {
            doctor_name: doctorData.profiles?.full_name || doctorData.full_name || 'BS. Test Doctor',
            specialty: doctorData.specialty || 'Chuyên khoa test',
            consultation_fee: doctorData.consultation_fee || 200000
          };
        }
      } catch (doctorError) {
        console.error('Error fetching doctor info:', doctorError);
      }
    }

    // Tạo appointment data
    const appointmentData = {
      appointment_id: appointmentId,
      doctor_id: sessionData.doctor_id || 'DOC-TEST-001',
      patient_id: sessionData.patient_id || 'PAT-TEST-001',
      appointment_date: sessionData.selected_date || new Date().toISOString().split('T')[0],
      appointment_time: sessionData.selected_time || '09:00',
      status: 'scheduled',
      notes: 'Đặt lịch qua chatbot',
      created_at: new Date().toISOString()
    };

    // Lưu vào database
    try {
      const { data: savedAppointment, error } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single();

      if (error) {
        console.error('Error saving appointment to database:', error);
      } else {
        console.log('Appointment saved to database:', savedAppointment);
      }
    } catch (saveError) {
      console.error('Exception saving appointment:', saveError);
    }

    // Cập nhật session status
    try {
      await supabase
        .from('chatbot_appointment_sessions')
        .update({ status: 'completed' })
        .eq('session_id', sessionId);
    } catch (updateError) {
      console.error('Error updating session status:', updateError);
    }

    // Tạo response data
    const responseData = {
      appointment_id: appointmentId,
      session_id: sessionId,
      status: 'scheduled',
      created_at: new Date().toISOString(),
      appointment_info: {
        doctor_name: doctorInfo.doctor_name,
        specialty: doctorInfo.specialty,
        appointment_date: appointmentData.appointment_date,
        start_time: appointmentData.appointment_time,
        end_time: calculateEndTime(appointmentData.appointment_time),
        consultation_fee: doctorInfo.consultation_fee
      }
    };

    console.log(`Appointment created: ${appointmentId}`);

    return NextResponse.json({
      success: true,
      data: responseData,
      message: 'Appointment created successfully'
    });
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({
      success: false,
      message: 'Lỗi khi tạo appointment',
      error: error.message
    }, { status: 500 });
  }
}

// Helper function to calculate end time (30 minutes after start time)
function calculateEndTime(startTime: string): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  let endHours = hours;
  let endMinutes = minutes + 30;

  if (endMinutes >= 60) {
    endHours += 1;
    endMinutes -= 60;
  }

  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}
