import logger from '@hospital/shared/dist/utils/logger';
import { ApiGatewayClient, createApiGatewayClient, defaultApiGatewayConfig } from '@hospital/shared/dist/clients/api-gateway.client';

interface PatientData {
  patient_id: string;
  full_name: string;
  phone_number?: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
}

interface PatientServiceResponse {
  success: boolean;
  data: PatientData | PatientData[];
}

interface PatientStats {
  total_patients: number;
  unique_patients_this_month: number;
}

export class PatientService {
  private apiGatewayClient: ApiGatewayClient;

  constructor() {
    this.apiGatewayClient = createApiGatewayClient({
      ...defaultApiGatewayConfig,
      serviceName: 'doctor-service',
    });
  }

  // Get patient information by ID
  async getPatientById(patientId: string): Promise<PatientData | null> {
    try {
      logger.info('🔄 Fetching patient via API Gateway', { patientId });

      const response = await this.apiGatewayClient.getPatient(patientId);

      if (response.success && response.data) {
        logger.info('✅ Patient fetched successfully via API Gateway', { patientId });
        return response.data as PatientData;
      }

      logger.warn('⚠️ Patient not found via API Gateway', { patientId });
      return null;
    } catch (error) {
      logger.error('❌ Error fetching patient via API Gateway:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        patientId
      });

      return null;
    }
  }

  // Get multiple patients by IDs
  async getPatientsByIds(patientIds: string[]): Promise<PatientData[]> {
    try {
      const patients: PatientData[] = [];
      
      // Fetch patients in batches to avoid overwhelming the service
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
    } catch (error) {
      logger.error('Error fetching multiple patients:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        patientCount: patientIds.length
      });
      
      return [];
    }
  }

  // Get patient statistics for a doctor (patients who have appointments with this doctor)
  async getDoctorPatientStats(doctorId: string): Promise<PatientStats> {
    try {
      logger.info('🔄 Fetching patient stats via API Gateway', { doctorId });

      const response = await this.apiGatewayClient.getPatientStats(doctorId);

      if (response.success && response.data) {
        logger.info('✅ Patient stats fetched successfully via API Gateway', { doctorId });
        return response.data as PatientStats;
      }

      logger.warn('⚠️ No patient stats found via API Gateway', { doctorId });
      return {
        total_patients: 0,
        unique_patients_this_month: 0
      };
    } catch (error) {
      logger.error('❌ Error fetching patient stats via API Gateway:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        doctorId
      });

      return {
        total_patients: 0,
        unique_patients_this_month: 0
      };
    }
  }

  // Check if Patient Service is available
  async isServiceAvailable(): Promise<boolean> {
    try {
      logger.info('🔄 Checking patient service health via API Gateway');

      const isHealthy = await this.apiGatewayClient.checkServiceHealth('patients');

      if (isHealthy) {
        logger.info('✅ Patient service is healthy via API Gateway');
      } else {
        logger.warn('⚠️ Patient service is not healthy via API Gateway');
      }

      return isHealthy;
    } catch (error) {
      logger.error('❌ Error checking patient service health via API Gateway:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return false;
    }
  }

  // Search patients by name or phone (for appointment display)
  async searchPatients(query: string, limit: number = 10): Promise<PatientData[]> {
    try {
      logger.info('🔄 Searching patients via API Gateway', { query, limit });

      const response = await this.apiGatewayClient.searchPatients(query, limit);

      if (response.success && Array.isArray(response.data)) {
        logger.info('✅ Patients search completed via API Gateway', {
          query,
          resultCount: response.data.length
        });
        return response.data;
      }

      logger.warn('⚠️ No patients found via API Gateway', { query });
      return [];
    } catch (error) {
      logger.error('❌ Error searching patients via API Gateway:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query,
        limit
      });

      return [];
    }
  }

  // Get patient count for a specific doctor (from appointments)
  async getPatientCountForDoctor(doctorId: string): Promise<number> {
    try {
      logger.info('🔄 Fetching patient count via API Gateway', { doctorId });

      // Use the patient stats endpoint which includes patient count
      const stats = await this.getDoctorPatientStats(doctorId);

      logger.info('✅ Patient count fetched via API Gateway', {
        doctorId,
        count: stats.total_patients
      });

      return stats.total_patients;
    } catch (error) {
      logger.error('❌ Error fetching patient count via API Gateway:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        doctorId
      });

      return 0;
    }
  }
}
