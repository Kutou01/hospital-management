"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const supabase_js_1 = require("@supabase/supabase-js");
const winston_1 = __importDefault(require("winston"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3015;
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.Console(),
        new winston_1.default.transports.File({ filename: 'chatbot-booking.log' })
    ]
});
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'chatbot-booking-service',
        version: '2.0.0'
    });
});
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
    }
    catch (error) {
        logger.error('Error fetching specialties:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách chuyên khoa',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
app.get('/api/doctors', async (req, res) => {
    try {
        const { specialty_id } = req.query;
        logger.info(`Fetching doctors for specialty: ${specialty_id}`);
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
        let filteredDoctors = doctorsData;
        if (specialty_id) {
            const { data: specialtyData } = await supabase
                .from('specialties')
                .select('specialty_name')
                .eq('specialty_id', specialty_id)
                .single();
            if (specialtyData) {
                filteredDoctors = doctorsData.filter(doctor => doctor.specializations &&
                    doctor.specializations.toLowerCase().includes(specialtyData.specialty_name.toLowerCase()));
            }
        }
        const transformedData = filteredDoctors.map(doctor => {
            const profile = profilesData.find(p => p.id === doctor.profile_id);
            const consultation_fee = (() => {
                const spec = doctor.specializations?.toLowerCase() || '';
                if (spec.includes('tim') || spec.includes('cardio'))
                    return 300000;
                if (spec.includes('thần kinh') || spec.includes('neuro'))
                    return 350000;
                if (spec.includes('nhi') || spec.includes('pediatric'))
                    return 250000;
                if (spec.includes('xương') || spec.includes('ortho'))
                    return 400000;
                if (spec.includes('da') || spec.includes('derma'))
                    return 280000;
                return 200000;
            })();
            const experience_years = (() => {
                const createdDate = new Date(doctor.created_at);
                const now = new Date();
                const yearsDiff = now.getFullYear() - createdDate.getFullYear();
                if (yearsDiff >= 5)
                    return 15;
                if (yearsDiff >= 3)
                    return 10;
                if (yearsDiff >= 1)
                    return 5;
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
    }
    catch (error) {
        logger.error('Error fetching doctors:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách bác sĩ',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
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
            expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        };
        logger.info(`Session created: ${sessionId}`);
        return res.json({
            success: true,
            data: sessionData,
            message: 'Session created successfully'
        });
    }
    catch (error) {
        logger.error('Error creating session:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo session',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
app.put('/api/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const updateData = req.body;
        logger.info(`Updating session: ${sessionId}`, updateData);
        return res.json({
            success: true,
            data: { session_id: sessionId, ...updateData },
            message: 'Session updated successfully'
        });
    }
    catch (error) {
        logger.error('Error updating session:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật session',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
app.get('/api/slots/:doctorId', async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { date } = req.query;
        logger.info(`Fetching slots for doctor: ${doctorId}, date: ${date}`);
        const slots = [];
        const targetDate = date ? new Date(date) : new Date();
        for (let hour = 8; hour < 17; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                if (hour === 12 && minute === 0)
                    continue;
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
                    is_available: Math.random() > 0.3,
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
    }
    catch (error) {
        logger.error('Error fetching time slots:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy time slots',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
app.post('/api/appointment/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        logger.info(`Creating appointment for session: ${sessionId}`);
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
    }
    catch (error) {
        logger.error('Error creating appointment:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo appointment',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
app.listen(PORT, () => {
    logger.info(`Chatbot Booking Service running on port ${PORT}`);
    console.log(`🤖 Chatbot Booking Service running on port ${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
    console.log(`🏥 Specialties: http://localhost:${PORT}/api/specialties`);
    console.log(`👨‍⚕️ Doctors: http://localhost:${PORT}/api/doctors`);
});
exports.default = app;
//# sourceMappingURL=index-updated.js.map