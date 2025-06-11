import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthService } from '../services/auth.service';
import logger from '@hospital/shared/dist/utils/logger';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Sign up a new user
   */
  public signUp = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const { email, password, full_name, role, ...additionalData } = req.body;

      const result = await this.authService.signUp({
        email,
        password,
        full_name,
        role,
        ...additionalData
      });

      if (result.error) {
        // Determine appropriate status code based on error type
        let statusCode = 400;
        if (result.error.includes('already registered') || result.error.includes('already exists')) {
          statusCode = 409; // Conflict
        } else if (result.error.includes('Invalid') || result.error.includes('validation')) {
          statusCode = 400; // Bad Request
        } else if (result.error.includes('permission') || result.error.includes('unauthorized')) {
          statusCode = 403; // Forbidden
        }

        res.status(statusCode).json({
          success: false,
          error: result.error,
          message: 'Failed to create account',
          timestamp: new Date().toISOString()
        });
        return;
      }

      logger.info('✅ User signed up successfully', {
        userId: result.user?.id,
        email: result.user?.email,
        role: result.user?.role,
        hasSession: !!result.session
      });

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        user: result.user,
        session: result.session,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      logger.error('❌ Sign up controller error:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to create account',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * Sign in user
   */
  public signIn = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const { email, password } = req.body;

      const result = await this.authService.signIn(email, password);

      if (result.error) {
        res.status(401).json({
          success: false,
          error: result.error,
          message: 'Invalid credentials'
        });
        return;
      }

      logger.info('User signed in successfully', {
        userId: result.user?.id,
        email: result.user?.email,
        role: result.user?.role
      });

      res.status(200).json({
        success: true,
        message: 'Signed in successfully',
        user: result.user,
        session: result.session,
        access_token: result.session?.access_token
      });

    } catch (error) {
      logger.error('Sign in error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to sign in'
      });
    }
  };

  /**
   * Sign out user
   */
  public signOut = async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        res.status(400).json({
          success: false,
          error: 'No token provided'
        });
        return;
      }

      const result = await this.authService.signOut(token);

      if (result.error) {
        res.status(400).json({
          success: false,
          error: result.error,
          message: 'Failed to sign out'
        });
        return;
      }

      logger.info('User signed out successfully');

      res.status(200).json({
        success: true,
        message: 'Signed out successfully'
      });

    } catch (error) {
      logger.error('Sign out error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to sign out'
      });
    }
  };

  /**
   * Refresh access token
   */
  public refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        res.status(400).json({
          success: false,
          error: 'Refresh token is required'
        });
        return;
      }

      const result = await this.authService.refreshToken(refresh_token);

      if (result.error) {
        res.status(401).json({
          success: false,
          error: result.error,
          message: 'Failed to refresh token'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        session: result.session,
        access_token: result.session?.access_token
      });

    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to refresh token'
      });
    }
  };

  /**
   * Reset password
   */
  public resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const { email } = req.body;

      const result = await this.authService.resetPassword(email);

      if (result.error) {
        res.status(400).json({
          success: false,
          error: result.error,
          message: 'Failed to send reset password email'
        });
        return;
      }

      logger.info('Password reset email sent', { email });

      res.status(200).json({
        success: true,
        message: 'Password reset email sent successfully'
      });

    } catch (error) {
      logger.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to send reset password email'
      });
    }
  };

  /**
   * Verify JWT token
   */
  public verifyToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        res.status(400).json({
          success: false,
          error: 'No token provided'
        });
        return;
      }

      const result = await this.authService.verifyToken(token);

      if (result.error) {
        res.status(401).json({
          success: false,
          error: result.error,
          message: 'Invalid token'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Token is valid',
        user: result.user
      });

    } catch (error) {
      logger.error('Verify token error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to verify token'
      });
    }
  };

  /**
   * Create doctor record with department-based ID
   */
  public createDoctorRecord = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, userData } = req.body;

      if (!userId || !userData) {
        res.status(400).json({
          success: false,
          error: 'userId and userData are required'
        });
        return;
      }

      await this.authService.createDoctorRecord(userId, userData);

      logger.info('Doctor record created successfully', { userId });

      res.status(201).json({
        success: true,
        message: 'Doctor record created successfully'
      });

    } catch (error: any) {
      logger.error('Create doctor record error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to create doctor record'
      });
    }
  };

  /**
   * Create patient record
   */
  public createPatientRecord = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, userData } = req.body;

      if (!userId || !userData) {
        res.status(400).json({
          success: false,
          error: 'userId and userData are required'
        });
        return;
      }

      await this.authService.createPatientRecord(userId, userData);

      logger.info('Patient record created successfully', { userId });

      res.status(201).json({
        success: true,
        message: 'Patient record created successfully'
      });

    } catch (error: any) {
      logger.error('Create patient record error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
        message: 'Failed to create patient record'
      });
    }
  };

  /**
   * Send magic link for passwordless login
   */
  public sendMagicLink = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const { email } = req.body;

      const result = await this.authService.sendMagicLink(email);

      if (result.error) {
        res.status(400).json({
          success: false,
          error: result.error,
          message: 'Failed to send magic link'
        });
        return;
      }

      logger.info('Magic link sent successfully', { email });

      res.status(200).json({
        success: true,
        message: 'Magic link sent to your email address'
      });

    } catch (error) {
      logger.error('Send magic link error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to send magic link'
      });
    }
  };

  /**
   * Send OTP to phone number
   */
  public sendPhoneOTP = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const { phone_number } = req.body;

      const result = await this.authService.sendPhoneOTP(phone_number);

      if (result.error) {
        res.status(400).json({
          success: false,
          error: result.error,
          message: 'Failed to send OTP'
        });
        return;
      }

      logger.info('Phone OTP sent successfully', { phone_number });

      res.status(200).json({
        success: true,
        message: 'OTP sent to your phone number'
      });

    } catch (error) {
      logger.error('Send phone OTP error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to send OTP'
      });
    }
  };

  /**
   * Verify phone OTP and sign in
   */
  public verifyPhoneOTP = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const { phone_number, otp_code } = req.body;

      const result = await this.authService.verifyPhoneOTP(phone_number, otp_code);

      if (result.error) {
        res.status(400).json({
          success: false,
          error: result.error,
          message: 'Invalid OTP or phone number'
        });
        return;
      }

      logger.info('Phone OTP verified successfully', { phone_number });

      res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        user: result.user,
        session: result.session,
        access_token: result.session?.access_token
      });

    } catch (error) {
      logger.error('Verify phone OTP error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to verify OTP'
      });
    }
  };

  /**
   * Initiate OAuth login
   */
  public initiateOAuth = async (req: Request, res: Response): Promise<void> => {
    try {
      const { provider } = req.params;

      if (!['google', 'github', 'facebook', 'apple'].includes(provider)) {
        res.status(400).json({
          success: false,
          error: 'Invalid OAuth provider',
          message: 'Supported providers: google, github, facebook, apple'
        });
        return;
      }

      const result = await this.authService.initiateOAuth(provider as any);

      if (result.error) {
        res.status(400).json({
          success: false,
          error: result.error,
          message: 'Failed to initiate OAuth login'
        });
        return;
      }

      logger.info('OAuth login initiated', { provider });

      // Redirect to OAuth provider
      res.redirect(result.url!);

    } catch (error) {
      logger.error('Initiate OAuth error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to initiate OAuth login'
      });
    }
  };

  /**
   * Handle OAuth callback
   */
  public handleOAuthCallback = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const { code, state, provider } = req.body;

      const result = await this.authService.handleOAuthCallback(code, state, provider);

      if (result.error) {
        res.status(400).json({
          success: false,
          error: result.error,
          message: 'OAuth login failed'
        });
        return;
      }

      logger.info('OAuth login successful', { provider });

      res.status(200).json({
        success: true,
        message: 'OAuth login successful',
        user: result.user,
        session: result.session,
        access_token: result.session?.access_token
      });

    } catch (error) {
      logger.error('OAuth callback error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'OAuth login failed'
      });
    }
  };
}
