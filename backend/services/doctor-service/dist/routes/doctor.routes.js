"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const doctor_controller_1 = require("../controllers/doctor.controller");
const router = express_1.default.Router();
const doctorController = new doctor_controller_1.DoctorController();
const validateCreateDoctor = [
    (0, express_validator_1.body)('full_name').notEmpty().withMessage('Full name is required'),
    (0, express_validator_1.body)('specialty').notEmpty().withMessage('Specialty is required'),
    (0, express_validator_1.body)('qualification').notEmpty().withMessage('Qualification is required'),
    (0, express_validator_1.body)('department_id').notEmpty().withMessage('Department ID is required'),
    (0, express_validator_1.body)('license_number').notEmpty().withMessage('License number is required'),
    (0, express_validator_1.body)('gender').isIn(['male', 'female', 'other']).withMessage('Valid gender is required'),
    (0, express_validator_1.body)('phone_number').optional().isMobilePhone('any'),
    (0, express_validator_1.body)('email').optional().isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('working_hours').optional().isObject(),
    (0, express_validator_1.body)('photo_url').optional().isURL()
];
const validateUpdateDoctor = [
    (0, express_validator_1.body)('full_name').optional().notEmpty(),
    (0, express_validator_1.body)('specialty').optional().notEmpty(),
    (0, express_validator_1.body)('qualification').optional().notEmpty(),
    (0, express_validator_1.body)('department_id').optional().notEmpty(),
    (0, express_validator_1.body)('license_number').optional().notEmpty(),
    (0, express_validator_1.body)('gender').optional().isIn(['male', 'female', 'other']),
    (0, express_validator_1.body)('phone_number').optional().isMobilePhone('any'),
    (0, express_validator_1.body)('email').optional().isEmail(),
    (0, express_validator_1.body)('schedule').optional().isObject(),
    (0, express_validator_1.body)('photo_url').optional().isURL(),
    (0, express_validator_1.body)('is_active').optional().isBoolean()
];
const validateDoctorId = [
    (0, express_validator_1.param)('doctorId').notEmpty().withMessage('Doctor ID is required')
];
const validateDepartmentId = [
    (0, express_validator_1.param)('departmentId').notEmpty().withMessage('Department ID is required')
];
const validateSearchQuery = [
    (0, express_validator_1.query)('specialty').optional().isString(),
    (0, express_validator_1.query)('department_id').optional().isString(),
    (0, express_validator_1.query)('gender').optional().isIn(['male', 'female', 'other']),
    (0, express_validator_1.query)('search').optional().isString(),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 })
];
router.get('/', doctorController.getAllDoctors.bind(doctorController));
router.get('/search', validateSearchQuery, doctorController.searchDoctors.bind(doctorController));
router.get('/by-profile/:profileId', doctorController.getDoctorByProfileId.bind(doctorController));
router.get('/:doctorId', validateDoctorId, doctorController.getDoctorById.bind(doctorController));
router.get('/department/:departmentId', validateDepartmentId, doctorController.getDoctorsByDepartment.bind(doctorController));
router.post('/', validateCreateDoctor, doctorController.createDoctor.bind(doctorController));
router.put('/:doctorId', validateDoctorId, validateUpdateDoctor, doctorController.updateDoctor.bind(doctorController));
router.delete('/:doctorId', validateDoctorId, doctorController.deleteDoctor.bind(doctorController));
router.get('/:doctorId/profile', validateDoctorId, doctorController.getDoctorProfile.bind(doctorController));
router.get('/:doctorId/schedule', validateDoctorId, doctorController.getDoctorSchedule.bind(doctorController));
router.get('/:doctorId/schedule/weekly', validateDoctorId, doctorController.getWeeklySchedule.bind(doctorController));
router.put('/:doctorId/schedule', validateDoctorId, doctorController.updateSchedule.bind(doctorController));
router.get('/:doctorId/availability', validateDoctorId, doctorController.getAvailability.bind(doctorController));
router.get('/:doctorId/time-slots', validateDoctorId, doctorController.getAvailableTimeSlots.bind(doctorController));
router.get('/:doctorId/reviews', validateDoctorId, doctorController.getDoctorReviews.bind(doctorController));
router.get('/:doctorId/reviews/stats', validateDoctorId, doctorController.getReviewStats.bind(doctorController));
router.get('/:doctorId/appointments', validateDoctorId, doctorController.getDoctorAppointments.bind(doctorController));
router.get('/:doctorId/stats', validateDoctorId, doctorController.getDoctorStats.bind(doctorController));
exports.default = router;
//# sourceMappingURL=doctor.routes.js.map