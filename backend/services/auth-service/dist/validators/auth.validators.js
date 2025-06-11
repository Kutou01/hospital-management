"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRole = exports.validateUserId = exports.validateEmail = exports.validateUpdateProfile = exports.validateChangePassword = exports.validateRefreshToken = exports.validateResetPassword = exports.validateSignIn = exports.validateSignUp = void 0;
const express_validator_1 = require("express-validator");
exports.validateSignUp = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    (0, express_validator_1.body)('full_name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters')
        .matches(/^[a-zA-ZÀ-ỹ\s]+$/)
        .withMessage('Full name can only contain letters and spaces'),
    (0, express_validator_1.body)('role')
        .isIn(['admin', 'doctor', 'patient'])
        .withMessage('Role must be one of: admin, doctor, patient'),
    (0, express_validator_1.body)('phone_number')
        .optional()
        .matches(/^0\d{9}$/)
        .withMessage('Phone number must be 10 digits starting with 0'),
    (0, express_validator_1.body)('gender')
        .optional()
        .isIn(['male', 'female', 'other'])
        .withMessage('Gender must be one of: male, female, other'),
    (0, express_validator_1.body)('date_of_birth')
        .optional()
        .isISO8601()
        .withMessage('Date of birth must be a valid date'),
    (0, express_validator_1.body)('specialty')
        .if((0, express_validator_1.body)('role').equals('doctor'))
        .notEmpty()
        .withMessage('Specialty is required for doctors'),
    (0, express_validator_1.body)('license_number')
        .if((0, express_validator_1.body)('role').equals('doctor'))
        .optional()
        .matches(/^VN-[A-Z]{2}-\d{4}$/)
        .withMessage('License number must follow format: VN-XX-0000'),
    (0, express_validator_1.body)('qualification')
        .if((0, express_validator_1.body)('role').equals('doctor'))
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('Qualification must be between 2 and 50 characters'),
    (0, express_validator_1.body)('department_id')
        .if((0, express_validator_1.body)('role').equals('doctor'))
        .optional()
        .isLength({ min: 1, max: 20 })
        .withMessage('Department ID is invalid')
];
exports.validateSignIn = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Password is required')
];
exports.validateResetPassword = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address')
];
exports.validateRefreshToken = [
    (0, express_validator_1.body)('refresh_token')
        .notEmpty()
        .withMessage('Refresh token is required')
        .isLength({ min: 10 })
        .withMessage('Invalid refresh token format')
];
exports.validateChangePassword = [
    (0, express_validator_1.body)('current_password')
        .notEmpty()
        .withMessage('Current password is required'),
    (0, express_validator_1.body)('new_password')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
    (0, express_validator_1.body)('confirm_password')
        .custom((value, { req }) => {
        if (value !== req.body.new_password) {
            throw new Error('Password confirmation does not match new password');
        }
        return true;
    })
];
exports.validateUpdateProfile = [
    (0, express_validator_1.body)('full_name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters')
        .matches(/^[a-zA-ZÀ-ỹ\s]+$/)
        .withMessage('Full name can only contain letters and spaces'),
    (0, express_validator_1.body)('phone_number')
        .optional()
        .matches(/^0\d{9}$/)
        .withMessage('Phone number must be 10 digits starting with 0'),
    (0, express_validator_1.body)('gender')
        .optional()
        .isIn(['male', 'female', 'other'])
        .withMessage('Gender must be one of: male, female, other'),
    (0, express_validator_1.body)('date_of_birth')
        .optional()
        .isISO8601()
        .withMessage('Date of birth must be a valid date')
];
exports.validateEmail = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address')
];
exports.validateUserId = [
    (0, express_validator_1.body)('user_id')
        .isUUID()
        .withMessage('User ID must be a valid UUID')
];
exports.validateRole = [
    (0, express_validator_1.body)('role')
        .isIn(['admin', 'doctor', 'patient'])
        .withMessage('Role must be one of: admin, doctor, patient')
];
//# sourceMappingURL=auth.validators.js.map