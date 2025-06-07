import axios from 'axios';
import logger from '@hospital/shared/dist/utils/logger';
import { PatientInfo, PatientServiceResponse } from '../types/appointment.types';

export class PatientService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.PATIENT_SERVICE_URL || 'http://patient-service:3003';
  }

  // Get patient information by ID
  async getPatientById(patientId: string): Promise<PatientInfo | null> {
    try {
      const response = await axios.get<PatientServiceResponse>(`${this.baseUrl}/api/patients/${patientId}`, {
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
    } catch (error) {
      logger.error('Error fetching patient information:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        patientId
      });
      return null;
    }
  }

  // Verify patient exists and is active
  async verifyPatientExists(patientId: string): Promise<boolean> {
    try {
      const patient = await this.getPatientById(patientId);
      return patient !== null;
    } catch (error) {
      logger.error('Error verifying patient existence:', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        patientId 
      });
      return false;
    }
  }

  // Get patient's appointment history count
  async getPatientAppointmentCount(patientId: string): Promise<number> {
    try {
      // This would typically call the patient service to get appointment count
      // For now, we'll return 0 as a placeholder
      return 0;
    } catch (error) {
      logger.error('Error fetching patient appointment count:', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        patientId 
      });
      return 0;
    }
  }

  // Check if patient has any active appointments
  async hasActiveAppointments(patientId: string): Promise<boolean> {
    try {
      // This would check if patient has any scheduled/confirmed appointments
      // For now, we'll return false as a placeholder
      return false;
    } catch (error) {
      logger.error('Error checking patient active appointments:', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        patientId 
      });
      return false;
    }
  }
}
