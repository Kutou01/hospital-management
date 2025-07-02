const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3016;

// Load environment variables
require('dotenv').config();

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'chatbot-booking-service-simple',
    version: '1.0.0'
  });
});

// 1. Lấy danh sách chuyên khoa từ database thực tế
app.get('/api/specialties', async (req, res) => {
  try {
    console.log('Fetching specialties from public.specialties');
    
    const { data, error } = await supabase
      .from('specialties')
      .select('specialty_id, specialty_name, specialty_code, description')
      .eq('is_active', true)
      .order('specialty_name');

    if (error) {
      console.error('Error fetching specialties:', error);
      throw error;
    }

    // Transform data để có name_vi field cho compatibility với frontend
    const transformedData = data?.map(item => ({
      specialty_id: item.specialty_id,
      name_vi: item.specialty_name,
      name: item.specialty_name,
      description: item.description || `Chuyên khoa ${item.specialty_name}`
    })) || [];

    console.log(`Specialties found: ${transformedData.length}`);

    return res.json({
      success: true,
      data: transformedData,
      message: 'Specialties retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching specialties:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách chuyên khoa',
      error: error.message
    });
  }
});

// 2. Lấy danh sách bác sĩ theo chuyên khoa
app.get('/api/doctors', async (req, res) => {
  try {
    const { specialty_id } = req.query;
    console.log(`Fetching doctors for specialty: ${specialty_id}`);
    
    // Lấy bác sĩ từ public.doctors
    const { data: doctorsData, error } = await supabase
      .from('doctors')
      .select(`
        doctor_id,
        specialty,
        specializations,
        qualification,
        experience_years,
        consultation_fee,
        availability_status,
        status,
        profile_id
      `)
      .eq('status', 'active')
      .eq('availability_status', 'available');

    if (error) {
      console.error('Error fetching doctors:', error);
      throw error;
    }

    if (!doctorsData || doctorsData.length === 0) {
      console.log('No doctors found');
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
        filteredDoctors = doctorsData.filter(doctor => {
          // Kiểm tra trong cả specialty (text) và specializations (jsonb)
          const specialtyMatch = doctor.specialty && 
            doctor.specialty.toLowerCase().includes(specialtyData.specialty_name.toLowerCase());
          
          const specializationsMatch = doctor.specializations && 
            Array.isArray(doctor.specializations) &&
            doctor.specializations.some(spec => 
              spec.toLowerCase().includes(specialtyData.specialty_name.toLowerCase())
            );
          
          return specialtyMatch || specializationsMatch;
        });
      }
    }

    // Transform data để match với format mong đợi của frontend
    const transformedData = filteredDoctors.map(doctor => {
      const profile = profilesData.find(p => p.id === doctor.profile_id);
      
      // Lấy specialty name từ specialty hoặc specializations
      let specialtyName = 'Chuyên khoa tổng quát';
      if (doctor.specialty && doctor.specialty !== 'SPEC040') {
        specialtyName = doctor.specialty;
      } else if (doctor.specializations && Array.isArray(doctor.specializations) && doctor.specializations.length > 0) {
        specialtyName = doctor.specializations[0];
      }

      return {
        doctor_id: doctor.doctor_id,
        doctor_name: profile?.full_name || `BS. ${doctor.doctor_id}`,
        specialty_name: specialtyName,
        consultation_fee: doctor.consultation_fee || 200000, // Default fee nếu null
        experience_years: doctor.experience_years || 0,
        availability_status: doctor.availability_status || 'available'
      };
    })
    .filter(doctor => doctor.doctor_name !== `BS. ${doctor.doctor_id}`) // Chỉ lấy doctors có profile
    .sort((a, b) => (b.experience_years || 0) - (a.experience_years || 0)); // Sort by experience

    console.log(`Doctors found after filtering: ${transformedData.length}`);

    return res.json({
      success: true,
      data: transformedData,
      message: 'Doctors retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bác sĩ',
      error: error.message
    });
  }
});

// 3. Tạo session đặt lịch
app.post('/api/session', async (req, res) => {
  try {
    const { patient_id } = req.body;
    console.log(`Creating session for patient: ${patient_id}`);

    const sessionId = `CHAT-APPT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    const sessionData = {
      session_id: sessionId,
      patient_id: patient_id || 'GUEST',
      current_step: 'selecting_specialty',
      status: 'active',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
    };

    console.log(`Session created: ${sessionId}`);

    return res.json({
      success: true,
      data: sessionData,
      message: 'Session created successfully'
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo session',
      error: error.message
    });
  }
});

// 4. Cập nhật session
app.put('/api/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const updateData = req.body;
    
    console.log(`Updating session: ${sessionId}`, updateData);
    
    return res.json({
      success: true,
      data: { session_id: sessionId, ...updateData },
      message: 'Session updated successfully'
    });
  } catch (error) {
    console.error('Error updating session:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật session',
      error: error.message
    });
  }
});

// 5. Lấy time slots cho bác sĩ
app.get('/api/slots/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;
    
    console.log(`Fetching slots for doctor: ${doctorId}, date: ${date}`);

    // Tạo time slots giả cho demo
    const slots = [];
    const targetDate = date ? new Date(date) : new Date();
    
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
    console.error('Error fetching time slots:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy time slots',
      error: error.message
    });
  }
});

// 6. Tạo appointment từ session
app.post('/api/appointment/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log(`Creating appointment for session: ${sessionId}`);

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

    console.log(`Appointment created: ${appointmentId}`);

    return res.json({
      success: true,
      data: appointmentData,
      message: 'Appointment created successfully'
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo appointment',
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🤖 Chatbot Booking Service (Simple) running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🏥 Specialties: http://localhost:${PORT}/api/specialties`);
  console.log(`👨‍⚕️ Doctors: http://localhost:${PORT}/api/doctors`);
});
