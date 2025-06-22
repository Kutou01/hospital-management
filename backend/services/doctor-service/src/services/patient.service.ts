import axios from 'axios';
import logger from '@hospital/shared/dist/utils/logger';

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
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.PATIENT_SERVICE_URL || 'http://localhost:3003';
  }

  // Get patient information by ID
  async getPatientById(patientId: string): Promise<PatientData | null> {
    try {
      const response = await axios.get<PatientServiceResponse>(
        `${this.baseUrl}/api/patients/${patientId}`,
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success && response.data.data) {
        return response.data.data as PatientData;
      }

      return null;
    } catch (error) {
      logger.error('Error fetching patient information:', {
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
      const response = await axios.get(
        `${this.baseUrl}/api/patients/doctor/${doctorId}/stats`,
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return {
        total_patients: 0,
        unique_patients_this_month: 0
      };
    } catch (error) {
      logger.error('Error fetching patient stats for doctor:', {
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
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 2000
      });
      
      return response.status === 200;
    } catch (error) {
      logger.warn('Patient Service is not available:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        baseUrl: this.baseUrl
      });
      
      return false;
    }
  }

  // Search patients by name or phone (for appointment display)
  async searchPatients(query: string, limit: number = 10): Promise<PatientData[]> {
    try {
      const response = await axios.get<PatientServiceResponse>(
        `${this.baseUrl}/api/patients/search`,
        {
          params: {
            q: query,
            limit
          },
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }

      return [];
    } catch (error) {
      logger.error('Error searching patients:', {
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
      const response = await axios.get(
        `${this.baseUrl}/api/patients/count/doctor/${doctorId}`,
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success && response.data.data) {
        return response.data.data.count || 0;
      }

      return 0;
    } catch (error) {
      logger.error('Error fetching patient count for doctor:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        doctorId
      });
      
      return 0;
    }
  }
}
