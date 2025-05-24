import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@hospital/shared/src/types/common.types';
import logger from '@hospital/shared/src/utils/logger';

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
export const permissionMiddleware = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = (req as AuthenticatedRequest).user;
      
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      if (!user.permissions || !user.permissions.includes(requiredPermission)) {
        logger.warn('Permission denied', {
          userId: user.id,
          role: user.role,
          requiredPermission,
          userPermissions: user.permissions,
          path: req.path,
          method: req.method
        });

        res.status(403).json({
          success: false,
          error: `Permission denied. Required permission: ${requiredPermission}`
        });
        return;
      }

      logger.info('Permission granted', {
        userId: user.id,
        role: user.role,
        permission: requiredPermission,
        path: req.path,
        method: req.method
      });

      next();
    } catch (error) {
      logger.error('Permission middleware error', { error });
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
};

/**
 * Middleware to check if user has any of the specified permissions
 */
export const anyPermissionMiddleware = (requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = (req as AuthenticatedRequest).user;
      
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const hasPermission = requiredPermissions.some(permission => 
        user.permissions && user.permissions.includes(permission)
      );

      if (!hasPermission) {
        logger.warn('Permission denied - no matching permissions', {
          userId: user.id,
          role: user.role,
          requiredPermissions,
          userPermissions: user.permissions,
          path: req.path,
          method: req.method
        });

        res.status(403).json({
          success: false,
          error: `Permission denied. Required one of: ${requiredPermissions.join(', ')}`
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Any permission middleware error', { error });
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
};

/**
 * Middleware to check if user can access their own resource or has admin permission
 */
export const ownerOrAdminMiddleware = (userIdParam: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = (req as AuthenticatedRequest).user;
      const resourceUserId = req.params[userIdParam];
      
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // Allow if user is accessing their own resource
      if (user.id === resourceUserId) {
        next();
        return;
      }

      // Allow if user has admin permissions
      if (user.permissions && user.permissions.includes('users:read')) {
        next();
        return;
      }

      logger.warn('Access denied - not owner or admin', {
        userId: user.id,
        role: user.role,
        resourceUserId,
        path: req.path,
        method: req.method
      });

      res.status(403).json({
        success: false,
        error: 'Access denied. You can only access your own resources.'
      });
    } catch (error) {
      logger.error('Owner or admin middleware error', { error });
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
};

/**
 * Middleware to check if user has role-based access to profile
 */
export const profileAccessMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const profileId = req.params.profileId;
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    // Allow if user is accessing their own profile
    if (user.profile_id === profileId) {
      next();
      return;
    }

    // Allow if user has appropriate read permissions
    const canReadProfiles = user.permissions && (
      user.permissions.includes('patients:read') ||
      user.permissions.includes('doctors:read') ||
      user.permissions.includes('users:read')
    );

    if (canReadProfiles) {
      next();
      return;
    }

    logger.warn('Profile access denied', {
      userId: user.id,
      role: user.role,
      profileId,
      userProfileId: user.profile_id,
      path: req.path,
      method: req.method
    });

    res.status(403).json({
      success: false,
      error: 'Access denied. You can only access your own profile.'
    });
  } catch (error) {
    logger.error('Profile access middleware error', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Helper function to create resource-specific permission middleware
 */
export const createResourcePermission = (resource: string, action: string) => {
  return permissionMiddleware(`${resource}:${action}`);
};

// Common permission middlewares
export const canReadUsers = permissionMiddleware('users:read');
export const canWriteUsers = permissionMiddleware('users:write');
export const canDeleteUsers = permissionMiddleware('users:delete');

export const canReadPatients = permissionMiddleware('patients:read');
export const canWritePatients = permissionMiddleware('patients:write');

export const canReadDoctors = permissionMiddleware('doctors:read');
export const canWriteDoctors = permissionMiddleware('doctors:write');

export const canReadAppointments = permissionMiddleware('appointments:read');
export const canWriteAppointments = permissionMiddleware('appointments:write');

export const canReadMedicalRecords = permissionMiddleware('medical-records:read');
export const canWriteMedicalRecords = permissionMiddleware('medical-records:write');

export const canReadPrescriptions = permissionMiddleware('prescriptions:read');
export const canWritePrescriptions = permissionMiddleware('prescriptions:write');

export const canReadBilling = permissionMiddleware('billing:read');
export const canWriteBilling = permissionMiddleware('billing:write');

export const canManageSystem = permissionMiddleware('system:manage');
