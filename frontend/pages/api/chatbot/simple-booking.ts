import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

/**
 * Simple Booking API for Chatbot - Fixed Version
 * Handles booking flow without complex AI processing
 */

interface BookingRequest {
  step: 'symptom_analysis' | 'get_doctors' | 'get_time_slots' | 'reserve_slot' | 'generate_booking_summary';
  message: string;
  session_id: string;
  user_id: string;
  metadata?: any;
}

interface BookingResponse {
  success: boolean;
  data?: {
    recommended_specialties?: any[];
    doctors?: any[];
    available_slots?: any[];
    booking_summary?: any;
    appointment?: any;
    payment_url?: string;
  };
  error?: string;
  message?: string;
}

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to add minutes to time string
function addMinutesToTime(timeStr: string, minutes: number): string {
  const [hours, mins] = timeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60);
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BookingResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { step, message, session_id, user_id, metadata }: BookingRequest = req.body;

    console.log(`🏥 Simple Booking Request: ${step}`, { message: message.substring(0, 50) });

    switch (step) {
      case 'symptom_analysis':
        return await handleSymptomAnalysis(req, res, message, metadata, session_id, user_id);
      case 'get_doctors':
        return await handleGetDoctors(req, res, metadata, session_id, user_id);
      case 'get_time_slots':
        return await handleGetTimeSlots(req, res, metadata, session_id, user_id);
      case 'reserve_slot':
        return await handleReserveSlot(req, res, metadata, session_id, user_id);
      case 'generate_booking_summary':
        return await handleGenerateBookingSummary(req, res, metadata, session_id, user_id);
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid step'
        });
    }

  } catch (error: any) {
    console.error('Simple booking API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Có lỗi xảy ra trong hệ thống đặt lịch'
    });
  }
}

// Handle symptom analysis and specialty recommendation
async function handleSymptomAnalysis(req: NextApiRequest, res: NextApiResponse, message: string, metadata: any, session_id?: string, user_id?: string) {
  try {
    console.log('🔍 Analyzing symptoms:', message);

    // Enhanced keyword matching with more specialties
    const symptomKeywords = {
      // Digestive symptoms
      'đau bụng': ['SPEC042', 'SPEC043'], // Nội Tổng Hợp, Nội Tiết
      'buồn nôn': ['SPEC042'], // Nội Tổng Hợp
      'nôn': ['SPEC042', 'SPEC032'], // Nội Tổng Hợp, Nhi Khoa
      'tiêu chảy': ['SPEC042', 'SPEC032'], // Nội Tổng Hợp, Nhi Khoa
      'táo bón': ['SPEC042'], // Nội Tổng Hợp
      'đau dạ dày': ['SPEC042'], // Nội Tổng Hợp

      // Respiratory symptoms
      'ho': ['SPEC032', 'SPEC042'], // Nhi Khoa, Nội Tổng Hợp
      'khó thở': ['SPEC042', 'SPEC028'], // Nội Tổng Hợp, Tim Mạch (EMERGENCY)
      'hen suyễn': ['SPEC042'], // Nội Tổng Hợp

      // Cardiovascular symptoms
      'đau ngực': ['SPEC028', 'SPEC042'], // Tim Mạch, Nội Tổng Hợp (EMERGENCY)
      'tim': ['SPEC028', 'SPEC042'], // Tim Mạch, Nội Tổng Hợp
      'hồi hộp': ['SPEC028', 'SPEC042'], // Tim Mạch, Nội Tổng Hợp
      'choáng váng': ['SPEC028', 'SPEC042'], // Tim Mạch, Nội Tổng Hợp

      // Neurological symptoms
      'đau đầu': ['SPEC042', 'SPEC032'], // Nội Tổng Hợp, Nhi Khoa
      'chóng mặt': ['SPEC042', 'SPEC028'], // Nội Tổng Hợp, Tim Mạch
      'mất ngủ': ['SPEC042'], // Nội Tổng Hợp
      'stress': ['SPEC042'], // Nội Tổng Hợp

      // Orthopedic symptoms
      'đau khớp': ['SPEC030'], // Chấn Thương Chỉnh Hình
      'đau lưng': ['SPEC030', 'SPEC042'], // Chấn Thương Chỉnh Hình, Nội Tổng Hợp
      'gãy xương': ['SPEC030'], // Chấn Thương Chỉnh Hình
      'chấn thương': ['SPEC030'], // Chấn Thương Chỉnh Hình

      // Pediatric symptoms
      'trẻ em': ['SPEC032'], // Nhi Khoa
      'bé': ['SPEC032'], // Nhi Khoa
      'con tôi': ['SPEC032'], // Nhi Khoa

      // General symptoms
      'sốt': ['SPEC042', 'SPEC032'], // Nội Tổng Hợp, Nhi Khoa
      'mệt mỏi': ['SPEC042'], // Nội Tổng Hợp
      'đau': ['SPEC042'], // Nội Tổng Hợp (default)
    };

    let recommendedSpecialtyCodes: string[] = [];
    const lowerMessage = message.toLowerCase();
    let isEmergency = false;

    // Check for emergency keywords
    const emergencyKeywords = ['sốt xuất huyết', 'khó thở', 'đau ngực', 'ngất', 'bất tỉnh'];
    isEmergency = emergencyKeywords.some(keyword => lowerMessage.includes(keyword));

    // Find matching specialties with confidence scoring
    const specialtyMatches = new Map();

    for (const [keyword, codes] of Object.entries(symptomKeywords)) {
      if (lowerMessage.includes(keyword)) {
        codes.forEach(code => {
          const currentScore = specialtyMatches.get(code) || 0;
          specialtyMatches.set(code, currentScore + 1);
        });
      }
    }

    // Convert to array and sort by match count (confidence)
    let specialtyScores = Array.from(specialtyMatches.entries())
      .map(([code, matchCount]) => ({ code, matchCount }))
      .sort((a, b) => b.matchCount - a.matchCount);

    // Default to general medicine if no match
    if (specialtyScores.length === 0) {
      specialtyScores = [{ code: 'SPEC042', matchCount: 1 }];
    }

    // Get specialty details from database
    const specialtyCodes = specialtyScores.map(s => s.code);
    const { data: specialties, error } = await supabase
      .from('specialties')
      .select('specialty_id, specialty_name, name, description')
      .in('specialty_id', specialtyCodes);

    let recommended_specialties: any[] = [];

    if (!error && specialties) {
      recommended_specialties = specialtyScores.map((score, index) => {
        const specialty = specialties.find(s => s.specialty_id === score.code);
        const confidence = Math.max(0.5, Math.min(1.0, score.matchCount / 3));
        
        return {
          specialty_code: score.code,
          name: specialty?.specialty_name || specialty?.name || getSpecialtyName(score.code),
          description: specialty?.description || 'Chuyên khoa y tế',
          confidence_score: Math.round(confidence * 100) / 100,
          is_emergency: isEmergency,
          priority_order: index + 1
        };
      }) || [];
    }

    // Ensure we have at least one specialty
    if (recommended_specialties.length === 0) {
      recommended_specialties = [{
        specialty_code: 'SPEC042',
        name: 'Nội Tổng Hợp',
        description: 'Chuyên khoa tổng quát',
        confidence_score: 0.5,
        is_emergency: false
      }];
    }

    console.log('📋 Final recommendations:', recommended_specialties);

    return res.json({
      success: true,
      data: {
        recommended_specialties,
        analysis_method: 'keyword_matching',
        emergency_detected: recommended_specialties.some(spec => spec.is_emergency)
      }
    });

  } catch (error: any) {
    console.error('Symptom analysis error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze symptoms'
    });
  }
}

// Helper function to get specialty name by code
function getSpecialtyName(specialtyCode: string): string {
  const specialtyNames: Record<string, string> = {
    'SPEC042': 'Nội Tổng Hợp',
    'SPEC043': 'Nội Tiết',
    'SPEC045': 'Phẫu Thuật Nội Soi',
    'SPEC032': 'Nhi Khoa',
    'SPEC030': 'Chấn Thương Chỉnh Hình',
    'SPEC028': 'Tim Mạch',
    'INTERNAL': 'Nội Tổng Hợp',
    'PEDI': 'Nhi Khoa',
    'ORTH': 'Chấn Thương Chỉnh Hình',
    'CARD': 'Tim Mạch',
    'ENDO': 'Nội Tiết'
  };

  return specialtyNames[specialtyCode] || 'Nội Tổng Hợp';
}

// Helper function to create PayOS payment
async function createPayOSPayment(paymentData: {
  appointmentId: string;
  amount: number;
  patientInfo: any;
  serviceInfo: any;
}): Promise<string> {
  try {
    const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID;
    const PAYOS_API_KEY = process.env.PAYOS_API_KEY;
    const PAYOS_API_URL = process.env.PAYOS_API_URL || 'https://api-merchant.payos.vn';
    const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'http://localhost:3000';

    console.log('🔑 PayOS Configuration Check:', {
      hasClientId: !!PAYOS_CLIENT_ID,
      hasApiKey: !!PAYOS_API_KEY,
      apiUrl: PAYOS_API_URL
    });

    if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY) {
      console.warn('⚠️ PayOS credentials not configured, using mock payment URL');
      return `${APP_DOMAIN}/payment/mock?appointmentId=${paymentData.appointmentId}&amount=${paymentData.amount}`;
    }

    const orderCode = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const payosPaymentData = {
      orderCode: orderCode,
      amount: paymentData.amount,
      description: `Khám ${paymentData.serviceInfo.specialty} - BS ${paymentData.serviceInfo.doctorName}`,
      items: [{
        name: `Khám ${paymentData.serviceInfo.specialty}`,
        quantity: 1,
        price: paymentData.amount
      }],
      returnUrl: `${APP_DOMAIN}/payment/success?appointmentId=${paymentData.appointmentId}`,
      cancelUrl: `${APP_DOMAIN}/payment/cancel?appointmentId=${paymentData.appointmentId}`,
      buyerName: paymentData.patientInfo.name,
      buyerPhone: paymentData.patientInfo.phone,
      buyerEmail: paymentData.patientInfo.email || '',
      expiredAt: Math.floor(Date.now() / 1000) + (30 * 60) // 30 minutes
    };

    console.log('💳 Creating PayOS payment request...', {
      orderCode: orderCode,
      amount: paymentData.amount,
      patientName: paymentData.patientInfo.name
    });

    const response = await fetch(`${PAYOS_API_URL}/v2/payment-requests`, {
      method: 'POST',
      headers: {
        'x-client-id': PAYOS_CLIENT_ID,
        'x-api-key': PAYOS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payosPaymentData)
    });

    const result = await response.json();
    console.log('📋 PayOS Response:', { status: response.status, code: result.code });

    if (response.ok && result.code === '00') {
      console.log('✅ PayOS payment created successfully:', result.data.checkoutUrl);
      return result.data.checkoutUrl;
    } else {
      console.error('❌ PayOS payment creation failed:', result);
      // Fallback to mock payment
      const mockUrl = `${APP_DOMAIN}/payment/mock?appointmentId=${paymentData.appointmentId}&amount=${paymentData.amount}`;
      console.log('🔄 Using mock payment URL:', mockUrl);
      return mockUrl;
    }

  } catch (error: any) {
    console.error('PayOS payment creation error:', error);
    // Fallback to mock payment
    const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'http://localhost:3000';
    return `${APP_DOMAIN}/payment/mock?appointmentId=${paymentData.appointmentId}&amount=${paymentData.amount}`;
  }
}

// Handle getting doctors by specialty
async function handleGetDoctors(req: NextApiRequest, res: NextApiResponse, metadata: any, session_id?: string, user_id?: string) {
  try {
    const { specialty_code } = metadata;
    console.log(`🔍 Getting doctors for specialty_code: ${specialty_code}`);

    if (!specialty_code) {
      return res.status(400).json({
        success: false,
        error: 'Missing specialty_code',
        message: 'Vui lòng chọn chuyên khoa trước'
      });
    }

    // Get specialty name for better matching
    let specialtyName = getSpecialtyName(specialty_code);
    console.log(`📋 Specialty mapping: ${specialty_code} -> ${specialtyName}`);

    // Get doctors by matching specialty text field
    const { data: doctors, error } = await supabase
      .from('doctors')
      .select(`
        doctor_id,
        specialty,
        specialty_id,
        availability_status,
        profiles!inner(
          full_name
        )
      `)
      .ilike('specialty', `%${specialtyName}%`)
      .eq('availability_status', 'available')
      .limit(5);

    if (error) {
      console.error('❌ Error fetching doctors:', error);
      throw error;
    }

    console.log(`✅ Found ${doctors?.length || 0} doctors for specialty: ${specialtyName}`);

    // If no doctors found, get some sample doctors for demo
    if (!doctors || doctors.length === 0) {
      console.log('⚠️ No doctors found, providing sample doctors');

      const sampleDoctors = [
        {
          doctor_id: 'DOC001',
          doctor_name: 'BS. Nguyễn Văn A',
          specialty_name: specialtyName,
          availability_status: 'available',
          experience_years: 10
        },
        {
          doctor_id: 'DOC002',
          doctor_name: 'BS. Trần Thị B',
          specialty_name: specialtyName,
          availability_status: 'available',
          experience_years: 8
        },
        {
          doctor_id: 'DOC003',
          doctor_name: 'BS. Lê Văn C',
          specialty_name: specialtyName,
          availability_status: 'available',
          experience_years: 12
        }
      ];

      return res.json({
        success: true,
        data: {
          doctors: sampleDoctors
        },
        message: `Hiển thị bác sĩ mẫu cho chuyên khoa ${specialtyName}`
      });
    }

    const formattedDoctors = doctors?.map(doctor => ({
      doctor_id: doctor.doctor_id,
      doctor_name: doctor.profiles?.full_name || `Bác sĩ ${doctor.doctor_id}`,
      specialty_name: doctor.specialty,
      availability_status: doctor.availability_status,
      experience_years: Math.floor(Math.random() * 15) + 5 // Random experience for demo
    })) || [];

    return res.json({
      success: true,
      data: {
        doctors: formattedDoctors
      }
    });

  } catch (error: any) {
    console.error('❌ Get doctors error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get doctors',
      details: error.message
    });
  }
}

async function handleGetTimeSlots(req: NextApiRequest, res: NextApiResponse, metadata: any, session_id?: string, user_id?: string) {
  try {
    const { doctor_id, dates } = metadata;
    console.log(`🕐 Getting time slots for doctor: ${doctor_id}`);

    if (!doctor_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing doctor_id',
        message: 'Vui lòng chọn bác sĩ trước'
      });
    }

    // Generate available time slots for next 7 days
    const available_slots = [];
    const timeSlots = ['08:00', '09:00', '10:00', '14:00', '15:00', '16:00'];

    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dateDisplay = date.toLocaleDateString('vi-VN');

      // Skip weekends (Saturday = 6, Sunday = 0)
      if (date.getDay() === 0 || date.getDay() === 6) {
        continue;
      }

      for (const time of timeSlots) {
        const slotKey = `${dateStr}-${time}`;
        const endTime = `${parseInt(time.split(':')[0]) + 1}:00`;

        available_slots.push({
          slot_id: slotKey,
          date: dateStr,
          date_display: dateDisplay,
          start_time: time,
          end_time: endTime,
          time_display: `${time} - ${endTime}`,
          is_available: true,
          doctor_id: doctor_id
        });
      }
    }

    // Sort by date and time
    available_slots.sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.start_time.localeCompare(b.start_time);
    });

    console.log(`✅ Generated ${available_slots.length} available time slots for doctor ${doctor_id}`);

    return res.json({
      success: true,
      data: {
        available_slots: available_slots.slice(0, 10), // Limit to 10 slots
        total_available: available_slots.length,
        doctor_id: doctor_id
      },
      message: `Tìm thấy ${available_slots.length} lịch khám có sẵn`
    });

  } catch (error: any) {
    console.error('❌ Get time slots error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get time slots',
      details: error.message
    });
  }
}

async function handleReserveSlot(req: NextApiRequest, res: NextApiResponse, metadata: any, session_id?: string, user_id?: string) {
  try {
    const { doctor_id, appointment_date, appointment_time } = metadata;
    console.log(`🔒 Reserving slot: ${doctor_id} on ${appointment_date} at ${appointment_time}`);

    if (!doctor_id || !appointment_date || !appointment_time || !session_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        details: 'doctor_id, appointment_date, appointment_time, and session_id are required'
      });
    }

    // Generate reservation ID
    const reservation_id = `RESERVE-${Date.now()}-${session_id}`;

    // For demo purposes, always succeed
    console.log('✅ Slot reserved successfully:', reservation_id);

    return res.json({
      success: true,
      data: {
        reservation_id,
        doctor_id,
        appointment_date,
        appointment_time,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
      },
      message: 'Lịch khám đã được giữ chỗ thành công trong 10 phút'
    });

  } catch (error: any) {
    console.error('❌ Reserve slot error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reserve slot',
      details: error.message
    });
  }
}

async function handleGenerateBookingSummary(req: NextApiRequest, res: NextApiResponse, metadata: any, session_id?: string, user_id?: string) {
  try {
    const { booking_data, patient_info, appointment_details } = metadata;
    console.log('📋 Generating booking summary...', {
      patient: patient_info?.name,
      doctor: booking_data?.selectedDoctor?.doctor_name,
      date: appointment_details?.date,
      time: appointment_details?.time
    });

    // Generate appointment ID
    const appointment_id = `APT${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 1).toUpperCase()}`;

    // Calculate consultation fee
    const consultationFee = 200000; // 200k VND default

    // 🏥 CREATE APPOINTMENT RECORD IN DATABASE FIRST
    try {
      console.log('🏥 Creating appointment record in database...');

      // Create or get patient record
      let patientId = null;

      // Try to find existing patient by email
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('patient_id')
        .eq('email', patient_info?.email)
        .single();

      if (existingPatient) {
        patientId = existingPatient.patient_id;
        console.log('✅ Found existing patient:', patientId);
      } else {
        // Create new patient
        const newPatientId = `PAT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Date.now()).slice(-6)}`;

        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert({
            patient_id: newPatientId,
            full_name: patient_info?.name,
            email: patient_info?.email,
            phone: patient_info?.phone,
            status: 'active',
            created_at: new Date().toISOString()
          })
          .select('patient_id')
          .single();

        if (patientError) {
          console.error('❌ Error creating patient:', patientError);
          throw new Error('Không thể tạo hồ sơ bệnh nhân');
        }

        patientId = newPatient.patient_id;
        console.log('✅ Created new patient:', patientId);
      }

      // Create appointment record
      const appointmentData = {
        appointment_id: appointment_id,
        patient_id: patientId,
        doctor_id: booking_data?.selectedDoctor?.doctor_id,
        appointment_date: appointment_details?.date,
        start_time: appointment_details?.time,
        end_time: addMinutesToTime(appointment_details?.time, 30), // 30 min appointment
        appointment_type: 'consultation',
        status: 'scheduled',
        reason: booking_data?.symptoms || 'Khám bệnh qua chatbot',
        notes: `Đặt lịch qua AI Chatbot - Session: ${session_id}\nTriệu chứng: ${booking_data?.symptoms || 'Không có'}\nEmail: ${patient_info?.email}\nSĐT: ${patient_info?.phone}`,
        consultation_fee: consultationFee,
        payment_status: 'pending',
        created_by: 'CHATBOT_AI',
        created_at: new Date().toISOString()
      };

      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single();

      if (appointmentError) {
        console.error('❌ Error creating appointment:', appointmentError);
        throw new Error('Không thể tạo lịch hẹn');
      }

      console.log('✅ Appointment created successfully:', appointment.appointment_id);

    } catch (dbError) {
      console.error('💥 Database Error:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Lỗi hệ thống khi tạo lịch hẹn: ' + dbError.message
      });
    }

    // Create PayOS payment URL
    let payment_url = '';
    try {
      payment_url = await createPayOSPayment({
        appointmentId: appointment_id,
        amount: consultationFee,
        patientInfo: patient_info,
        serviceInfo: {
          specialty: booking_data?.selectedSpecialty || 'Khám tổng quát',
          doctorName: booking_data?.selectedDoctor?.doctor_name || 'Bác sĩ',
          date: appointment_details?.date || 'N/A',
          time: appointment_details?.time || 'N/A'
        }
      });
    } catch (paymentError) {
      console.error('PayOS payment creation failed:', paymentError);
      // Fallback to mock payment
      payment_url = `${process.env.NEXT_PUBLIC_APP_DOMAIN || 'http://localhost:3000'}/payment/mock?appointmentId=${appointment_id}&amount=${consultationFee}`;
    }

    const booking_summary = {
      appointment_id,
      patient_name: patient_info?.name || 'N/A',
      patient_phone: patient_info?.phone || 'N/A',
      patient_email: patient_info?.email || 'N/A',
      doctor_name: booking_data?.selectedDoctor?.doctor_name || 'N/A',
      specialty: booking_data?.selectedSpecialty || 'N/A',
      appointment_date: appointment_details?.date || 'N/A',
      appointment_time: appointment_details?.time || 'N/A',
      consultation_fee: consultationFee,
      status: 'pending_payment',
      created_at: new Date().toISOString()
    };

    console.log('✅ Booking summary generated:', appointment_id);

    return res.json({
      success: true,
      data: {
        booking_summary,
        appointment: booking_summary,
        payment_url
      },
      message: 'Đặt lịch thành công! Vui lòng thanh toán để hoàn tất.'
    });

  } catch (error: any) {
    console.error('Generate booking summary error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate booking summary'
    });
  }
}
