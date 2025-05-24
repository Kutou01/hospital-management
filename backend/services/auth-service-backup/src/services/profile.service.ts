import { UserRole } from '@hospital/shared/src/types/common.types';
import { DoctorProfileData, PatientProfileData } from '@hospital/shared/src/types/user.types';
import { supabase } from '../config/database.config';
import logger from '@hospital/shared/src/utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class ProfileService {
  
  /**
   * Create role-specific profile after user registration
   */
  async createRoleProfile(
    userId: string, 
    role: UserRole, 
    profileData: DoctorProfileData | PatientProfileData
  ): Promise<string> {
    try {
      switch (role) {
        case UserRole.DOCTOR:
          return await this.createDoctorProfile(userId, profileData as DoctorProfileData);
        case UserRole.PATIENT:
          return await this.createPatientProfile(userId, profileData as PatientProfileData);
        case UserRole.NURSE:
        case UserRole.RECEPTIONIST:
        case UserRole.ADMIN:
          return await this.createStaffProfile(userId, role);
        default:
          throw new Error(`Unsupported role: ${role}`);
      }
    } catch (error) {
      logger.error('Error creating role profile', { error, userId, role });
      throw error;
    }
  }

  /**
   * Create doctor profile
   */
  private async createDoctorProfile(userId: string, profileData: DoctorProfileData): Promise<string> {
    const doctorId = `DOC${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const doctorRecord = {
      id: doctorId,
      user_id: userId,
      specialization: profileData.specialization,
      license_number: profileData.license_number,
      department_id: profileData.department_id || null,
      experience_years: profileData.experience_years || 0,
      consultation_fee: profileData.consultation_fee || 0,
      bio: profileData.bio || '',
      education: profileData.education || [],
      certifications: profileData.certifications || [],
      languages: profileData.languages || ['English'],
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('doctors')
      .insert([doctorRecord])
      .select()
      .single();

    if (error) {
      logger.error('Error creating doctor profile', { error, userId });
      throw new Error(`Failed to create doctor profile: ${error.message}`);
    }

    // Create doctor availability if provided
    if (profileData.availability && profileData.availability.length > 0) {
      await this.createDoctorAvailability(doctorId, profileData.availability);
    }

    logger.info('Doctor profile created successfully', { doctorId, userId });
    return doctorId;
  }

  /**
   * Create patient profile
   */
  private async createPatientProfile(userId: string, profileData: PatientProfileData): Promise<string> {
    const patientId = `PAT${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const patientRecord = {
      id: patientId,
      user_id: userId,
      date_of_birth: profileData.date_of_birth,
      gender: profileData.gender,
      address: profileData.address || null,
      emergency_contact: profileData.emergency_contact || null,
      insurance_info: profileData.insurance_info || null,
      medical_history: profileData.medical_history || [],
      allergies: profileData.allergies || [],
      current_medications: profileData.current_medications || [],
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('patients')
      .insert([patientRecord])
      .select()
      .single();

    if (error) {
      logger.error('Error creating patient profile', { error, userId });
      throw new Error(`Failed to create patient profile: ${error.message}`);
    }

    logger.info('Patient profile created successfully', { patientId, userId });
    return patientId;
  }

  /**
   * Create staff profile for admin, nurse, receptionist
   */
  private async createStaffProfile(userId: string, role: UserRole): Promise<string> {
    const staffId = `STF${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const staffRecord = {
      id: staffId,
      user_id: userId,
      role: role,
      department_id: null,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('staff')
      .insert([staffRecord])
      .select()
      .single();

    if (error) {
      logger.error('Error creating staff profile', { error, userId, role });
      throw new Error(`Failed to create staff profile: ${error.message}`);
    }

    logger.info('Staff profile created successfully', { staffId, userId, role });
    return staffId;
  }

  /**
   * Create doctor availability schedule
   */
  private async createDoctorAvailability(doctorId: string, availability: any[]): Promise<void> {
    const availabilityRecords = availability.map(slot => ({
      id: uuidv4(),
      doctor_id: doctorId,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_available: slot.is_available,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('doctor_availability')
      .insert(availabilityRecords);

    if (error) {
      logger.error('Error creating doctor availability', { error, doctorId });
      throw new Error(`Failed to create doctor availability: ${error.message}`);
    }

    logger.info('Doctor availability created successfully', { doctorId, slotsCount: availability.length });
  }

  /**
   * Get profile by user ID and role
   */
  async getProfileByUserId(userId: string, role: UserRole): Promise<any> {
    try {
      switch (role) {
        case UserRole.DOCTOR:
          return await this.getDoctorProfile(userId);
        case UserRole.PATIENT:
          return await this.getPatientProfile(userId);
        case UserRole.NURSE:
        case UserRole.RECEPTIONIST:
        case UserRole.ADMIN:
          return await this.getStaffProfile(userId);
        default:
          return null;
      }
    } catch (error) {
      logger.error('Error getting profile', { error, userId, role });
      throw error;
    }
  }

  private async getDoctorProfile(userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('doctors')
      .select(`
        *,
        department:departments(id, name),
        availability:doctor_availability(*)
      `)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  private async getPatientProfile(userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  private async getStaffProfile(userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('staff')
      .select(`
        *,
        department:departments(id, name)
      `)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }
}
