import { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role?: string;
        email?: string;
    };
}
export declare class PrescriptionController {
    private prescriptionRepository;
    constructor();
    getAllPrescriptions(req: Request, res: Response): Promise<void>;
    getPrescriptionById(req: Request, res: Response): Promise<void>;
    getPrescriptionsByPatientId(req: Request, res: Response): Promise<void>;
    getPrescriptionsByDoctorId(req: Request, res: Response): Promise<void>;
    createPrescription(req: AuthenticatedRequest, res: Response): Promise<void>;
    updatePrescription(req: AuthenticatedRequest, res: Response): Promise<void>;
    deletePrescription(req: Request, res: Response): Promise<void>;
    getAllMedications(req: Request, res: Response): Promise<void>;
    searchMedications(req: Request, res: Response): Promise<void>;
    createMedication(req: Request, res: Response): Promise<void>;
    checkDrugInteractions(req: Request, res: Response): Promise<void>;
}
export {};
//# sourceMappingURL=prescription.controller.d.ts.map