import { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role?: string;
        email?: string;
    };
}
export declare class BillingController {
    private billingRepository;
    private stripe;
    constructor();
    getAllBills(req: Request, res: Response): Promise<void>;
    getBillById(req: Request, res: Response): Promise<void>;
    getBillsByPatientId(req: Request, res: Response): Promise<void>;
    createBill(req: AuthenticatedRequest, res: Response): Promise<void>;
    updateBill(req: Request, res: Response): Promise<void>;
    deleteBill(req: Request, res: Response): Promise<void>;
    createPayment(req: AuthenticatedRequest, res: Response): Promise<void>;
    getPaymentsByBillId(req: Request, res: Response): Promise<void>;
    createPaymentIntent(req: Request, res: Response): Promise<void>;
    confirmPayment(req: AuthenticatedRequest, res: Response): Promise<void>;
    createInsurance(req: Request, res: Response): Promise<void>;
    getInsuranceByPatientId(req: Request, res: Response): Promise<void>;
    getPaymentSummary(req: Request, res: Response): Promise<void>;
    generateInvoice(req: Request, res: Response): Promise<void>;
}
export {};
//# sourceMappingURL=billing.controller.d.ts.map