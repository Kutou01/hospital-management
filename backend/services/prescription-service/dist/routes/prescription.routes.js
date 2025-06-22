"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const prescription_controller_1 = require("../controllers/prescription.controller");
const router = (0, express_1.Router)();
const prescriptionController = new prescription_controller_1.PrescriptionController();
// Validation middleware
const validateCreatePrescription = [
    (0, express_validator_1.body)('patient_id').notEmpty().withMessage('Patient ID is required'),
    (0, express_validator_1.body)('doctor_id').notEmpty().withMessage('Doctor ID is required'),
    (0, express_validator_1.body)('prescription_date').isISO8601().withMessage('Valid prescription date is required'),
    (0, express_validator_1.body)('items').isArray({ min: 1 }).withMessage('At least one prescription item is required'),
    (0, express_validator_1.body)('items.*.medication_id').notEmpty().withMessage('Medication ID is required for each item'),
    (0, express_validator_1.body)('items.*.dosage').notEmpty().withMessage('Dosage is required for each item'),
    (0, express_validator_1.body)('items.*.frequency').notEmpty().withMessage('Frequency is required for each item'),
    (0, express_validator_1.body)('items.*.duration').notEmpty().withMessage('Duration is required for each item'),
    (0, express_validator_1.body)('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    (0, express_validator_1.body)('items.*.instructions').notEmpty().withMessage('Instructions are required for each item'),
    (0, express_validator_1.body)('appointment_id').optional().isString(),
    (0, express_validator_1.body)('medical_record_id').optional().isString(),
    (0, express_validator_1.body)('notes').optional().isString()
];
const validateUpdatePrescription = [
    (0, express_validator_1.body)('status').optional().isIn(['pending', 'dispensed', 'cancelled', 'expired']),
    (0, express_validator_1.body)('notes').optional().isString(),
    (0, express_validator_1.body)('pharmacy_notes').optional().isString(),
    (0, express_validator_1.body)('dispensed_by').optional().isString(),
    (0, express_validator_1.body)('dispensed_at').optional().isISO8601()
];
const validateCreateMedication = [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Medication name is required'),
    (0, express_validator_1.body)('category').notEmpty().withMessage('Category is required'),
    (0, express_validator_1.body)('form').notEmpty().withMessage('Form is required'),
    (0, express_validator_1.body)('strength').notEmpty().withMessage('Strength is required'),
    (0, express_validator_1.body)('unit').notEmpty().withMessage('Unit is required'),
    (0, express_validator_1.body)('generic_name').optional().isString(),
    (0, express_validator_1.body)('brand_name').optional().isString(),
    (0, express_validator_1.body)('manufacturer').optional().isString(),
    (0, express_validator_1.body)('description').optional().isString(),
    (0, express_validator_1.body)('contraindications').optional().isString(),
    (0, express_validator_1.body)('side_effects').optional().isString(),
    (0, express_validator_1.body)('storage_conditions').optional().isString(),
    (0, express_validator_1.body)('price_per_unit').optional().isFloat({ min: 0 }),
    (0, express_validator_1.body)('stock_quantity').optional().isInt({ min: 0 }),
    (0, express_validator_1.body)('expiry_date').optional().isISO8601(),
    (0, express_validator_1.body)('requires_prescription').optional().isBoolean(),
    (0, express_validator_1.body)('is_controlled_substance').optional().isBoolean()
];
const validatePrescriptionId = [
    (0, express_validator_1.param)('prescriptionId').notEmpty().withMessage('Prescription ID is required')
];
const validatePatientId = [
    (0, express_validator_1.param)('patientId').notEmpty().withMessage('Patient ID is required')
];
const validateDoctorId = [
    (0, express_validator_1.param)('doctorId').notEmpty().withMessage('Doctor ID is required')
];
const validateSearchQuery = [
    (0, express_validator_1.query)('q').notEmpty().withMessage('Search query is required')
];
const validateDrugInteractionCheck = [
    (0, express_validator_1.body)('medicationIds').isArray({ min: 2 }).withMessage('At least 2 medication IDs are required'),
    (0, express_validator_1.body)('medicationIds.*').notEmpty().withMessage('Each medication ID must be valid')
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
exports.default = router;
//# sourceMappingURL=prescription.routes.js.map