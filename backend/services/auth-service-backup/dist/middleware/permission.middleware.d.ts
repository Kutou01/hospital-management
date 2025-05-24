import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@hospital/shared/src/types/common.types';
export interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        email: string;
        role: UserRole;
        full_name: string;
        profile_id?: string;
        permissions: string[];
    };
}
/**
 * Middleware to check if user has specific permission
 */
export declare const permissionMiddleware: (requiredPermission: string) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to check if user has any of the specified permissions
 */
export declare const anyPermissionMiddleware: (requiredPermissions: string[]) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to check if user can access their own resource or has admin permission
 */
export declare const ownerOrAdminMiddleware: (userIdParam?: string) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to check if user has role-based access to profile
 */
export declare const profileAccessMiddleware: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Helper function to create resource-specific permission middleware
 */
export declare const createResourcePermission: (resource: string, action: string) => (req: Request, res: Response, next: NextFunction) => void;
export declare const canReadUsers: (req: Request, res: Response, next: NextFunction) => void;
export declare const canWriteUsers: (req: Request, res: Response, next: NextFunction) => void;
export declare const canDeleteUsers: (req: Request, res: Response, next: NextFunction) => void;
export declare const canReadPatients: (req: Request, res: Response, next: NextFunction) => void;
export declare const canWritePatients: (req: Request, res: Response, next: NextFunction) => void;
export declare const canReadDoctors: (req: Request, res: Response, next: NextFunction) => void;
export declare const canWriteDoctors: (req: Request, res: Response, next: NextFunction) => void;
export declare const canReadAppointments: (req: Request, res: Response, next: NextFunction) => void;
export declare const canWriteAppointments: (req: Request, res: Response, next: NextFunction) => void;
export declare const canReadMedicalRecords: (req: Request, res: Response, next: NextFunction) => void;
export declare const canWriteMedicalRecords: (req: Request, res: Response, next: NextFunction) => void;
export declare const canReadPrescriptions: (req: Request, res: Response, next: NextFunction) => void;
export declare const canWritePrescriptions: (req: Request, res: Response, next: NextFunction) => void;
export declare const canReadBilling: (req: Request, res: Response, next: NextFunction) => void;
export declare const canWriteBilling: (req: Request, res: Response, next: NextFunction) => void;
export declare const canManageSystem: (req: Request, res: Response, next: NextFunction) => void;
