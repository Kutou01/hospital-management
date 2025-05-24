"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
const authController = new auth_controller_1.AuthController();
// Validation rules
const loginValidation = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').isLength({ min: 1 }).withMessage('Password is required')
];
const registerValidation = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    (0, express_validator_1.body)('full_name').isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
    (0, express_validator_1.body)('role').isIn(['admin', 'doctor', 'patient', 'nurse', 'receptionist']).withMessage('Valid role is required'),
    (0, express_validator_1.body)('phone_number').optional().isMobilePhone('any').withMessage('Valid phone number is required'),
    // Doctor-specific validation
    (0, express_validator_1.body)('profile_data.specialization')
        .if((0, express_validator_1.body)('role').equals('doctor'))
        .notEmpty()
        .withMessage('Specialization is required for doctors'),
    (0, express_validator_1.body)('profile_data.license_number')
        .if((0, express_validator_1.body)('role').equals('doctor'))
        .notEmpty()
        .withMessage('License number is required for doctors'),
    // Patient-specific validation
    (0, express_validator_1.body)('profile_data.date_of_birth')
        .if((0, express_validator_1.body)('role').equals('patient'))
        .isISO8601()
        .withMessage('Valid date of birth is required for patients'),
    (0, express_validator_1.body)('profile_data.gender')
        .if((0, express_validator_1.body)('role').equals('patient'))
        .isIn(['male', 'female', 'other'])
        .withMessage('Valid gender is required for patients')
];
const changePasswordValidation = [
    (0, express_validator_1.body)('current_password').isLength({ min: 1 }).withMessage('Current password is required'),
    (0, express_validator_1.body)('new_password').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
];
const resetPasswordValidation = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required')
];
const confirmResetValidation = [
    (0, express_validator_1.body)('token').isLength({ min: 1 }).withMessage('Reset token is required'),
    (0, express_validator_1.body)('new_password').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
];
const refreshTokenValidation = [
    (0, express_validator_1.body)('refresh_token').isLength({ min: 1 }).withMessage('Refresh token is required')
];
// Public routes (no authentication required)
router.post('/login', loginValidation, validation_middleware_1.validateRequest, authController.login);
router.post('/register', registerValidation, validation_middleware_1.validateRequest, authController.register);
router.post('/refresh', refreshTokenValidation, validation_middleware_1.validateRequest, authController.refreshToken);
router.post('/reset-password', resetPasswordValidation, validation_middleware_1.validateRequest, authController.resetPassword);
router.post('/reset-password/confirm', confirmResetValidation, validation_middleware_1.validateRequest, authController.confirmPasswordReset);
// Protected routes (authentication required)
router.post('/logout', auth_middleware_1.authMiddleware, authController.logout);
router.post('/change-password', auth_middleware_1.authMiddleware, changePasswordValidation, validation_middleware_1.validateRequest, authController.changePassword);
router.get('/me', auth_middleware_1.authMiddleware, authController.getProfile);
exports.default = router;
