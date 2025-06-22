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
        this.baseUrl = process.env.PATIENT_SERVICE_URL || 'http://localhost:3003';
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
                return response.data.data;
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
    async getPatientsByIds(patientIds) {
        try {
            const patients = [];
            const batchSize = 10;
            for (let i = 0; i < patientIds.length; i += batchSize) {
                const batch = patientIds.slice(i, i + batchSize);
                const batchPromises = batch.map(id => this.getPatientById(id));
                const batchResults = await Promise.allSettled(batchPromises);
                batchResults.forEach(result => {
                    if (result.status === 'fulfilled' && result.value) {
                        patients.push(result.value);
                    }
                });
            }
            return patients;
        }
        catch (error) {
            logger_1.default.error('Error fetching multiple patients:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                patientCount: patientIds.length
            });
            return [];
        }
    }
    async getDoctorPatientStats(doctorId) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/api/patients/doctor/${doctorId}/stats`, {
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.success && response.data.data) {
                return response.data.data;
            }
            return {
                total_patients: 0,
                unique_patients_this_month: 0
            };
        }
        catch (error) {
            logger_1.default.error('Error fetching patient stats for doctor:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                doctorId
            });
            return {
                total_patients: 0,
                unique_patients_this_month: 0
            };
        }
    }
    async isServiceAvailable() {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/health`, {
                timeout: 2000
            });
            return response.status === 200;
        }
        catch (error) {
            logger_1.default.warn('Patient Service is not available:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                baseUrl: this.baseUrl
            });
            return false;
        }
    }
    async searchPatients(query, limit = 10) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/api/patients/search`, {
                params: {
                    q: query,
                    limit
                },
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.success && Array.isArray(response.data.data)) {
                return response.data.data;
            }
            return [];
        }
        catch (error) {
            logger_1.default.error('Error searching patients:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                query,
                limit
            });
            return [];
        }
    }
    async getPatientCountForDoctor(doctorId) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/api/patients/count/doctor/${doctorId}`, {
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.success && response.data.data) {
                return response.data.data.count || 0;
            }
            return 0;
        }
        catch (error) {
            logger_1.default.error('Error fetching patient count for doctor:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                doctorId
            });
            return 0;
        }
    }
}
exports.PatientService = PatientService;
//# sourceMappingURL=patient.service.js.map