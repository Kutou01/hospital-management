import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/database.config';
import logger from '@hospital/shared/dist/utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    userId: string;
    email: string;
    role: string;
    full_name?: string;
    phone_number?: string;
    is_active?: boolean;
    doctor_id?: string;
    patient_id?: string;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    logger.info('🔍 AUTH MIDDLEWARE CALLED', {
      url: req.url,
      method: req.method,
      headers: {
        authorization: req.headers.authorization ? 'Bearer ***' : 'none',
        'user-agent': req.headers['user-agent']
      }
    });
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authorization token required'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    // DEBUG: Log user info
    logger.info('🔍 DEBUG Auth Middleware - User from token:', {
      userId: user?.id,
      email: user?.email,
      error: error?.message
    });

    if (error || !user) {
      logger.warn('Invalid token provided:', { error: error?.message });
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
      return;
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // DEBUG: Log profile info
    logger.info('🔍 DEBUG Auth Middleware - Profile from database:', {
      profileFound: !!profile,
      profileRole: profile?.role,
      profileActive: profile?.is_active,
      profileEmail: profile?.email,
      error: profileError?.message
    });

    if (profileError || !profile) {
      logger.error('Error fetching user profile:', { error: profileError, userId: user.id });
      res.status(401).json({
        success: false,
        message: 'User profile not found'
      });
      return;
    }

    // Check if user is active
    if (!profile.is_active) {
      res.status(401).json({
        success: false,
        message: 'User account is inactive'
      });
      return;
    }

    // Get doctor_id if user is a doctor
    let doctorId = null;
    if (profile.role === 'doctor') {
      const { data: doctor, error: doctorError } = await supabaseAdmin
        .from('doctors')
        .select('doctor_id')
        .eq('profile_id', user.id)
        .single();

      if (!doctorError && doctor) {
        doctorId = doctor.doctor_id;
      }
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      userId: user.id, // Add missing userId property
      email: user.email || profile.email,
      role: profile.role,
      full_name: profile.full_name,
      phone_number: profile.phone_number,
      is_active: profile.is_active,
      doctor_id: doctorId
    };

    // DEBUG: Log final user object
    logger.info('🔍 DEBUG Auth Middleware - Final req.user:', {
      id: req.user.id,
      role: req.user.role,
      email: req.user.email
    });

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
      return;
    }

    next();
  };
};

export const requireDoctor = requireRole(['doctor']);
export const requireAdmin = requireRole(['admin']);
export const requireDoctorOrAdmin = requireRole(['doctor', 'admin']);

// Export alias for backward compatibility
export const authenticateToken = authMiddleware;
