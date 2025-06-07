import { Request, Response } from 'express';
export declare class PatientController {
    private patientRepository;
    constructor();
    getAllPatients(req: Request, res: Response): Promise<void>;
    getPatientById(req: Request, res: Response): Promise<void>;
    getPatientByProfileId(req: Request, res: Response): Promise<void>;
    getPatientsByDoctorId(req: Request, res: Response): Promise<void>;
    createPatient(req: Request, res: Response): Promise<void>;
    updatePatient(req: Request, res: Response): Promise<void>;
    deletePatient(req: Request, res: Response): Promise<void>;
    getPatientStats(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=patient.controller.d.ts.map