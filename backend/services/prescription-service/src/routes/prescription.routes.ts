import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { PrescriptionController } from '../controllers/prescription.controller';

const router = Router();
const prescriptionController = new PrescriptionController();

// Validation middleware
const validateCreatePrescription = [
  body('patient_id').notEmpty().withMessage('Patient ID is required'),
  body('doctor_id').notEmpty().withMessage('Doctor ID is required'),
  body('prescription_date').isISO8601().withMessage('Valid prescription date is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one prescription item is required'),
  body('items.*.medication_id').notEmpty().withMessage('Medication ID is required for each item'),
  body('items.*.dosage').notEmpty().withMessage('Dosage is required for each item'),
  body('items.*.frequency').notEmpty().withMessage('Frequency is required for each item'),
  body('items.*.duration').notEmpty().withMessage('Duration is required for each item'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('items.*.instructions').notEmpty().withMessage('Instructions are required for each item'),
  body('appointment_id').optional().isString(),
  body('medical_record_id').optional().isString(),
  body('notes').optional().isString()
];

const validateUpdatePrescription = [
  body('status').optional().isIn(['pending', 'dispensed', 'cancelled', 'expired']),
  body('notes').optional().isString(),
  body('pharmacy_notes').optional().isString(),
  body('dispensed_by').optional().isString(),
  body('dispensed_at').optional().isISO8601()
];

const validateCreateMedication = [
  body('name').notEmpty().withMessage('Medication name is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('form').notEmpty().withMessage('Form is required'),
  body('strength').notEmpty().withMessage('Strength is required'),
  body('unit').notEmpty().withMessage('Unit is required'),
  body('generic_name').optional().isString(),
  body('brand_name').optional().isString(),
  body('manufacturer').optional().isString(),
  body('description').optional().isString(),
  body('contraindications').optional().isString(),
  body('side_effects').optional().isString(),
  body('storage_conditions').optional().isString(),
  body('price_per_unit').optional().isFloat({ min: 0 }),
  body('stock_quantity').optional().isInt({ min: 0 }),
  body('expiry_date').optional().isISO8601(),
  body('requires_prescription').optional().isBoolean(),
  body('is_controlled_substance').optional().isBoolean()
];

const validatePrescriptionId = [
  param('prescriptionId').notEmpty().withMessage('Prescription ID is required')
];

const validatePatientId = [
  param('patientId').notEmpty().withMessage('Patient ID is required')
];

const validateDoctorId = [
  param('doctorId').notEmpty().withMessage('Doctor ID is required')
];

const validateSearchQuery = [
  query('q').notEmpty().withMessage('Search query is required')
];

const validateDrugInteractionCheck = [
  body('medicationIds').isArray({ min: 2 }).withMessage('At least 2 medication IDs are required'),
  body('medicationIds.*').notEmpty().withMessage('Each medication ID must be valid')
];

// Prescription routes
/**
 * @swagger
 * /api/prescriptions:
 *   get:
 *     summary: Get all prescriptions
 *     tags: [Prescriptions]
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
 *         description: List of prescriptions
 */
router.get('/', prescriptionController.getAllPrescriptions.bind(prescriptionController));

/**
 * @swagger
 * /api/prescriptions/{prescriptionId}:
 *   get:
 *     summary: Get prescription by ID
 *     tags: [Prescriptions]
 *     parameters:
 *       - in: path
 *         name: prescriptionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Prescription details
 *       404:
 *         description: Prescription not found
 */
router.get('/:prescriptionId', validatePrescriptionId, prescriptionController.getPrescriptionById.bind(prescriptionController));

/**
 * @swagger
 * /api/prescriptions/patient/{patientId}:
 *   get:
 *     summary: Get prescriptions by patient ID
 *     tags: [Prescriptions]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of patient prescriptions
 */
router.get('/patient/:patientId', validatePatientId, prescriptionController.getPrescriptionsByPatientId.bind(prescriptionController));

/**
 * @swagger
 * /api/prescriptions/doctor/{doctorId}:
 *   get:
 *     summary: Get prescriptions by doctor ID
 *     tags: [Prescriptions]
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of doctor prescriptions
 */
router.get('/doctor/:doctorId', validateDoctorId, prescriptionController.getPrescriptionsByDoctorId.bind(prescriptionController));

/**
 * @swagger
 * /api/prescriptions:
 *   post:
 *     summary: Create new prescription
 *     tags: [Prescriptions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePrescriptionRequest'
 *     responses:
 *       201:
 *         description: Prescription created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', validateCreatePrescription, prescriptionController.createPrescription.bind(prescriptionController));

/**
 * @swagger
 * /api/prescriptions/{prescriptionId}:
 *   put:
 *     summary: Update prescription
 *     tags: [Prescriptions]
 *     parameters:
 *       - in: path
 *         name: prescriptionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePrescriptionRequest'
 *     responses:
 *       200:
 *         description: Prescription updated successfully
 *       404:
 *         description: Prescription not found
 */
router.put('/:prescriptionId', validatePrescriptionId, validateUpdatePrescription, prescriptionController.updatePrescription.bind(prescriptionController));

/**
 * @swagger
 * /api/prescriptions/{prescriptionId}:
 *   delete:
 *     summary: Delete prescription
 *     tags: [Prescriptions]
 *     parameters:
 *       - in: path
 *         name: prescriptionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Prescription deleted successfully
 *       404:
 *         description: Prescription not found
 */
router.delete('/:prescriptionId', validatePrescriptionId, prescriptionController.deletePrescription.bind(prescriptionController));

// Medication routes
/**
 * @swagger
 * /api/prescriptions/medications:
 *   get:
 *     summary: Get all medications
 *     tags: [Medications]
 *     responses:
 *       200:
 *         description: List of medications
 */
router.get('/medications', prescriptionController.getAllMedications.bind(prescriptionController));

/**
 * @swagger
 * /api/prescriptions/medications/search:
 *   get:
 *     summary: Search medications
 *     tags: [Medications]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/medications/search', validateSearchQuery, prescriptionController.searchMedications.bind(prescriptionController));

/**
 * @swagger
 * /api/prescriptions/medications:
 *   post:
 *     summary: Create new medication
 *     tags: [Medications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMedicationRequest'
 *     responses:
 *       201:
 *         description: Medication created successfully
 */
router.post('/medications', validateCreateMedication, prescriptionController.createMedication.bind(prescriptionController));

/**
 * @swagger
 * /api/prescriptions/check-interactions:
 *   post:
 *     summary: Check drug interactions
 *     tags: [Prescriptions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               medicationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Drug interaction check results
 */
router.post('/check-interactions', validateDrugInteractionCheck, prescriptionController.checkDrugInteractions.bind(prescriptionController));

export default router;
