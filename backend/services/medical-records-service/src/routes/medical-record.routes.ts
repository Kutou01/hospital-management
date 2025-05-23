import { Router } from 'express';
import { body, param } from 'express-validator';
import { MedicalRecordController } from '../controllers/medical-record.controller';

const router = Router();
const medicalRecordController = new MedicalRecordController();

// Validation middleware
const validateCreateMedicalRecord = [
  body('patient_id').notEmpty().withMessage('Patient ID is required'),
  body('doctor_id').notEmpty().withMessage('Doctor ID is required'),
  body('visit_date').isISO8601().withMessage('Valid visit date is required'),
  body('chief_complaint').optional().isString(),
  body('present_illness').optional().isString(),
  body('past_medical_history').optional().isString(),
  body('physical_examination').optional().isString(),
  body('diagnosis').optional().isString(),
  body('treatment_plan').optional().isString(),
  body('medications').optional().isString(),
  body('follow_up_instructions').optional().isString(),
  body('notes').optional().isString()
];

const validateUpdateMedicalRecord = [
  body('chief_complaint').optional().isString(),
  body('present_illness').optional().isString(),
  body('past_medical_history').optional().isString(),
  body('physical_examination').optional().isString(),
  body('diagnosis').optional().isString(),
  body('treatment_plan').optional().isString(),
  body('medications').optional().isString(),
  body('follow_up_instructions').optional().isString(),
  body('notes').optional().isString(),
  body('status').optional().isIn(['active', 'archived', 'deleted'])
];

const validateCreateLabResult = [
  body('record_id').notEmpty().withMessage('Record ID is required'),
  body('test_name').notEmpty().withMessage('Test name is required'),
  body('test_type').notEmpty().withMessage('Test type is required'),
  body('test_date').isISO8601().withMessage('Valid test date is required'),
  body('result_value').optional().isString(),
  body('reference_range').optional().isString(),
  body('unit').optional().isString(),
  body('result_date').optional().isISO8601(),
  body('lab_technician').optional().isString(),
  body('notes').optional().isString()
];

const validateCreateVitalSigns = [
  body('record_id').notEmpty().withMessage('Record ID is required'),
  body('recorded_at').isISO8601().withMessage('Valid recorded date is required'),
  body('temperature').optional().isNumeric(),
  body('blood_pressure_systolic').optional().isInt({ min: 0, max: 300 }),
  body('blood_pressure_diastolic').optional().isInt({ min: 0, max: 200 }),
  body('heart_rate').optional().isInt({ min: 0, max: 300 }),
  body('respiratory_rate').optional().isInt({ min: 0, max: 100 }),
  body('oxygen_saturation').optional().isFloat({ min: 0, max: 100 }),
  body('weight').optional().isFloat({ min: 0 }),
  body('height').optional().isFloat({ min: 0 }),
  body('notes').optional().isString()
];

const validateRecordId = [
  param('recordId').notEmpty().withMessage('Record ID is required')
];

const validatePatientId = [
  param('patientId').notEmpty().withMessage('Patient ID is required')
];

const validateDoctorId = [
  param('doctorId').notEmpty().withMessage('Doctor ID is required')
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

export default router;
