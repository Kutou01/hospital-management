import { MedicalRecord, LabResult, VitalSignsHistory, CreateMedicalRecordRequest, UpdateMedicalRecordRequest, CreateLabResultRequest, CreateVitalSignsRequest } from '../types/medical-record.types';
export declare class MedicalRecordRepository {
    private supabase;
    findAll(limit?: number, offset?: number): Promise<MedicalRecord[]>;
    findById(recordId: string): Promise<MedicalRecord | null>;
    findByPatientId(patientId: string): Promise<MedicalRecord[]>;
    findByDoctorId(doctorId: string): Promise<MedicalRecord[]>;
    create(recordData: CreateMedicalRecordRequest, createdBy: string): Promise<MedicalRecord>;
    update(recordId: string, recordData: UpdateMedicalRecordRequest, updatedBy: string): Promise<MedicalRecord>;
    delete(recordId: string): Promise<void>;
    count(): Promise<number>;
    createLabResult(labData: CreateLabResultRequest): Promise<LabResult>;
    getLabResultsByRecordId(recordId: string): Promise<LabResult[]>;
    createVitalSigns(vitalData: CreateVitalSignsRequest, recordedBy: string): Promise<VitalSignsHistory>;
    getVitalSignsByRecordId(recordId: string): Promise<VitalSignsHistory[]>;
    private calculateBMI;
    private mapSupabaseRecordToMedicalRecord;
}
//# sourceMappingURL=medical-record.repository.d.ts.map