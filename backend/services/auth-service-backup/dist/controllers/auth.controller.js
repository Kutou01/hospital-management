"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const user_service_1 = require("../services/user.service");
const logger_1 = __importDefault(require("@hospital/shared/src/utils/logger"));
class AuthController {
    constructor() {
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
        this.login = async (req, res, next) => {
            try {
                const loginData = req.body;
                const clientInfo = {
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    deviceInfo: {
                        platform: req.get('sec-ch-ua-platform'),
                        mobile: req.get('sec-ch-ua-mobile'),
                    },
                };
                const result = await this.authService.login(loginData, clientInfo);
                logger_1.default.info('User logged in successfully', {
                    userId: result.user.id,
                    email: result.user.email,
                    role: result.user.role,
                    ip: clientInfo.ip,
                });
                const response = {
                    success: true,
                    data: result,
                    message: 'Login successful',
                };
                res.status(200).json(response);
            }
            catch (error) {
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
        this.register = async (req, res, next) => {
            try {
                const userData = req.body;
                const user = await this.authService.register(userData);
                logger_1.default.info('User registered successfully', {
                    userId: user.id,
                    email: user.email,
                    role: user.role,
                });
                const response = {
                    success: true,
                    data: { user },
                    message: 'Registration successful',
                };
                res.status(201).json(response);
            }
            catch (error) {
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
        this.refreshToken = async (req, res, next) => {
            try {
                const { refresh_token } = req.body;
                const result = await this.authService.refreshToken(refresh_token);
                const response = {
                    success: true,
                    data: result,
                    message: 'Token refreshed successfully',
                };
                res.status(200).json(response);
            }
            catch (error) {
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
        this.logout = async (req, res, next) => {
            try {
                const token = req.headers.authorization?.replace('Bearer ', '');
                if (token) {
                    await this.authService.logout(token);
                }
                logger_1.default.info('User logged out successfully', {
                    userId: req.user?.id,
                });
                const response = {
                    success: true,
                    message: 'Logout successful',
                };
                res.status(200).json(response);
            }
            catch (error) {
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
        this.changePassword = async (req, res, next) => {
            try {
                const userId = req.user.id;
                const passwordData = req.body;
                await this.authService.changePassword(userId, passwordData);
                logger_1.default.info('Password changed successfully', { userId });
                const response = {
                    success: true,
                    message: 'Password changed successfully',
                };
                res.status(200).json(response);
            }
            catch (error) {
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
        this.resetPassword = async (req, res, next) => {
            try {
                const { email } = req.body;
                await this.authService.requestPasswordReset(email);
                const response = {
                    success: true,
                    message: 'Password reset email sent',
                };
                res.status(200).json(response);
            }
            catch (error) {
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
        this.confirmPasswordReset = async (req, res, next) => {
            try {
                const resetData = req.body;
                await this.authService.confirmPasswordReset(resetData);
                const response = {
                    success: true,
                    message: 'Password reset successful',
                };
                res.status(200).json(response);
            }
            catch (error) {
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
        this.getProfile = async (req, res, next) => {
            try {
                const userId = req.user.id;
                const user = await this.userService.getUserById(userId);
                const response = {
                    success: true,
                    data: { user },
                    message: 'Profile retrieved successfully',
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.authService = new auth_service_1.AuthService();
        this.userService = new user_service_1.UserService();
    }
}
exports.AuthController = AuthController;
