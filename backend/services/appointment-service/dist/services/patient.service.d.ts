import { PatientInfo } from '../types/appointment.types';
export declare class PatientService {
    private baseUrl;
    constructor();
    getPatientById(patientId: string): Promise<PatientInfo | null>;
    verifyPatientExists(patientId: string): Promise<boolean>;
    getPatientAppointmentCount(patientId: string): Promise<number>;
    hasActiveAppointments(patientId: string): Promise<boolean>;
}
//# sourceMappingURL=patient.service.d.ts.map