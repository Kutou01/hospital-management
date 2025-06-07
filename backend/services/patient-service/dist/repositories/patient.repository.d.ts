import { Patient, PatientWithProfile, CreatePatientDto, UpdatePatientDto, PatientSearchFilters } from '../types/patient.types';
export declare class PatientRepository {
    private supabase;
    private generatePatientId;
    private calculateAge;
    getAllPatients(filters?: PatientSearchFilters, page?: number, limit?: number): Promise<{
        patients: PatientWithProfile[];
        total: number;
    }>;
    getPatientById(patientId: string): Promise<PatientWithProfile | null>;
    getPatientByProfileId(profileId: string): Promise<PatientWithProfile | null>;
    getPatientsByDoctorId(doctorId: string): Promise<PatientWithProfile[]>;
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
}
//# sourceMappingURL=patient.repository.d.ts.map