import express from 'express';
import { PatientController } from '../controllers/patient.controller';
import {
  validatePatientId,
  validateProfileId,
  validateDoctorId,
  validateCreatePatient,
  validateUpdatePatient,
  validatePatientSearch
} from '../validators/patient.validators';

const router = express.Router();
const patientController = new PatientController();

// GET /api/patients - Get all patients with optional filters and pagination
router.get(
  '/',
  validatePatientSearch,
  patientController.getAllPatients.bind(patientController)
);

// GET /api/patients/stats - Get patient statistics
router.get(
  '/stats',
  patientController.getPatientStats.bind(patientController)
);

// GET /api/patients/doctor/:doctorId - Get patients by doctor ID
router.get(
  '/doctor/:doctorId',
  validateDoctorId,
  patientController.getPatientsByDoctorId.bind(patientController)
);

// GET /api/patients/profile/:profileId - Get patient by profile ID
router.get(
  '/profile/:profileId',
  validateProfileId,
  patientController.getPatientByProfileId.bind(patientController)
);

// GET /api/patients/:patientId - Get patient by ID
router.get(
  '/:patientId',
  validatePatientId,
  patientController.getPatientById.bind(patientController)
);

// POST /api/patients - Create new patient
router.post(
  '/',
  validateCreatePatient,
  patientController.createPatient.bind(patientController)
);

// PUT /api/patients/:patientId - Update patient
router.put(
  '/:patientId',
  validateUpdatePatient,
  patientController.updatePatient.bind(patientController)
);

// DELETE /api/patients/:patientId - Delete patient (soft delete)
router.delete(
  '/:patientId',
  validatePatientId,
  patientController.deletePatient.bind(patientController)
);

export default router;
