import { body } from 'express-validator';

export const validateSignUp = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('full_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-ZÀ-ỹ\s]+$/)
    .withMessage('Full name can only contain letters and spaces'),
  
  body('role')
    .isIn(['admin', 'doctor', 'patient'])
    .withMessage('Role must be one of: admin, doctor, patient'),
  
  body('phone_number')
    .optional()
    .matches(/^0\d{9}$/)
    .withMessage('Phone number must be 10 digits starting with 0'),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be one of: male, female, other'),
  
  body('date_of_birth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),
  
  // Doctor-specific validations
  body('specialty')
    .if(body('role').equals('doctor'))
    .notEmpty()
    .withMessage('Specialty is required for doctors'),
  
  body('license_number')
    .if(body('role').equals('doctor'))
    .optional()
    .matches(/^VN-[A-Z]{2}-\d{4}$/)
    .withMessage('License number must follow format: VN-XX-0000'),
  
  body('qualification')
    .if(body('role').equals('doctor'))
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Qualification must be between 2 and 50 characters'),
  
  body('department_id')
    .if(body('role').equals('doctor'))
    .optional()
    .isLength({ min: 1, max: 20 })
    .withMessage('Department ID is invalid')
];

export const validateSignIn = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const validateResetPassword = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

export const validateRefreshToken = [
  body('refresh_token')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isLength({ min: 10 })
    .withMessage('Invalid refresh token format')
];

export const validateChangePassword = [
  body('current_password')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('new_password')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('confirm_password')
    .custom((value, { req }) => {
      if (value !== req.body.new_password) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    })
];

export const validateUpdateProfile = [
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-ZÀ-ỹ\s]+$/)
    .withMessage('Full name can only contain letters and spaces'),
  
  body('phone_number')
    .optional()
    .matches(/^0\d{9}$/)
    .withMessage('Phone number must be 10 digits starting with 0'),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be one of: male, female, other'),
  
  body('date_of_birth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date')
];

export const validateEmail = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

export const validateUserId = [
  body('user_id')
    .isUUID()
    .withMessage('User ID must be a valid UUID')
];

export const validateRole = [
  body('role')
    .isIn(['admin', 'doctor', 'patient'])
    .withMessage('Role must be one of: admin, doctor, patient')
];

// Magic Link validators
export const validateMagicLink = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

// Phone OTP validators
export const validatePhoneOTP = [
  body('phone_number')
    .matches(/^\+84\d{9}$/)
    .withMessage('Phone number must be in format +84xxxxxxxxx (Vietnamese phone number)')
];

export const validateVerifyOTP = [
  body('phone_number')
    .matches(/^\+84\d{9}$/)
    .withMessage('Phone number must be in format +84xxxxxxxxx (Vietnamese phone number)'),

  body('otp_code')
    .matches(/^\d{6}$/)
    .withMessage('OTP code must be exactly 6 digits')
];

// OAuth validators
export const validateOAuthCallback = [
  body('code')
    .notEmpty()
    .withMessage('OAuth authorization code is required'),

  body('state')
    .notEmpty()
    .withMessage('OAuth state parameter is required'),

  body('provider')
    .optional()
    .isIn(['google', 'github', 'facebook', 'apple'])
    .withMessage('Provider must be one of: google, github, facebook, apple')
];
