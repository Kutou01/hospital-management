import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface SupabaseJWTPayload {
  sub: string;
  email: string;
  role?: string;
  user_metadata?: any;
  app_metadata?: any;
  iat?: number;
  exp?: number;
}

// Initialize Supabase client for JWT verification
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for API Gateway auth middleware');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'No token provided'
      });
      return;
    }

    // Verify Supabase JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
      return;
    }

    // Get user profile from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name, is_active')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      res.status(401).json({
        success: false,
        error: 'User profile not found'
      });
      return;
    }

    if (!profile.is_active) {
      res.status(401).json({
        success: false,
        error: 'User account is inactive'
      });
      return;
    }

    // Add user info to request headers for downstream services
    req.headers['x-user-id'] = user.id;
    req.headers['x-user-email'] = user.email || '';
    req.headers['x-user-role'] = profile.role;
    req.headers['x-user-name'] = profile.full_name || '';

    console.log('Request authenticated via Supabase Auth', {
      userId: user.id,
      email: user.email,
      role: profile.role,
      path: req.path,
      method: req.method
    });

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};
