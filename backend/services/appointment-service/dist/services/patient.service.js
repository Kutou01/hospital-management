"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
class PatientService {
    constructor() {
        this.baseUrl = process.env.PATIENT_SERVICE_URL || 'http://patient-service:3003';
    }
    async getPatientById(patientId) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/api/patients/${patientId}`, {
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.success && response.data.data) {
                const patient = response.data.data;
                return {
                    patient_id: patient.patient_id,
                    full_name: patient.full_name,
                    phone_number: patient.profile?.phone_number,
                    email: patient.profile?.email,
                    date_of_birth: patient.date_of_birth,
                    gender: patient.gender
                };
            }
            return null;
        }
        catch (error) {
            logger_1.default.error('Error fetching patient information:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                patientId
            });
            return null;
        }
    }
    async verifyPatientExists(patientId) {
        try {
            const patient = await this.getPatientById(patientId);
            return patient !== null;
        }
        catch (error) {
            logger_1.default.error('Error verifying patient existence:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                patientId
            });
            return false;
        }
    }
    async getPatientAppointmentCount(patientId) {
        try {
            return 0;
        }
        catch (error) {
            logger_1.default.error('Error fetching patient appointment count:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                patientId
            });
            return 0;
        }
    }
    async hasActiveAppointments(patientId) {
        try {
            return false;
        }
        catch (error) {
            logger_1.default.error('Error checking patient active appointments:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                patientId
            });
            return false;
        }
    }
}
exports.PatientService = PatientService;
//# sourceMappingURL=patient.service.js.map