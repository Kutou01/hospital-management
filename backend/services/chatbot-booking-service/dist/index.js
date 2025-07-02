"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const supabase_js_1 = require("@supabase/supabase-js");
const winston_1 = __importDefault(require("winston"));
dotenv_1.default.config();
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston_1.default.transports.File({ filename: 'logs/combined.log' }),
        new winston_1.default.transports.Console({
            format: winston_1.default.format.simple()
        })
    ]
});
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!supabaseServiceKey) {
    logger.error('SUPABASE_SERVICE_ROLE_KEY is required');
    process.exit(1);
}
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3018;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        process.env.FRONTEND_URL || 'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    next();
});
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'chatbot-booking-service',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
app.get('/api/specialties', async (req, res) => {
    try {
        logger.info('Fetching specialties from public.specialties');
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
        specialty,
        specializations,
        qualification,
        experience_years,
        consultation_fee,
        availability_status,
        status,
        profile_id,
        specialty_id
      `)
            .eq('status', 'active')
            .eq('availability_status', 'available');
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
                filteredDoctors = doctorsData.filter(doctor => {
                    const specialtyMatch = doctor.specialty &&
                        doctor.specialty.toLowerCase().includes(specialtyData.specialty_name.toLowerCase());
                    const specializationsMatch = doctor.specializations &&
                        Array.isArray(doctor.specializations) &&
                        doctor.specializations.some(spec => spec.toLowerCase().includes(specialtyData.specialty_name.toLowerCase()));
                    return specialtyMatch || specializationsMatch;
                });
            }
        }
        const transformedData = filteredDoctors.map(doctor => {
            const profile = profilesData.find(p => p.id === doctor.profile_id);
            let specialtyName = 'Chuyên khoa tổng quát';
            if (doctor.specialty && doctor.specialty !== 'SPEC040') {
                specialtyName = doctor.specialty;
            }
            else if (doctor.specializations && Array.isArray(doctor.specializations) && doctor.specializations.length > 0) {
                specialtyName = doctor.specializations[0];
            }
            return {
                doctor_id: doctor.doctor_id,
                doctor_name: profile?.full_name || `BS. ${doctor.doctor_id}`,
                specialty_name: specialtyName,
                consultation_fee: doctor.consultation_fee || 200000,
                experience_years: doctor.experience_years || 0,
                availability_status: doctor.availability_status || 'available'
            };
        })
            .filter(doctor => doctor.doctor_name !== `BS. ${doctor.doctor_id}`)
            .sort((a, b) => (b.experience_years || 0) - (a.experience_years || 0));
        logger.info(`Doctors found after filtering: ${transformedData.length}`);
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
app.get('/api/slots/:doctorId/:date', async (req, res) => {
    try {
        const { doctorId, date } = req.params;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format. Use YYYY-MM-DD'
            });
        }
        const { data, error } = await supabase.rpc('hospital_dev.get_chatbot_available_slots', {
            p_doctor_id: doctorId,
            p_date: date
        });
        if (error) {
            console.log('RPC function failed, using mock data:', error);
            const mockSlots = [
                { slot_id: 'SLOT-001', time_display: '08:00 - 08:30', start_time: '08:00:00', end_time: '08:30:00', is_morning: true },
                { slot_id: 'SLOT-002', time_display: '08:30 - 09:00', start_time: '08:30:00', end_time: '09:00:00', is_morning: true },
                { slot_id: 'SLOT-003', time_display: '09:00 - 09:30', start_time: '09:00:00', end_time: '09:30:00', is_morning: true },
                { slot_id: 'SLOT-004', time_display: '14:00 - 14:30', start_time: '14:00:00', end_time: '14:30:00', is_morning: false },
                { slot_id: 'SLOT-005', time_display: '14:30 - 15:00', start_time: '14:30:00', end_time: '15:00:00', is_morning: false },
                { slot_id: 'SLOT-006', time_display: '15:00 - 15:30', start_time: '15:00:00', end_time: '15:30:00', is_morning: false }
            ];
            const transformedData = mockSlots;
            const morningSlots = transformedData.filter((slot) => slot.is_morning);
            const afternoonSlots = transformedData.filter((slot) => !slot.is_morning);
            return res.json({
                success: true,
                data: {
                    morning: morningSlots,
                    afternoon: afternoonSlots,
                    total: transformedData.length
                },
                message: 'Time slots retrieved successfully (mock data)'
            });
        }
        const transformedData = data || [];
        const morningSlots = transformedData.filter((slot) => slot.is_morning);
        const afternoonSlots = transformedData.filter((slot) => !slot.is_morning);
        return res.json({
            success: true,
            data: {
                morning: morningSlots,
                afternoon: afternoonSlots,
                total: transformedData?.length || 0
            },
            message: 'Time slots retrieved successfully'
        });
    }
    catch (error) {
        logger.error('Error fetching time slots:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy lịch trống',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
});
app.post('/api/session', async (req, res) => {
    try {
        const { patient_id } = req.body;
        if (!patient_id) {
            return res.status(400).json({
                success: false,
                message: 'Patient ID is required'
            });
        }
        const sessionId = `CHAT-APPT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-6)}`;
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
        const mockSession = {
            session_id: sessionId,
            patient_id: patient_id,
            current_step: 'selecting_specialty',
            status: 'active',
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        console.log('Created mock session:', mockSession);
        return res.json({
            success: true,
            data: {
                session_id: mockSession.session_id,
                expires_at: mockSession.expires_at
            },
            message: 'Booking session created successfully (mock)'
        });
    }
    catch (error) {
        logger.error('Error creating booking session:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo phiên đặt lịch',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
});
app.put('/api/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { step, specialty, doctor_id, date, time, symptoms, notes, session_data } = req.body;
        const { data, error } = await supabase
            .rpc('update_booking_session', {
            p_session_id: sessionId,
            p_step: step || null,
            p_specialty: specialty || null,
            p_doctor_id: doctor_id || null,
            p_date: date || null,
            p_time: time || null,
            p_symptoms: symptoms || null,
            p_notes: notes || null,
            p_session_data: session_data || null
        });
        if (error)
            throw error;
        const result = data?.[0];
        if (!result?.success) {
            return res.status(400).json({
                success: false,
                message: result?.message || 'Failed to update session'
            });
        }
        return res.json({
            success: true,
            data: result.session_info,
            message: result.message
        });
    }
    catch (error) {
        logger.error('Error updating booking session:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật phiên đặt lịch',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
});
app.get('/api/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { data, error } = await supabase
            .rpc('get_session_info', {
            p_session_id: sessionId
        });
        if (error)
            throw error;
        if (!data || data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }
        return res.json({
            success: true,
            data: data[0],
            message: 'Session info retrieved successfully'
        });
    }
    catch (error) {
        logger.error('Error fetching session info:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin phiên đặt lịch',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
});
app.post('/api/appointment/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { data, error } = await supabase
            .rpc('create_appointment_from_session', {
            p_session_id: sessionId
        });
        if (error)
            throw error;
        const result = data?.[0];
        if (!result?.success) {
            return res.status(400).json({
                success: false,
                message: result?.message || 'Failed to create appointment'
            });
        }
        return res.json({
            success: true,
            data: {
                appointment_id: result.appointment_id,
                appointment_info: result.appointment_info
            },
            message: result.message
        });
    }
    catch (error) {
        logger.error('Error creating appointment:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo lịch hẹn',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
});
app.use((error, req, res, next) => {
    logger.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});
app.listen(PORT, () => {
    logger.info(`🚀 Chatbot Booking Service running on port ${PORT}`);
    logger.info(`📋 Health check: http://localhost:${PORT}/health`);
    logger.info(`🤖 API Base URL: http://localhost:${PORT}/api`);
});
exports.default = app;
//# sourceMappingURL=index.js.map