import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { body, query } from 'express-validator';

const router = Router();
const userController = new UserController();

// Validation rules
const updateUserValidation = [
  body('full_name').optional().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('phone_number').optional().isMobilePhone('any').withMessage('Valid phone number is required'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean')
];

const getUsersValidation = [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be 0 or greater'),
  query('role').optional().isIn(['admin', 'doctor', 'patient', 'nurse', 'receptionist']).withMessage('Valid role is required')
];

// All user routes require authentication
router.use(authMiddleware);

// Get current user profile (already handled in auth routes, but keeping for consistency)
router.get('/me', userController.getCurrentUser);

// Admin only routes
router.get('/', roleMiddleware(['admin']), getUsersValidation, validateRequest, userController.getAllUsers);
router.get('/stats', roleMiddleware(['admin']), userController.getUserStats);
router.get('/by-role/:role', roleMiddleware(['admin']), userController.getUsersByRole);

// Get specific user (admin or self)
router.get('/:id', userController.getUserById);

// Update user (admin or self)
router.put('/:id', updateUserValidation, validateRequest, userController.updateUser);

// Admin only - user management
router.post('/:id/activate', roleMiddleware(['admin']), userController.activateUser);
router.post('/:id/deactivate', roleMiddleware(['admin']), userController.deactivateUser);
router.delete('/:id', roleMiddleware(['admin']), userController.deleteUser);

export default router;
