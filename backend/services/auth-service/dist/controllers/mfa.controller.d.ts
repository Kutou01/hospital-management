import { Request, Response } from "express";
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
        email: string;
    };
}
export declare const getMFAStatus: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const enrollTOTP: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const completeTOTPEnrollment: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const challengeTOTP: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const verifyTOTP: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const authenticateWithMFA: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const unenrollTOTP: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const checkMFACompliance: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getMFAAuditHistory: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const checkMFAVerificationNeeded: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=mfa.controller.d.ts.map