import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { DoctorService } from '../services/doctor.service';
import { PatientService } from '../services/patient.service';
import { AppointmentRealtimeService } from '../services/realtime.service';
import logger from '@hospital/shared/dist/utils/logger';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentSearchFilters,
  AppointmentResponse,
  PaginatedAppointmentResponse,
  TimeSlotsResponse
} from '../types/appointment.types';

export class AppointmentController {
  private appointmentRepository: AppointmentRepository;
  private doctorService: DoctorService;
  private patientService: PatientService;

  constructor() {
    this.appointmentRepository = new AppointmentRepository();
    this.doctorService = new DoctorService();
    this.patientService = new PatientService();
  }

  // Get all appointments with optional filters and pagination
  async getAllAppointments(req: Request, res: Response): Promise<void> {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const filters: AppointmentSearchFilters = {
        doctor_id: req.query.doctor_id as string,
        patient_id: req.query.patient_id as string,
        appointment_date: req.query.appointment_date as string,
        date_from: req.query.date_from as string,
        date_to: req.query.date_to as string,
        status: req.query.status as any,
        appointment_type: req.query.appointment_type as any,
        search: req.query.search as string
      };

      const { appointments, total } = await this.appointmentRepository.getAllAppointments(filters, page, limit);

      const response: PaginatedAppointmentResponse = {
        success: true,
        data: appointments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      logger.error('Error in getAllAppointments:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch appointments',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get appointment by ID
  async getAppointmentById(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      const { appointmentId } = req.params;
      const appointment = await this.appointmentRepository.getAppointmentById(appointmentId);

      if (!appointment) {
        res.status(404).json({
          success: false,
          error: 'Appointment not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const response: AppointmentResponse = {
        success: true,
        data: appointment,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      logger.error('Error in getAppointmentById:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch appointment',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get appointments by doctor ID
  async getAppointmentsByDoctorId(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      const { doctorId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const filters: Partial<AppointmentSearchFilters> = {
        appointment_date: req.query.date as string,
        status: req.query.status as any,
        appointment_type: req.query.appointment_type as any
      };

      const { appointments, total } = await this.appointmentRepository.getAppointmentsByDoctorId(
        doctorId, 
        filters, 
        page, 
        limit
      );

      const response: PaginatedAppointmentResponse = {
        success: true,
        data: appointments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      logger.error('Error in getAppointmentsByDoctorId:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch doctor appointments',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get appointments by patient ID
  async getAppointmentsByPatientId(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      const { patientId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const filters: Partial<AppointmentSearchFilters> = {
        appointment_date: req.query.date as string,
        status: req.query.status as any,
        appointment_type: req.query.appointment_type as any
      };

      const { appointments, total } = await this.appointmentRepository.getAppointmentsByPatientId(
        patientId, 
        filters, 
        page, 
        limit
      );

      const response: PaginatedAppointmentResponse = {
        success: true,
        data: appointments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      logger.error('Error in getAppointmentsByPatientId:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch patient appointments',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Create new appointment
  async createAppointment(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      const appointmentData: CreateAppointmentDto = req.body;

      // Verify doctor exists
      const doctorExists = await this.doctorService.verifyDoctorExists(appointmentData.doctor_id);
      if (!doctorExists) {
        res.status(400).json({
          success: false,
          error: 'Doctor not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Verify patient exists
      const patientExists = await this.patientService.verifyPatientExists(appointmentData.patient_id);
      if (!patientExists) {
        res.status(400).json({
          success: false,
          error: 'Patient not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Check doctor availability
      const isAvailable = await this.doctorService.checkDoctorAvailability(
        appointmentData.doctor_id,
        appointmentData.appointment_date,
        appointmentData.start_time,
        appointmentData.end_time
      );

      if (!isAvailable) {
        res.status(400).json({
          success: false,
          error: 'Doctor is not available at the requested time',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Check for conflicts
      const conflictCheck = await this.appointmentRepository.checkConflicts(
        appointmentData.doctor_id,
        appointmentData.appointment_date,
        appointmentData.start_time,
        appointmentData.end_time
      );

      if (conflictCheck.has_conflict) {
        res.status(400).json({
          success: false,
          error: 'Time slot conflicts with existing appointment',
          details: conflictCheck,
          timestamp: new Date().toISOString()
        });
        return;
      }

      const appointment = await this.appointmentRepository.createAppointment(appointmentData);

      const response: AppointmentResponse = {
        success: true,
        data: appointment,
        message: 'Appointment created successfully',
        timestamp: new Date().toISOString()
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Error in createAppointment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create appointment',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Update appointment
  async updateAppointment(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      const { appointmentId } = req.params;
      const updateData: UpdateAppointmentDto = req.body;

      // Check if appointment exists
      const exists = await this.appointmentRepository.appointmentExists(appointmentId);
      if (!exists) {
        res.status(404).json({
          success: false,
          error: 'Appointment not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // If updating time, check for conflicts
      if (updateData.appointment_date || updateData.start_time || updateData.end_time) {
        const currentAppointment = await this.appointmentRepository.getAppointmentById(appointmentId);
        if (currentAppointment) {
          const checkDate = updateData.appointment_date || currentAppointment.appointment_date;
          const checkStartTime = updateData.start_time || currentAppointment.start_time;
          const checkEndTime = updateData.end_time || currentAppointment.end_time;

          const conflictCheck = await this.appointmentRepository.checkConflicts(
            currentAppointment.doctor_id,
            checkDate,
            checkStartTime,
            checkEndTime,
            appointmentId
          );

          if (conflictCheck.has_conflict) {
            res.status(400).json({
              success: false,
              error: 'Time slot conflicts with existing appointment',
              details: conflictCheck,
              timestamp: new Date().toISOString()
            });
            return;
          }
        }
      }

      const appointment = await this.appointmentRepository.updateAppointment(appointmentId, updateData);

      const response: AppointmentResponse = {
        success: true,
        data: appointment,
        message: 'Appointment updated successfully',
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      logger.error('Error in updateAppointment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update appointment',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Cancel appointment
  async cancelAppointment(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      const { appointmentId } = req.params;
      const { reason } = req.body;

      // Check if appointment exists
      const exists = await this.appointmentRepository.appointmentExists(appointmentId);
      if (!exists) {
        res.status(404).json({
          success: false,
          error: 'Appointment not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      await this.appointmentRepository.cancelAppointment(appointmentId, reason);

      res.json({
        success: true,
        message: 'Appointment cancelled successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error in cancelAppointment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel appointment',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Confirm appointment
  async confirmAppointment(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      const { appointmentId } = req.params;
      const { notes } = req.body;

      // Check if appointment exists
      const exists = await this.appointmentRepository.appointmentExists(appointmentId);
      if (!exists) {
        res.status(404).json({
          success: false,
          error: 'Appointment not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const updateData: UpdateAppointmentDto = {
        status: 'confirmed'
      };

      if (notes) {
        updateData.notes = notes;
      }

      const appointment = await this.appointmentRepository.updateAppointment(appointmentId, updateData);

      const response: AppointmentResponse = {
        success: true,
        data: appointment,
        message: 'Appointment confirmed successfully',
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      logger.error('Error in confirmAppointment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to confirm appointment',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get available time slots
  async getAvailableTimeSlots(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      const { doctor_id, date, duration } = req.query;
      const slotDuration = parseInt(duration as string) || 30;

      // Get available slots from doctor service
      const availableSlots = await this.doctorService.getAvailableTimeSlots(
        doctor_id as string,
        date as string,
        slotDuration
      );

      const response: TimeSlotsResponse = {
        success: true,
        data: availableSlots.map(slot => ({
          date: date as string,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_available: true,
          doctor_id: doctor_id as string,
          slot_duration: slotDuration
        })),
        doctor_id: doctor_id as string,
        date: date as string,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      logger.error('Error in getAvailableTimeSlots:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch available time slots',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get appointment statistics
  async getAppointmentStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.appointmentRepository.getAppointmentStats();

      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error in getAppointmentStats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch appointment statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get upcoming appointments for a doctor
  async getUpcomingAppointments(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      const { doctorId } = req.params;
      const days = parseInt(req.query.days as string) || 7;

      const appointments = await this.appointmentRepository.getUpcomingAppointments(doctorId, days);

      const response: AppointmentResponse = {
        success: true,
        data: appointments,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      logger.error('Error in getUpcomingAppointments:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch upcoming appointments',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // REAL-TIME FEATURES

  // Get real-time service status
  async getRealtimeStatus(req: Request, res: Response): Promise<void> {
    try {
      // Note: We'll need to access the real-time service instance
      // For now, return basic status
      res.json({
        success: true,
        data: {
          realtime_enabled: true,
          websocket_enabled: true,
          supabase_subscription: true,
          connected_clients: 0, // Will be updated when WebSocket is integrated
          last_event: null,
          uptime: process.uptime()
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error in getRealtimeStatus:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get real-time status',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get live appointments with real-time capabilities
  async getLiveAppointments(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      // Get current appointments
      const { appointments, total } = await this.appointmentRepository.getAllAppointments({}, page, limit);

      res.json({
        success: true,
        data: {
          appointments,
          realtime_enabled: true,
          live_updates: true,
          websocket_channel: 'appointments_realtime',
          subscription_info: {
            events: ['INSERT', 'UPDATE', 'DELETE'],
            filters: ['status_changes', 'time_changes', 'new_appointments']
          }
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error in getLiveAppointments:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch live appointments',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // CALENDAR INTEGRATION FEATURES

  // Get calendar view for appointments
  async getCalendarView(req: Request, res: Response): Promise<void> {
    try {
      const { date, doctorId, view = 'month' } = req.query;

      if (!date) {
        res.status(400).json({
          success: false,
          error: 'Date is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const calendarData = await this.appointmentRepository.getCalendarView(
        date as string,
        doctorId as string,
        view as 'day' | 'week' | 'month'
      );

      const response: AppointmentResponse = {
        success: true,
        data: calendarData,
        message: 'Calendar view retrieved successfully',
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      logger.error('Error getting calendar view:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get calendar view',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get weekly schedule for a doctor
  async getWeeklySchedule(req: Request, res: Response): Promise<void> {
    try {
      const { doctorId } = req.params;
      const { startDate } = req.query;

      if (!doctorId) {
        res.status(400).json({
          success: false,
          error: 'Doctor ID is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const weeklySchedule = await this.appointmentRepository.getWeeklySchedule(
        doctorId,
        startDate as string
      );

      const response: AppointmentResponse = {
        success: true,
        data: weeklySchedule,
        message: 'Weekly schedule retrieved successfully',
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      logger.error('Error getting weekly schedule:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get weekly schedule',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Reschedule appointment with smart suggestions
  async rescheduleAppointment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { newDate, newStartTime, newEndTime, reason } = req.body;

      if (!id || !newDate || !newStartTime || !newEndTime) {
        res.status(400).json({
          success: false,
          error: 'Appointment ID, new date, and new time are required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Get current appointment
      const currentAppointment = await this.appointmentRepository.getAppointmentById(id);
      if (!currentAppointment) {
        res.status(404).json({
          success: false,
          error: 'Appointment not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Check for conflicts with new time
      const conflictCheck = await this.appointmentRepository.checkConflicts(
        currentAppointment.doctor_id,
        newDate,
        newStartTime,
        newEndTime,
        id // Exclude current appointment
      );

      if (conflictCheck.has_conflict) {
        res.status(400).json({
          success: false,
          error: 'New time slot conflicts with existing appointment',
          details: conflictCheck,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Update appointment
      const updatedAppointment = await this.appointmentRepository.updateAppointment(id, {
        appointment_date: newDate,
        start_time: newStartTime,
        end_time: newEndTime,
        notes: reason ? `Rescheduled: ${reason}` : currentAppointment.notes
      });

      const response: AppointmentResponse = {
        success: true,
        data: updatedAppointment,
        message: 'Appointment rescheduled successfully',
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      logger.error('Error rescheduling appointment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reschedule appointment',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get appointment statistics for a doctor
  async getDoctorAppointmentStats(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      const { doctorId } = req.params;

      // Get appointment statistics
      const stats = await this.appointmentRepository.getDoctorAppointmentStats(doctorId);

      const response: AppointmentResponse = {
        success: true,
        data: stats,
        message: 'Doctor appointment statistics retrieved successfully',
        timestamp: new Date().toISOString()
      };

      res.json(response);

    } catch (error) {
      logger.error('Error getting doctor appointment stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get doctor appointment statistics',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get patient count for a doctor
  async getDoctorPatientCount(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      const { doctorId } = req.params;

      // Get unique patient count for doctor
      const patientCount = await this.appointmentRepository.getDoctorPatientCount(doctorId);

      const response = {
        success: true,
        data: { total_patients: patientCount },
        message: 'Doctor patient count retrieved successfully',
        timestamp: new Date().toISOString()
      };

      res.json(response);

    } catch (error) {
      logger.error('Error getting doctor patient count:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get doctor patient count',
        timestamp: new Date().toISOString()
      });
    }
  }
}
