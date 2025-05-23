import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { body } from 'express-validator';

const router = Router();
const authController = new AuthController();

// Validation rules
const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 1 }).withMessage('Password is required')
];

const registerValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('full_name').isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('role').isIn(['admin', 'doctor', 'patient', 'nurse', 'receptionist']).withMessage('Valid role is required'),
  body('phone_number').optional().isMobilePhone('any').withMessage('Valid phone number is required')
];

const changePasswordValidation = [
  body('current_password').isLength({ min: 1 }).withMessage('Current password is required'),
  body('new_password').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
];

const resetPasswordValidation = [
  body('email').isEmail().withMessage('Valid email is required')
];

const confirmResetValidation = [
  body('token').isLength({ min: 1 }).withMessage('Reset token is required'),
  body('new_password').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
];

const refreshTokenValidation = [
  body('refresh_token').isLength({ min: 1 }).withMessage('Refresh token is required')
];

// Public routes (no authentication required)
router.post('/login', loginValidation, validateRequest, authController.login);
router.post('/register', registerValidation, validateRequest, authController.register);
router.post('/refresh', refreshTokenValidation, validateRequest, authController.refreshToken);
router.post('/reset-password', resetPasswordValidation, validateRequest, authController.resetPassword);
router.post('/reset-password/confirm', confirmResetValidation, validateRequest, authController.confirmPasswordReset);

// Protected routes (authentication required)
router.post('/logout', authMiddleware, authController.logout);
router.post('/change-password', authMiddleware, changePasswordValidation, validateRequest, authController.changePassword);
router.get('/me', authMiddleware, authController.getProfile);

export default router;
