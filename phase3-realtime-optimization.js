// ============================================================================
// PHASE 3.3: REAL-TIME PERFORMANCE OPTIMIZATION
// Hospital Management System - Performance & Scalability
// ============================================================================
// This file implements WebSocket optimization and event-driven architecture

const WebSocket = require('ws');
const Redis = require('redis');
const EventEmitter = require('events');

// ============================================================================
// 1. OPTIMIZED WEBSOCKET SERVER
// ============================================================================

class HospitalWebSocketServer extends EventEmitter {
    constructor(server, options = {}) {
        super();
        
        this.wss = new WebSocket.Server({ 
            server,
            perMessageDeflate: {
                zlibDeflateOptions: {
                    level: 3, // Balanced compression
                    chunkSize: 1024,
                },
                threshold: 1024,
                concurrencyLimit: 10,
                clientMaxWindowBits: 15,
                serverMaxWindowBits: 15,
                serverMaxNoContextTakeover: false,
                clientMaxNoContextTakeover: false,
            },
            maxPayload: 16 * 1024 * 1024, // 16MB max payload
            ...options
        });

        // Connection management
        this.connections = new Map();
        this.rooms = new Map();
        this.userConnections = new Map();
        
        // Performance metrics
        this.metrics = {
            totalConnections: 0,
            activeConnections: 0,
            messagesPerSecond: 0,
            averageLatency: 0,
            lastMessageTime: Date.now()
        };

        // Redis for pub/sub across multiple servers
        this.publisher = Redis.createClient({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            db: 1 // Use database 1 for pub/sub
        });

        this.subscriber = Redis.createClient({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            db: 1
        });

        this.setupEventHandlers();
        this.setupRedisSubscriptions();
        this.startPerformanceMonitoring();
    }

    setupEventHandlers() {
        this.wss.on('connection', (ws, req) => {
            this.handleConnection(ws, req);
        });

        this.wss.on('error', (error) => {
            console.error('WebSocket Server Error:', error);
        });
    }

    handleConnection(ws, req) {
        const connectionId = this.generateConnectionId();
        const userAgent = req.headers['user-agent'];
        const ipAddress = req.socket.remoteAddress;
        
        // Connection metadata
        const connection = {
            id: connectionId,
            ws,
            userId: null,
            userRole: null,
            rooms: new Set(),
            lastActivity: Date.now(),
            messageCount: 0,
            ipAddress,
            userAgent,
            connectedAt: Date.now()
        };

        this.connections.set(connectionId, connection);
        this.metrics.totalConnections++;
        this.metrics.activeConnections++;

        console.log(`✅ WebSocket connected: ${connectionId} (${this.metrics.activeConnections} active)`);

        // Setup message handlers
        ws.on('message', (data) => {
            this.handleMessage(connectionId, data);
        });

        ws.on('close', (code, reason) => {
            this.handleDisconnection(connectionId, code, reason);
        });

        ws.on('error', (error) => {
            console.error(`WebSocket Error (${connectionId}):`, error);
            this.handleDisconnection(connectionId, 1006, 'error');
        });

        // Send welcome message
        this.sendToConnection(connectionId, {
            type: 'connection_established',
            connectionId,
            timestamp: Date.now(),
            serverInfo: {
                version: '3.3.0',
                features: ['real-time-notifications', 'live-updates', 'presence']
            }
        });

        // Setup ping/pong for connection health
        this.setupHeartbeat(connectionId);
    }

    handleMessage(connectionId, data) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;

        try {
            const message = JSON.parse(data);
            connection.lastActivity = Date.now();
            connection.messageCount++;
            
            // Update performance metrics
            this.updateMessageMetrics();

            switch (message.type) {
                case 'authenticate':
                    this.handleAuthentication(connectionId, message);
                    break;
                
                case 'join_room':
                    this.handleJoinRoom(connectionId, message);
                    break;
                
                case 'leave_room':
                    this.handleLeaveRoom(connectionId, message);
                    break;
                
                case 'subscribe_notifications':
                    this.handleSubscribeNotifications(connectionId, message);
                    break;
                
                case 'ping':
                    this.handlePing(connectionId, message);
                    break;
                
                default:
                    console.warn(`Unknown message type: ${message.type}`);
            }

        } catch (error) {
            console.error(`Message parsing error (${connectionId}):`, error);
            this.sendError(connectionId, 'invalid_message', 'Invalid JSON message');
        }
    }

    handleAuthentication(connectionId, message) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;

        const { token, userId, userRole } = message;
        
        // TODO: Validate JWT token here
        // For now, we'll accept the provided userId and role
        
        connection.userId = userId;
        connection.userRole = userRole;
        
        // Add to user connections map
        if (!this.userConnections.has(userId)) {
            this.userConnections.set(userId, new Set());
        }
        this.userConnections.get(userId).add(connectionId);

        this.sendToConnection(connectionId, {
            type: 'authentication_success',
            userId,
            userRole,
            timestamp: Date.now()
        });

        console.log(`🔐 User authenticated: ${userId} (${userRole}) on connection ${connectionId}`);
    }

    handleJoinRoom(connectionId, message) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;

        const { room } = message;
        
        // Validate room access based on user role
        if (!this.canAccessRoom(connection.userRole, room)) {
            this.sendError(connectionId, 'access_denied', `Access denied to room: ${room}`);
            return;
        }

        // Add connection to room
        if (!this.rooms.has(room)) {
            this.rooms.set(room, new Set());
        }
        
        this.rooms.get(room).add(connectionId);
        connection.rooms.add(room);

        this.sendToConnection(connectionId, {
            type: 'room_joined',
            room,
            timestamp: Date.now()
        });

        // Notify others in room
        this.broadcastToRoom(room, {
            type: 'user_joined_room',
            userId: connection.userId,
            room,
            timestamp: Date.now()
        }, connectionId);

        console.log(`🏠 User ${connection.userId} joined room: ${room}`);
    }

    handleLeaveRoom(connectionId, message) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;

        const { room } = message;
        
        this.removeFromRoom(connectionId, room);
        
        this.sendToConnection(connectionId, {
            type: 'room_left',
            room,
            timestamp: Date.now()
        });
    }

    handlePing(connectionId, message) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;

        const latency = Date.now() - (message.timestamp || Date.now());
        
        this.sendToConnection(connectionId, {
            type: 'pong',
            timestamp: Date.now(),
            latency
        });

        // Update average latency
        this.updateLatencyMetrics(latency);
    }

    // ============================================================================
    // 2. ROOM AND USER MANAGEMENT
    // ============================================================================

    canAccessRoom(userRole, room) {
        const roomPermissions = {
            'emergency_alerts': ['admin', 'doctor', 'receptionist'],
            'department_updates': ['admin', 'doctor', 'receptionist'],
            'appointment_notifications': ['admin', 'doctor', 'patient', 'receptionist'],
            'system_announcements': ['admin', 'doctor', 'patient', 'receptionist'],
            'doctor_availability': ['admin', 'doctor', 'receptionist'],
            'patient_updates': ['admin', 'doctor', 'patient']
        };

        const allowedRoles = roomPermissions[room] || [];
        return allowedRoles.includes(userRole);
    }

    removeFromRoom(connectionId, room) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;

        if (this.rooms.has(room)) {
            this.rooms.get(room).delete(connectionId);
            
            // Clean up empty rooms
            if (this.rooms.get(room).size === 0) {
                this.rooms.delete(room);
            }
        }
        
        connection.rooms.delete(room);

        // Notify others in room
        this.broadcastToRoom(room, {
            type: 'user_left_room',
            userId: connection.userId,
            room,
            timestamp: Date.now()
        });
    }

    // ============================================================================
    // 3. MESSAGE BROADCASTING
    // ============================================================================

    sendToConnection(connectionId, message) {
        const connection = this.connections.get(connectionId);
        if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
            return false;
        }

        try {
            connection.ws.send(JSON.stringify(message));
            return true;
        } catch (error) {
            console.error(`Send error (${connectionId}):`, error);
            return false;
        }
    }

    sendToUser(userId, message) {
        const userConnections = this.userConnections.get(userId);
        if (!userConnections) return 0;

        let sentCount = 0;
        for (const connectionId of userConnections) {
            if (this.sendToConnection(connectionId, message)) {
                sentCount++;
            }
        }
        return sentCount;
    }

    broadcastToRoom(room, message, excludeConnectionId = null) {
        const roomConnections = this.rooms.get(room);
        if (!roomConnections) return 0;

        let sentCount = 0;
        for (const connectionId of roomConnections) {
            if (connectionId !== excludeConnectionId) {
                if (this.sendToConnection(connectionId, message)) {
                    sentCount++;
                }
            }
        }
        return sentCount;
    }

    broadcastToRole(role, message) {
        let sentCount = 0;
        for (const [connectionId, connection] of this.connections) {
            if (connection.userRole === role) {
                if (this.sendToConnection(connectionId, message)) {
                    sentCount++;
                }
            }
        }
        return sentCount;
    }

    // ============================================================================
    // 4. REDIS PUB/SUB FOR SCALING
    // ============================================================================

    setupRedisSubscriptions() {
        this.subscriber.on('message', (channel, message) => {
            try {
                const data = JSON.parse(message);
                this.handleRedisMessage(channel, data);
            } catch (error) {
                console.error('Redis message parsing error:', error);
            }
        });

        // Subscribe to hospital events
        this.subscriber.subscribe('hospital:notifications');
        this.subscriber.subscribe('hospital:appointments');
        this.subscriber.subscribe('hospital:emergencies');
        this.subscriber.subscribe('hospital:system');
    }

    handleRedisMessage(channel, data) {
        switch (channel) {
            case 'hospital:notifications':
                this.handleNotificationBroadcast(data);
                break;
            
            case 'hospital:appointments':
                this.handleAppointmentUpdate(data);
                break;
            
            case 'hospital:emergencies':
                this.handleEmergencyAlert(data);
                break;
            
            case 'hospital:system':
                this.handleSystemAnnouncement(data);
                break;
        }
    }

    publishToRedis(channel, data) {
        this.publisher.publish(channel, JSON.stringify(data));
    }

    // ============================================================================
    // 5. HEALTHCARE-SPECIFIC EVENT HANDLERS
    // ============================================================================

    handleNotificationBroadcast(data) {
        const { userId, userRole, room, message } = data;
        
        if (userId) {
            this.sendToUser(userId, {
                type: 'notification',
                ...message,
                timestamp: Date.now()
            });
        } else if (userRole) {
            this.broadcastToRole(userRole, {
                type: 'notification',
                ...message,
                timestamp: Date.now()
            });
        } else if (room) {
            this.broadcastToRoom(room, {
                type: 'notification',
                ...message,
                timestamp: Date.now()
            });
        }
    }

    handleAppointmentUpdate(data) {
        const { appointmentId, patientId, doctorId, status, message } = data;
        
        // Notify patient
        if (patientId) {
            this.sendToUser(patientId, {
                type: 'appointment_update',
                appointmentId,
                status,
                message,
                timestamp: Date.now()
            });
        }
        
        // Notify doctor
        if (doctorId) {
            this.sendToUser(doctorId, {
                type: 'appointment_update',
                appointmentId,
                status,
                message,
                timestamp: Date.now()
            });
        }
        
        // Broadcast to appointment notifications room
        this.broadcastToRoom('appointment_notifications', {
            type: 'appointment_update',
            appointmentId,
            patientId,
            doctorId,
            status,
            message,
            timestamp: Date.now()
        });
    }

    handleEmergencyAlert(data) {
        const { level, message, department, location } = data;
        
        // Broadcast to emergency alerts room
        this.broadcastToRoom('emergency_alerts', {
            type: 'emergency_alert',
            level,
            message,
            department,
            location,
            timestamp: Date.now()
        });
        
        // Also notify all doctors and admins
        this.broadcastToRole('doctor', {
            type: 'emergency_alert',
            level,
            message,
            department,
            location,
            timestamp: Date.now()
        });
        
        this.broadcastToRole('admin', {
            type: 'emergency_alert',
            level,
            message,
            department,
            location,
            timestamp: Date.now()
        });
    }

    handleSystemAnnouncement(data) {
        const { message, targetRole, priority } = data;
        
        if (targetRole) {
            this.broadcastToRole(targetRole, {
                type: 'system_announcement',
                message,
                priority,
                timestamp: Date.now()
            });
        } else {
            // Broadcast to all connections
            for (const [connectionId] of this.connections) {
                this.sendToConnection(connectionId, {
                    type: 'system_announcement',
                    message,
                    priority,
                    timestamp: Date.now()
                });
            }
        }
    }

    // ============================================================================
    // 6. CONNECTION MANAGEMENT AND CLEANUP
    // ============================================================================

    handleDisconnection(connectionId, code, reason) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;

        // Remove from all rooms
        for (const room of connection.rooms) {
            this.removeFromRoom(connectionId, room);
        }

        // Remove from user connections
        if (connection.userId && this.userConnections.has(connection.userId)) {
            this.userConnections.get(connection.userId).delete(connectionId);
            
            // Clean up empty user connection sets
            if (this.userConnections.get(connection.userId).size === 0) {
                this.userConnections.delete(connection.userId);
            }
        }

        // Remove connection
        this.connections.delete(connectionId);
        this.metrics.activeConnections--;

        console.log(`❌ WebSocket disconnected: ${connectionId} (${this.metrics.activeConnections} active) - Code: ${code}, Reason: ${reason}`);
    }

    setupHeartbeat(connectionId) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;

        const heartbeatInterval = setInterval(() => {
            if (connection.ws.readyState === WebSocket.OPEN) {
                // Check if connection is still alive
                const timeSinceLastActivity = Date.now() - connection.lastActivity;
                
                if (timeSinceLastActivity > 60000) { // 1 minute timeout
                    console.log(`💔 Heartbeat timeout for connection: ${connectionId}`);
                    connection.ws.terminate();
                    clearInterval(heartbeatInterval);
                } else {
                    // Send ping
                    this.sendToConnection(connectionId, {
                        type: 'ping',
                        timestamp: Date.now()
                    });
                }
            } else {
                clearInterval(heartbeatInterval);
            }
        }, 30000); // Ping every 30 seconds
    }

    // ============================================================================
    // 7. PERFORMANCE MONITORING
    // ============================================================================

    startPerformanceMonitoring() {
        setInterval(() => {
            this.updatePerformanceMetrics();
            this.logPerformanceStats();
        }, 60000); // Every minute
    }

    updateMessageMetrics() {
        const now = Date.now();
        const timeDiff = (now - this.metrics.lastMessageTime) / 1000;
        
        if (timeDiff > 0) {
            this.metrics.messagesPerSecond = 1 / timeDiff;
        }
        
        this.metrics.lastMessageTime = now;
    }

    updateLatencyMetrics(latency) {
        // Simple moving average
        this.metrics.averageLatency = (this.metrics.averageLatency * 0.9) + (latency * 0.1);
    }

    updatePerformanceMetrics() {
        // Clean up stale connections
        const now = Date.now();
        const staleConnections = [];
        
        for (const [connectionId, connection] of this.connections) {
            if (now - connection.lastActivity > 300000) { // 5 minutes
                staleConnections.push(connectionId);
            }
        }
        
        staleConnections.forEach(connectionId => {
            this.handleDisconnection(connectionId, 1000, 'stale_connection');
        });
    }

    logPerformanceStats() {
        console.log('📊 WebSocket Performance Stats:', {
            activeConnections: this.metrics.activeConnections,
            totalRooms: this.rooms.size,
            averageLatency: Math.round(this.metrics.averageLatency),
            messagesPerSecond: Math.round(this.metrics.messagesPerSecond * 100) / 100
        });
    }

    // ============================================================================
    // 8. UTILITY METHODS
    // ============================================================================

    generateConnectionId() {
        return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    sendError(connectionId, errorCode, errorMessage) {
        this.sendToConnection(connectionId, {
            type: 'error',
            error: {
                code: errorCode,
                message: errorMessage
            },
            timestamp: Date.now()
        });
    }

    getConnectionStats() {
        return {
            totalConnections: this.metrics.totalConnections,
            activeConnections: this.metrics.activeConnections,
            totalRooms: this.rooms.size,
            averageLatency: this.metrics.averageLatency,
            messagesPerSecond: this.metrics.messagesPerSecond
        };
    }
}

module.exports = { HospitalWebSocketServer };
