"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const patient_controller_1 = require("../controllers/patient.controller");
const patient_validators_1 = require("../validators/patient.validators");
const router = express_1.default.Router();
const patientController = new patient_controller_1.PatientController();
router.get('/', patient_validators_1.validatePatientSearch, patientController.getAllPatients.bind(patientController));
router.get('/stats', patientController.getPatientStats.bind(patientController));
router.get('/doctor/:doctorId', patient_validators_1.validateDoctorId, patientController.getPatientsByDoctorId.bind(patientController));
router.get('/profile/:profileId', patient_validators_1.validateProfileId, patientController.getPatientByProfileId.bind(patientController));
router.get('/:patientId', patient_validators_1.validatePatientId, patientController.getPatientById.bind(patientController));
router.post('/', patient_validators_1.validateCreatePatient, patientController.createPatient.bind(patientController));
router.put('/:patientId', patient_validators_1.validateUpdatePatient, patientController.updatePatient.bind(patientController));
router.delete('/:patientId', patient_validators_1.validatePatientId, patientController.deletePatient.bind(patientController));
exports.default = router;
//# sourceMappingURL=patient.routes.js.map