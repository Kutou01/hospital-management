import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { 
  canReadPatients,
  canReadDoctors,
  profileAccessMiddleware,
  permissionMiddleware
} from '../middleware/permission.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { body } from 'express-validator';

const router = Router();
const profileController = new ProfileController();

// Validation rules
const updateProfileValidation = [
  body('profile_data').isObject().withMessage('Profile data must be an object')
];

// All profile routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     DoctorProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         user_id:
 *           type: string
 *         specialization:
 *           type: string
 *         license_number:
 *           type: string
 *         department_id:
 *           type: string
 *         experience_years:
 *           type: integer
 *         consultation_fee:
 *           type: number
 *         bio:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, inactive, on_leave]
 *     
 *     PatientProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         user_id:
 *           type: string
 *         date_of_birth:
 *           type: string
 *           format: date
 *         gender:
 *           type: string
 *           enum: [male, female, other]
 *         address:
 *           type: object
 *         emergency_contact:
 *           type: object
 *         insurance_info:
 *           type: object
 *         status:
 *           type: string
 *           enum: [active, inactive]
 */

// Get current user's profile
router.get('/me', profileController.getCurrentUserProfile);

// Update current user's profile
router.put('/me', updateProfileValidation, validateRequest, profileController.updateCurrentUserProfile);

// Get profile by ID (with access control)
router.get('/:profileId', profileAccessMiddleware, profileController.getProfileById);

// Get doctor profiles (requires permission)
router.get('/doctors/list', canReadDoctors, profileController.getDoctorProfiles);

// Get patient profiles (requires permission)
router.get('/patients/list', canReadPatients, profileController.getPatientProfiles);

export default router;
