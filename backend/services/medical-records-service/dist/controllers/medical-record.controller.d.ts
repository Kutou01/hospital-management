import { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}
export declare class MedicalRecordController {
    private medicalRecordRepository;
    constructor();
    getAllMedicalRecords(req: Request, res: Response): Promise<void>;
    getMedicalRecordById(req: Request, res: Response): Promise<void>;
    getMedicalRecordsByPatientId(req: Request, res: Response): Promise<void>;
    getMedicalRecordsByDoctorId(req: Request, res: Response): Promise<void>;
    createMedicalRecord(req: AuthenticatedRequest, res: Response): Promise<void>;
    updateMedicalRecord(req: AuthenticatedRequest, res: Response): Promise<void>;
    deleteMedicalRecord(req: Request, res: Response): Promise<void>;
    createLabResult(req: Request, res: Response): Promise<void>;
    getLabResultsByRecordId(req: Request, res: Response): Promise<void>;
    createVitalSigns(req: AuthenticatedRequest, res: Response): Promise<void>;
    getVitalSignsByRecordId(req: Request, res: Response): Promise<void>;
}
export {};
//# sourceMappingURL=medical-record.controller.d.ts.map