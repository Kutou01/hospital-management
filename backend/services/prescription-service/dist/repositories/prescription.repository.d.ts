import { Prescription, Medication, CreatePrescriptionRequest, UpdatePrescriptionRequest, CreateMedicationRequest, UpdateMedicationRequest, PrescriptionWithDetails, DrugInteractionCheck } from '../types/prescription.types';
export declare class PrescriptionRepository {
    private supabase;
    constructor();
    findAllPrescriptions(limit?: number, offset?: number): Promise<Prescription[]>;
    findPrescriptionById(prescriptionId: string): Promise<PrescriptionWithDetails | null>;
    findPrescriptionsByPatientId(patientId: string): Promise<Prescription[]>;
    findPrescriptionsByDoctorId(doctorId: string): Promise<Prescription[]>;
    createPrescription(prescriptionData: CreatePrescriptionRequest, createdBy: string): Promise<PrescriptionWithDetails>;
    updatePrescription(prescriptionId: string, prescriptionData: UpdatePrescriptionRequest, updatedBy: string): Promise<Prescription>;
    deletePrescription(prescriptionId: string): Promise<void>;
    findAllMedications(limit?: number, offset?: number): Promise<Medication[]>;
    findMedicationById(medicationId: string): Promise<Medication | null>;
    searchMedications(searchTerm: string): Promise<Medication[]>;
    createMedication(medicationData: CreateMedicationRequest): Promise<Medication>;
    updateMedication(medicationId: string, medicationData: UpdateMedicationRequest): Promise<Medication>;
    checkDrugInteractions(medicationIds: string[]): Promise<DrugInteractionCheck>;
    private generatePrescriptionId;
    private generateMedicationId;
    private mapSupabasePrescriptionToPrescription;
    private mapSupabasePrescriptionItemToPrescriptionItem;
    private mapSupabaseMedicationToMedication;
    private mapSupabaseDrugInteractionToDrugInteraction;
}
//# sourceMappingURL=prescription.repository.d.ts.map