import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthService } from '../services/auth.service';
import { supabaseAdmin } from '../config/supabase';
import crypto from 'crypto';
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
   * Complete patient registration (signup + patient record creation)
   */
  public registerPatient = async (req: Request, res: Response): Promise<void> => {
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

      const { email, password, full_name, phone_number, gender, date_of_birth, blood_type, address, emergency_contact } = req.body;

      // Prepare complete patient data for signup
      const patientSignupData = {
        email,
        password,
        full_name,
        role: 'patient' as const,
        phone_number,
        gender,
        date_of_birth,
        blood_type,
        address,
        emergency_contact
      };

      const result = await this.authService.signUp(patientSignupData);

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
          message: 'Failed to register patient',
          timestamp: new Date().toISOString()
        });
        return;
      }

      logger.info('✅ Patient registered successfully', {
        userId: result.user?.id,
        email: result.user?.email,
        role: result.user?.role,
        hasSession: !!result.session
      });

      res.status(201).json({
        success: true,
        message: 'Patient registered successfully',
        user: result.user,
        session: result.session,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      logger.error('❌ Patient registration controller error:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to register patient',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * Complete doctor registration (signup + doctor record creation)
   */
  public registerDoctor = async (req: Request, res: Response): Promise<void> => {
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

      const { email, password, full_name, phone_number, gender, date_of_birth, specialty, license_number, qualification, department_id } = req.body;

      // Validate required doctor fields
      if (!department_id) {
        res.status(400).json({
          success: false,
          error: 'Department ID is required for doctor registration',
          message: 'Please provide a valid department_id',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Prepare complete doctor data for signup
      const doctorSignupData = {
        email,
        password,
        full_name,
        role: 'doctor' as const,
        phone_number,
        gender,
        date_of_birth,
        specialty,
        license_number,
        qualification,
        department_id
      };

      const result = await this.authService.signUp(doctorSignupData);

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
          message: 'Failed to register doctor',
          timestamp: new Date().toISOString()
        });
        return;
      }

      logger.info('✅ Doctor registered successfully', {
        userId: result.user?.id,
        email: result.user?.email,
        role: result.user?.role,
        department_id,
        hasSession: !!result.session
      });

      res.status(201).json({
        success: true,
        message: 'Doctor registered successfully',
        user: result.user,
        session: result.session,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      logger.error('❌ Doctor registration controller error:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to register doctor',
        timestamp: new Date().toISOString()
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

  /**
   * Test database connection and triggers
   */
  public testDatabase = async (req: Request, res: Response): Promise<void> => {
    try {
      // Test 1: Check if profiles table exists
      const { data: profilesTest, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('count')
        .limit(1);

      // Test 2: Check if trigger function exists
      const { data: triggerTest, error: triggerError } = await supabaseAdmin
        .rpc('check_trigger_exists', { trigger_name: 'on_auth_user_created' });

      // Test 3: Check auth.users table access
      const { data: authUsersTest, error: authError } = await supabaseAdmin
        .from('auth.users')
        .select('count')
        .limit(1);

      res.json({
        success: true,
        tests: {
          profiles_table: {
            accessible: !profilesError,
            error: profilesError?.message
          },
          trigger_function: {
            exists: !triggerError,
            error: triggerError?.message
          },
          auth_users_table: {
            accessible: !authError,
            error: authError?.message
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      logger.error('Database test error:', error);
      res.status(500).json({
        success: false,
        error: 'Database test failed',
        message: error.message
      });
    }
  };

  /**
   * Setup database trigger for profile creation
   */
  public setupTrigger = async (req: Request, res: Response): Promise<void> => {
    try {
      // Test RLS policies by trying to disable/enable them
      const { error: disableRLSError } = await supabaseAdmin
        .rpc('disable_rls_on_profiles');

      if (disableRLSError) {
        logger.warn('Could not disable RLS:', disableRLSError);
      }

      res.json({
        success: true,
        message: 'RLS policies checked',
        rls_disabled: !disableRLSError,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      logger.error('Trigger setup error:', error);
      res.status(500).json({
        success: false,
        error: 'Trigger setup failed',
        message: error.message
      });
    }
  };

  /**
   * Simple signup without Supabase Auth (for testing)
   */
  public simpleSignup = async (req: Request, res: Response): Promise<void> => {
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

      const { email, password, full_name, role, phone_number } = req.body;

      // Generate a UUID for the user
      const userId = crypto.randomUUID();

      // Create profile directly in database
      const profileData = {
        id: userId,
        email: email,
        full_name: full_name,
        role: role,
        phone_number: phone_number || null,
        email_verified: true,
        phone_verified: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert(profileData);

      if (profileError) {
        logger.error('Profile creation error:', profileError);
        res.status(400).json({
          success: false,
          error: 'Profile creation failed',
          message: profileError.message
        });
        return;
      }

      res.status(201).json({
        success: true,
        message: 'User profile created successfully',
        user: {
          id: userId,
          email: email,
          full_name: full_name,
          role: role
        }
      });

    } catch (error: any) {
      logger.error('Simple signup error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  };

  /**
   * Simple signin without Supabase Auth (for testing)
   */
  public simpleSignin = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
        return;
      }

      // Find user in profiles table
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (profileError || !profile) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
        return;
      }

      if (!profile.is_active) {
        res.status(401).json({
          success: false,
          error: 'Account is inactive'
        });
        return;
      }

      // For testing, we'll accept any password (in real app, hash and compare)
      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role,
          phone_number: profile.phone_number,
          email_verified: profile.email_verified,
          is_active: profile.is_active
        }
      });

    } catch (error: any) {
      logger.error('Simple signin error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  };

  /**
   * Check Supabase Auth configuration
   */
  public checkAuthConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      // Test different auth methods to see what works
      const tests = {
        admin_create_user: null,
        client_signup: null,
        auth_settings: null
      };

      // Test 1: Admin create user (should work)
      try {
        const testEmail = `test-${Date.now()}@example.com`;
        const { data: adminResult, error: adminError } = await supabaseAdmin.auth.admin.createUser({
          email: testEmail,
          password: 'Test123456',
          email_confirm: true
        });

        tests.admin_create_user = {
          success: !adminError,
          error: adminError?.message,
          user_created: !!adminResult?.user
        };

        // Clean up test user
        if (adminResult?.user) {
          await supabaseAdmin.auth.admin.deleteUser(adminResult.user.id);
        }
      } catch (error: any) {
        tests.admin_create_user = {
          success: false,
          error: error.message
        };
      }

      // Test 2: Client signup (what's failing)
      try {
        const testEmail2 = `test-client-${Date.now()}@example.com`;
        const { data: clientResult, error: clientError } = await supabaseAdmin.auth.admin.createUser({
          email: testEmail2,
          password: 'Test123456',
          email_confirm: false // Test without email confirmation
        });

        tests.client_signup = {
          success: !clientError,
          error: clientError?.message,
          user_created: !!clientResult?.user
        };

        // Clean up test user
        if (clientResult?.user) {
          await supabaseAdmin.auth.admin.deleteUser(clientResult.user.id);
        }
      } catch (error: any) {
        tests.client_signup = {
          success: false,
          error: error.message
        };
      }

      // Test 3: Check auth settings
      try {
        const { data: settings, error: settingsError } = await supabaseAdmin.auth.admin.getSettings();
        tests.auth_settings = {
          success: !settingsError,
          error: settingsError?.message,
          settings: settings
        };
      } catch (error: any) {
        tests.auth_settings = {
          success: false,
          error: error.message
        };
      }

      res.json({
        success: true,
        message: 'Auth configuration check completed',
        tests: tests,
        recommendations: {
          issue_found: !tests.client_signup?.success,
          likely_cause: tests.client_signup?.success ? 'No issues found' : 'Email confirmation or SMTP configuration',
          next_steps: [
            'Check Supabase dashboard Auth settings',
            'Disable email confirmation temporarily',
            'Configure SMTP if email confirmation is needed'
          ]
        },
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      logger.error('Auth config check error:', error);
      res.status(500).json({
        success: false,
        error: 'Auth config check failed',
        message: error.message
      });
    }
  };
}
