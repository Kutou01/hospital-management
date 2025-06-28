import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import logger from '@hospital/shared/dist/utils/logger';

export interface ConnectedClient {
  id: string;
  userId?: string;
  userRole?: string;
  doctorId?: string;
  patientId?: string;
  rooms: Set<string>;
  connectedAt: Date;
}

export class WebSocketManager {
  private io: SocketIOServer | null = null;
  private clients: Map<string, ConnectedClient> = new Map();
  private isInitialized: boolean = false;

  /**
   * Initialize WebSocket server
   */
  async initialize(httpServer?: HttpServer): Promise<void> {
    try {
      if (!httpServer) {
        logger.warn('⚠️ No HTTP server provided for WebSocket initialization');
        this.isInitialized = false;
        return;
      }

      this.io = new SocketIOServer(httpServer, {
        cors: {
          origin: process.env.FRONTEND_URL || "http://localhost:3000",
          methods: ["GET", "POST"],
          credentials: true
        },
        transports: ['websocket', 'polling'],
        allowEIO3: true
      });

      this.setupEventHandlers();
      this.isInitialized = true;

      logger.info('✅ WebSocket Manager initialized successfully on HTTP server');
    } catch (error) {
      logger.error('❌ Failed to initialize WebSocket Manager:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(socket: Socket): void {
    logger.info('🔌 New WebSocket connection:', socket.id);

    // Create client record
    const client: ConnectedClient = {
      id: socket.id,
      rooms: new Set(),
      connectedAt: new Date()
    };

    this.clients.set(socket.id, client);

    // Setup socket event handlers
    this.setupSocketHandlers(socket, client);

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to Appointment Service',
      clientId: socket.id,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Setup individual socket event handlers
   */
  private setupSocketHandlers(socket: Socket, client: ConnectedClient): void {
    // Authentication
    socket.on('authenticate', (data) => {
      this.handleAuthentication(socket, client, data);
    });

    // Join specific rooms
    socket.on('join_room', (roomName: string) => {
      this.joinRoom(socket, client, roomName);
    });

    // Leave specific rooms
    socket.on('leave_room', (roomName: string) => {
      this.leaveRoom(socket, client, roomName);
    });

    // Subscribe to doctor appointments
    socket.on('subscribe_doctor', (doctorId: string) => {
      this.subscribeToDoctorAppointments(socket, client, doctorId);
    });

    // Subscribe to patient appointments
    socket.on('subscribe_patient', (patientId: string) => {
      this.subscribeToPatientAppointments(socket, client, patientId);
    });

    // Subscribe to date-specific appointments
    socket.on('subscribe_date', (date: string) => {
      this.subscribeToDateAppointments(socket, client, date);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, client, reason);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('❌ WebSocket error for client:', socket.id, error);
    });
  }

  /**
   * Handle client authentication
   */
  private handleAuthentication(socket: Socket, client: ConnectedClient, data: any): void {
    try {
      const { userId, userRole, doctorId, patientId } = data;

      // Update client information
      client.userId = userId;
      client.userRole = userRole;
      client.doctorId = doctorId;
      client.patientId = patientId;

      // Auto-join relevant rooms based on role
      if (userRole === 'doctor' && doctorId) {
        this.joinRoom(socket, client, `doctor_${doctorId}`);
      } else if (userRole === 'patient' && patientId) {
        this.joinRoom(socket, client, `patient_${patientId}`);
      }

      socket.emit('authenticated', {
        success: true,
        message: 'Authentication successful',
        clientInfo: {
          userId,
          userRole,
          rooms: Array.from(client.rooms)
        }
      });

      logger.info('✅ Client authenticated:', {
        socketId: socket.id,
        userId,
        userRole
      });

    } catch (error) {
      socket.emit('authentication_error', {
        success: false,
        message: 'Authentication failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      logger.error('❌ Authentication failed for client:', socket.id, error);
    }
  }

  /**
   * Join a room
   */
  private joinRoom(socket: Socket, client: ConnectedClient, roomName: string): void {
    try {
      socket.join(roomName);
      client.rooms.add(roomName);

      socket.emit('room_joined', {
        room: roomName,
        message: `Joined room: ${roomName}`
      });

      logger.info('📥 Client joined room:', {
        socketId: socket.id,
        room: roomName
      });

    } catch (error) {
      logger.error('❌ Error joining room:', error);
    }
  }

  /**
   * Leave a room
   */
  private leaveRoom(socket: Socket, client: ConnectedClient, roomName: string): void {
    try {
      socket.leave(roomName);
      client.rooms.delete(roomName);

      socket.emit('room_left', {
        room: roomName,
        message: `Left room: ${roomName}`
      });

      logger.info('📤 Client left room:', {
        socketId: socket.id,
        room: roomName
      });

    } catch (error) {
      logger.error('❌ Error leaving room:', error);
    }
  }

  /**
   * Subscribe to doctor appointments
   */
  private subscribeToDoctorAppointments(socket: Socket, client: ConnectedClient, doctorId: string): void {
    const roomName = `doctor_${doctorId}`;
    this.joinRoom(socket, client, roomName);
    
    client.doctorId = doctorId;
    
    socket.emit('subscription_confirmed', {
      type: 'doctor_appointments',
      doctorId,
      message: `Subscribed to appointments for doctor: ${doctorId}`
    });
  }

  /**
   * Subscribe to patient appointments
   */
  private subscribeToPatientAppointments(socket: Socket, client: ConnectedClient, patientId: string): void {
    const roomName = `patient_${patientId}`;
    this.joinRoom(socket, client, roomName);
    
    client.patientId = patientId;
    
    socket.emit('subscription_confirmed', {
      type: 'patient_appointments',
      patientId,
      message: `Subscribed to appointments for patient: ${patientId}`
    });
  }

  /**
   * Subscribe to date-specific appointments
   */
  private subscribeToDateAppointments(socket: Socket, client: ConnectedClient, date: string): void {
    const roomName = `date_${date}`;
    this.joinRoom(socket, client, roomName);
    
    socket.emit('subscription_confirmed', {
      type: 'date_appointments',
      date,
      message: `Subscribed to appointments for date: ${date}`
    });
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnection(socket: Socket, client: ConnectedClient, reason: string): void {
    logger.info('🔌 Client disconnected:', {
      socketId: socket.id,
      userId: client.userId,
      reason,
      connectedDuration: Date.now() - client.connectedAt.getTime()
    });

    // Remove client from tracking
    this.clients.delete(socket.id);
  }

  /**
   * Broadcast message to all connected clients
   */
  public broadcastToAll(event: string, data: any): void {
    if (!this.io || !this.isInitialized) {
      logger.warn('⚠️ WebSocket not initialized - skipping broadcast');
      return;
    }

    try {
      this.io.emit(event, {
        ...data,
        broadcast: true,
        timestamp: new Date().toISOString()
      });

      logger.info('📡 Broadcast to all clients:', {
        event,
        clientCount: this.clients.size
      });
    } catch (error) {
      logger.error('❌ Error broadcasting to all clients:', error);
    }
  }

  /**
   * Broadcast message to specific room
   */
  public broadcastToRoom(roomName: string, event: string, data: any): void {
    if (!this.io || !this.isInitialized) {
      logger.warn('⚠️ WebSocket not initialized - skipping room broadcast');
      return;
    }

    try {
      this.io.to(roomName).emit(event, {
        ...data,
        room: roomName,
        timestamp: new Date().toISOString()
      });

      logger.info('📡 Broadcast to room:', {
        room: roomName,
        event
      });
    } catch (error) {
      logger.error('❌ Error broadcasting to room:', error);
    }
  }

  /**
   * Send message to specific client
   */
  public sendToClient(clientId: string, event: string, data: any): void {
    if (!this.io || !this.isInitialized) {
      logger.warn('⚠️ WebSocket not initialized - skipping client message');
      return;
    }

    try {
      this.io.to(clientId).emit(event, {
        ...data,
        direct: true,
        timestamp: new Date().toISOString()
      });

      logger.info('📡 Direct message to client:', {
        clientId,
        event
      });
    } catch (error) {
      logger.error('❌ Error sending message to client:', error);
    }
  }

  /**
   * Get connected clients count
   */
  public getConnectedClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Get clients in specific room
   */
  public getClientsInRoom(roomName: string): ConnectedClient[] {
    return Array.from(this.clients.values()).filter(client => 
      client.rooms.has(roomName)
    );
  }

  /**
   * Get connection status
   */
  public isWebSocketReady(): boolean {
    return this.isInitialized && this.io !== null;
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect(): Promise<void> {
    try {
      if (this.io) {
        this.io.close();
        this.io = null;
      }

      this.clients.clear();
      this.isInitialized = false;

      logger.info('✅ WebSocket Manager disconnected');
    } catch (error) {
      logger.error('❌ Error disconnecting WebSocket Manager:', error);
    }
  }
}
