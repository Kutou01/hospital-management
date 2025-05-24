"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profile_controller_1 = require("../controllers/profile.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
const profileController = new profile_controller_1.ProfileController();
// Validation rules
const updateProfileValidation = [
    (0, express_validator_1.body)('profile_data').isObject().withMessage('Profile data must be an object')
];
// All profile routes require authentication
router.use(auth_middleware_1.authMiddleware);
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
router.put('/me', updateProfileValidation, validation_middleware_1.validateRequest, profileController.updateCurrentUserProfile);
// Get profile by ID (with access control)
router.get('/:profileId', permission_middleware_1.profileAccessMiddleware, profileController.getProfileById);
// Get doctor profiles (requires permission)
router.get('/doctors/list', permission_middleware_1.canReadDoctors, profileController.getDoctorProfiles);
// Get patient profiles (requires permission)
router.get('/patients/list', permission_middleware_1.canReadPatients, profileController.getPatientProfiles);
exports.default = router;
