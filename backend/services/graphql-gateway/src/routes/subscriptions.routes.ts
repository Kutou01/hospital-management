import { Router, Request, Response } from 'express';
import { subscriptionService } from '../services/subscription.service';
import logger from '@hospital/shared/dist/utils/logger';
import { EnhancedResponseHelper } from '@hospital/shared/dist/utils/response-helpers';

// Helper functions for consistent responses
const sendError = (res: Response, message: string, status = 400) => {
  return res.status(status).json(EnhancedResponseHelper.error(message));
};

const sendSuccess = (res: Response, message: string) => {
  return res.json(EnhancedResponseHelper.success(message));
};

const sendInternalError = (res: Response, message: string) => {
  return res.status(500).json(EnhancedResponseHelper.internalError(message));
};

const router = Router();

/**
 * Webhook endpoint for appointment updates from appointment service
 */
router.post('/webhooks/appointment-created', async (req: Request, res: Response) => {
  try {
    const appointment = req.body;
    
    if (!appointment || !appointment.appointmentId) {
      return sendError(res, 'Invalid appointment data');
    }

    await subscriptionService.publishAppointmentUpdate(appointment);
    
    logger.info(`📢 Webhook: Published appointment created for ${appointment.appointmentId}`);
    return sendSuccess(res, 'Event published successfully');
  } catch (error) {
    logger.error('❌ Webhook error - appointment created:', error);
    return sendInternalError(res, 'Failed to publish event');
  }
});

router.post('/webhooks/appointment-status-changed', async (req: Request, res: Response) => {
  try {
    const appointment = req.body;
    
    if (!appointment || !appointment.appointmentId) {
      return sendError(res, 'Invalid appointment data');
    }

    await subscriptionService.publishAppointmentStatusChange(appointment);
    
    logger.info(`📢 Webhook: Published appointment status change for ${appointment.appointmentId}`);
    return sendSuccess(res, 'Event published successfully');
  } catch (error) {
    logger.error('❌ Webhook error - appointment status changed:', error);
    return sendInternalError(res, 'Failed to publish event');
  }
});

/**
 * Webhook endpoint for queue updates
 */
router.post('/webhooks/queue-updated', async (req: Request, res: Response) => {
  try {
    const queueData = req.body;
    
    if (!queueData || !queueData.queueId) {
      return sendError(res, 'Invalid queue data');
    }

    // await subscriptionService.publishQueueUpdate(queueData); // Method not implemented yet
    
    logger.info(`📢 Webhook: Published queue update for ${queueData.queueId}`);
    return sendSuccess(res, 'Event published successfully');
  } catch (error) {
    logger.error('❌ Webhook error - queue updated:', error);
    return sendInternalError(res, 'Failed to publish event');
  }
});

/**
 * Webhook endpoint for doctor availability updates
 */
router.post('/webhooks/doctor-availability-changed', async (req: Request, res: Response) => {
  try {
    const doctorData = req.body;
    
    if (!doctorData || !doctorData.doctorId) {
      return sendError(res, 'Invalid doctor data');
    }

    await subscriptionService.publishDoctorAvailabilityChange(doctorData);
    
    logger.info(`📢 Webhook: Published doctor availability change for ${doctorData.doctorId}`);
    return sendSuccess(res, 'Event published successfully');
  } catch (error) {
    logger.error('❌ Webhook error - doctor availability changed:', error);
    return sendInternalError(res, 'Failed to publish event');
  }
});

/**
 * Webhook endpoint for schedule updates
 */
router.post('/webhooks/schedule-updated', async (req: Request, res: Response) => {
  try {
    const scheduleData = req.body;
    
    if (!scheduleData || !scheduleData.scheduleId) {
      return sendError(res, 'Invalid schedule data');
    }

    // await subscriptionService.publishScheduleUpdate(scheduleData); // Method not implemented yet
    
    logger.info(`📢 Webhook: Published schedule update for ${scheduleData.scheduleId}`);
    return sendSuccess(res, 'Event published successfully');
  } catch (error) {
    logger.error('❌ Webhook error - schedule updated:', error);
    return sendInternalError(res, 'Failed to publish event');
  }
});

/**
 * Webhook endpoint for doctor status updates
 */
router.post('/webhooks/doctor-status-changed', async (req: Request, res: Response) => {
  try {
    const doctorData = req.body;
    
    if (!doctorData || !doctorData.doctorId) {
      return sendError(res, 'Invalid doctor data');
    }

    await subscriptionService.publishDoctorStatusChange(doctorData);
    
    logger.info(`📢 Webhook: Published doctor status change for ${doctorData.doctorId}`);
    return sendSuccess(res, 'Event published successfully');
  } catch (error) {
    logger.error('❌ Webhook error - doctor status changed:', error);
    return sendInternalError(res, 'Failed to publish event');
  }
});

/**
 * Webhook endpoint for system notifications
 */
router.post('/webhooks/system-notification', async (req: Request, res: Response) => {
  try {
    const notificationData = req.body;
    
    if (!notificationData || !notificationData.type) {
      return sendError(res, 'Invalid notification data');
    }

    await subscriptionService.publishSystemNotification(notificationData);
    
    logger.info(`📢 Webhook: Published system notification of type ${notificationData.type}`);
    return sendSuccess(res, 'Event published successfully');
  } catch (error) {
    logger.error('❌ Webhook error - system notification:', error);
    return sendInternalError(res, 'Failed to publish event');
  }
});

/**
 * Webhook endpoint for patient updates
 */
router.post('/webhooks/patient-updated', async (req: Request, res: Response) => {
  try {
    const patientData = req.body;
    
    if (!patientData || !patientData.patientId) {
      return sendError(res, 'Invalid patient data');
    }

    await subscriptionService.publishPatientUpdate(patientData);
    
    logger.info(`📢 Webhook: Published patient update for ${patientData.patientId}`);
    return sendSuccess(res, 'Event published successfully');
  } catch (error) {
    logger.error('❌ Webhook error - patient updated:', error);
    return sendInternalError(res, 'Failed to publish event');
  }
});

/**
 * Webhook endpoint for patient status changes
 */
router.post('/webhooks/patient-status-changed', async (req: Request, res: Response) => {
  try {
    const patientData = req.body;
    
    if (!patientData || !patientData.patientId) {
      return sendError(res, 'Invalid patient data');
    }

    await subscriptionService.publishPatientStatusChange(patientData);
    
    logger.info(`📢 Webhook: Published patient status change for ${patientData.patientId}`);
    return sendSuccess(res, 'Event published successfully');
  } catch (error) {
    logger.error('❌ Webhook error - patient status changed:', error);
    return sendInternalError(res, 'Failed to publish event');
  }
});

/**
 * Webhook endpoint for emergency notifications
 */
router.post('/webhooks/emergency-notification', async (req: Request, res: Response) => {
  try {
    const emergencyData = req.body;
    
    if (!emergencyData || !emergencyData.type) {
      return sendError(res, 'Invalid notification data');
    }

    await subscriptionService.publishSystemNotification(emergencyData);
    
    logger.info(`📢 Webhook: Published emergency notification of type ${emergencyData.type}`);
    return sendSuccess(res, 'Event published successfully');
  } catch (error) {
    logger.error('❌ Webhook error - emergency notification:', error);
    return sendInternalError(res, 'Failed to publish event');
  }
});

/**
 * Health check endpoint for subscription service
 */
router.get('/health', (req: Request, res: Response) => {
  try {
    const healthData = {
      status: 'healthy',
      service: 'GraphQL Subscriptions',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      subscriptions: {
        active: 0, // subscriptionService.getActiveSubscriptionsCount() not implemented
        supported: [
          'appointmentCreated',
          'appointmentStatusChanged',
          'queueUpdated',
          'doctorAvailabilityChanged',
          'scheduleUpdated',
          'doctorStatusChanged',
          'systemNotification',
          'patientUpdated',
          'patientStatusChanged',
          'emergencyNotification'
        ]
      }
    };
    
    return res.json(healthData);
  } catch (error) {
    logger.error('❌ Subscription health check failed:', error);
    return res.status(503).json(EnhancedResponseHelper.serviceUnavailable('Subscription service not ready'));
  }
});

export default router;
