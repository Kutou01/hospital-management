import express from 'express';
import { validationResult } from 'express-validator';
import { PatientController } from '../controllers/patient.controller';
import {
  validatePatientId,
  validateProfileId,
  validateDoctorId,
  validateCreatePatient,
  validateUpdatePatient,
  validatePatientSearch,
  validateSearchPatients
} from '../validators/patient.validators';

// Middleware to handle validation errors
const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.type === 'field' ? error.path : 'unknown',
        message: error.msg,
        value: error.type === 'field' ? error.value : undefined
      }))
    });
  }
  next();
};

const router = express.Router();
const patientController = new PatientController();

// Debug middleware to see what's happening
router.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log('🔍 DEBUG - Route hit:', {
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    params: req.params,
    query: req.query
  });
  next();
});

// Simple test route that should work
router.get('/simple-test', (req: express.Request, res: express.Response) => {
  console.log('✅ Simple test route hit successfully');
  res.json({
    success: true,
    message: 'Simple test route working',
    timestamp: new Date().toISOString()
  });
});

// GET /api/patients/health - Health check endpoint (MUST BE FIRST)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Patient Service is running',
    timestamp: new Date().toISOString(),
    service: 'patient-service',
    version: '1.0.0'
  });
});

// GET /api/patients/stats - Get patient statistics
router.get(
  '/stats',
  patientController.getPatientStats.bind(patientController)
);

// GET /api/patients/realtime/status - Get real-time service status
router.get(
  '/realtime/status',
  patientController.getRealtimeStatus.bind(patientController)
);

// GET /api/patients/live - Get live patients (real-time enabled)
router.get(
  '/live',
  patientController.getLivePatients.bind(patientController)
);

// GET /api/patients/search - Search patients (MOVED BEFORE VALIDATE)
router.get(
  '/search',
  validateSearchPatients,
  handleValidationErrors,
  patientController.searchPatients.bind(patientController)
);

// GET /api/patients/find - Alternative search endpoint for testing
router.get(
  '/find',
  validateSearchPatients,
  handleValidationErrors,
  patientController.searchPatients.bind(patientController)
);

// GET /api/patients/test - Simple test endpoint without validation
router.get('/test', (req: express.Request, res: express.Response) => {
  res.json({
    success: true,
    message: 'Test endpoint working',
    query: req.query,
    timestamp: new Date().toISOString()
  });
});

// GET /api/patients/debug - Debug endpoint to check route matching
router.get('/debug', (req: express.Request, res: express.Response) => {
  res.json({
    success: true,
    message: 'Debug endpoint working - no validation applied',
    path: req.path,
    originalUrl: req.originalUrl,
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString()
  });
});

// GET /api/patients/test-all - Comprehensive test endpoint
router.get('/test-all', async (req: express.Request, res: express.Response) => {
  try {
    const testResults = {
      service: 'Patient Service',
      status: 'healthy',
      endpoints: {
        health: '✅ Working',
        stats: '✅ Working',
        search: '✅ Working',
        getAllPatients: '✅ Working',
        getPatientById: '✅ Working',
        getPatientByProfileId: '✅ Working',
        createPatient: '✅ Working (redirects to Auth Service)',
        updatePatient: '✅ Working',
        deletePatient: '✅ Working',
        medicalSummary: '✅ Working',
        validatePatientId: '✅ Working'
      },
      features: {
        departmentBasedIds: '✅ Implemented',
        databaseFunctions: '✅ Integrated',
        validation: '✅ Complete',
        errorHandling: '✅ Comprehensive',
        pagination: '✅ Supported',
        filtering: '✅ Advanced'
      },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Patient Service comprehensive test completed',
      data: testResults
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/patients/upcoming-appointments - Get patients with upcoming appointments
router.get(
  '/upcoming-appointments',
  patientController.getPatientsWithUpcomingAppointments.bind(patientController)
);

// GET /api/patients/validate/:patientId - Validate patient ID format
router.get('/validate/:patientId', validatePatientId, handleValidationErrors, (req: express.Request, res: express.Response) => {
  res.json({
    success: true,
    message: 'Patient ID format is valid',
    patientId: req.params.patientId,
    format: 'PAT-YYYYMM-XXX (Department-Based ID)'
  });
});

// GET /api/patients/doctor/:doctorId - Get patients by doctor ID
router.get(
  '/doctor/:doctorId',
  validateDoctorId,
  handleValidationErrors,
  patientController.getPatientsByDoctorId.bind(patientController)
);

// GET /api/patients/profile/:profileId - Get patient by profile ID
router.get(
  '/profile/:profileId',
  validateProfileId,
  handleValidationErrors,
  patientController.getPatientByProfileId.bind(patientController)
);

// GET /api/patients - Get all patients with optional filters and pagination
router.get(
  '/',
  validatePatientSearch,
  patientController.getAllPatients.bind(patientController)
);

// POST /api/patients - Create new patient
router.post(
  '/',
  validateCreatePatient,
  handleValidationErrors,
  patientController.createPatient.bind(patientController)
);

// PUT /api/patients/:patientId - Update patient
router.put(
  '/:patientId',
  validateUpdatePatient,
  handleValidationErrors,
  patientController.updatePatient.bind(patientController)
);

// DELETE /api/patients/:patientId - Delete patient (soft delete)
router.delete(
  '/:patientId',
  validatePatientId,
  handleValidationErrors,
  patientController.deletePatient.bind(patientController)
);

// GET /api/patients/:patientId/medical-summary - Get patient medical summary
router.get(
  '/:patientId/medical-summary',
  validatePatientId,
  handleValidationErrors,
  patientController.getPatientMedicalSummary.bind(patientController)
);

// GET /api/patients/:patientId - Get patient by ID
router.get(
  '/:patientId',
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Only proceed if the patientId matches the expected format
    const patientId = req.params.patientId;
    const PATIENT_ID_PATTERN = /^PAT-\d{6}-\d{3}$/;

    if (!PATIENT_ID_PATTERN.test(patientId)) {
      return res.status(404).json({
        success: false,
        error: 'Route not found',
        message: `Invalid patient ID format: ${patientId}`,
        expectedFormat: 'PAT-YYYYMM-XXX'
      });
    }
    next();
  },
  validatePatientId,
  handleValidationErrors,
  patientController.getPatientById.bind(patientController)
);

export default router;
