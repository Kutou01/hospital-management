"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientService = void 0;
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const api_gateway_client_1 = require("@hospital/shared/dist/clients/api-gateway.client");
class PatientService {
    constructor() {
        this.apiGatewayClient = (0, api_gateway_client_1.createApiGatewayClient)({
            ...api_gateway_client_1.defaultApiGatewayConfig,
            serviceName: 'doctor-service',
        });
    }
    async getPatientById(patientId) {
        try {
            logger_1.default.info('🔄 Fetching patient via API Gateway', { patientId });
            const response = await this.apiGatewayClient.getPatient(patientId);
            if (response.success && response.data) {
                logger_1.default.info('✅ Patient fetched successfully via API Gateway', { patientId });
                return response.data;
            }
            logger_1.default.warn('⚠️ Patient not found via API Gateway', { patientId });
            return null;
        }
        catch (error) {
            logger_1.default.error('❌ Error fetching patient via API Gateway:', {
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
            logger_1.default.info('🔄 Fetching patient stats via API Gateway', { doctorId });
            const response = await this.apiGatewayClient.getPatientStats(doctorId);
            if (response.success && response.data) {
                logger_1.default.info('✅ Patient stats fetched successfully via API Gateway', { doctorId });
                return response.data;
            }
            logger_1.default.warn('⚠️ No patient stats found via API Gateway', { doctorId });
            return {
                total_patients: 0,
                unique_patients_this_month: 0
            };
        }
        catch (error) {
            logger_1.default.error('❌ Error fetching patient stats via API Gateway:', {
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
            logger_1.default.info('🔄 Checking patient service health via API Gateway');
            const isHealthy = await this.apiGatewayClient.checkServiceHealth('patients');
            if (isHealthy) {
                logger_1.default.info('✅ Patient service is healthy via API Gateway');
            }
            else {
                logger_1.default.warn('⚠️ Patient service is not healthy via API Gateway');
            }
            return isHealthy;
        }
        catch (error) {
            logger_1.default.error('❌ Error checking patient service health via API Gateway:', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }
    async searchPatients(query, limit = 10) {
        try {
            logger_1.default.info('🔄 Searching patients via API Gateway', { query, limit });
            const response = await this.apiGatewayClient.searchPatients(query, limit);
            if (response.success && Array.isArray(response.data)) {
                logger_1.default.info('✅ Patients search completed via API Gateway', {
                    query,
                    resultCount: response.data.length
                });
                return response.data;
            }
            logger_1.default.warn('⚠️ No patients found via API Gateway', { query });
            return [];
        }
        catch (error) {
            logger_1.default.error('❌ Error searching patients via API Gateway:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                query,
                limit
            });
            return [];
        }
    }
    async getPatientCountForDoctor(doctorId) {
        try {
            logger_1.default.info('🔄 Fetching patient count via API Gateway', { doctorId });
            const stats = await this.getDoctorPatientStats(doctorId);
            logger_1.default.info('✅ Patient count fetched via API Gateway', {
                doctorId,
                count: stats.total_patients
            });
            return stats.total_patients;
        }
        catch (error) {
            logger_1.default.error('❌ Error fetching patient count via API Gateway:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                doctorId
            });
            return 0;
        }
    }
}
exports.PatientService = PatientService;
//# sourceMappingURL=patient.service.js.map