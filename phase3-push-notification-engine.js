// ============================================================================
// PHASE 3.3: PUSH NOTIFICATION ENGINE
// Hospital Management System - Performance & Scalability
// ============================================================================
// This file implements optimized push notification system for healthcare

const webpush = require('web-push');
const { hospitalEventBus, messageQueue, HospitalEvents } = require('./phase3-event-driven-architecture');

// ============================================================================
// 1. PUSH NOTIFICATION MANAGER
// ============================================================================

class HospitalPushNotificationEngine {
    constructor() {
        // Configure web-push
        webpush.setVapidDetails(
            'mailto:admin@hospital.com',
            process.env.VAPID_PUBLIC_KEY || 'your-vapid-public-key',
            process.env.VAPID_PRIVATE_KEY || 'your-vapid-private-key'
        );

        // Notification templates
        this.templates = new Map();
        this.setupNotificationTemplates();

        // Subscription management
        this.subscriptions = new Map(); // userId -> subscription[]
        this.deviceTokens = new Map(); // userId -> deviceToken[]

        // Performance metrics
        this.metrics = {
            notificationsSent: 0,
            notificationsDelivered: 0,
            notificationsFailed: 0,
            averageDeliveryTime: 0,
            subscriptionsActive: 0
        };

        this.setupEventListeners();
    }

    setupNotificationTemplates() {
        // Appointment notifications
        this.templates.set('appointment_reminder', {
            title: 'Nhắc nhở lịch hẹn',
            body: 'Bạn có lịch hẹn với {doctorName} vào {appointmentTime}',
            icon: '/icons/appointment-reminder.png',
            badge: '/icons/badge.png',
            tag: 'appointment-reminder',
            requireInteraction: true,
            actions: [
                { action: 'confirm', title: 'Xác nhận' },
                { action: 'reschedule', title: 'Đổi lịch' }
            ]
        });

        this.templates.set('appointment_confirmed', {
            title: 'Lịch hẹn đã được xác nhận',
            body: 'Lịch hẹn của bạn với {doctorName} đã được xác nhận',
            icon: '/icons/appointment-confirmed.png',
            tag: 'appointment-confirmed',
            actions: [
                { action: 'view', title: 'Xem chi tiết' }
            ]
        });

        this.templates.set('appointment_cancelled', {
            title: 'Lịch hẹn đã bị hủy',
            body: 'Lịch hẹn với {doctorName} vào {appointmentTime} đã bị hủy',
            icon: '/icons/appointment-cancelled.png',
            tag: 'appointment-cancelled',
            requireInteraction: true,
            actions: [
                { action: 'reschedule', title: 'Đặt lịch mới' }
            ]
        });

        // Medical notifications
        this.templates.set('test_results_ready', {
            title: 'Kết quả xét nghiệm đã có',
            body: 'Kết quả xét nghiệm của bạn đã sẵn sàng để xem',
            icon: '/icons/test-results.png',
            tag: 'test-results',
            requireInteraction: true,
            actions: [
                { action: 'view', title: 'Xem kết quả' }
            ]
        });

        this.templates.set('prescription_ready', {
            title: 'Đơn thuốc đã sẵn sàng',
            body: 'Đơn thuốc của bạn đã được chuẩn bị xong',
            icon: '/icons/prescription.png',
            tag: 'prescription',
            actions: [
                { action: 'view', title: 'Xem đơn thuốc' }
            ]
        });

        // Emergency notifications
        this.templates.set('emergency_alert', {
            title: '🚨 Cảnh báo khẩn cấp',
            body: '{message}',
            icon: '/icons/emergency.png',
            badge: '/icons/emergency-badge.png',
            tag: 'emergency',
            requireInteraction: true,
            vibrate: [200, 100, 200, 100, 200],
            actions: [
                { action: 'acknowledge', title: 'Đã nhận' },
                { action: 'respond', title: 'Phản hồi' }
            ]
        });

        // System notifications
        this.templates.set('system_maintenance', {
            title: 'Bảo trì hệ thống',
            body: 'Hệ thống sẽ bảo trì từ {startTime} đến {endTime}',
            icon: '/icons/maintenance.png',
            tag: 'maintenance',
            actions: [
                { action: 'details', title: 'Chi tiết' }
            ]
        });

        // Doctor notifications
        this.templates.set('new_patient_assigned', {
            title: 'Bệnh nhân mới được phân công',
            body: 'Bạn có bệnh nhân mới: {patientName}',
            icon: '/icons/new-patient.png',
            tag: 'new-patient',
            actions: [
                { action: 'view', title: 'Xem hồ sơ' }
            ]
        });

        this.templates.set('schedule_updated', {
            title: 'Lịch làm việc đã cập nhật',
            body: 'Lịch làm việc của bạn đã được cập nhật',
            icon: '/icons/schedule.png',
            tag: 'schedule-update',
            actions: [
                { action: 'view', title: 'Xem lịch' }
            ]
        });
    }

    setupEventListeners() {
        // Listen to hospital events for automatic notifications
        hospitalEventBus.on(HospitalEvents.APPOINTMENT_CREATED, (data) => {
            this.handleAppointmentCreated(data);
        });

        hospitalEventBus.on(HospitalEvents.APPOINTMENT_UPDATED, (data) => {
            this.handleAppointmentUpdated(data);
        });

        hospitalEventBus.on(HospitalEvents.EMERGENCY_ALERT, (data) => {
            this.handleEmergencyAlert(data);
        });

        hospitalEventBus.on(HospitalEvents.MEDICAL_RECORD_UPDATED, (data) => {
            this.handleMedicalRecordUpdated(data);
        });

        hospitalEventBus.on(HospitalEvents.DOCTOR_AVAILABILITY_CHANGED, (data) => {
            this.handleDoctorAvailabilityChanged(data);
        });
    }

    // ============================================================================
    // 2. SUBSCRIPTION MANAGEMENT
    // ============================================================================

    async subscribeUser(userId, subscription, deviceInfo = {}) {
        if (!this.subscriptions.has(userId)) {
            this.subscriptions.set(userId, []);
        }

        const userSubscriptions = this.subscriptions.get(userId);
        
        // Check if subscription already exists
        const existingIndex = userSubscriptions.findIndex(sub => 
            sub.endpoint === subscription.endpoint
        );

        if (existingIndex >= 0) {
            // Update existing subscription
            userSubscriptions[existingIndex] = {
                ...subscription,
                deviceInfo,
                updatedAt: Date.now()
            };
        } else {
            // Add new subscription
            userSubscriptions.push({
                ...subscription,
                deviceInfo,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
        }

        this.metrics.subscriptionsActive = this.getTotalSubscriptions();
        
        console.log(`📱 User ${userId} subscribed for push notifications`);
        return true;
    }

    async unsubscribeUser(userId, endpoint = null) {
        if (!this.subscriptions.has(userId)) {
            return false;
        }

        const userSubscriptions = this.subscriptions.get(userId);

        if (endpoint) {
            // Remove specific subscription
            const filteredSubs = userSubscriptions.filter(sub => sub.endpoint !== endpoint);
            this.subscriptions.set(userId, filteredSubs);
        } else {
            // Remove all subscriptions for user
            this.subscriptions.delete(userId);
        }

        this.metrics.subscriptionsActive = this.getTotalSubscriptions();
        
        console.log(`📱 User ${userId} unsubscribed from push notifications`);
        return true;
    }

    getUserSubscriptions(userId) {
        return this.subscriptions.get(userId) || [];
    }

    getTotalSubscriptions() {
        let total = 0;
        for (const [, subscriptions] of this.subscriptions) {
            total += subscriptions.length;
        }
        return total;
    }

    // ============================================================================
    // 3. NOTIFICATION SENDING
    // ============================================================================

    async sendNotification(userId, templateName, data = {}, options = {}) {
        const template = this.templates.get(templateName);
        if (!template) {
            throw new Error(`Notification template not found: ${templateName}`);
        }

        const userSubscriptions = this.getUserSubscriptions(userId);
        if (userSubscriptions.length === 0) {
            console.warn(`No subscriptions found for user: ${userId}`);
            return { sent: 0, failed: 0 };
        }

        // Prepare notification payload
        const notification = this.prepareNotification(template, data, options);
        
        // Send to all user subscriptions
        const results = await Promise.allSettled(
            userSubscriptions.map(subscription => 
                this.sendToSubscription(subscription, notification)
            )
        );

        // Process results
        const sent = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        // Update metrics
        this.metrics.notificationsSent += sent;
        this.metrics.notificationsFailed += failed;

        // Clean up failed subscriptions
        await this.cleanupFailedSubscriptions(userId, results, userSubscriptions);

        console.log(`📤 Notification sent to user ${userId}: ${sent} sent, ${failed} failed`);
        
        return { sent, failed, template: templateName };
    }

    async sendBulkNotification(userIds, templateName, data = {}, options = {}) {
        const results = await Promise.allSettled(
            userIds.map(userId => 
                this.sendNotification(userId, templateName, data, options)
            )
        );

        const summary = results.reduce((acc, result) => {
            if (result.status === 'fulfilled') {
                acc.totalSent += result.value.sent;
                acc.totalFailed += result.value.failed;
                acc.usersNotified++;
            } else {
                acc.usersErrored++;
            }
            return acc;
        }, { totalSent: 0, totalFailed: 0, usersNotified: 0, usersErrored: 0 });

        console.log(`📤 Bulk notification sent: ${summary.usersNotified} users, ${summary.totalSent} notifications`);
        
        return summary;
    }

    async sendToSubscription(subscription, notification) {
        const startTime = Date.now();
        
        try {
            const result = await webpush.sendNotification(
                subscription,
                JSON.stringify(notification),
                {
                    TTL: 24 * 60 * 60, // 24 hours
                    urgency: notification.urgency || 'normal',
                    topic: notification.tag
                }
            );

            const deliveryTime = Date.now() - startTime;
            this.updateDeliveryTime(deliveryTime);
            this.metrics.notificationsDelivered++;

            return { success: true, result };
        } catch (error) {
            console.error('Push notification error:', error);
            throw error;
        }
    }

    prepareNotification(template, data, options) {
        // Replace placeholders in template
        const title = this.replacePlaceholders(template.title, data);
        const body = this.replacePlaceholders(template.body, data);

        return {
            title,
            body,
            icon: template.icon,
            badge: template.badge,
            tag: template.tag,
            requireInteraction: template.requireInteraction,
            vibrate: template.vibrate,
            actions: template.actions,
            data: {
                ...data,
                timestamp: Date.now(),
                url: options.url || '/'
            },
            urgency: options.urgency || 'normal'
        };
    }

    replacePlaceholders(text, data) {
        return text.replace(/\{(\w+)\}/g, (match, key) => {
            return data[key] || match;
        });
    }

    async cleanupFailedSubscriptions(userId, results, subscriptions) {
        const failedIndexes = [];
        
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                const error = result.reason;
                
                // Check if subscription is invalid (410 Gone, 404 Not Found)
                if (error.statusCode === 410 || error.statusCode === 404) {
                    failedIndexes.push(index);
                }
            }
        });

        if (failedIndexes.length > 0) {
            const validSubscriptions = subscriptions.filter((_, index) => 
                !failedIndexes.includes(index)
            );
            
            this.subscriptions.set(userId, validSubscriptions);
            console.log(`🧹 Cleaned up ${failedIndexes.length} invalid subscriptions for user ${userId}`);
        }
    }

    // ============================================================================
    // 4. EVENT HANDLERS
    // ============================================================================

    async handleAppointmentCreated(data) {
        const { appointmentId, patientId, doctorId, appointmentTime, doctorName } = data;
        
        // Send confirmation to patient
        await this.sendNotification(patientId, 'appointment_confirmed', {
            doctorName,
            appointmentTime: new Date(appointmentTime).toLocaleString('vi-VN')
        });

        // Schedule reminder 24 hours before
        const reminderTime = new Date(appointmentTime).getTime() - (24 * 60 * 60 * 1000);
        if (reminderTime > Date.now()) {
            await messageQueue.addJob('notifications', 'send_notification', {
                userId: patientId,
                templateName: 'appointment_reminder',
                data: { doctorName, appointmentTime: new Date(appointmentTime).toLocaleString('vi-VN') }
            }, { delay: reminderTime - Date.now() });
        }
    }

    async handleAppointmentUpdated(data) {
        const { appointmentId, patientId, doctorId, status, changes } = data;
        
        if (status === 'cancelled') {
            await this.sendNotification(patientId, 'appointment_cancelled', {
                doctorName: changes.doctorName,
                appointmentTime: changes.appointmentTime
            });
        }
    }

    async handleEmergencyAlert(data) {
        const { level, message, department, targetRoles } = data;
        
        // Send to all users with specified roles
        const urgency = level === 'critical' ? 'high' : 'normal';
        
        // This would typically query the database for users with target roles
        // For now, we'll emit an event for the WebSocket server to handle
        hospitalEventBus.emit('broadcast_emergency_notification', {
            templateName: 'emergency_alert',
            data: { message },
            options: { urgency },
            targetRoles
        });
    }

    async handleMedicalRecordUpdated(data) {
        const { recordId, patientId, updateType } = data;
        
        if (updateType === 'test_results') {
            await this.sendNotification(patientId, 'test_results_ready', {
                recordId
            });
        }
    }

    async handleDoctorAvailabilityChanged(data) {
        const { doctorId, availability, affectedAppointments } = data;
        
        // Notify patients with affected appointments
        for (const appointment of affectedAppointments || []) {
            await this.sendNotification(appointment.patientId, 'schedule_updated', {
                doctorName: appointment.doctorName,
                newTime: appointment.newTime
            });
        }
    }

    // ============================================================================
    // 5. PERFORMANCE AND METRICS
    // ============================================================================

    updateDeliveryTime(time) {
        this.metrics.averageDeliveryTime = 
            (this.metrics.averageDeliveryTime * 0.9) + (time * 0.1);
    }

    getMetrics() {
        return {
            ...this.metrics,
            subscriptionsActive: this.getTotalSubscriptions(),
            deliveryRate: this.metrics.notificationsSent > 0 
                ? (this.metrics.notificationsDelivered / this.metrics.notificationsSent * 100).toFixed(2) + '%'
                : '0%'
        };
    }

    async getDetailedStats() {
        const queueStats = await messageQueue.getAllQueueStats();
        
        return {
            notifications: this.getMetrics(),
            queues: queueStats,
            templates: Array.from(this.templates.keys()),
            activeUsers: this.subscriptions.size
        };
    }

    // ============================================================================
    // 6. UTILITY METHODS
    // ============================================================================

    async testNotification(userId, message = 'Test notification') {
        return await this.sendNotification(userId, 'system_maintenance', {
            message,
            startTime: 'now',
            endTime: 'soon'
        });
    }

    async scheduleNotification(userId, templateName, data, sendAt) {
        const delay = new Date(sendAt).getTime() - Date.now();
        
        if (delay <= 0) {
            return await this.sendNotification(userId, templateName, data);
        }

        return await messageQueue.addJob('notifications', 'send_notification', {
            userId,
            templateName,
            data
        }, { delay });
    }

    getTemplate(templateName) {
        return this.templates.get(templateName);
    }

    addTemplate(templateName, template) {
        this.templates.set(templateName, template);
    }
}

// ============================================================================
// 7. EXPORT MODULE
// ============================================================================

const pushNotificationEngine = new HospitalPushNotificationEngine();

module.exports = {
    pushNotificationEngine,
    HospitalPushNotificationEngine
};
