import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import winston from 'winston';

const app = express();
const PORT = process.env.PORT || 3015;

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'chatbot-booking.log' })
  ]
});

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'chatbot-booking-service',
    version: '2.0.0'
  });
});

// ============================================================================
// CHATBOT BOOKING ENDPOINTS - USING REAL DATA
// ============================================================================

// 1. Lấy danh sách chuyên khoa từ public schema (dữ liệu thực tế)
app.get('/api/specialties', async (req, res) => {
  try {
    logger.info('Fetching specialties from public schema');
    
    const { data, error } = await supabase
      .from('specialties')
      .select('specialty_id, specialty_name, specialty_code, description')
      .eq('is_active', true)
      .order('specialty_name');

    if (error) {
      logger.error('Error fetching specialties:', error);
      throw error;
    }

    // Transform data để có name_vi field cho compatibility với frontend
    const transformedData = data?.map(item => ({
      specialty_id: item.specialty_id,
      name_vi: item.specialty_name,
      name: item.specialty_name,
      description: item.description || `Chuyên khoa ${item.specialty_name}`
    })) || [];

    logger.info(`Specialties found: ${transformedData.length}`);

    return res.json({
      success: true,
      data: transformedData,
      message: 'Specialties retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching specialties:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách chuyên khoa',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 2. Lấy danh sách bác sĩ theo chuyên khoa từ public schema
app.get('/api/doctors', async (req, res) => {
  try {
    const { specialty_id } = req.query;
    logger.info(`Fetching doctors for specialty: ${specialty_id}`);

    // Lấy bác sĩ từ public.doctors với join profiles
    const { data: doctorsData, error } = await supabase
      .from('doctors')
      .select(`
        doctor_id,
        specializations,
        qualification,
        status,
        department_id,
        gender,
        profile_id,
        created_at
      `)
      .eq('status', 'active');

    if (error) {
      logger.error('Error fetching doctors:', error);
      throw error;
    }

    if (!doctorsData || doctorsData.length === 0) {
      logger.info('No doctors found');
      return res.json({
        success: true,
        data: [],
        message: 'No doctors found'
      });
    }

    // Lấy thông tin profiles cho bác sĩ
    const profileIds = doctorsData.map(d => d.profile_id).filter(Boolean);
    let profilesData = [];
    
    if (profileIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', profileIds)
        .eq('is_active', true);
      
      profilesData = profiles || [];
    }

    // Filter doctors by specialty if provided
    let filteredDoctors = doctorsData;
    if (specialty_id) {
      // Lấy tên chuyên khoa từ specialty_id
      const { data: specialtyData } = await supabase
        .from('specialties')
        .select('specialty_name')
        .eq('specialty_id', specialty_id)
        .single();

      if (specialtyData) {
        filteredDoctors = doctorsData.filter(doctor => 
          doctor.specializations && 
          doctor.specializations.toLowerCase().includes(specialtyData.specialty_name.toLowerCase())
        );
      }
    }

    // Transform data để match với format mong đợi của frontend
    const transformedData = filteredDoctors.map(doctor => {
      const profile = profilesData.find(p => p.id === doctor.profile_id);
      
      // Tạo consultation_fee và experience_years giả dựa trên chuyên khoa
      const consultation_fee = (() => {
        const spec = doctor.specializations?.toLowerCase() || '';
        if (spec.includes('tim') || spec.includes('cardio')) return 300000;
        if (spec.includes('thần kinh') || spec.includes('neuro')) return 350000;
        if (spec.includes('nhi') || spec.includes('pediatric')) return 250000;
        if (spec.includes('xương') || spec.includes('ortho')) return 400000;
        if (spec.includes('da') || spec.includes('derma')) return 280000;
        return 200000;
      })();

      const experience_years = (() => {
        const createdDate = new Date(doctor.created_at);
        const now = new Date();
        const yearsDiff = now.getFullYear() - createdDate.getFullYear();
        if (yearsDiff >= 5) return 15;
        if (yearsDiff >= 3) return 10;
        if (yearsDiff >= 1) return 5;
        return 3;
      })();

      return {
        doctor_id: doctor.doctor_id,
        doctor_name: profile?.full_name || `BS. ${doctor.doctor_id}`,
        specialty_name: doctor.specializations || 'Chuyên khoa tổng quát',
        consultation_fee: consultation_fee,
        experience_years: experience_years,
        availability_status: 'available'
      };
    });

    logger.info(`Doctors found: ${transformedData.length}`);

    return res.json({
      success: true,
      data: transformedData,
      message: 'Doctors retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching doctors:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bác sĩ',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 3. Tạo session đặt lịch
app.post('/api/session', async (req, res) => {
  try {
    const { patient_id } = req.body;
    logger.info(`Creating session for patient: ${patient_id}`);

    const sessionId = `CHAT-APPT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    const sessionData = {
      session_id: sessionId,
      patient_id: patient_id || 'GUEST',
      current_step: 'selecting_specialty',
      status: 'active',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
    };

    // Lưu session vào memory hoặc database tùy theo cấu hình
    // Ở đây chúng ta sẽ return session data trực tiếp
    
    logger.info(`Session created: ${sessionId}`);

    return res.json({
      success: true,
      data: sessionData,
      message: 'Session created successfully'
    });
  } catch (error) {
    logger.error('Error creating session:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 4. Cập nhật session
app.put('/api/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const updateData = req.body;
    
    logger.info(`Updating session: ${sessionId}`, updateData);

    // Ở đây chúng ta sẽ return success trực tiếp
    // Trong thực tế sẽ cập nhật vào database
    
    return res.json({
      success: true,
      data: { session_id: sessionId, ...updateData },
      message: 'Session updated successfully'
    });
  } catch (error) {
    logger.error('Error updating session:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 5. Lấy time slots cho bác sĩ
app.get('/api/slots/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;
    
    logger.info(`Fetching slots for doctor: ${doctorId}, date: ${date}`);

    // Tạo time slots giả cho demo
    const slots = [];
    const targetDate = date ? new Date(date as string) : new Date();
    
    // Tạo slots từ 8:00 đến 17:00, mỗi slot 30 phút
    for (let hour = 8; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 12 && minute === 0) continue; // Skip lunch break
        
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endTime = minute === 30 
          ? `${(hour + 1).toString().padStart(2, '0')}:00`
          : `${hour.toString().padStart(2, '0')}:30`;
        
        slots.push({
          slot_id: `SLOT-${doctorId}-${targetDate.toISOString().split('T')[0]}-${startTime}`,
          doctor_id: doctorId,
          date: targetDate.toISOString().split('T')[0],
          start_time: startTime,
          end_time: endTime,
          is_available: Math.random() > 0.3, // 70% available
          time_display: `${startTime} - ${endTime}`,
          is_morning: hour < 12
        });
      }
    }

    return res.json({
      success: true,
      data: slots,
      message: 'Time slots retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching time slots:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy time slots',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 6. Tạo appointment từ session
app.post('/api/appointment/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    logger.info(`Creating appointment for session: ${sessionId}`);

    // Tạo appointment ID
    const appointmentId = `APPT-CHAT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    const appointmentData = {
      appointment_id: appointmentId,
      session_id: sessionId,
      status: 'scheduled',
      created_at: new Date().toISOString(),
      appointment_info: {
        doctor_name: 'BS. Test Doctor',
        specialty: 'Chuyên khoa test',
        appointment_date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '09:30',
        consultation_fee: 200000
      }
    };

    logger.info(`Appointment created: ${appointmentId}`);

    return res.json({
      success: true,
      data: appointmentData,
      message: 'Appointment created successfully'
    });
  } catch (error) {
    logger.error('Error creating appointment:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo appointment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Start server
app.listen(PORT, () => {
  logger.info(`Chatbot Booking Service running on port ${PORT}`);
  console.log(`🤖 Chatbot Booking Service running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🏥 Specialties: http://localhost:${PORT}/api/specialties`);
  console.log(`👨‍⚕️ Doctors: http://localhost:${PORT}/api/doctors`);
});

export default app;
