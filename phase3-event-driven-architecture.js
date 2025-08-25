// ============================================================================
// PHASE 3.3: EVENT-DRIVEN ARCHITECTURE & MESSAGE QUEUE
// Hospital Management System - Performance & Scalability
// ============================================================================
// This file implements event-driven architecture with message queues

const EventEmitter = require('events');
const Redis = require('redis');
const Bull = require('bull');

// ============================================================================
// 1. HOSPITAL EVENT BUS
// ============================================================================

class HospitalEventBus extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(100); // Increase max listeners for hospital events
        
        // Redis connection for distributed events
        this.redis = Redis.createClient({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            db: 2 // Use database 2 for events
        });

        // Event metrics
        this.metrics = {
            eventsEmitted: 0,
            eventsProcessed: 0,
            eventTypes: new Map(),
            averageProcessingTime: 0,
            lastEventTime: Date.now()
        };

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // Track all events for metrics
        this.on('newListener', (event) => {
            if (!this.metrics.eventTypes.has(event)) {
                this.metrics.eventTypes.set(event, { emitted: 0, processed: 0 });
            }
        });

        // Log critical events
        this.on('error', (error) => {
            console.error('🚨 Hospital Event Bus Error:', error);
        });
    }

    // Enhanced emit with metrics and Redis pub/sub
    emit(event, ...args) {
        const startTime = Date.now();
        
        // Update metrics
        this.metrics.eventsEmitted++;
        this.metrics.lastEventTime = startTime;
        
        if (this.metrics.eventTypes.has(event)) {
            this.metrics.eventTypes.get(event).emitted++;
        }

        // Emit locally
        const result = super.emit(event, ...args);

        // Publish to Redis for distributed processing
        this.publishToRedis(event, args);

        // Update processing time
        const processingTime = Date.now() - startTime;
        this.updateProcessingTime(processingTime);

        return result;
    }

    publishToRedis(event, args) {
        try {
            this.redis.publish('hospital:events', JSON.stringify({
                event,
                args,
                timestamp: Date.now(),
                serverId: process.env.SERVER_ID || 'server-1'
            }));
        } catch (error) {
            console.error('Redis publish error:', error);
        }
    }

    updateProcessingTime(time) {
        this.metrics.averageProcessingTime = 
            (this.metrics.averageProcessingTime * 0.9) + (time * 0.1);
    }

    getMetrics() {
        return {
            ...this.metrics,
            eventTypes: Object.fromEntries(this.metrics.eventTypes)
        };
    }
}

// Global event bus instance
const hospitalEventBus = new HospitalEventBus();

// ============================================================================
// 2. MESSAGE QUEUE SYSTEM
// ============================================================================

class HospitalMessageQueue {
    constructor() {
        this.queues = new Map();
        this.redis = Redis.createClient({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            db: 3 // Use database 3 for queues
        });

        this.setupQueues();
    }

    setupQueues() {
        // High priority queue for critical operations
        this.queues.set('critical', new Bull('hospital:critical', {
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                db: 3
            },
            defaultJobOptions: {
                removeOnComplete: 100,
                removeOnFail: 50,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000
                }
            }
        }));

        // Normal priority queue for regular operations
        this.queues.set('normal', new Bull('hospital:normal', {
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                db: 3
            },
            defaultJobOptions: {
                removeOnComplete: 50,
                removeOnFail: 25,
                attempts: 2,
                backoff: {
                    type: 'fixed',
                    delay: 5000
                }
            }
        }));

        // Low priority queue for background tasks
        this.queues.set('background', new Bull('hospital:background', {
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                db: 3
            },
            defaultJobOptions: {
                removeOnComplete: 25,
                removeOnFail: 10,
                attempts: 1,
                delay: 10000 // 10 second delay for background tasks
            }
        }));

        // Notification queue for real-time notifications
        this.queues.set('notifications', new Bull('hospital:notifications', {
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                db: 3
            },
            defaultJobOptions: {
                removeOnComplete: 200,
                removeOnFail: 50,
                attempts: 2,
                backoff: {
                    type: 'fixed',
                    delay: 1000
                }
            }
        }));

        this.setupQueueProcessors();
    }

    setupQueueProcessors() {
        // Critical queue processor
        this.queues.get('critical').process('emergency_alert', 10, async (job) => {
            return await this.processEmergencyAlert(job.data);
        });

        this.queues.get('critical').process('appointment_urgent', 5, async (job) => {
            return await this.processUrgentAppointment(job.data);
        });

        // Normal queue processor
        this.queues.get('normal').process('appointment_update', 20, async (job) => {
            return await this.processAppointmentUpdate(job.data);
        });

        this.queues.get('normal').process('patient_registration', 10, async (job) => {
            return await this.processPatientRegistration(job.data);
        });

        this.queues.get('normal').process('medical_record_update', 15, async (job) => {
            return await this.processMedicalRecordUpdate(job.data);
        });

        // Background queue processor
        this.queues.get('background').process('data_cleanup', 2, async (job) => {
            return await this.processDataCleanup(job.data);
        });

        this.queues.get('background').process('report_generation', 3, async (job) => {
            return await this.processReportGeneration(job.data);
        });

        this.queues.get('background').process('backup_task', 1, async (job) => {
            return await this.processBackupTask(job.data);
        });

        // Notification queue processor
        this.queues.get('notifications').process('send_notification', 50, async (job) => {
            return await this.processSendNotification(job.data);
        });

        this.queues.get('notifications').process('email_notification', 20, async (job) => {
            return await this.processEmailNotification(job.data);
        });

        this.queues.get('notifications').process('sms_notification', 10, async (job) => {
            return await this.processSMSNotification(job.data);
        });
    }

    // ============================================================================
    // 3. JOB PROCESSORS
    // ============================================================================

    async processEmergencyAlert(data) {
        const { level, message, department, location, userId } = data;
        
        console.log(`🚨 Processing emergency alert: ${level} - ${message}`);
        
        // Emit event for real-time notifications
        hospitalEventBus.emit('emergency_alert', {
            level,
            message,
            department,
            location,
            timestamp: Date.now()
        });

        // Log to security audit
        hospitalEventBus.emit('security_event', {
            type: 'emergency_alert',
            level,
            message,
            userId,
            timestamp: Date.now()
        });

        return { success: true, alertId: `alert_${Date.now()}` };
    }

    async processUrgentAppointment(data) {
        const { appointmentId, patientId, doctorId, urgencyLevel } = data;
        
        console.log(`⚡ Processing urgent appointment: ${appointmentId}`);
        
        // Emit event for immediate processing
        hospitalEventBus.emit('appointment_urgent', {
            appointmentId,
            patientId,
            doctorId,
            urgencyLevel,
            timestamp: Date.now()
        });

        return { success: true, processed: true };
    }

    async processAppointmentUpdate(data) {
        const { appointmentId, status, patientId, doctorId, changes } = data;
        
        console.log(`📅 Processing appointment update: ${appointmentId} -> ${status}`);
        
        // Emit event for real-time updates
        hospitalEventBus.emit('appointment_updated', {
            appointmentId,
            status,
            patientId,
            doctorId,
            changes,
            timestamp: Date.now()
        });

        // Add to notification queue
        await this.addJob('notifications', 'send_notification', {
            type: 'appointment_update',
            recipients: [patientId, doctorId],
            data: { appointmentId, status, changes }
        });

        return { success: true, notificationQueued: true };
    }

    async processPatientRegistration(data) {
        const { patientId, profileData, registrationType } = data;
        
        console.log(`👤 Processing patient registration: ${patientId}`);
        
        // Emit event for profile creation
        hospitalEventBus.emit('patient_registered', {
            patientId,
            profileData,
            registrationType,
            timestamp: Date.now()
        });

        // Queue welcome notification
        await this.addJob('notifications', 'send_notification', {
            type: 'welcome_patient',
            recipients: [patientId],
            data: { patientId, registrationType }
        });

        return { success: true, profileCreated: true };
    }

    async processMedicalRecordUpdate(data) {
        const { recordId, patientId, doctorId, updateType, changes } = data;
        
        console.log(`📋 Processing medical record update: ${recordId}`);
        
        // Emit event for audit logging
        hospitalEventBus.emit('medical_record_updated', {
            recordId,
            patientId,
            doctorId,
            updateType,
            changes,
            timestamp: Date.now()
        });

        // Log PHI access
        hospitalEventBus.emit('phi_access', {
            userId: doctorId,
            patientId,
            accessType: 'write',
            resourceId: recordId,
            timestamp: Date.now()
        });

        return { success: true, auditLogged: true };
    }

    async processDataCleanup(data) {
        const { cleanupType, criteria, dryRun } = data;
        
        console.log(`🧹 Processing data cleanup: ${cleanupType}`);
        
        // Emit event for cleanup tracking
        hospitalEventBus.emit('data_cleanup_started', {
            cleanupType,
            criteria,
            dryRun,
            timestamp: Date.now()
        });

        // Simulate cleanup process
        await new Promise(resolve => setTimeout(resolve, 5000));

        return { success: true, cleanupType, recordsProcessed: 100 };
    }

    async processReportGeneration(data) {
        const { reportType, parameters, userId, format } = data;
        
        console.log(`📊 Processing report generation: ${reportType}`);
        
        // Emit event for report tracking
        hospitalEventBus.emit('report_generation_started', {
            reportType,
            parameters,
            userId,
            format,
            timestamp: Date.now()
        });

        // Simulate report generation
        await new Promise(resolve => setTimeout(resolve, 10000));

        const reportId = `report_${Date.now()}`;
        
        // Queue notification when report is ready
        await this.addJob('notifications', 'send_notification', {
            type: 'report_ready',
            recipients: [userId],
            data: { reportId, reportType, format }
        });

        return { success: true, reportId, downloadUrl: `/reports/${reportId}` };
    }

    async processBackupTask(data) {
        const { backupType, tables, destination } = data;
        
        console.log(`💾 Processing backup task: ${backupType}`);
        
        // Emit event for backup tracking
        hospitalEventBus.emit('backup_started', {
            backupType,
            tables,
            destination,
            timestamp: Date.now()
        });

        // Simulate backup process
        await new Promise(resolve => setTimeout(resolve, 30000));

        return { success: true, backupId: `backup_${Date.now()}`, size: '1.2GB' };
    }

    async processSendNotification(data) {
        const { type, recipients, data: notificationData, priority } = data;
        
        console.log(`🔔 Processing notification: ${type} to ${recipients.length} recipients`);
        
        // Emit event for real-time delivery
        hospitalEventBus.emit('notification_sent', {
            type,
            recipients,
            data: notificationData,
            priority,
            timestamp: Date.now()
        });

        return { success: true, delivered: recipients.length };
    }

    async processEmailNotification(data) {
        const { to, subject, body, template } = data;
        
        console.log(`📧 Processing email notification to: ${to}`);
        
        // Simulate email sending
        await new Promise(resolve => setTimeout(resolve, 2000));

        return { success: true, messageId: `email_${Date.now()}` };
    }

    async processSMSNotification(data) {
        const { to, message, priority } = data;
        
        console.log(`📱 Processing SMS notification to: ${to}`);
        
        // Simulate SMS sending
        await new Promise(resolve => setTimeout(resolve, 1000));

        return { success: true, messageId: `sms_${Date.now()}` };
    }

    // ============================================================================
    // 4. QUEUE MANAGEMENT METHODS
    // ============================================================================

    async addJob(queueName, jobType, data, options = {}) {
        const queue = this.queues.get(queueName);
        if (!queue) {
            throw new Error(`Queue not found: ${queueName}`);
        }

        const job = await queue.add(jobType, data, options);
        console.log(`➕ Job added to ${queueName} queue: ${jobType} (${job.id})`);
        
        return job;
    }

    async getQueueStats(queueName) {
        const queue = this.queues.get(queueName);
        if (!queue) {
            throw new Error(`Queue not found: ${queueName}`);
        }

        const [waiting, active, completed, failed, delayed] = await Promise.all([
            queue.getWaiting(),
            queue.getActive(),
            queue.getCompleted(),
            queue.getFailed(),
            queue.getDelayed()
        ]);

        return {
            waiting: waiting.length,
            active: active.length,
            completed: completed.length,
            failed: failed.length,
            delayed: delayed.length
        };
    }

    async getAllQueueStats() {
        const stats = {};
        for (const [queueName] of this.queues) {
            stats[queueName] = await this.getQueueStats(queueName);
        }
        return stats;
    }

    async pauseQueue(queueName) {
        const queue = this.queues.get(queueName);
        if (queue) {
            await queue.pause();
            console.log(`⏸️ Queue paused: ${queueName}`);
        }
    }

    async resumeQueue(queueName) {
        const queue = this.queues.get(queueName);
        if (queue) {
            await queue.resume();
            console.log(`▶️ Queue resumed: ${queueName}`);
        }
    }

    async cleanQueue(queueName, grace = 0, status = 'completed') {
        const queue = this.queues.get(queueName);
        if (queue) {
            await queue.clean(grace, status);
            console.log(`🧹 Queue cleaned: ${queueName} (${status})`);
        }
    }
}

// ============================================================================
// 5. HEALTHCARE EVENT DEFINITIONS
// ============================================================================

class HospitalEvents {
    static PATIENT_REGISTERED = 'patient_registered';
    static PATIENT_UPDATED = 'patient_updated';
    static APPOINTMENT_CREATED = 'appointment_created';
    static APPOINTMENT_UPDATED = 'appointment_updated';
    static APPOINTMENT_CANCELLED = 'appointment_cancelled';
    static MEDICAL_RECORD_CREATED = 'medical_record_created';
    static MEDICAL_RECORD_UPDATED = 'medical_record_updated';
    static EMERGENCY_ALERT = 'emergency_alert';
    static DOCTOR_AVAILABILITY_CHANGED = 'doctor_availability_changed';
    static DEPARTMENT_UPDATE = 'department_update';
    static SYSTEM_MAINTENANCE = 'system_maintenance';
    static SECURITY_ALERT = 'security_alert';
    static PHI_ACCESS = 'phi_access';
    static NOTIFICATION_SENT = 'notification_sent';
    static REPORT_GENERATED = 'report_generated';
    static BACKUP_COMPLETED = 'backup_completed';
}

// ============================================================================
// 6. EXPORT MODULES
// ============================================================================

const messageQueue = new HospitalMessageQueue();

module.exports = {
    hospitalEventBus,
    messageQueue,
    HospitalEvents,
    HospitalEventBus,
    HospitalMessageQueue
};
