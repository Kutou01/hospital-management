"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const appointment_controller_1 = require("../controllers/appointment.controller");
const appointment_validators_1 = require("../validators/appointment.validators");
const router = express_1.default.Router();
const appointmentController = new appointment_controller_1.AppointmentController();
router.get('/', appointment_validators_1.validateAppointmentSearch, appointmentController.getAllAppointments.bind(appointmentController));
router.get('/stats', appointmentController.getAppointmentStats.bind(appointmentController));
router.get('/available-slots', appointment_validators_1.validateAvailableSlots, appointmentController.getAvailableTimeSlots.bind(appointmentController));
router.get('/doctor/:doctorId', appointment_validators_1.validateDoctorId, appointmentController.getAppointmentsByDoctorId.bind(appointmentController));
router.get('/doctor/:doctorId/upcoming', appointment_validators_1.validateDoctorId, appointmentController.getUpcomingAppointments.bind(appointmentController));
router.get('/patient/:patientId', appointment_validators_1.validatePatientId, appointmentController.getAppointmentsByPatientId.bind(appointmentController));
router.get('/:appointmentId', appointment_validators_1.validateAppointmentId, appointmentController.getAppointmentById.bind(appointmentController));
router.post('/', appointment_validators_1.validateCreateAppointment, appointmentController.createAppointment.bind(appointmentController));
router.put('/:appointmentId', appointment_validators_1.validateUpdateAppointment, appointmentController.updateAppointment.bind(appointmentController));
router.post('/:appointmentId/confirm', appointment_validators_1.validateConfirmAppointment, appointmentController.confirmAppointment.bind(appointmentController));
router.delete('/:appointmentId', appointment_validators_1.validateAppointmentId, appointmentController.cancelAppointment.bind(appointmentController));
exports.default = router;
//# sourceMappingURL=appointment.routes.js.map