import { SupabaseClient } from '@supabase/supabase-js';
import { Doctor, CreateDoctorRequest, UpdateDoctorRequest, DoctorSearchQuery } from '@hospital/shared/dist/types/doctor.types';
import { getSupabase } from '../config/database.config';
import logger from '@hospital/shared/dist/utils/logger';

export class DoctorRepository {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = getSupabase();
  }

  async findById(doctorId: string): Promise<Doctor | null> {
    try {
      const { data, error } = await this.supabase
        .from('doctors')
        .select('*')
        .eq('doctor_id', doctorId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.mapSupabaseDoctorToDoctor(data);
    } catch (error) {
      logger.error('Error finding doctor by ID', { error, doctorId });
      throw error;
    }
  }

  async findByProfileId(profileId: string): Promise<Doctor | null> {
    try {
      const { data, error } = await this.supabase
        .from('doctors')
        .select('*')
        .eq('profile_id', profileId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.mapSupabaseDoctorToDoctor(data);
    } catch (error) {
      logger.error('Error finding doctor by profile ID', { error, profileId });
      throw error;
    }
  }

  async findByEmail(email: string): Promise<Doctor | null> {
    try {
      const { data, error } = await this.supabase
        .from('doctors')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.mapSupabaseDoctorToDoctor(data);
    } catch (error) {
      logger.error('Error finding doctor by email', { error, email });
      throw error;
    }
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<Doctor[]> {
    try {
      const { data, error } = await this.supabase
        .from('doctors')
        .select('*')
        .order('full_name', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data.map(doctor => this.mapSupabaseDoctorToDoctor(doctor));
    } catch (error) {
      logger.error('Error finding all doctors', { error, limit, offset });
      throw error;
    }
  }

  async findByDepartment(departmentId: string, limit: number = 50, offset: number = 0): Promise<Doctor[]> {
    try {
      const { data, error } = await this.supabase
        .from('doctors')
        .select('*')
        .eq('department_id', departmentId)
        .order('full_name', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data.map(doctor => this.mapSupabaseDoctorToDoctor(doctor));
    } catch (error) {
      logger.error('Error finding doctors by department', { error, departmentId, limit, offset });
      throw error;
    }
  }

  async findBySpecialty(specialty: string, limit: number = 50, offset: number = 0): Promise<Doctor[]> {
    try {
      const { data, error } = await this.supabase
        .from('doctors')
        .select('*')
        .eq('specialty', specialty)
        .order('full_name', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data.map(doctor => this.mapSupabaseDoctorToDoctor(doctor));
    } catch (error) {
      logger.error('Error finding doctors by specialty', { error, specialty, limit, offset });
      throw error;
    }
  }

  async search(query: DoctorSearchQuery, limit: number = 50, offset: number = 0): Promise<Doctor[]> {
    try {
      let supabaseQuery = this.supabase
        .from('doctors')
        .select('*');

      // Apply filters
      if (query.specialty) {
        supabaseQuery = supabaseQuery.eq('specialty', query.specialty);
      }

      if (query.department_id) {
        supabaseQuery = supabaseQuery.eq('department_id', query.department_id);
      }

      if (query.gender) {
        supabaseQuery = supabaseQuery.eq('gender', query.gender);
      }

      if (query.search) {
        supabaseQuery = supabaseQuery.or(`full_name.ilike.%${query.search}%,specialty.ilike.%${query.search}%`);
      }

      const { data, error } = await supabaseQuery
        .order('full_name', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data.map(doctor => this.mapSupabaseDoctorToDoctor(doctor));
    } catch (error) {
      logger.error('Error searching doctors', { error, query, limit, offset });
      throw error;
    }
  }

  async create(doctorData: CreateDoctorRequest): Promise<Doctor> {
    try {
      // Generate doctor ID
      const doctorId = await this.generateDoctorId();
      
      const supabaseDoctor = {
        doctor_id: doctorId,
        // ✅ UPDATED: Only use columns that exist in current database schema
        specialty: doctorData.specialty,
        qualification: doctorData.qualification,
        department_id: doctorData.department_id,
        license_number: doctorData.license_number,
        gender: doctorData.gender,
        bio: doctorData.bio || null,
        experience_years: doctorData.experience_years || 0,
        consultation_fee: doctorData.consultation_fee || null,
        address: doctorData.address || {},
        languages_spoken: doctorData.languages_spoken || ['Vietnamese'],
        availability_status: 'available',
        rating: 0.00,
        total_reviews: 0
      };

      const { data, error } = await this.supabase
        .from('doctors')
        .insert([supabaseDoctor])
        .select()
        .single();

      if (error) throw error;

      return this.mapSupabaseDoctorToDoctor(data);
    } catch (error) {
      logger.error('Error creating doctor', { error, doctorData });
      throw error;
    }
  }

  async update(doctorId: string, doctorData: UpdateDoctorRequest): Promise<Doctor | null> {
    try {
      // First update the doctor record
      const { data, error } = await this.supabase
        .from('doctors')
        .update(doctorData)
        .eq('doctor_id', doctorId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      // If phone_number, email, or full_name is being updated, also update the profile
      if (doctorData.phone_number || doctorData.email || doctorData.full_name) {
        const profileUpdateData: any = {};

        if (doctorData.phone_number) profileUpdateData.phone_number = doctorData.phone_number;
        if (doctorData.email) profileUpdateData.email = doctorData.email;
        if (doctorData.full_name) profileUpdateData.full_name = doctorData.full_name;

        if (Object.keys(profileUpdateData).length > 0) {
          profileUpdateData.updated_at = new Date().toISOString();

          const { error: profileError } = await this.supabase
            .from('profiles')
            .update(profileUpdateData)
            .eq('id', data.profile_id);

          if (profileError) {
            logger.warn('Failed to update profile during doctor update', {
              error: profileError,
              doctorId,
              profileId: data.profile_id
            });
            // Don't throw error, just log warning as doctor update succeeded
          } else {
            logger.info('Successfully synced doctor update to profile', {
              doctorId,
              profileId: data.profile_id,
              updatedFields: Object.keys(profileUpdateData)
            });
          }
        }
      }

      return this.mapSupabaseDoctorToDoctor(data);
    } catch (error) {
      logger.error('Error updating doctor', { error, doctorId, doctorData });
      throw error;
    }
  }

  async delete(doctorId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('doctors')
        .delete()
        .eq('doctor_id', doctorId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Error deleting doctor', { error, doctorId });
      throw error;
    }
  }

  async count(): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('doctors')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error('Error counting doctors', { error });
      throw error;
    }
  }

  async countByDepartment(departmentId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('doctors')
        .select('*', { count: 'exact', head: true })
        .eq('department_id', departmentId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error('Error counting doctors by department', { error, departmentId });
      throw error;
    }
  }

  private async generateDoctorId(): Promise<string> {
    // Get the current count to generate next ID
    const count = await this.count();
    const nextId = (count + 1).toString().padStart(6, '0');
    return `DOC${nextId}`;
  }

  private mapSupabaseDoctorToDoctor(supabaseDoctor: any): Doctor {
    return {
      id: supabaseDoctor.doctor_id,
      doctor_id: supabaseDoctor.doctor_id,
      profile_id: supabaseDoctor.profile_id,
      specialty: supabaseDoctor.specialty,
      qualification: supabaseDoctor.qualification,
      department_id: supabaseDoctor.department_id,
      license_number: supabaseDoctor.license_number,
      gender: supabaseDoctor.gender,
      bio: supabaseDoctor.bio,
      experience_years: supabaseDoctor.experience_years || 0,
      consultation_fee: supabaseDoctor.consultation_fee,
      address: supabaseDoctor.address || {},
      languages_spoken: supabaseDoctor.languages_spoken || ['Vietnamese'],
      availability_status: supabaseDoctor.availability_status || 'available',
      rating: supabaseDoctor.rating || 0.00,
      total_reviews: supabaseDoctor.total_reviews || 0,
      created_at: new Date(supabaseDoctor.created_at),
      updated_at: new Date(supabaseDoctor.updated_at)
    };
  }
}
