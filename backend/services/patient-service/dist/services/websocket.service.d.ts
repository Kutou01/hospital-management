import { Server as HttpServer } from 'http';
export interface ConnectedClient {
    id: string;
    userId?: string;
    userRole?: string;
    patientId?: string;
    doctorId?: string;
    rooms: Set<string>;
    connectedAt: Date;
}
export declare class WebSocketManager {
    private io;
    private clients;
    private isInitialized;
    initialize(httpServer?: HttpServer): Promise<void>;
    private setupEventHandlers;
    private handleConnection;
    private setupSocketHandlers;
    private handleAuthentication;
    private joinRoom;
    private leaveRoom;
    private subscribeToPatientUpdates;
    private subscribeToMedicalStaffUpdates;
    private subscribeToAdminDashboard;
    private handleDisconnection;
    broadcastToAll(event: string, data: any): void;
    broadcastToRoom(roomName: string, event: string, data: any): void;
    sendToClient(clientId: string, event: string, data: any): void;
    getConnectedClientsCount(): number;
    getClientsInRoom(roomName: string): ConnectedClient[];
    isWebSocketReady(): boolean;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=websocket.service.d.ts.map