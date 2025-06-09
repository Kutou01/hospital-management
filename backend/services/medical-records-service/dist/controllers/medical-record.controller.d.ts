import { Request, Response } from 'express';
export declare class MedicalRecordController {
    private medicalRecordRepository;
    constructor();
    getAllMedicalRecords(req: Request, res: Response): Promise<void>;
    getMedicalRecordById(req: Request, res: Response): Promise<void>;
    getMedicalRecordsByPatientId(req: Request, res: Response): Promise<void>;
    getMedicalRecordsByDoctorId(req: Request, res: Response): Promise<void>;
    createMedicalRecord(req: Request, res: Response): Promise<void>;
    updateMedicalRecord(req: Request, res: Response): Promise<void>;
    deleteMedicalRecord(req: Request, res: Response): Promise<void>;
    createLabResult(req: Request, res: Response): Promise<void>;
    getLabResultsByRecordId(req: Request, res: Response): Promise<void>;
    createVitalSigns(req: Request, res: Response): Promise<void>;
    getVitalSignsByRecordId(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=medical-record.controller.d.ts.map