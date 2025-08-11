import { CreateEmbeddedPrescriptionRequest, CreateMedicalRecordRequest, EmbeddedPrescription, MedicalRecord, UpdateEmbeddedPrescriptionRequest, UpdateMedicalRecordRequest } from "../types/medical-record.types";
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
    createPrescriptionForRecord(recordId: string, prescriptionData: CreateEmbeddedPrescriptionRequest, createdBy: string): Promise<EmbeddedPrescription>;
    updatePrescriptionInRecord(recordId: string, prescriptionId: string, updateData: UpdateEmbeddedPrescriptionRequest): Promise<EmbeddedPrescription>;
    getPrescriptionsByPatientId(patientId: string): Promise<EmbeddedPrescription[]>;
    getPrescriptionsByDoctorId(doctorId: string): Promise<EmbeddedPrescription[]>;
    private mapSupabaseRecordToMedicalRecord;
}
//# sourceMappingURL=medical-record.repository.d.ts.map