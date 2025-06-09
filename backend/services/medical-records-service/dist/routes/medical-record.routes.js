"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const medical_record_controller_1 = require("../controllers/medical-record.controller");
const router = (0, express_1.Router)();
const medicalRecordController = new medical_record_controller_1.MedicalRecordController();
// Validation middleware
const validateCreateMedicalRecord = [
    (0, express_validator_1.body)('patient_id').notEmpty().withMessage('Patient ID is required'),
    (0, express_validator_1.body)('doctor_id').notEmpty().withMessage('Doctor ID is required'),
    (0, express_validator_1.body)('visit_date').isISO8601().withMessage('Valid visit date is required'),
    (0, express_validator_1.body)('chief_complaint').optional().isString(),
    (0, express_validator_1.body)('present_illness').optional().isString(),
    (0, express_validator_1.body)('past_medical_history').optional().isString(),
    (0, express_validator_1.body)('physical_examination').optional().isString(),
    (0, express_validator_1.body)('diagnosis').optional().isString(),
    (0, express_validator_1.body)('treatment_plan').optional().isString(),
    (0, express_validator_1.body)('medications').optional().isString(),
    (0, express_validator_1.body)('follow_up_instructions').optional().isString(),
    (0, express_validator_1.body)('notes').optional().isString()
];
const validateUpdateMedicalRecord = [
    (0, express_validator_1.body)('chief_complaint').optional().isString(),
    (0, express_validator_1.body)('present_illness').optional().isString(),
    (0, express_validator_1.body)('past_medical_history').optional().isString(),
    (0, express_validator_1.body)('physical_examination').optional().isString(),
    (0, express_validator_1.body)('diagnosis').optional().isString(),
    (0, express_validator_1.body)('treatment_plan').optional().isString(),
    (0, express_validator_1.body)('medications').optional().isString(),
    (0, express_validator_1.body)('follow_up_instructions').optional().isString(),
    (0, express_validator_1.body)('notes').optional().isString(),
    (0, express_validator_1.body)('status').optional().isIn(['active', 'archived', 'deleted'])
];
const validateCreateLabResult = [
    (0, express_validator_1.body)('record_id').notEmpty().withMessage('Record ID is required'),
    (0, express_validator_1.body)('test_name').notEmpty().withMessage('Test name is required'),
    (0, express_validator_1.body)('test_type').notEmpty().withMessage('Test type is required'),
    (0, express_validator_1.body)('test_date').isISO8601().withMessage('Valid test date is required'),
    (0, express_validator_1.body)('result_value').optional().isString(),
    (0, express_validator_1.body)('reference_range').optional().isString(),
    (0, express_validator_1.body)('unit').optional().isString(),
    (0, express_validator_1.body)('result_date').optional().isISO8601(),
    (0, express_validator_1.body)('lab_technician').optional().isString(),
    (0, express_validator_1.body)('notes').optional().isString()
];
const validateCreateVitalSigns = [
    (0, express_validator_1.body)('record_id').notEmpty().withMessage('Record ID is required'),
    (0, express_validator_1.body)('recorded_at').isISO8601().withMessage('Valid recorded date is required'),
    (0, express_validator_1.body)('temperature').optional().isNumeric(),
    (0, express_validator_1.body)('blood_pressure_systolic').optional().isInt({ min: 0, max: 300 }),
    (0, express_validator_1.body)('blood_pressure_diastolic').optional().isInt({ min: 0, max: 200 }),
    (0, express_validator_1.body)('heart_rate').optional().isInt({ min: 0, max: 300 }),
    (0, express_validator_1.body)('respiratory_rate').optional().isInt({ min: 0, max: 100 }),
    (0, express_validator_1.body)('oxygen_saturation').optional().isFloat({ min: 0, max: 100 }),
    (0, express_validator_1.body)('weight').optional().isFloat({ min: 0 }),
    (0, express_validator_1.body)('height').optional().isFloat({ min: 0 }),
    (0, express_validator_1.body)('notes').optional().isString()
];
const validateRecordId = [
    (0, express_validator_1.param)('recordId').notEmpty().withMessage('Record ID is required')
];
const validatePatientId = [
    (0, express_validator_1.param)('patientId').notEmpty().withMessage('Patient ID is required')
];
const validateDoctorId = [
    (0, express_validator_1.param)('doctorId').notEmpty().withMessage('Doctor ID is required')
];
// Medical Records routes
router.get('/', medicalRecordController.getAllMedicalRecords.bind(medicalRecordController));
router.get('/:recordId', validateRecordId, medicalRecordController.getMedicalRecordById.bind(medicalRecordController));
router.get('/patient/:patientId', validatePatientId, medicalRecordController.getMedicalRecordsByPatientId.bind(medicalRecordController));
router.get('/doctor/:doctorId', validateDoctorId, medicalRecordController.getMedicalRecordsByDoctorId.bind(medicalRecordController));
router.post('/', validateCreateMedicalRecord, medicalRecordController.createMedicalRecord.bind(medicalRecordController));
router.put('/:recordId', validateRecordId, validateUpdateMedicalRecord, medicalRecordController.updateMedicalRecord.bind(medicalRecordController));
router.delete('/:recordId', validateRecordId, medicalRecordController.deleteMedicalRecord.bind(medicalRecordController));
// Lab Results routes
router.post('/lab-results', validateCreateLabResult, medicalRecordController.createLabResult.bind(medicalRecordController));
router.get('/:recordId/lab-results', validateRecordId, medicalRecordController.getLabResultsByRecordId.bind(medicalRecordController));
// Vital Signs routes
router.post('/vital-signs', validateCreateVitalSigns, medicalRecordController.createVitalSigns.bind(medicalRecordController));
router.get('/:recordId/vital-signs', validateRecordId, medicalRecordController.getVitalSignsByRecordId.bind(medicalRecordController));
exports.default = router;
//# sourceMappingURL=medical-record.routes.js.map