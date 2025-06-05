import { SupabaseClient } from '@supabase/supabase-js';
import { Doctor, CreateDoctorRequest, UpdateDoctorRequest, DoctorSearchQuery } from '@hospital/shared/src/types/doctor.types';
import { getSupabase } from '../config/database.config';
import logger from '@hospital/shared/src/utils/logger';

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
        full_name: doctorData.full_name,
        specialty: doctorData.specialty,
        qualification: doctorData.qualification,
        working_hours: doctorData.working_hours,
        department_id: doctorData.department_id,
        license_number: doctorData.license_number,
        gender: doctorData.gender,
        photo_url: doctorData.photo_url,
        phone_number: doctorData.phone_number,
        email: doctorData.email
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
      full_name: supabaseDoctor.full_name,
      specialty: supabaseDoctor.specialty,
      qualification: supabaseDoctor.qualification,
      schedule: supabaseDoctor.schedule,
      department_id: supabaseDoctor.department_id,
      license_number: supabaseDoctor.license_number,
      gender: supabaseDoctor.gender,
      photo_url: supabaseDoctor.photo_url,
      phone_number: supabaseDoctor.phone_number,
      email: supabaseDoctor.email,
      user_id: supabaseDoctor.user_id,
      created_at: new Date(),
      updated_at: new Date()
    };
  }
}
