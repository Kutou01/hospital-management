import { PubSub } from 'graphql-subscriptions';
import logger from '@hospital/shared/dist/utils/logger';

// Subscription event types
export enum SubscriptionEvents {
  // Appointment events
  APPOINTMENT_UPDATED = 'APPOINTMENT_UPDATED',
  APPOINTMENT_STATUS_CHANGED = 'APPOINTMENT_STATUS_CHANGED',
  DOCTOR_APPOINTMENT_UPDATED = 'DOCTOR_APPOINTMENT_UPDATED',
  PATIENT_APPOINTMENT_UPDATED = 'PATIENT_APPOINTMENT_UPDATED',
  NEW_APPOINTMENT_CREATED = 'NEW_APPOINTMENT_CREATED',
  WAITING_QUEUE_UPDATED = 'WAITING_QUEUE_UPDATED',
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',

  // Doctor events
  DOCTOR_STATUS_CHANGED = 'DOCTOR_STATUS_CHANGED',
  DOCTOR_SCHEDULE_CHANGED = 'DOCTOR_SCHEDULE_CHANGED',
  DOCTOR_AVAILABILITY_CHANGED = 'DOCTOR_AVAILABILITY_CHANGED',
  DOCTOR_NOTIFICATION = 'DOCTOR_NOTIFICATION',
  DOCTOR_REVIEW_ADDED = 'DOCTOR_REVIEW_ADDED',
  DOCTOR_SHIFT_CHANGED = 'DOCTOR_SHIFT_CHANGED',
  DOCTOR_WORKLOAD_UPDATED = 'DOCTOR_WORKLOAD_UPDATED',

  // Patient events
  PATIENT_STATUS_CHANGED = 'PATIENT_STATUS_CHANGED',
  PATIENT_UPDATED = 'PATIENT_UPDATED',
  PATIENT_MEDICAL_RECORD_ADDED = 'PATIENT_MEDICAL_RECORD_ADDED',
  PATIENT_PRESCRIPTION_ADDED = 'PATIENT_PRESCRIPTION_ADDED',
  PATIENT_VITAL_SIGNS_UPDATED = 'PATIENT_VITAL_SIGNS_UPDATED',
  PATIENT_LAB_RESULT_ADDED = 'PATIENT_LAB_RESULT_ADDED',
  PATIENT_NOTIFICATION = 'PATIENT_NOTIFICATION',
  PATIENT_QUEUE_STATUS = 'PATIENT_QUEUE_STATUS',

  // Department events
  DEPARTMENT_UPDATED = 'DEPARTMENT_UPDATED',
  DEPARTMENT_STATS_UPDATED = 'DEPARTMENT_STATS_UPDATED',
  ROOM_AVAILABILITY_CHANGED = 'ROOM_AVAILABILITY_CHANGED',
  EQUIPMENT_STATUS_CHANGED = 'EQUIPMENT_STATUS_CHANGED',

  // System events
  SYSTEM_NOTIFICATION = 'SYSTEM_NOTIFICATION',
  GLOBAL_UPDATE = 'GLOBAL_UPDATE'
}

class SubscriptionService {
  private pubsub: PubSub;
  private isInitialized: boolean = false;

  constructor() {
    this.pubsub = new PubSub();
  }

  /**
   * Initialize the subscription service
   */
  async initialize(): Promise<void> {
    try {
      logger.info('🔄 Initializing Subscription Service...');
      
      // Setup event listeners for microservice events
      this.setupEventListeners();
      
      this.isInitialized = true;
      logger.info('✅ Subscription Service initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize Subscription Service:', error);
      throw error;
    }
  }

  /**
   * Setup event listeners for microservice events
   */
  private setupEventListeners(): void {
    // This would typically listen to message queues or webhooks from microservices
    // For now, we'll provide methods for microservices to call directly
    logger.info('📡 Setting up event listeners for microservice events');
  }

  /**
   * Publish appointment update event
   */
  async publishAppointmentUpdate(appointment: any): Promise<void> {
    try {
      await this.pubsub.publish(SubscriptionEvents.APPOINTMENT_UPDATED, {
        appointmentUpdated: appointment
      });

      // Also publish to doctor-specific channel
      if (appointment.doctorId) {
        await this.pubsub.publish(SubscriptionEvents.DOCTOR_APPOINTMENT_UPDATED, {
          doctorAppointmentUpdated: appointment
        });
      }

      // Also publish to patient-specific channel
      if (appointment.patientId) {
        await this.pubsub.publish(SubscriptionEvents.PATIENT_APPOINTMENT_UPDATED, {
          patientAppointmentUpdated: appointment
        });
      }

      logger.info(`📢 Published appointment update: ${appointment.appointmentId}`);
    } catch (error) {
      logger.error('❌ Failed to publish appointment update:', error);
    }
  }

  /**
   * Publish appointment status change event
   */
  async publishAppointmentStatusChange(appointment: any): Promise<void> {
    try {
      await this.pubsub.publish(SubscriptionEvents.APPOINTMENT_STATUS_CHANGED, {
        appointmentStatusChanged: appointment
      });

      logger.info(`📢 Published appointment status change: ${appointment.appointmentId} -> ${appointment.status}`);
    } catch (error) {
      logger.error('❌ Failed to publish appointment status change:', error);
    }
  }

  /**
   * Publish new appointment created event
   */
  async publishNewAppointment(appointment: any): Promise<void> {
    try {
      await this.pubsub.publish(SubscriptionEvents.NEW_APPOINTMENT_CREATED, {
        newAppointmentCreated: appointment
      });

      logger.info(`📢 Published new appointment: ${appointment.appointmentId}`);
    } catch (error) {
      logger.error('❌ Failed to publish new appointment:', error);
    }
  }

  /**
   * Publish waiting queue update event
   */
  async publishWaitingQueueUpdate(doctorId: string, queue: any[]): Promise<void> {
    try {
      await this.pubsub.publish(SubscriptionEvents.WAITING_QUEUE_UPDATED, {
        waitingQueueUpdated: queue
      });

      logger.info(`📢 Published waiting queue update for doctor: ${doctorId}`);
    } catch (error) {
      logger.error('❌ Failed to publish waiting queue update:', error);
    }
  }

  /**
   * Publish doctor status change event
   */
  async publishDoctorStatusChange(doctor: any): Promise<void> {
    try {
      await this.pubsub.publish(SubscriptionEvents.DOCTOR_STATUS_CHANGED, {
        doctorStatusChanged: doctor
      });

      logger.info(`📢 Published doctor status change: ${doctor.doctorId}`);
    } catch (error) {
      logger.error('❌ Failed to publish doctor status change:', error);
    }
  }

  /**
   * Publish doctor schedule change event
   */
  async publishDoctorScheduleChange(schedule: any): Promise<void> {
    try {
      await this.pubsub.publish(SubscriptionEvents.DOCTOR_SCHEDULE_CHANGED, {
        doctorScheduleChanged: schedule
      });

      logger.info(`📢 Published doctor schedule change: ${schedule.doctorId}`);
    } catch (error) {
      logger.error('❌ Failed to publish doctor schedule change:', error);
    }
  }

  /**
   * Publish doctor availability change event
   */
  async publishDoctorAvailabilityChange(doctor: any): Promise<void> {
    try {
      await this.pubsub.publish(SubscriptionEvents.DOCTOR_AVAILABILITY_CHANGED, {
        doctorAvailabilityChanged: doctor
      });

      logger.info(`📢 Published doctor availability change: ${doctor.doctorId}`);
    } catch (error) {
      logger.error('❌ Failed to publish doctor availability change:', error);
    }
  }

  /**
   * Publish doctor notification event
   */
  async publishDoctorNotification(doctorId: string, notification: any): Promise<void> {
    try {
      await this.pubsub.publish(SubscriptionEvents.DOCTOR_NOTIFICATION, {
        doctorNotification: notification
      });

      logger.info(`📢 Published doctor notification: ${doctorId}`);
    } catch (error) {
      logger.error('❌ Failed to publish doctor notification:', error);
    }
  }

  /**
   * Publish patient status change event
   */
  async publishPatientStatusChange(patient: any): Promise<void> {
    try {
      await this.pubsub.publish(SubscriptionEvents.PATIENT_STATUS_CHANGED, {
        patientStatusChanged: patient
      });

      logger.info(`📢 Published patient status change: ${patient.patientId}`);
    } catch (error) {
      logger.error('❌ Failed to publish patient status change:', error);
    }
  }

  /**
   * Publish patient update event
   */
  async publishPatientUpdate(patient: any): Promise<void> {
    try {
      await this.pubsub.publish(SubscriptionEvents.PATIENT_UPDATED, {
        patientUpdated: patient
      });

      logger.info(`📢 Published patient update: ${patient.patientId}`);
    } catch (error) {
      logger.error('❌ Failed to publish patient update:', error);
    }
  }

  /**
   * Publish system notification event
   */
  async publishSystemNotification(notification: any): Promise<void> {
    try {
      await this.pubsub.publish(SubscriptionEvents.SYSTEM_NOTIFICATION, {
        systemNotification: notification
      });

      logger.info(`📢 Published system notification: ${notification.type}`);
    } catch (error) {
      logger.error('❌ Failed to publish system notification:', error);
    }
  }

  /**
   * Get PubSub instance for direct access
   */
  getPubSub(): PubSub {
    return this.pubsub;
  }

  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      logger.info('🧹 Cleaning up Subscription Service...');
      // Cleanup PubSub resources if needed
      this.isInitialized = false;
      logger.info('✅ Subscription Service cleanup completed');
    } catch (error) {
      logger.error('❌ Failed to cleanup Subscription Service:', error);
    }
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
export default subscriptionService;
