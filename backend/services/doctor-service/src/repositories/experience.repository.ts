import { SupabaseClient } from '@supabase/supabase-js';
import {
  DoctorExperience,
  CreateExperienceRequest
} from '@hospital/shared/dist/types/doctor.types';
import { getSupabase } from '../config/database.config';
import logger from '@hospital/shared/dist/utils/logger';

export class ExperienceRepository {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = getSupabase();
  }

  async findByDoctorId(doctorId: string): Promise<DoctorExperience[]> {
    try {
      const { data, error } = await this.supabase
        .from('doctor_experiences')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('start_date', { ascending: false });

      if (error) throw error;

      return data?.map(this.mapSupabaseExperienceToExperience) || [];
    } catch (error) {
      logger.error('Error finding experiences by doctor ID', { error, doctorId });
      throw error;
    }
  }

  async findById(experienceId: string): Promise<DoctorExperience | null> {
    try {
      const { data, error } = await this.supabase
        .from('doctor_experiences')
        .select('*')
        .eq('experience_id', experienceId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.mapSupabaseExperienceToExperience(data);
    } catch (error) {
      logger.error('Error finding experience by ID', { error, experienceId });
      throw error;
    }
  }

  async findByType(doctorId: string, experienceType: 'work' | 'education' | 'certification' | 'research'): Promise<DoctorExperience[]> {
    try {
      const { data, error } = await this.supabase
        .from('doctor_experiences')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('experience_type', experienceType)
        .order('start_date', { ascending: false });

      if (error) throw error;

      return data?.map(this.mapSupabaseExperienceToExperience) || [];
    } catch (error) {
      logger.error('Error finding experiences by type', { error, doctorId, experienceType });
      throw error;
    }
  }

  async findCurrent(doctorId: string): Promise<DoctorExperience[]> {
    try {
      const { data, error } = await this.supabase
        .from('doctor_experiences')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('is_current', true)
        .order('start_date', { ascending: false });

      if (error) throw error;

      return data?.map(this.mapSupabaseExperienceToExperience) || [];
    } catch (error) {
      logger.error('Error finding current experiences', { error, doctorId });
      throw error;
    }
  }

  async create(experienceData: CreateExperienceRequest): Promise<DoctorExperience> {
    try {
      // If this is marked as current, update other experiences of same type to not current
      if (experienceData.is_current) {
        await this.updateCurrentStatus(experienceData.doctor_id, experienceData.experience_type, false);
      }

      const { data, error } = await this.supabase
        .from('doctor_experiences')
        .insert([{
          doctor_id: experienceData.doctor_id,
          institution_name: experienceData.institution_name,
          position: experienceData.position,
          start_date: experienceData.start_date.toISOString().split('T')[0],
          end_date: experienceData.end_date?.toISOString().split('T')[0],
          is_current: experienceData.is_current || false,
          description: experienceData.description,
          experience_type: experienceData.experience_type
        }])
        .select()
        .single();

      if (error) throw error;

      return this.mapSupabaseExperienceToExperience(data);
    } catch (error) {
      logger.error('Error creating experience', { error, experienceData });
      throw error;
    }
  }

  async update(experienceId: string, experienceData: Partial<CreateExperienceRequest>): Promise<DoctorExperience | null> {
    try {
      const updateData: any = { ...experienceData };
      
      if (experienceData.start_date) {
        updateData.start_date = experienceData.start_date.toISOString().split('T')[0];
      }
      
      if (experienceData.end_date) {
        updateData.end_date = experienceData.end_date.toISOString().split('T')[0];
      }

      // If marking as current, update other experiences of same type
      if (experienceData.is_current && experienceData.doctor_id && experienceData.experience_type) {
        await this.updateCurrentStatus(experienceData.doctor_id, experienceData.experience_type, false, experienceId);
      }

      const { data, error } = await this.supabase
        .from('doctor_experiences')
        .update(updateData)
        .eq('experience_id', experienceId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.mapSupabaseExperienceToExperience(data);
    } catch (error) {
      logger.error('Error updating experience', { error, experienceId, experienceData });
      throw error;
    }
  }

  async delete(experienceId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('doctor_experiences')
        .delete()
        .eq('experience_id', experienceId);

      if (error) throw error;

      return true;
    } catch (error) {
      logger.error('Error deleting experience', { error, experienceId });
      throw error;
    }
  }

  async getWorkExperience(doctorId: string): Promise<DoctorExperience[]> {
    return this.findByType(doctorId, 'work');
  }

  async getEducation(doctorId: string): Promise<DoctorExperience[]> {
    return this.findByType(doctorId, 'education');
  }

  async getCertifications(doctorId: string): Promise<DoctorExperience[]> {
    return this.findByType(doctorId, 'certification');
  }

  async getResearch(doctorId: string): Promise<DoctorExperience[]> {
    return this.findByType(doctorId, 'research');
  }

  async calculateTotalExperience(doctorId: string): Promise<{
    total_years: number;
    work_years: number;
    education_years: number;
    current_positions: DoctorExperience[];
  }> {
    try {
      const experiences = await this.findByDoctorId(doctorId);
      const currentDate = new Date();

      let totalYears = 0;
      let workYears = 0;
      let educationYears = 0;
      const currentPositions = experiences.filter(exp => exp.is_current);

      experiences.forEach(exp => {
        const startDate = new Date(exp.start_date);
        const endDate = exp.end_date ? new Date(exp.end_date) : currentDate;
        
        const yearsDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        
        if (exp.experience_type === 'work') {
          workYears += yearsDiff;
          totalYears += yearsDiff;
        } else if (exp.experience_type === 'education') {
          educationYears += yearsDiff;
        }
      });

      return {
        total_years: Math.round(totalYears * 10) / 10, // Round to 1 decimal place
        work_years: Math.round(workYears * 10) / 10,
        education_years: Math.round(educationYears * 10) / 10,
        current_positions: currentPositions
      };
    } catch (error) {
      logger.error('Error calculating total experience', { error, doctorId });
      throw error;
    }
  }

  async getExperienceTimeline(doctorId: string): Promise<DoctorExperience[]> {
    try {
      const experiences = await this.findByDoctorId(doctorId);
      
      // Sort by start date (most recent first)
      return experiences.sort((a, b) => {
        const dateA = new Date(a.start_date);
        const dateB = new Date(b.start_date);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      logger.error('Error getting experience timeline', { error, doctorId });
      throw error;
    }
  }

  async searchExperiences(doctorId: string, searchTerm: string): Promise<DoctorExperience[]> {
    try {
      const { data, error } = await this.supabase
        .from('doctor_experiences')
        .select('*')
        .eq('doctor_id', doctorId)
        .or(`institution_name.ilike.%${searchTerm}%,position.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order('start_date', { ascending: false });

      if (error) throw error;

      return data?.map(this.mapSupabaseExperienceToExperience) || [];
    } catch (error) {
      logger.error('Error searching experiences', { error, doctorId, searchTerm });
      throw error;
    }
  }

  async getExperiencesByDateRange(doctorId: string, startDate: Date, endDate: Date): Promise<DoctorExperience[]> {
    try {
      const { data, error } = await this.supabase
        .from('doctor_experiences')
        .select('*')
        .eq('doctor_id', doctorId)
        .gte('start_date', startDate.toISOString().split('T')[0])
        .lte('start_date', endDate.toISOString().split('T')[0])
        .order('start_date', { ascending: false });

      if (error) throw error;

      return data?.map(this.mapSupabaseExperienceToExperience) || [];
    } catch (error) {
      logger.error('Error getting experiences by date range', { error, doctorId, startDate, endDate });
      throw error;
    }
  }

  private async updateCurrentStatus(
    doctorId: string, 
    experienceType: string, 
    isCurrent: boolean, 
    excludeId?: string
  ): Promise<void> {
    try {
      let query = this.supabase
        .from('doctor_experiences')
        .update({ is_current: isCurrent })
        .eq('doctor_id', doctorId)
        .eq('experience_type', experienceType);

      if (excludeId) {
        query = query.neq('experience_id', excludeId);
      }

      const { error } = await query;

      if (error) throw error;
    } catch (error) {
      logger.error('Error updating current status', { error, doctorId, experienceType, isCurrent });
      throw error;
    }
  }

  private mapSupabaseExperienceToExperience(supabaseExperience: any): DoctorExperience {
    return {
      experience_id: supabaseExperience.experience_id,
      doctor_id: supabaseExperience.doctor_id,
      institution_name: supabaseExperience.institution_name,
      position: supabaseExperience.position,
      start_date: new Date(supabaseExperience.start_date),
      end_date: supabaseExperience.end_date ? new Date(supabaseExperience.end_date) : undefined,
      is_current: supabaseExperience.is_current,
      description: supabaseExperience.description,
      experience_type: supabaseExperience.experience_type,
      created_at: new Date(supabaseExperience.created_at),
      updated_at: new Date(supabaseExperience.updated_at)
    };
  }
}
