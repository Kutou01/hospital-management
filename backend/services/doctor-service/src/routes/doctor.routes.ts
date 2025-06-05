import express from 'express';
import { body, param, query } from 'express-validator';
import { DoctorController } from '../controllers/doctor.controller';

const router = express.Router();
const doctorController = new DoctorController();

// Validation middleware
const validateCreateDoctor = [
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('specialty').notEmpty().withMessage('Specialty is required'),
  body('qualification').notEmpty().withMessage('Qualification is required'),
  body('department_id').notEmpty().withMessage('Department ID is required'),
  body('license_number').notEmpty().withMessage('License number is required'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Valid gender is required'),
  body('phone_number').optional().isMobilePhone('any'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('working_hours').optional().isObject(),
  body('photo_url').optional().isURL()
];

const validateUpdateDoctor = [
  body('full_name').optional().notEmpty(),
  body('specialty').optional().notEmpty(),
  body('qualification').optional().notEmpty(),
  body('department_id').optional().notEmpty(),
  body('license_number').optional().notEmpty(),
  body('gender').optional().isIn(['male', 'female', 'other']),
  body('phone_number').optional().isMobilePhone('any'),
  body('email').optional().isEmail(),
  body('schedule').optional().isObject(),
  body('photo_url').optional().isURL(),
  body('is_active').optional().isBoolean()
];

const validateDoctorId = [
  param('doctorId').notEmpty().withMessage('Doctor ID is required')
];

const validateDepartmentId = [
  param('departmentId').notEmpty().withMessage('Department ID is required')
];

const validateSearchQuery = [
  query('specialty').optional().isString(),
  query('department_id').optional().isString(),
  query('gender').optional().isIn(['male', 'female', 'other']),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
];

// Routes

/**
 * @swagger
 * /api/doctors:
 *   get:
 *     summary: Get all doctors
 *     tags: [Doctors]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of doctors
 */
router.get('/', doctorController.getAllDoctors.bind(doctorController));

/**
 * @swagger
 * /api/doctors/search:
 *   get:
 *     summary: Search doctors
 *     tags: [Doctors]
 *     parameters:
 *       - in: query
 *         name: specialty
 *         schema:
 *           type: string
 *       - in: query
 *         name: department_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', validateSearchQuery, doctorController.searchDoctors.bind(doctorController));

/**
 * @swagger
 * /api/doctors/{doctorId}:
 *   get:
 *     summary: Get doctor by ID
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor details
 *       404:
 *         description: Doctor not found
 */
router.get('/:doctorId', validateDoctorId, doctorController.getDoctorById.bind(doctorController));

/**
 * @swagger
 * /api/doctors/department/{departmentId}:
 *   get:
 *     summary: Get doctors by department
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of doctors in department
 */
router.get('/department/:departmentId', validateDepartmentId, doctorController.getDoctorsByDepartment.bind(doctorController));

/**
 * @swagger
 * /api/doctors:
 *   post:
 *     summary: Create new doctor
 *     tags: [Doctors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - specialty
 *               - qualification
 *               - department_id
 *               - license_number
 *               - gender
 *             properties:
 *               full_name:
 *                 type: string
 *               specialty:
 *                 type: string
 *               qualification:
 *                 type: string
 *               department_id:
 *                 type: string
 *               license_number:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *     responses:
 *       201:
 *         description: Doctor created successfully
 */
router.post('/', validateCreateDoctor, doctorController.createDoctor.bind(doctorController));

/**
 * @swagger
 * /api/doctors/{doctorId}:
 *   put:
 *     summary: Update doctor
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor updated successfully
 *       404:
 *         description: Doctor not found
 */
router.put('/:doctorId', validateDoctorId, validateUpdateDoctor, doctorController.updateDoctor.bind(doctorController));

/**
 * @swagger
 * /api/doctors/{doctorId}:
 *   delete:
 *     summary: Delete doctor
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor deleted successfully
 *       404:
 *         description: Doctor not found
 */
router.delete('/:doctorId', validateDoctorId, doctorController.deleteDoctor.bind(doctorController));

export default router;
