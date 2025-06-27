interface AppointmentData {
    appointment_id: string;
    patient_id: string;
    patient_name?: string;
    patient_phone?: string;
    patient_email?: string;
    appointment_date: string;
    appointment_time: string;
    status: string;
    appointment_type: string;
    notes?: string;
}
interface AppointmentStats {
    total_appointments: number;
    appointments_this_month: number;
    appointments_today: number;
    monthly_stats: Array<{
        month: string;
        appointments: number;
        patients: number;
    }>;
    appointment_types: Array<{
        type: string;
        count: number;
        percentage: number;
    }>;
}
export declare class AppointmentService {
    private apiGatewayClient;
    constructor();
    getDoctorAppointments(doctorId: string, filters?: {
        date?: string;
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        appointments: AppointmentData[];
        pagination?: any;
    }>;
    getDoctorAppointmentStats(doctorId: string): Promise<AppointmentStats>;
    getDoctorPatientCount(doctorId: string): Promise<number>;
    isServiceAvailable(): Promise<boolean>;
    getTodayAppointments(doctorId: string): Promise<AppointmentData[]>;
    getMonthlyAppointments(doctorId: string): Promise<AppointmentData[]>;
    getUpcomingAppointments(doctorId: string): Promise<AppointmentData[]>;
    getRecentActivity(doctorId: string): Promise<any[]>;
    private getDefaultStats;
}
export {};
//# sourceMappingURL=appointment.service.d.ts.map