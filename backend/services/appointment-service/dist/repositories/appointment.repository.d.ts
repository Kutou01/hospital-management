import { Appointment, AppointmentWithDetails, CreateAppointmentDto, UpdateAppointmentDto, AppointmentSearchFilters, ConflictCheck, AppointmentStats } from '../types/appointment.types';
export declare class AppointmentRepository {
    private supabase;
    private generateAppointmentId;
    getAllAppointments(filters?: AppointmentSearchFilters, page?: number, limit?: number): Promise<{
        appointments: AppointmentWithDetails[];
        total: number;
    }>;
    getAppointmentById(appointmentId: string): Promise<AppointmentWithDetails | null>;
    getAppointmentsByDoctorId(doctorId: string, filters?: Partial<AppointmentSearchFilters>, page?: number, limit?: number): Promise<{
        appointments: AppointmentWithDetails[];
        total: number;
    }>;
    getAppointmentsByPatientId(patientId: string, filters?: Partial<AppointmentSearchFilters>, page?: number, limit?: number): Promise<{
        appointments: AppointmentWithDetails[];
        total: number;
    }>;
    createAppointment(appointmentData: CreateAppointmentDto): Promise<Appointment>;
    updateAppointment(appointmentId: string, updateData: UpdateAppointmentDto): Promise<Appointment>;
    cancelAppointment(appointmentId: string, reason?: string): Promise<boolean>;
    checkConflicts(doctorId: string, appointmentDate: string, startTime: string, endTime: string, excludeAppointmentId?: string): Promise<ConflictCheck>;
    appointmentExists(appointmentId: string): Promise<boolean>;
    getAppointmentStats(): Promise<AppointmentStats>;
    getUpcomingAppointments(doctorId: string, days?: number): Promise<AppointmentWithDetails[]>;
}
//# sourceMappingURL=appointment.repository.d.ts.map