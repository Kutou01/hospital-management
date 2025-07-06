import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  try {
    switch (endpoint) {
      case 'specialties':
        return await getSpecialties();
      case 'doctors':
        const specialtyId = searchParams.get('specialty_id');
        return await getDoctors(specialtyId);
      case 'slots':
        const doctorId = searchParams.get('doctor_id');
        const date = searchParams.get('date');
        return await getTimeSlots(doctorId!, date!);
      default:
        return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }
  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  const body = await request.json();

  try {
    switch (endpoint) {
      case 'session':
        return await createSession(body);
      case 'update-session':
        const sessionId = searchParams.get('session_id');
        return await updateSession(sessionId!, body);
      case 'book-appointment':
        return await bookAppointment(body);
      default:
        return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }
  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ===== GET ENDPOINTS =====

async function getSpecialties() {
  const { data, error } = await supabase
    .from('specialties')
    .select('*')
    .eq('is_active', true)
    .order('specialty_name');

  if (error) {
    console.error('❌ Error fetching specialties:', error);
    return NextResponse.json({
      success: false,
      data: [],
      error: error.message
    });
  }

  // Transform data để có format đúng
  const transformedData = data?.map(specialty => ({
    specialty_id: specialty.specialty_id,
    name_vi: specialty.specialty_name || specialty.name_vi || 'Không có tên',
    description: specialty.description || `Chuyên khoa ${specialty.specialty_name || specialty.name_vi}`
  })) || [];

  console.log('✅ Found specialties:', transformedData.length);
  console.log('🔍 Specialty details:', transformedData.slice(0, 3));

  return NextResponse.json({
    success: true,
    data: transformedData,
    error: null
  });
}

async function getDoctors(specialtyId: string | null) {
  let query = supabase
    .from('doctors')
    .select(`
      doctor_id,
      specialty,
      consultation_fee,
      experience_years,
      profiles!inner(
        full_name
      )
    `)
    .eq('availability_status', 'available');

  if (specialtyId) {
    query = query.eq('specialty', specialtyId);
  }

  const { data, error } = await query.order('experience_years', { ascending: false });

  if (error) {
    console.error('❌ Error fetching doctors:', error);
    return NextResponse.json({
      success: false,
      data: [],
      error: error.message
    });
  }

  // Transform data để có format đúng
  const transformedData = data?.map(doctor => ({
    doctor_id: doctor.doctor_id,
    doctor_name: doctor.profiles?.full_name || 'Không có tên',
    specialty_name: doctor.specialty,
    consultation_fee: doctor.consultation_fee,
    experience_years: doctor.experience_years
  })) || [];

  console.log('✅ Found doctors:', transformedData.length);
  console.log('🔍 Doctor details:', transformedData.map(d => ({
    id: d.doctor_id,
    name: d.doctor_name,
    specialty: d.specialty_name
  })));

  return NextResponse.json({
    success: true,
    data: transformedData,
    error: null
  });
}

async function getTimeSlots(doctorId: string, date: string) {
  try {
    // Thử sử dụng function find_optimal_time_slots trước
    const { data, error } = await supabase
      .rpc('find_optimal_time_slots', {
        input_doctor_id: doctorId,
        input_date: date,
        duration_minutes: 30
      });

    if (error) {
      console.error('Error calling find_optimal_time_slots:', error);
      // Fallback: tạo slots mặc định
      return generateDefaultTimeSlots(doctorId, date);
    }

    if (!data || data.length === 0) {
      console.log('No slots returned from database, generating default slots');
      return generateDefaultTimeSlots(doctorId, date);
    }

    // Chuyển đổi dữ liệu từ find_optimal_time_slots thành format cần thiết
    const slots = data.map((slot: any, index: number) => ({
      slot_id: `SLOT-${doctorId}-${date}-${slot.suggested_time}`,
      doctor_id: doctorId,
      date: date,
      start_time: slot.suggested_time,
      end_time: addMinutesToTime(slot.suggested_time, 30),
      is_available: true,
      time_display: `${slot.suggested_time} - ${addMinutesToTime(slot.suggested_time, 30)}`,
      is_morning: isTimeInMorning(slot.suggested_time),
      availability_score: slot.availability_score
    }));

    // Phân chia theo buổi
    const morning = slots.filter(slot => slot.is_morning);
    const afternoon = slots.filter(slot => !slot.is_morning);

    return NextResponse.json({
      success: true,
      data: { morning, afternoon }
    });
  } catch (error) {
    console.error('Exception in getTimeSlots:', error);
    return generateDefaultTimeSlots(doctorId, date);
  }
}

function generateDefaultTimeSlots(doctorId: string, date: string) {
  const slots = [];

  // Tạo slots từ 8:00 đến 17:00, mỗi slot 30 phút
  for (let hour = 8; hour < 17; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 12 && minute === 0) continue; // Skip lunch break

      const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const endTime = minute === 30
        ? `${(hour + 1).toString().padStart(2, '0')}:00`
        : `${hour.toString().padStart(2, '0')}:30`;

      slots.push({
        slot_id: `SLOT-${doctorId}-${date}-${startTime}`,
        doctor_id: doctorId,
        date: date,
        start_time: startTime,
        end_time: endTime,
        is_available: Math.random() > 0.3, // 70% available
        time_display: `${startTime} - ${endTime}`,
        is_morning: hour < 12
      });
    }
  }

  // Phân chia theo buổi
  const morning = slots.filter(slot => slot.is_morning && slot.is_available);
  const afternoon = slots.filter(slot => !slot.is_morning && slot.is_available);

  return NextResponse.json({
    success: true,
    data: { morning, afternoon }
  });
}

function addMinutesToTime(timeStr: string, minutes: number): string {
  const [hours, mins] = timeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60);
  const newMins = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
}

function isTimeInMorning(timeStr: string): boolean {
  const [hours] = timeStr.split(':').map(Number);
  return hours < 12;
}

// ===== POST ENDPOINTS =====

async function createSession(body: any) {
  const sessionId = `CHAT-APPT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  const sessionData = {
    session_id: sessionId,
    patient_id: body.patient_id || 'GUEST',
    current_step: 'selecting_patient_type',
    status: 'active',
    created_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString()
  };

  const { data, error } = await supabase
    .from('chatbot_booking_sessions')
    .insert(sessionData)
    .select()
    .single();

  return NextResponse.json({
    success: !error,
    data: data,
    error: error?.message
  });
}

async function updateSession(sessionId: string, updates: any) {
  const { data, error } = await supabase
    .from('chatbot_booking_sessions')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('session_id', sessionId)
    .select()
    .single();

  return NextResponse.json({
    success: !error,
    data: data,
    error: error?.message
  });
}

async function bookAppointment(body: any) {
  const {
    session_id,
    patient_name,
    patient_phone,
    patient_email,
    doctor_id,
    appointment_date,
    start_time,
    end_time,
    symptoms,
    appointment_type = 'consultation',
    status = 'scheduled',
    reason
  } = body;

  // Comprehensive validation
  const validationErrors = [];
  if (!session_id) validationErrors.push('Session ID is required');
  if (!patient_name) validationErrors.push('Patient name is required');
  if (!patient_phone) validationErrors.push('Patient phone is required');
  if (!doctor_id) validationErrors.push('Doctor ID is required');
  if (!appointment_date) validationErrors.push('Appointment date is required');
  if (!start_time) validationErrors.push('Start time is required');

  if (validationErrors.length > 0) {
    console.error('❌ Validation errors:', validationErrors);
    return NextResponse.json({
      success: false,
      error: 'Thiếu thông tin bắt buộc',
      details: {
        validationErrors,
        receivedData: {
          session_id: !!session_id,
          patient_name: !!patient_name,
          patient_phone: !!patient_phone,
          doctor_id: !!doctor_id,
          appointment_date: !!appointment_date,
          start_time: !!start_time
        }
      }
    });
  }

  console.log('✅ Validation passed for booking:', {
    session_id,
    patient_name,
    patient_phone,
    doctor_id,
    appointment_date,
    start_time
  });

  // Tạo appointment ID
  const appointmentId = `CHAT-${Date.now().toString().slice(-8)}`;

  // Tạo hoặc tìm patient ID
  let patientId = `PAT-CHAT-${Date.now().toString().slice(-6)}`;

  // Thử tìm patient theo phone number hoặc email trong profiles
  let existingPatient = null;
  // Tạm thời skip tìm kiếm existing patient để tránh lỗi schema
  // TODO: Implement proper patient lookup later

  if (existingPatient) {
    patientId = existingPatient.patient_id;
    console.log('✅ Found existing patient:', patientId);
  } else {
    // Tạo patient record mới (simplified - chỉ cần patient_id và gender)
    console.log('🏥 Creating new patient record:', patientId);

    const { data: newPatient, error: patientError } = await supabase
      .from('patients')
      .insert({
        patient_id: patientId,
        gender: 'other', // Default gender since it's required
        status: 'active',
        created_at: new Date().toISOString(),
        created_by: 'CHATBOT_AI'
      })
      .select('patient_id')
      .single();

    if (patientError) {
      console.error('❌ Error creating patient:', patientError);
      return NextResponse.json({
        success: false,
        error: `Không thể tạo hồ sơ bệnh nhân: ${patientError.message}`,
        details: patientError
      });
    }

    console.log('✅ Patient created successfully:', newPatient.patient_id);
  }

  // Kiểm tra doctor có tồn tại không
  const { data: doctorExists, error: doctorError } = await supabase
    .from('doctors')
    .select(`
      doctor_id,
      specialty,
      profiles!inner(
        full_name
      )
    `)
    .eq('doctor_id', doctor_id)
    .single();

  if (doctorError || !doctorExists) {
    console.error('Doctor not found:', doctor_id, doctorError);

    // Lấy danh sách doctor IDs có sẵn để debug
    const { data: availableDoctors } = await supabase
      .from('doctors')
      .select('doctor_id, specialty')
      .limit(5);

    return NextResponse.json({
      success: false,
      error: `Bác sĩ với ID ${doctor_id} không tồn tại trong hệ thống. Vui lòng chọn bác sĩ khác.`,
      details: {
        doctor_id,
        error: doctorError?.message,
        available_doctors: availableDoctors?.map(d => d.doctor_id) || []
      }
    });
  }

  console.log('✅ Doctor found:', {
    id: doctorExists.doctor_id,
    name: doctorExists.profiles?.full_name,
    specialty: doctorExists.specialty
  });

  // Đảm bảo start_time và end_time không null
  const validStartTime = start_time || '09:00';
  const validEndTime = end_time || '09:30';

  console.log('Input times:', { start_time, end_time });
  console.log('Valid times:', { validStartTime, validEndTime });

  // Tạo appointment data theo schema thực tế
  const appointmentData = {
    appointment_id: appointmentId,
    patient_id: patientId,
    doctor_id: doctor_id,
    appointment_date: appointment_date,
    start_time: validStartTime,
    end_time: validEndTime,
    appointment_type: appointment_type || 'consultation',
    status: status || 'scheduled',
    reason: reason || symptoms || 'Khám bệnh qua chatbot',
    notes: `Đặt lịch qua AI Chatbot - Session: ${session_id}\nTriệu chứng: ${symptoms || 'Không có'}\nBệnh nhân: ${patient_name}\nSĐT: ${patient_phone}`,
    created_by: 'CHATBOT_AI'
  };

  console.log('Creating appointment with data:', appointmentData);

  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .insert(appointmentData)
    .select()
    .single();

  if (appointmentError) {
    console.error('Appointment creation error:', appointmentError);
    return NextResponse.json({
      success: false,
      error: `Lỗi tạo lịch hẹn: ${appointmentError.message}`,
      details: appointmentError
    });
  }

  console.log('Appointment created successfully:', appointment);

  // Cập nhật session thành completed
  await supabase
    .from('chatbot_booking_sessions')
    .update({
      status: 'completed',
      confirmation_code: appointmentId,
      updated_at: new Date().toISOString()
    })
    .eq('session_id', session_id);

  return NextResponse.json({
    success: true,
    data: {
      appointment: appointment,
      confirmation_code: appointmentId,
      message: 'Đặt lịch thành công!'
    }
  });
}
