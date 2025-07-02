import { Router, Request, Response } from 'express';
import { subscriptionService } from '../services/subscription.service';
import logger from '@hospital/shared/dist/utils/logger';
import { EnhancedResponseHelper } from '@hospital/shared/dist/utils/response-helpers';

const router = Router();

/**
 * Webhook endpoint for appointment updates from appointment service
 */
router.post('/webhook/appointment/updated', async (req: Request, res: Response) => {
  try {
    const appointment = req.body;
    
    if (!appointment || !appointment.appointmentId) {
      return EnhancedResponseHelper.badRequest(res, 'Invalid appointment data');
    }

    await subscriptionService.publishAppointmentUpdate(appointment);
    
    logger.info(`📢 Webhook: Published appointment update for ${appointment.appointmentId}`);
    return EnhancedResponseHelper.success(res, { message: 'Event published successfully' });
  } catch (error) {
    logger.error('❌ Webhook error - appointment updated:', error);
    return EnhancedResponseHelper.internalServerError(res, 'Failed to publish event');
  }
});

/**
 * Webhook endpoint for appointment status changes
 */
router.post('/webhook/appointment/status-changed', async (req: Request, res: Response) => {
  try {
    const appointment = req.body;
    
    if (!appointment || !appointment.appointmentId) {
      return EnhancedResponseHelper.badRequest(res, 'Invalid appointment data');
    }

    await subscriptionService.publishAppointmentStatusChange(appointment);
    
    logger.info(`📢 Webhook: Published appointment status change for ${appointment.appointmentId}`);
    return EnhancedResponseHelper.success(res, { message: 'Event published successfully' });
  } catch (error) {
    logger.error('❌ Webhook error - appointment status changed:', error);
    return EnhancedResponseHelper.internalServerError(res, 'Failed to publish event');
  }
});

/**
 * Webhook endpoint for new appointments
 */
router.post('/webhook/appointment/created', async (req: Request, res: Response) => {
  try {
    const appointment = req.body;
    
    if (!appointment || !appointment.appointmentId) {
      return EnhancedResponseHelper.badRequest(res, 'Invalid appointment data');
    }

    await subscriptionService.publishNewAppointment(appointment);
    
    logger.info(`📢 Webhook: Published new appointment ${appointment.appointmentId}`);
    return EnhancedResponseHelper.success(res, { message: 'Event published successfully' });
  } catch (error) {
    logger.error('❌ Webhook error - appointment created:', error);
    return EnhancedResponseHelper.internalServerError(res, 'Failed to publish event');
  }
});

/**
 * Webhook endpoint for waiting queue updates
 */
router.post('/webhook/appointment/queue-updated', async (req: Request, res: Response) => {
  try {
    const { doctorId, queue } = req.body;
    
    if (!doctorId || !Array.isArray(queue)) {
      return EnhancedResponseHelper.badRequest(res, 'Invalid queue data');
    }

    await subscriptionService.publishWaitingQueueUpdate(doctorId, queue);
    
    logger.info(`📢 Webhook: Published queue update for doctor ${doctorId}`);
    return EnhancedResponseHelper.success(res, { message: 'Event published successfully' });
  } catch (error) {
    logger.error('❌ Webhook error - queue updated:', error);
    return EnhancedResponseHelper.internalServerError(res, 'Failed to publish event');
  }
});

/**
 * Webhook endpoint for doctor status changes
 */
router.post('/webhook/doctor/status-changed', async (req: Request, res: Response) => {
  try {
    const doctor = req.body;
    
    if (!doctor || !doctor.doctorId) {
      return EnhancedResponseHelper.badRequest(res, 'Invalid doctor data');
    }

    await subscriptionService.publishDoctorStatusChange(doctor);
    
    logger.info(`📢 Webhook: Published doctor status change for ${doctor.doctorId}`);
    return EnhancedResponseHelper.success(res, { message: 'Event published successfully' });
  } catch (error) {
    logger.error('❌ Webhook error - doctor status changed:', error);
    return EnhancedResponseHelper.internalServerError(res, 'Failed to publish event');
  }
});

/**
 * Webhook endpoint for doctor schedule changes
 */
router.post('/webhook/doctor/schedule-changed', async (req: Request, res: Response) => {
  try {
    const schedule = req.body;
    
    if (!schedule || !schedule.doctorId) {
      return EnhancedResponseHelper.badRequest(res, 'Invalid schedule data');
    }

    await subscriptionService.publishDoctorScheduleChange(schedule);
    
    logger.info(`📢 Webhook: Published doctor schedule change for ${schedule.doctorId}`);
    return EnhancedResponseHelper.success(res, { message: 'Event published successfully' });
  } catch (error) {
    logger.error('❌ Webhook error - doctor schedule changed:', error);
    return EnhancedResponseHelper.internalServerError(res, 'Failed to publish event');
  }
});

/**
 * Webhook endpoint for doctor availability changes
 */
router.post('/webhook/doctor/availability-changed', async (req: Request, res: Response) => {
  try {
    const doctor = req.body;
    
    if (!doctor || !doctor.doctorId) {
      return EnhancedResponseHelper.badRequest(res, 'Invalid doctor data');
    }

    await subscriptionService.publishDoctorAvailabilityChange(doctor);
    
    logger.info(`📢 Webhook: Published doctor availability change for ${doctor.doctorId}`);
    return EnhancedResponseHelper.success(res, { message: 'Event published successfully' });
  } catch (error) {
    logger.error('❌ Webhook error - doctor availability changed:', error);
    return EnhancedResponseHelper.internalServerError(res, 'Failed to publish event');
  }
});

/**
 * Webhook endpoint for doctor notifications
 */
router.post('/webhook/doctor/notification', async (req: Request, res: Response) => {
  try {
    const { doctorId, notification } = req.body;
    
    if (!doctorId || !notification) {
      return EnhancedResponseHelper.badRequest(res, 'Invalid notification data');
    }

    await subscriptionService.publishDoctorNotification(doctorId, notification);
    
    logger.info(`📢 Webhook: Published doctor notification for ${doctorId}`);
    return EnhancedResponseHelper.success(res, { message: 'Event published successfully' });
  } catch (error) {
    logger.error('❌ Webhook error - doctor notification:', error);
    return EnhancedResponseHelper.internalServerError(res, 'Failed to publish event');
  }
});

/**
 * Webhook endpoint for patient status changes
 */
router.post('/webhook/patient/status-changed', async (req: Request, res: Response) => {
  try {
    const patient = req.body;
    
    if (!patient || !patient.patientId) {
      return EnhancedResponseHelper.badRequest(res, 'Invalid patient data');
    }

    await subscriptionService.publishPatientStatusChange(patient);
    
    logger.info(`📢 Webhook: Published patient status change for ${patient.patientId}`);
    return EnhancedResponseHelper.success(res, { message: 'Event published successfully' });
  } catch (error) {
    logger.error('❌ Webhook error - patient status changed:', error);
    return EnhancedResponseHelper.internalServerError(res, 'Failed to publish event');
  }
});

/**
 * Webhook endpoint for patient updates
 */
router.post('/webhook/patient/updated', async (req: Request, res: Response) => {
  try {
    const patient = req.body;
    
    if (!patient || !patient.patientId) {
      return EnhancedResponseHelper.badRequest(res, 'Invalid patient data');
    }

    await subscriptionService.publishPatientUpdate(patient);
    
    logger.info(`📢 Webhook: Published patient update for ${patient.patientId}`);
    return EnhancedResponseHelper.success(res, { message: 'Event published successfully' });
  } catch (error) {
    logger.error('❌ Webhook error - patient updated:', error);
    return EnhancedResponseHelper.internalServerError(res, 'Failed to publish event');
  }
});

/**
 * Webhook endpoint for system notifications
 */
router.post('/webhook/system/notification', async (req: Request, res: Response) => {
  try {
    const notification = req.body;
    
    if (!notification || !notification.type) {
      return EnhancedResponseHelper.badRequest(res, 'Invalid notification data');
    }

    await subscriptionService.publishSystemNotification(notification);
    
    logger.info(`📢 Webhook: Published system notification: ${notification.type}`);
    return EnhancedResponseHelper.success(res, { message: 'Event published successfully' });
  } catch (error) {
    logger.error('❌ Webhook error - system notification:', error);
    return EnhancedResponseHelper.internalServerError(res, 'Failed to publish event');
  }
});

/**
 * Health check endpoint for subscription service
 */
router.get('/health', (req: Request, res: Response) => {
  const isReady = subscriptionService.isReady();
  
  if (isReady) {
    return EnhancedResponseHelper.success(res, {
      status: 'healthy',
      service: 'GraphQL Subscription Service',
      timestamp: new Date().toISOString()
    });
  } else {
    return EnhancedResponseHelper.serviceUnavailable(res, 'Subscription service not ready');
  }
});

export default router;
