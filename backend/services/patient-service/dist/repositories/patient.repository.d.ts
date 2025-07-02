import { Patient, PatientWithProfile, CreatePatientDto, UpdatePatientDto, PatientSearchFilters } from '../types/patient.types';
export declare class PatientRepository {
    private supabase;
    private calculateAge;
    getAllPatients(filters?: PatientSearchFilters, page?: number, limit?: number): Promise<{
        patients: PatientWithProfile[];
        total: number;
    }>;
    private getAllPatientsDirectQuery;
    getPatientById(patientId: string): Promise<PatientWithProfile | null>;
    getPatientByProfileId(profileId: string): Promise<PatientWithProfile | null>;
    getPatientsByDoctorId(doctorId: string): Promise<PatientWithProfile[]>;
    verifyProfileExists(profileId: string): Promise<boolean>;
    createPatient(patientData: CreatePatientDto): Promise<Patient>;
    updatePatient(patientId: string, updateData: UpdatePatientDto): Promise<Patient>;
    deletePatient(patientId: string): Promise<boolean>;
    patientExists(patientId: string): Promise<boolean>;
    getPatientStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        byGender: {
            male: number;
            female: number;
            other: number;
        };
        byBloodType: Record<string, number>;
    }>;
    searchPatients(searchTerm: string, limit?: number): Promise<PatientWithProfile[]>;
    getPatientsWithUpcomingAppointments(): Promise<PatientWithProfile[]>;
    getPatientMedicalSummary(patientId: string): Promise<{
        patient: PatientWithProfile | null;
        appointmentCount: number;
        lastAppointment: string | null;
        medicalHistory: string[];
        allergies: string[];
        currentMedications: any;
    }>;
    getPatientCountForDoctor(doctorId: string): Promise<number>;
    getPatientStatsForDoctor(doctorId: string): Promise<any>;
}
//# sourceMappingURL=patient.repository.d.ts.map