interface PatientData {
    patient_id: string;
    full_name: string;
    phone_number?: string;
    email?: string;
    date_of_birth?: string;
    gender?: string;
}
interface PatientStats {
    total_patients: number;
    unique_patients_this_month: number;
}
export declare class PatientService {
    private baseUrl;
    constructor();
    getPatientById(patientId: string): Promise<PatientData | null>;
    getPatientsByIds(patientIds: string[]): Promise<PatientData[]>;
    getDoctorPatientStats(doctorId: string): Promise<PatientStats>;
    isServiceAvailable(): Promise<boolean>;
    searchPatients(query: string, limit?: number): Promise<PatientData[]>;
    getPatientCountForDoctor(doctorId: string): Promise<number>;
}
export {};
//# sourceMappingURL=patient.service.d.ts.map