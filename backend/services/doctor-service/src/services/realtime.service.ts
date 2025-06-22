import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Server as HttpServer } from 'http';
import { supabaseAdmin } from '../config/database.config';
import logger from '@hospital/shared/dist/utils/logger';
import { EventBus } from '@hospital/shared/dist/events/event-bus';
import { WebSocketManager } from './websocket.service';

export interface DoctorRealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  doctor_id: string;
  profile_id?: string;
  old_status?: string;
  new_status?: string;
  availability_updated?: boolean;
  schedule_updated?: boolean;
  experience_updated?: boolean;
  shift_updated?: boolean;
  timestamp: string;
}

export class DoctorRealtimeService {
  private subscription: RealtimeChannel | null = null;
  private profileSubscription: RealtimeChannel | null = null;
  private shiftSubscription: RealtimeChannel | null = null;
  private experienceSubscription: RealtimeChannel | null = null;
  private eventBus: EventBus;
  private wsManager: WebSocketManager;
  private isConnected: boolean = false;

  constructor() {
    this.eventBus = new EventBus('doctor-service');
    this.wsManager = new WebSocketManager();
  }

  /**
   * Initialize real-time subscriptions for doctors
   */
  async initialize(httpServer?: HttpServer): Promise<void> {
    try {
      logger.info('🔄 Initializing Doctor Real-time Service...');

      // Connect to event bus
      await this.eventBus.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
      
      // Initialize WebSocket manager with HTTP server
      if (httpServer) {
        await this.wsManager.initialize(httpServer);
      } else {
        logger.warn('⚠️ No HTTP server provided - WebSocket features will be limited');
      }

      // Setup Supabase real-time subscriptions
      await this.setupSupabaseSubscriptions();

      this.isConnected = true;
      logger.info('✅ Doctor Real-time Service initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize Doctor Real-time Service:', error);
      throw error;
    }
  }

  /**
   * Setup Supabase real-time subscriptions for doctors and related tables
   */
  private async setupSupabaseSubscriptions(): Promise<void> {
    try {
      // Subscribe to doctors table changes
      this.subscription = supabaseAdmin
        .channel('doctors_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'doctors'
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            this.handleDoctorChange(payload);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            logger.info('✅ Supabase real-time subscription active for doctors');
          } else if (status === 'CHANNEL_ERROR') {
            logger.error('❌ Supabase real-time subscription error for doctors');
          }
        });

      // Subscribe to profiles table changes (for doctor profiles)
      this.profileSubscription = supabaseAdmin
        .channel('doctor_profiles_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: 'role=eq.doctor'
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            this.handleProfileChange(payload);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            logger.info('✅ Supabase real-time subscription active for doctor profiles');
          } else if (status === 'CHANNEL_ERROR') {
            logger.error('❌ Supabase real-time subscription error for doctor profiles');
          }
        });

      // Subscribe to shifts table changes
      this.shiftSubscription = supabaseAdmin
        .channel('doctor_shifts_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'shifts'
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            this.handleShiftChange(payload);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            logger.info('✅ Supabase real-time subscription active for doctor shifts');
          } else if (status === 'CHANNEL_ERROR') {
            logger.error('❌ Supabase real-time subscription error for doctor shifts');
          }
        });

      // Subscribe to experiences table changes
      this.experienceSubscription = supabaseAdmin
        .channel('doctor_experiences_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'experiences'
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            this.handleExperienceChange(payload);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            logger.info('✅ Supabase real-time subscription active for doctor experiences');
          } else if (status === 'CHANNEL_ERROR') {
            logger.error('❌ Supabase real-time subscription error for doctor experiences');
          }
        });

    } catch (error) {
      logger.error('❌ Failed to setup Supabase subscriptions:', error);
      throw error;
    }
  }

  /**
   * Handle doctor changes from Supabase real-time
   */
  private async handleDoctorChange(payload: RealtimePostgresChangesPayload<any>): Promise<void> {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      // Type-safe access to record properties
      const doctorId = (newRecord as any)?.doctor_id || (oldRecord as any)?.doctor_id;
      
      logger.info('📡 Received doctor change:', {
        eventType,
        doctorId
      });

      // Create standardized event with type-safe access
      const realtimeEvent: DoctorRealtimeEvent = {
        type: eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        doctor_id: doctorId,
        profile_id: (newRecord as any)?.profile_id || (oldRecord as any)?.profile_id,
        old_status: (oldRecord as any)?.availability_status,
        new_status: (newRecord as any)?.availability_status,
        availability_updated: this.checkAvailabilityUpdate(newRecord, oldRecord),
        schedule_updated: this.checkScheduleUpdate(newRecord, oldRecord),
        experience_updated: false, // Will be set by experience change handler
        shift_updated: false, // Will be set by shift change handler
        timestamp: new Date().toISOString()
      };

      // Process the event
      await this.processDoctorEvent(realtimeEvent);

    } catch (error) {
      logger.error('❌ Error handling doctor change:', error);
    }
  }

  /**
   * Handle profile changes from Supabase real-time
   */
  private async handleProfileChange(payload: RealtimePostgresChangesPayload<any>): Promise<void> {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      const profileId = (newRecord as any)?.profile_id || (oldRecord as any)?.profile_id;
      
      logger.info('📡 Received doctor profile change:', {
        eventType,
        profileId
      });

      // Find associated doctor
      const doctorId = await this.findDoctorByProfileId(profileId);
      
      if (doctorId) {
        const realtimeEvent: DoctorRealtimeEvent = {
          type: eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          doctor_id: doctorId,
          profile_id: profileId,
          timestamp: new Date().toISOString()
        };

        await this.processDoctorEvent(realtimeEvent);
      }

    } catch (error) {
      logger.error('❌ Error handling doctor profile change:', error);
    }
  }

  /**
   * Handle shift changes from Supabase real-time
   */
  private async handleShiftChange(payload: RealtimePostgresChangesPayload<any>): Promise<void> {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      const doctorId = (newRecord as any)?.doctor_id || (oldRecord as any)?.doctor_id;
      
      if (doctorId) {
        logger.info('📡 Received doctor shift change:', {
          eventType,
          doctorId
        });

        const realtimeEvent: DoctorRealtimeEvent = {
          type: eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          doctor_id: doctorId,
          shift_updated: true,
          timestamp: new Date().toISOString()
        };

        await this.processDoctorEvent(realtimeEvent);
      }

    } catch (error) {
      logger.error('❌ Error handling doctor shift change:', error);
    }
  }

  /**
   * Handle experience changes from Supabase real-time
   */
  private async handleExperienceChange(payload: RealtimePostgresChangesPayload<any>): Promise<void> {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      const doctorId = (newRecord as any)?.doctor_id || (oldRecord as any)?.doctor_id;
      
      if (doctorId) {
        logger.info('📡 Received doctor experience change:', {
          eventType,
          doctorId
        });

        const realtimeEvent: DoctorRealtimeEvent = {
          type: eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          doctor_id: doctorId,
          experience_updated: true,
          timestamp: new Date().toISOString()
        };

        await this.processDoctorEvent(realtimeEvent);
      }

    } catch (error) {
      logger.error('❌ Error handling doctor experience change:', error);
    }
  }

  /**
   * Process doctor events and broadcast to relevant channels
   */
  private async processDoctorEvent(event: DoctorRealtimeEvent): Promise<void> {
    try {
      // 1. Broadcast to WebSocket clients
      await this.broadcastToWebSocket(event);

      // 2. Publish to event bus for other services
      await this.publishToEventBus(event);

      // 3. Handle specific event types
      await this.handleSpecificEventType(event);

      // 4. Update cache if needed
      await this.updateCache(event);

      logger.info('✅ Doctor event processed successfully:', {
        type: event.type,
        doctorId: event.doctor_id
      });

    } catch (error) {
      logger.error('❌ Error processing doctor event:', error);
    }
  }

  /**
   * Broadcast event to WebSocket clients
   */
  private async broadcastToWebSocket(event: DoctorRealtimeEvent): Promise<void> {
    try {
      // Check if WebSocket is available
      if (!this.wsManager.isWebSocketReady()) {
        logger.warn('⚠️ WebSocket not ready - skipping broadcast');
        return;
      }

      // Broadcast to all connected clients
      this.wsManager.broadcastToAll('doctor_change', event);

      // Broadcast to specific doctor's clients
      if (event.doctor_id) {
        this.wsManager.broadcastToRoom(`doctor_${event.doctor_id}`, 'doctor_change', event);
      }

      // Broadcast to medical staff monitoring
      this.wsManager.broadcastToRoom('medical_staff', 'doctor_change', event);

      // Broadcast to admin dashboard
      this.wsManager.broadcastToRoom('admin_dashboard', 'doctor_change', event);

      // Broadcast to appointment service (for scheduling updates)
      this.wsManager.broadcastToRoom('appointment_service', 'doctor_change', event);

      logger.info('✅ WebSocket broadcast completed for doctor:', event.doctor_id);

    } catch (error) {
      logger.error('❌ Error broadcasting to WebSocket:', error);
    }
  }

  /**
   * Publish event to message bus for other services
   */
  private async publishToEventBus(event: DoctorRealtimeEvent): Promise<void> {
    try {
      await this.eventBus.publish('doctor_changed' as any, event, `doctor.${event.type.toLowerCase()}`);
      
      // Specific routing for availability updates
      if (event.availability_updated) {
        await this.eventBus.publish('doctor_availability_updated' as any, event, 'doctor.availability');
      }

      // Specific routing for schedule updates
      if (event.schedule_updated || event.shift_updated) {
        await this.eventBus.publish('doctor_schedule_updated' as any, event, 'doctor.schedule');
      }

    } catch (error) {
      logger.error('❌ Error publishing to event bus:', error);
    }
  }

  /**
   * Handle specific event types with custom logic
   */
  private async handleSpecificEventType(event: DoctorRealtimeEvent): Promise<void> {
    try {
      switch (event.type) {
        case 'INSERT':
          await this.handleNewDoctor(event);
          break;
        case 'UPDATE':
          await this.handleDoctorUpdate(event);
          break;
        case 'DELETE':
          await this.handleDoctorDeletion(event);
          break;
      }
    } catch (error) {
      logger.error('❌ Error handling specific event type:', error);
    }
  }

  /**
   * Handle new doctor registration
   */
  private async handleNewDoctor(event: DoctorRealtimeEvent): Promise<void> {
    logger.info('🆕 New doctor registered:', event.doctor_id);
    
    // Trigger welcome notifications
    await this.triggerWelcomeNotifications(event);
    
    // Update doctor statistics
    await this.updateDoctorStatistics();
  }

  /**
   * Handle doctor updates
   */
  private async handleDoctorUpdate(event: DoctorRealtimeEvent): Promise<void> {
    logger.info('📝 Doctor updated:', event.doctor_id);
    
    // Handle availability updates
    if (event.availability_updated) {
      await this.handleAvailabilityUpdate(event);
    }
    
    // Handle schedule updates
    if (event.schedule_updated || event.shift_updated) {
      await this.handleScheduleUpdate(event);
    }
  }

  /**
   * Handle doctor deletion
   */
  private async handleDoctorDeletion(event: DoctorRealtimeEvent): Promise<void> {
    logger.info('❌ Doctor deleted:', event.doctor_id);
    
    // Cleanup related data
    await this.cleanupDoctorData(event);
    
    // Update statistics
    await this.updateDoctorStatistics();
  }

  // Helper methods
  private checkAvailabilityUpdate(newRecord: any, oldRecord: any): boolean {
    return (newRecord?.availability_status !== oldRecord?.availability_status) ||
           (newRecord?.working_hours !== oldRecord?.working_hours);
  }

  private checkScheduleUpdate(newRecord: any, oldRecord: any): boolean {
    return (newRecord?.schedule !== oldRecord?.schedule) ||
           (newRecord?.working_days !== oldRecord?.working_days);
  }

  private async findDoctorByProfileId(profileId: string): Promise<string | null> {
    try {
      const { data } = await supabaseAdmin
        .from('doctors')
        .select('doctor_id')
        .eq('profile_id', profileId)
        .single();
      
      return data?.doctor_id || null;
    } catch (error) {
      logger.error('❌ Error finding doctor by profile ID:', error);
      return null;
    }
  }

  // Placeholder methods for future implementation
  private async triggerWelcomeNotifications(event: DoctorRealtimeEvent): Promise<void> {
    // Implementation for welcome notifications
  }

  private async updateDoctorStatistics(): Promise<void> {
    // Implementation for statistics updates
  }

  private async handleAvailabilityUpdate(event: DoctorRealtimeEvent): Promise<void> {
    logger.info('📅 Availability updated for doctor:', event.doctor_id);
  }

  private async handleScheduleUpdate(event: DoctorRealtimeEvent): Promise<void> {
    logger.info('⏰ Schedule updated for doctor:', event.doctor_id);
  }

  private async cleanupDoctorData(event: DoctorRealtimeEvent): Promise<void> {
    // Implementation for data cleanup
  }

  private async updateCache(event: DoctorRealtimeEvent): Promise<void> {
    // Implementation for cache updates
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

      if (this.profileSubscription) {
        await this.profileSubscription.unsubscribe();
        this.profileSubscription = null;
      }

      if (this.shiftSubscription) {
        await this.shiftSubscription.unsubscribe();
        this.shiftSubscription = null;
      }

      if (this.experienceSubscription) {
        await this.experienceSubscription.unsubscribe();
        this.experienceSubscription = null;
      }

      await this.eventBus.disconnect();
      await this.wsManager.disconnect();
      
      this.isConnected = false;
      logger.info('✅ Doctor Real-time Service disconnected');
    } catch (error) {
      logger.error('❌ Error disconnecting Doctor Real-time Service:', error);
    }
  }
}
