import { Request, Response, NextFunction } from 'express';
export declare class AuthController {
    private authService;
    private userService;
    constructor();
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
    login: (req: Request, res: Response, next: NextFunction) => Promise<void>;
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
    register: (req: Request, res: Response, next: NextFunction) => Promise<void>;
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
    refreshToken: (req: Request, res: Response, next: NextFunction) => Promise<void>;
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
    logout: (req: Request, res: Response, next: NextFunction) => Promise<void>;
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
    changePassword: (req: Request, res: Response, next: NextFunction) => Promise<void>;
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
    resetPassword: (req: Request, res: Response, next: NextFunction) => Promise<void>;
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
    confirmPasswordReset: (req: Request, res: Response, next: NextFunction) => Promise<void>;
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
    getProfile: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
