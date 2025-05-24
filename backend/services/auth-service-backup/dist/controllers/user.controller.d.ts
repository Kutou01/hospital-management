import { Request, Response, NextFunction } from 'express';
export declare class UserController {
    private userService;
    constructor();
    getCurrentUser: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getUserById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getAllUsers: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getUsersByRole: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateUser: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    activateUser: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deactivateUser: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deleteUser: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getUserStats: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
