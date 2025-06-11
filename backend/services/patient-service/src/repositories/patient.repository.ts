import { getSupabase } from '../config/database.config';
import logger from '@hospital/shared/dist/utils/logger';
import { 
  Patient, 
  PatientWithProfile, 
  CreatePatientDto, 
  UpdatePatientDto, 
  PatientSearchFilters 
} from '../types/patient.types';

export class PatientRepository {
  private supabase = getSupabase();

  // Generate patient ID
  private generatePatientId(): string {
    const timestamp = Date.now().toString().slice(-6);
    return `PAT${timestamp}`;
  }

  // Calculate age from date of birth
  private calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  // Get all patients with optional filters and pagination
  async getAllPatients(
    filters: PatientSearchFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ patients: PatientWithProfile[]; total: number }> {
    try {
      let query = this.supabase
        .from('patients')
        .select(`
          *,
          profile:profiles!patients_profile_id_fkey (
            id,
            email,
            full_name,
            date_of_birth,
            phone_number,
            role,
            is_active,
            email_verified,
            phone_verified
          )
        `, { count: 'exact' });

      // Apply filters (CLEAN DESIGN: search in profile.full_name)
      if (filters.search) {
        query = query.or(`patient_id.ilike.%${filters.search}%,profile.full_name.ilike.%${filters.search}%`);
      }

      if (filters.gender) {
        query = query.eq('gender', filters.gender);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.blood_type) {
        query = query.eq('blood_type', filters.blood_type);
      }

      if (filters.created_after) {
        query = query.gte('created_at', filters.created_after);
      }

      if (filters.created_before) {
        query = query.lte('created_at', filters.created_before);
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      // Order by patient_id (since full_name is in profiles table)
      query = query.order('patient_id');

      const { data, error, count } = await query;

      if (error) {
        logger.error('Error fetching patients:', error);
        throw new Error(`Failed to fetch patients: ${error.message}`);
      }

      // Filter by age if specified
      let filteredData = data || [];
      if (filters.age_min !== undefined || filters.age_max !== undefined) {
        filteredData = filteredData.filter(patient => {
          const age = this.calculateAge(patient.date_of_birth);
          if (filters.age_min !== undefined && age < filters.age_min) return false;
          if (filters.age_max !== undefined && age > filters.age_max) return false;
          return true;
        });
      }

      return {
        patients: filteredData as PatientWithProfile[],
        total: count || 0
      };
    } catch (error) {
      logger.error('Exception in getAllPatients:', error);
      throw error;
    }
  }

  // Get patient by ID
  async getPatientById(patientId: string): Promise<PatientWithProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('patients')
        .select(`
          *,
          profile:profiles!patients_profile_id_fkey (
            id,
            email,
            full_name,
            date_of_birth,
            phone_number,
            role,
            is_active,
            email_verified,
            phone_verified
          )
        `)
        .eq('patient_id', patientId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Patient not found
        }
        logger.error('Error fetching patient by ID:', error);
        throw new Error(`Failed to fetch patient: ${error.message}`);
      }

      return data as PatientWithProfile;
    } catch (error) {
      logger.error('Exception in getPatientById:', error);
      throw error;
    }
  }

  // Get patient by profile ID
  async getPatientByProfileId(profileId: string): Promise<PatientWithProfile | null> {
    try {
      const { data, error } = await this.supabase
        .from('patients')
        .select(`
          *,
          profile:profiles!patients_profile_id_fkey (
            id,
            email,
            phone_number,
            role,
            is_active,
            email_verified,
            phone_verified
          )
        `)
        .eq('profile_id', profileId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Patient not found
        }
        logger.error('Error fetching patient by profile ID:', error);
        throw new Error(`Failed to fetch patient: ${error.message}`);
      }

      return data as PatientWithProfile;
    } catch (error) {
      logger.error('Exception in getPatientByProfileId:', error);
      throw error;
    }
  }

  // Get patients by doctor ID (through appointments)
  async getPatientsByDoctorId(doctorId: string): Promise<PatientWithProfile[]> {
    try {
      const { data, error } = await this.supabase
        .from('appointments')
        .select(`
          patient_id,
          patients!appointments_patient_id_fkey (
            *,
            profile:profiles!patients_profile_id_fkey (
              id,
              email,
              full_name,
              date_of_birth,
              phone_number,
              role,
              is_active,
              email_verified,
              phone_verified
            )
          )
        `)
        .eq('doctor_id', doctorId);

      if (error) {
        logger.error('Error fetching patients by doctor ID:', error);
        throw new Error(`Failed to fetch patients: ${error.message}`);
      }

      // Extract unique patients
      const uniquePatients = new Map();
      data?.forEach((appointment: any) => {
        if (appointment.patients && appointment.patients.patient_id) {
          uniquePatients.set(appointment.patients.patient_id, appointment.patients);
        }
      });

      return Array.from(uniquePatients.values()) as PatientWithProfile[];
    } catch (error) {
      logger.error('Exception in getPatientsByDoctorId:', error);
      throw error;
    }
  }

  // Create new patient
  async createPatient(patientData: CreatePatientDto): Promise<Patient> {
    try {
      const patientId = this.generatePatientId();
      
      const newPatient = {
        patient_id: patientId,
        ...patientData,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('patients')
        .insert([newPatient])
        .select()
        .single();

      if (error) {
        logger.error('Error creating patient:', error);
        throw new Error(`Failed to create patient: ${error.message}`);
      }

      logger.info('Patient created successfully:', { patientId });
      return data as Patient;
    } catch (error) {
      logger.error('Exception in createPatient:', error);
      throw error;
    }
  }

  // Update patient
  async updatePatient(patientId: string, updateData: UpdatePatientDto): Promise<Patient> {
    try {
      const updatedData = {
        ...updateData,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('patients')
        .update(updatedData)
        .eq('patient_id', patientId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating patient:', error);
        throw new Error(`Failed to update patient: ${error.message}`);
      }

      logger.info('Patient updated successfully:', { patientId });
      return data as Patient;
    } catch (error) {
      logger.error('Exception in updatePatient:', error);
      throw error;
    }
  }

  // Delete patient (soft delete by setting status to inactive)
  async deletePatient(patientId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('patients')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('patient_id', patientId);

      if (error) {
        logger.error('Error deleting patient:', error);
        throw new Error(`Failed to delete patient: ${error.message}`);
      }

      logger.info('Patient deleted successfully:', { patientId });
      return true;
    } catch (error) {
      logger.error('Exception in deletePatient:', error);
      throw error;
    }
  }

  // Check if patient exists
  async patientExists(patientId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('patients')
        .select('patient_id')
        .eq('patient_id', patientId)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error checking patient existence:', error);
        throw new Error(`Failed to check patient existence: ${error.message}`);
      }

      return !!data;
    } catch (error) {
      logger.error('Exception in patientExists:', error);
      throw error;
    }
  }

  // Get patient statistics
  async getPatientStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byGender: { male: number; female: number; other: number };
    byBloodType: Record<string, number>;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('patients')
        .select('status, gender, blood_type');

      if (error) {
        logger.error('Error fetching patient stats:', error);
        throw new Error(`Failed to fetch patient stats: ${error.message}`);
      }

      const stats = {
        total: data?.length || 0,
        active: 0,
        inactive: 0,
        byGender: { male: 0, female: 0, other: 0 },
        byBloodType: {} as Record<string, number>
      };

      data?.forEach(patient => {
        // Count by status
        if (patient.status === 'active') stats.active++;
        else stats.inactive++;

        // Count by gender
        if (patient.gender in stats.byGender) {
          stats.byGender[patient.gender as keyof typeof stats.byGender]++;
        }

        // Count by blood type
        if (patient.blood_type) {
          stats.byBloodType[patient.blood_type] = (stats.byBloodType[patient.blood_type] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      logger.error('Exception in getPatientStats:', error);
      throw error;
    }
  }
}
