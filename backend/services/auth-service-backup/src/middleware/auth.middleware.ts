import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '@hospital/shared/src/types/user.types';
import { UnauthorizedError } from '@hospital/shared/src/types/common.types';
import logger from '@hospital/shared/src/utils/logger';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    // Add user info to request object
    (req as any).user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      full_name: decoded.full_name,
      profile_id: decoded.profile_id,
      permissions: decoded.permissions || []
    };

    logger.info('User authenticated', {
      userId: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      path: req.path,
      method: req.method
    });

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    } else {
      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      });
    }
  }
};
