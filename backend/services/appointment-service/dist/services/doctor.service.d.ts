import { DoctorInfo } from '../types/appointment.types';
export declare class DoctorService {
    private apiGatewayClient;
    constructor();
    getDoctorById(doctorId: string): Promise<DoctorInfo | null>;
    checkDoctorAvailability(doctorId: string, date: string, startTime: string, endTime: string): Promise<boolean>;
    getAvailableTimeSlots(doctorId: string, date: string, duration?: number): Promise<{
        start_time: string;
        end_time: string;
    }[]>;
    verifyDoctorExists(doctorId: string): Promise<boolean>;
    private timeToMinutes;
    private minutesToTime;
}
//# sourceMappingURL=doctor.service.d.ts.map