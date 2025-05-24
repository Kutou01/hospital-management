import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import {
  CreateUserRequest,
  LoginRequest,
  RefreshTokenRequest,
  ChangePasswordRequest,
  ResetPasswordRequest,
  ResetPasswordConfirmRequest
} from '@hospital/shared/src/types/user.types';
import { ApiResponse } from '@hospital/shared/src/types/common.types';
import logger from '@hospital/shared/src/utils/logger';

export class AuthController {
  private authService: AuthService;
  private userService: UserService;

  constructor() {
    this.authService = new AuthService();
    this.userService = new UserService();
  }

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: User login
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *             required:
   *               - email
   *               - password
   *     responses:
   *       200:
   *         description: Login successful
   *       401:
   *         description: Invalid credentials
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const loginData: LoginRequest = req.body;
      const clientInfo = {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        deviceInfo: {
          platform: req.get('sec-ch-ua-platform'),
          mobile: req.get('sec-ch-ua-mobile'),
        },
      };

      const result = await this.authService.login(loginData, clientInfo);

      logger.info('User logged in successfully', {
        userId: result.user.id,
        email: result.user.email,
        role: result.user.role,
        ip: clientInfo.ip,
      });

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Login successful',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     summary: User registration
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *                 minLength: 8
   *               full_name:
   *                 type: string
   *               role:
   *                 type: string
   *                 enum: [doctor, patient]
   *               phone_number:
   *                 type: string
   *               profile_data:
   *                 type: object
   *             required:
   *               - email
   *               - password
   *               - full_name
   *               - role
   *     responses:
   *       201:
   *         description: Registration successful
   *       400:
   *         description: Invalid input data
   *       409:
   *         description: Email already exists
   */
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: CreateUserRequest = req.body;

      const user = await this.authService.register(userData);

      logger.info('User registered successfully', {
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const response: ApiResponse = {
        success: true,
        data: { user },
        message: 'Registration successful',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /api/auth/refresh:
   *   post:
   *     summary: Refresh access token
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               refresh_token:
   *                 type: string
   *             required:
   *               - refresh_token
   *     responses:
   *       200:
   *         description: Token refreshed successfully
   *       401:
   *         description: Invalid refresh token
   */
  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refresh_token }: RefreshTokenRequest = req.body;

      const result = await this.authService.refreshToken(refresh_token);

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Token refreshed successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     summary: User logout
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Logout successful
   *       401:
   *         description: Unauthorized
   */
  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (token) {
        await this.authService.logout(token);
      }

      logger.info('User logged out successfully', {
        userId: (req as any).user?.id,
      });

      const response: ApiResponse = {
        success: true,
        message: 'Logout successful',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /api/auth/change-password:
   *   post:
   *     summary: Change user password
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               current_password:
   *                 type: string
   *               new_password:
   *                 type: string
   *                 minLength: 8
   *             required:
   *               - current_password
   *               - new_password
   *     responses:
   *       200:
   *         description: Password changed successfully
   *       400:
   *         description: Invalid current password
   *       401:
   *         description: Unauthorized
   */
  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const passwordData: ChangePasswordRequest = req.body;

      await this.authService.changePassword(userId, passwordData);

      logger.info('Password changed successfully', { userId });

      const response: ApiResponse = {
        success: true,
        message: 'Password changed successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /api/auth/reset-password:
   *   post:
   *     summary: Request password reset
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *             required:
   *               - email
   *     responses:
   *       200:
   *         description: Password reset email sent
   *       404:
   *         description: Email not found
   */
  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email }: ResetPasswordRequest = req.body;

      await this.authService.requestPasswordReset(email);

      const response: ApiResponse = {
        success: true,
        message: 'Password reset email sent',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /api/auth/reset-password/confirm:
   *   post:
   *     summary: Confirm password reset
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               token:
   *                 type: string
   *               new_password:
   *                 type: string
   *                 minLength: 8
   *             required:
   *               - token
   *               - new_password
   *     responses:
   *       200:
   *         description: Password reset successful
   *       400:
   *         description: Invalid or expired token
   */
  confirmPasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resetData: ResetPasswordConfirmRequest = req.body;

      await this.authService.confirmPasswordReset(resetData);

      const response: ApiResponse = {
        success: true,
        message: 'Password reset successful',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @swagger
   * /api/auth/me:
   *   get:
   *     summary: Get current user profile
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User profile retrieved successfully
   *       401:
   *         description: Unauthorized
   */
  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.id;

      const user = await this.userService.getUserById(userId);

      const response: ApiResponse = {
        success: true,
        data: { user },
        message: 'Profile retrieved successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
