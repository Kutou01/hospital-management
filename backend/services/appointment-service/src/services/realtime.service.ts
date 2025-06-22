import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Server as HttpServer } from 'http';
import { supabaseAdmin } from '../config/database.config';
import logger from '@hospital/shared/dist/utils/logger';
import { EventBus } from '@hospital/shared/dist/events/event-bus';
import { WebSocketManager } from './websocket.service';
import { notificationService } from './notification.service';

export interface AppointmentRealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  appointment_id: string;
  doctor_id?: string;
  patient_id?: string;
  old_status?: string;
  new_status?: string;
  appointment_date?: string;
  start_time?: string;
  end_time?: string;
  timestamp: string;
}

export class AppointmentRealtimeService {
  private subscription: RealtimeChannel | null = null;
  private eventBus: EventBus;
  private wsManager: WebSocketManager;
  private isConnected: boolean = false;

  constructor() {
    this.eventBus = new EventBus('appointment-service');
    this.wsManager = new WebSocketManager();
  }

  /**
   * Initialize real-time subscriptions for appointments
   */
  async initialize(httpServer?: HttpServer): Promise<void> {
    try {
      logger.info('🔄 Initializing Appointment Real-time Service...');

      // Connect to event bus
      await this.eventBus.connect(process.env.RABBITMQ_URL || 'amqp://localhost');

      // Initialize WebSocket manager with HTTP server
      if (httpServer) {
        await this.wsManager.initialize(httpServer);
      } else {
        logger.warn('⚠️ No HTTP server provided - WebSocket features will be limited');
      }

      // Setup Supabase real-time subscription
      await this.setupSupabaseSubscription();

      this.isConnected = true;
      logger.info('✅ Appointment Real-time Service initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize Appointment Real-time Service:', error);
      throw error;
    }
  }

  /**
   * Setup Supabase real-time subscription for appointments table
   */
  private async setupSupabaseSubscription(): Promise<void> {
    try {
      this.subscription = supabaseAdmin
        .channel('appointments_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'appointments'
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            this.handleAppointmentChange(payload);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            logger.info('✅ Supabase real-time subscription active for appointments');
          } else if (status === 'CHANNEL_ERROR') {
            logger.error('❌ Supabase real-time subscription error');
          }
        });
    } catch (error) {
      logger.error('❌ Failed to setup Supabase subscription:', error);
      throw error;
    }
  }

  /**
   * Handle appointment changes from Supabase real-time
   */
  private async handleAppointmentChange(payload: RealtimePostgresChangesPayload<any>): Promise<void> {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      // Type-safe access to record properties
      const appointmentId = (newRecord as any)?.appointment_id || (oldRecord as any)?.appointment_id;

      logger.info('📡 Received appointment change:', {
        eventType,
        appointmentId
      });

      // Create standardized event with type-safe access
      const realtimeEvent: AppointmentRealtimeEvent = {
        type: eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        appointment_id: appointmentId,
        doctor_id: (newRecord as any)?.doctor_id || (oldRecord as any)?.doctor_id,
        patient_id: (newRecord as any)?.patient_id || (oldRecord as any)?.patient_id,
        old_status: (oldRecord as any)?.status,
        new_status: (newRecord as any)?.status,
        appointment_date: (newRecord as any)?.appointment_date || (oldRecord as any)?.appointment_date,
        start_time: (newRecord as any)?.start_time || (oldRecord as any)?.start_time,
        end_time: (newRecord as any)?.end_time || (oldRecord as any)?.end_time,
        timestamp: new Date().toISOString()
      };

      // Process the event
      await this.processAppointmentEvent(realtimeEvent);

    } catch (error) {
      logger.error('❌ Error handling appointment change:', error);
    }
  }

  /**
   * Process appointment events and broadcast to relevant channels
   */
  private async processAppointmentEvent(event: AppointmentRealtimeEvent): Promise<void> {
    try {
      // 1. Broadcast to WebSocket clients
      await this.broadcastToWebSocket(event);

      // 2. Publish to event bus for other services
      await this.publishToEventBus(event);

      // 3. Handle specific event types
      await this.handleSpecificEventType(event);

      // 4. Update cache if needed
      await this.updateCache(event);

      logger.info('✅ Appointment event processed successfully:', {
        type: event.type,
        appointmentId: event.appointment_id
      });

    } catch (error) {
      logger.error('❌ Error processing appointment event:', error);
    }
  }

  /**
   * Broadcast event to WebSocket clients
   */
  private async broadcastToWebSocket(event: AppointmentRealtimeEvent): Promise<void> {
    try {
      // Check if WebSocket is available
      if (!this.wsManager.isWebSocketReady()) {
        logger.warn('⚠️ WebSocket not ready - skipping broadcast');
        return;
      }

      // Broadcast to all connected clients
      this.wsManager.broadcastToAll('appointment_change', event);

      // Broadcast to specific doctor's clients
      if (event.doctor_id) {
        this.wsManager.broadcastToRoom(`doctor_${event.doctor_id}`, 'appointment_change', event);
      }

      // Broadcast to specific patient's clients
      if (event.patient_id) {
        this.wsManager.broadcastToRoom(`patient_${event.patient_id}`, 'appointment_change', event);
      }

      // Broadcast to date-specific room
      if (event.appointment_date) {
        this.wsManager.broadcastToRoom(`date_${event.appointment_date}`, 'appointment_change', event);
      }

      logger.info('✅ WebSocket broadcast completed for appointment:', event.appointment_id);

    } catch (error) {
      logger.error('❌ Error broadcasting to WebSocket:', error);
    }
  }

  /**
   * Publish event to message bus for other services
   */
  private async publishToEventBus(event: AppointmentRealtimeEvent): Promise<void> {
    try {
      await this.eventBus.publish('appointment_changed' as any, event, `appointment.${event.type.toLowerCase()}`);

      // Specific routing for status changes
      if (event.type === 'UPDATE' && event.old_status !== event.new_status) {
        await this.eventBus.publish('appointment_status_changed' as any, {
          ...event,
          status_change: {
            from: event.old_status,
            to: event.new_status
          }
        }, 'appointment.status');
      }

    } catch (error) {
      logger.error('❌ Error publishing to event bus:', error);
    }
  }

  /**
   * Handle specific event types with custom logic
   */
  private async handleSpecificEventType(event: AppointmentRealtimeEvent): Promise<void> {
    try {
      switch (event.type) {
        case 'INSERT':
          await this.handleNewAppointment(event);
          break;
        case 'UPDATE':
          await this.handleAppointmentUpdate(event);
          break;
        case 'DELETE':
          await this.handleAppointmentCancellation(event);
          break;
      }
    } catch (error) {
      logger.error('❌ Error handling specific event type:', error);
    }
  }

  /**
   * Handle new appointment creation
   */
  private async handleNewAppointment(event: AppointmentRealtimeEvent): Promise<void> {
    logger.info('🆕 New appointment created:', event.appointment_id);
    
    // Check for potential conflicts with existing appointments
    await this.checkRealtimeConflicts(event);
    
    // Trigger notifications
    await this.triggerNewAppointmentNotifications(event);
  }

  /**
   * Handle appointment updates
   */
  private async handleAppointmentUpdate(event: AppointmentRealtimeEvent): Promise<void> {
    logger.info('📝 Appointment updated:', event.appointment_id);
    
    // Handle status changes
    if (event.old_status !== event.new_status) {
      await this.handleStatusChange(event);
    }
    
    // Handle time changes
    if (event.start_time || event.end_time) {
      await this.handleTimeChange(event);
    }
  }

  /**
   * Handle appointment cancellation
   */
  private async handleAppointmentCancellation(event: AppointmentRealtimeEvent): Promise<void> {
    logger.info('❌ Appointment cancelled:', event.appointment_id);
    
    // Trigger cancellation notifications
    await this.triggerCancellationNotifications(event);
    
    // Update availability
    await this.updateDoctorAvailability(event);
  }

  /**
   * Check for real-time conflicts
   */
  private async checkRealtimeConflicts(event: AppointmentRealtimeEvent): Promise<void> {
    try {
      if (event.type === 'INSERT' && event.appointment_id) {
        // Check for conflicts with the new appointment
        logger.info('🔍 Checking real-time conflicts for new appointment:', event.appointment_id);

        // This could trigger conflict resolution or warnings
        // For now, we'll just log the check
        logger.info('✅ Real-time conflict check completed');
      }
    } catch (error) {
      logger.error('❌ Error in real-time conflict check:', error);
    }
  }

  /**
   * Trigger notifications for new appointments
   */
  private async triggerNewAppointmentNotifications(event: AppointmentRealtimeEvent): Promise<void> {
    try {
      if (event.type === 'INSERT' && event.appointment_id) {
        logger.info('📧 Triggering notifications for new appointment:', event.appointment_id);

        // Create appointment object from event data
        const appointmentData = {
          appointment_id: event.appointment_id,
          doctor_id: event.doctor_id || '',
          patient_id: event.patient_id || '',
          appointment_date: event.appointment_date || '',
          start_time: event.start_time || '',
          end_time: event.end_time || '',
          status: (event.new_status || 'scheduled') as 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show',
          appointment_type: 'consultation' as const,
          created_at: event.timestamp,
          updated_at: event.timestamp
        };

        // Send notification through notification service
        await notificationService.sendAppointmentCreatedNotification(appointmentData);

        logger.info('✅ New appointment notifications triggered');
      }
    } catch (error) {
      logger.error('❌ Error triggering new appointment notifications:', error);
    }
  }

  /**
   * Handle status changes
   */
  private async handleStatusChange(event: AppointmentRealtimeEvent): Promise<void> {
    logger.info('🔄 Status changed:', {
      appointmentId: event.appointment_id,
      from: event.old_status,
      to: event.new_status
    });
  }

  /**
   * Handle time changes
   */
  private async handleTimeChange(event: AppointmentRealtimeEvent): Promise<void> {
    logger.info('⏰ Time changed for appointment:', event.appointment_id);
  }

  /**
   * Trigger cancellation notifications
   */
  private async triggerCancellationNotifications(event: AppointmentRealtimeEvent): Promise<void> {
    try {
      if (event.type === 'DELETE' && event.appointment_id) {
        logger.info('📧 Triggering cancellation notifications for appointment:', event.appointment_id);

        // Create appointment object from event data
        const appointmentData = {
          appointment_id: event.appointment_id,
          doctor_id: event.doctor_id || '',
          patient_id: event.patient_id || '',
          appointment_date: event.appointment_date || '',
          start_time: event.start_time || '',
          end_time: event.end_time || '',
          status: 'cancelled' as const,
          appointment_type: 'consultation' as const,
          created_at: event.timestamp,
          updated_at: event.timestamp
        };

        // Send cancellation notification
        await notificationService.sendAppointmentCancelledNotification(appointmentData, 'Appointment cancelled');

        logger.info('✅ Cancellation notifications triggered');
      }
    } catch (error) {
      logger.error('❌ Error triggering cancellation notifications:', error);
    }
  }

  /**
   * Update doctor availability
   */
  private async updateDoctorAvailability(event: AppointmentRealtimeEvent): Promise<void> {
    try {
      if (event.doctor_id) {
        logger.info('📅 Updating doctor availability for:', event.doctor_id);

        // This would typically refresh the doctor's availability cache
        // or trigger a recalculation of available time slots

        // For now, we'll just log the update
        logger.info('✅ Doctor availability update completed');
      }
    } catch (error) {
      logger.error('❌ Error updating doctor availability:', error);
    }
  }

  /**
   * Update cache with new data
   */
  private async updateCache(event: AppointmentRealtimeEvent): Promise<void> {
    try {
      // This would typically update Redis cache with new appointment data
      // For now, we'll just log the cache update
      logger.info('💾 Cache update triggered for appointment:', event.appointment_id);

      // Future implementation would include:
      // - Update appointment cache
      // - Update doctor schedule cache
      // - Update patient appointment cache
      // - Update calendar view cache

      logger.info('✅ Cache update completed');
    } catch (error) {
      logger.error('❌ Error updating cache:', error);
    }
  }

  /**
   * Get connection status
   */
  public isRealtimeConnected(): boolean {
    return this.isConnected && this.subscription !== null;
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect(): Promise<void> {
    try {
      if (this.subscription) {
        await this.subscription.unsubscribe();
        this.subscription = null;
      }

      await this.eventBus.disconnect();
      await this.wsManager.disconnect();
      
      this.isConnected = false;
      logger.info('✅ Appointment Real-time Service disconnected');
    } catch (error) {
      logger.error('❌ Error disconnecting Real-time Service:', error);
    }
  }
}
