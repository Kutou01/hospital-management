import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { UpdateUserRequest } from '@hospital/shared/src/types/user.types';
import { ApiResponse } from '@hospital/shared/src/types/common.types';
import logger from '@hospital/shared/src/utils/logger';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const user = await this.userService.getUserById(userId);

      const response: ApiResponse = {
        success: true,
        data: { user },
        message: 'Current user retrieved successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUserId = (req as any).user.id;
      const currentUserRole = (req as any).user.role;

      // Users can only access their own data unless they're admin
      if (id !== currentUserId && currentUserRole !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Forbidden: You can only access your own profile'
        });
        return;
      }

      const user = await this.userService.getUserById(id);

      const response: ApiResponse = {
        success: true,
        data: { user },
        message: 'User retrieved successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const users = await this.userService.getAllUsers(limit, offset);
      const total = await this.userService.getUserCount();

      const response: ApiResponse = {
        success: true,
        data: { users },
        message: 'Users retrieved successfully',
        pagination: {
          page: Math.floor(offset / limit) + 1,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: offset + limit < total,
          hasPrev: offset > 0
        }
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getUsersByRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { role } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const users = await this.userService.getUsersByRole(role, limit, offset);
      const total = await this.userService.getUserCountByRole(role);

      const response: ApiResponse = {
        success: true,
        data: { users },
        message: `Users with role ${role} retrieved successfully`,
        pagination: {
          page: Math.floor(offset / limit) + 1,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: offset + limit < total,
          hasPrev: offset > 0
        }
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUserId = (req as any).user.id;
      const currentUserRole = (req as any).user.role;
      const userData: UpdateUserRequest = req.body;

      // Users can only update their own data unless they're admin
      if (id !== currentUserId && currentUserRole !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Forbidden: You can only update your own profile'
        });
        return;
      }

      // Non-admin users cannot change is_active status
      if (currentUserRole !== 'admin' && userData.is_active !== undefined) {
        delete userData.is_active;
      }

      const user = await this.userService.updateUser(id, userData);

      logger.info('User updated', {
        userId: id,
        updatedBy: currentUserId,
        changes: Object.keys(userData)
      });

      const response: ApiResponse = {
        success: true,
        data: { user },
        message: 'User updated successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  activateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUserId = (req as any).user.id;

      await this.userService.activateUser(id);

      logger.info('User activated', {
        userId: id,
        activatedBy: currentUserId
      });

      const response: ApiResponse = {
        success: true,
        message: 'User activated successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  deactivateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUserId = (req as any).user.id;

      // Prevent self-deactivation
      if (id === currentUserId) {
        res.status(400).json({
          success: false,
          error: 'You cannot deactivate your own account'
        });
        return;
      }

      await this.userService.deactivateUser(id);

      logger.info('User deactivated', {
        userId: id,
        deactivatedBy: currentUserId
      });

      const response: ApiResponse = {
        success: true,
        message: 'User deactivated successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const currentUserId = (req as any).user.id;

      // Prevent self-deletion
      if (id === currentUserId) {
        res.status(400).json({
          success: false,
          error: 'You cannot delete your own account'
        });
        return;
      }

      await this.userService.deleteUser(id);

      logger.info('User deleted', {
        userId: id,
        deletedBy: currentUserId
      });

      const response: ApiResponse = {
        success: true,
        message: 'User deleted successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getUserStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const totalUsers = await this.userService.getUserCount();
      const adminCount = await this.userService.getUserCountByRole('admin');
      const doctorCount = await this.userService.getUserCountByRole('doctor');
      const patientCount = await this.userService.getUserCountByRole('patient');
      const nurseCount = await this.userService.getUserCountByRole('nurse');
      const receptionistCount = await this.userService.getUserCountByRole('receptionist');

      const stats = {
        total: totalUsers,
        byRole: {
          admin: adminCount,
          doctor: doctorCount,
          patient: patientCount,
          nurse: nurseCount,
          receptionist: receptionistCount
        }
      };

      const response: ApiResponse = {
        success: true,
        data: { stats },
        message: 'User statistics retrieved successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
