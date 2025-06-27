import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import winston from 'winston';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
  logger.error('SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'chatbot-booking-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ============================================================================
// CHATBOT BOOKING ENDPOINTS
// ============================================================================

// 1. Lấy danh sách chuyên khoa
app.get('/api/specialties', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('specialties')
      .select('specialty_id, name_vi, description')
      .eq('is_active', true)
      .order('name_vi');

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      message: 'Specialties retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching specialties:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách chuyên khoa',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// 2. Lấy danh sách bác sĩ theo chuyên khoa
app.get('/api/doctors', async (req, res) => {
  try {
    const { specialty_id } = req.query;
    
    const { data, error } = await supabase
      .rpc('get_doctors_by_specialty', {
        p_specialty_id: specialty_id || null
      });

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      message: 'Doctors retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bác sĩ',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// 3. Lấy time slots available
app.get('/api/slots/:doctorId/:date', async (req, res) => {
  try {
    const { doctorId, date } = req.params;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const { data, error } = await supabase
      .rpc('get_chatbot_available_slots', {
        p_doctor_id: doctorId,
        p_date: date
      });

    if (error) throw error;

    // Group slots by morning/afternoon
    const morningSlots = data?.filter(slot => slot.is_morning) || [];
    const afternoonSlots = data?.filter(slot => !slot.is_morning) || [];

    res.json({
      success: true,
      data: {
        morning: morningSlots,
        afternoon: afternoonSlots,
        total: data?.length || 0
      },
      message: 'Time slots retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching time slots:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy lịch trống',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// 4. Tạo booking session
app.post('/api/session', async (req, res) => {
  try {
    const { patient_id } = req.body;
    
    if (!patient_id) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required'
      });
    }

    const { data, error } = await supabase
      .rpc('create_booking_session', {
        p_patient_id: patient_id
      });

    if (error) throw error;

    res.json({
      success: true,
      data: data?.[0] || null,
      message: 'Booking session created successfully'
    });
  } catch (error) {
    logger.error('Error creating booking session:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo phiên đặt lịch',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// 5. Cập nhật booking session
app.put('/api/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const {
      step,
      specialty,
      doctor_id,
      date,
      time,
      symptoms,
      notes,
      session_data
    } = req.body;

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

    if (error) throw error;

    const result = data?.[0];
    if (!result?.success) {
      return res.status(400).json({
        success: false,
        message: result?.message || 'Failed to update session'
      });
    }

    res.json({
      success: true,
      data: result.session_info,
      message: result.message
    });
  } catch (error) {
    logger.error('Error updating booking session:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật phiên đặt lịch',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// 6. Lấy thông tin session
app.get('/api/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const { data, error } = await supabase
      .rpc('get_session_info', {
        p_session_id: sessionId
      });

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      data: data[0],
      message: 'Session info retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching session info:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin phiên đặt lịch',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// 7. Tạo appointment từ session
app.post('/api/appointment/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const { data, error } = await supabase
      .rpc('create_appointment_from_session', {
        p_session_id: sessionId
      });

    if (error) throw error;

    const result = data?.[0];
    if (!result?.success) {
      return res.status(400).json({
        success: false,
        message: result?.message || 'Failed to create appointment'
      });
    }

    res.json({
      success: true,
      data: {
        appointment_id: result.appointment_id,
        appointment_info: result.appointment_info
      },
      message: result.message
    });
  } catch (error) {
    logger.error('Error creating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo lịch hẹn',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Chatbot Booking Service running on port ${PORT}`);
  logger.info(`📋 Health check: http://localhost:${PORT}/health`);
  logger.info(`🤖 API Base URL: http://localhost:${PORT}/api`);
});

export default app;
