import express from 'express';
import { AppointmentController } from '../controllers/appointment.controller';
import {
  validateAppointmentId,
  validatePatientId,
  validateDoctorId,
  validateCreateAppointment,
  validateUpdateAppointment,
  validateAppointmentSearch,
  validateAvailableSlots,
  validateConfirmAppointment
} from '../validators/appointment.validators';

const router = express.Router();
const appointmentController = new AppointmentController();

// GET /api/appointments - Get all appointments with optional filters and pagination
router.get(
  '/',
  validateAppointmentSearch,
  appointmentController.getAllAppointments.bind(appointmentController)
);

// GET /api/appointments/stats - Get appointment statistics
router.get(
  '/stats',
  appointmentController.getAppointmentStats.bind(appointmentController)
);

// GET /api/appointments/realtime/status - Get real-time service status
router.get(
  '/realtime/status',
  appointmentController.getRealtimeStatus.bind(appointmentController)
);

// GET /api/appointments/live - Get live appointments (real-time enabled)
router.get(
  '/live',
  appointmentController.getLiveAppointments.bind(appointmentController)
);

// GET /api/appointments/available-slots - Get available time slots
router.get(
  '/available-slots',
  validateAvailableSlots,
  appointmentController.getAvailableTimeSlots.bind(appointmentController)
);

// GET /api/appointments/doctor/:doctorId - Get appointments by doctor ID
router.get(
  '/doctor/:doctorId',
  validateDoctorId,
  appointmentController.getAppointmentsByDoctorId.bind(appointmentController)
);

// GET /api/appointments/doctor/:doctorId/upcoming - Get upcoming appointments for doctor
router.get(
  '/doctor/:doctorId/upcoming',
  validateDoctorId,
  appointmentController.getUpcomingAppointments.bind(appointmentController)
);

// GET /api/appointments/patient/:patientId - Get appointments by patient ID
router.get(
  '/patient/:patientId',
  validatePatientId,
  appointmentController.getAppointmentsByPatientId.bind(appointmentController)
);

// GET /api/appointments/:appointmentId - Get appointment by ID
router.get(
  '/:appointmentId',
  validateAppointmentId,
  appointmentController.getAppointmentById.bind(appointmentController)
);

// POST /api/appointments - Create new appointment
router.post(
  '/',
  validateCreateAppointment,
  appointmentController.createAppointment.bind(appointmentController)
);

// PUT /api/appointments/:appointmentId - Update appointment
router.put(
  '/:appointmentId',
  validateUpdateAppointment,
  appointmentController.updateAppointment.bind(appointmentController)
);

// POST /api/appointments/:appointmentId/confirm - Confirm appointment
router.post(
  '/:appointmentId/confirm',
  validateConfirmAppointment,
  appointmentController.confirmAppointment.bind(appointmentController)
);

// DELETE /api/appointments/:appointmentId - Cancel appointment
router.delete(
  '/:appointmentId',
  validateAppointmentId,
  appointmentController.cancelAppointment.bind(appointmentController)
);

// CALENDAR INTEGRATION ROUTES

// GET /api/appointments/calendar - Get calendar view
router.get(
  '/calendar',
  appointmentController.getCalendarView.bind(appointmentController)
);

// GET /api/appointments/doctor/:doctorId/weekly - Get weekly schedule for doctor
router.get(
  '/doctor/:doctorId/weekly',
  validateDoctorId,
  appointmentController.getWeeklySchedule.bind(appointmentController)
);

// PUT /api/appointments/:id/reschedule - Reschedule appointment
router.put(
  '/:id/reschedule',
  validateAppointmentId,
  appointmentController.rescheduleAppointment.bind(appointmentController)
);

// REAL-TIME FEATURES ROUTES

// GET /api/appointments/realtime/status - Get real-time service status
router.get(
  '/realtime/status',
  appointmentController.getRealtimeStatus.bind(appointmentController)
);

// GET /api/appointments/live - Get live appointments with real-time capabilities
router.get(
  '/live',
  appointmentController.getLiveAppointments.bind(appointmentController)
);

export default router;
