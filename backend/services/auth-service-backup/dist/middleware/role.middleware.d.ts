import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@hospital/shared/src/types/common.types';
export declare const roleMiddleware: (allowedRoles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => void;
