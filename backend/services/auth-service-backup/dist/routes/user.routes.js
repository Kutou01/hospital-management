"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
const userController = new user_controller_1.UserController();
// Validation rules
const updateUserValidation = [
    (0, express_validator_1.body)('full_name').optional().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
    (0, express_validator_1.body)('phone_number').optional().isMobilePhone('any').withMessage('Valid phone number is required'),
    (0, express_validator_1.body)('is_active').optional().isBoolean().withMessage('is_active must be a boolean')
];
const getUsersValidation = [
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }).withMessage('Offset must be 0 or greater'),
    (0, express_validator_1.query)('role').optional().isIn(['admin', 'doctor', 'patient', 'nurse', 'receptionist']).withMessage('Valid role is required')
];
// All user routes require authentication
router.use(auth_middleware_1.authMiddleware);
// Get current user profile (already handled in auth routes, but keeping for consistency)
router.get('/me', userController.getCurrentUser);
// Admin only routes
router.get('/', permission_middleware_1.canReadUsers, getUsersValidation, validation_middleware_1.validateRequest, userController.getAllUsers);
router.get('/stats', permission_middleware_1.canReadUsers, userController.getUserStats);
router.get('/by-role/:role', permission_middleware_1.canReadUsers, userController.getUsersByRole);
// Get specific user (admin or self)
router.get('/:id', (0, permission_middleware_1.ownerOrAdminMiddleware)(), userController.getUserById);
// Update user (admin or self)
router.put('/:id', (0, permission_middleware_1.ownerOrAdminMiddleware)(), updateUserValidation, validation_middleware_1.validateRequest, userController.updateUser);
// Admin only - user management
router.post('/:id/activate', permission_middleware_1.canWriteUsers, userController.activateUser);
router.post('/:id/deactivate', permission_middleware_1.canWriteUsers, userController.deactivateUser);
router.delete('/:id', permission_middleware_1.canDeleteUsers, userController.deleteUser);
exports.default = router;
