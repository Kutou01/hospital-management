import { SupabaseClient } from '@supabase/supabase-js';
import {
  DoctorReview,
  CreateReviewRequest,
  ReviewStats
} from '@hospital/shared/dist/types/doctor.types';
import { getSupabase } from '../config/database.config';
import logger from '@hospital/shared/dist/utils/logger';

export class ReviewRepository {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = getSupabase();
  }

  async findByDoctorId(doctorId: string, limit: number = 50, offset: number = 0): Promise<DoctorReview[]> {
    try {
      const { data, error } = await this.supabase
        .from('doctor_reviews')
        .select(`
          *,
          patients:patient_id (
            patient_id,
            profiles:profile_id (
              full_name,
              phone_number
            )
          )
        `)
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data?.map(this.mapSupabaseReviewToReview) || [];
    } catch (error) {
      logger.error('Error finding reviews by doctor ID', { error, doctorId });
      throw error;
    }
  }

  async findByPatientId(patientId: string, limit: number = 50, offset: number = 0): Promise<DoctorReview[]> {
    try {
      const { data, error } = await this.supabase
        .from('doctor_reviews')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data?.map(this.mapSupabaseReviewToReview) || [];
    } catch (error) {
      logger.error('Error finding reviews by patient ID', { error, patientId });
      throw error;
    }
  }

  async findById(reviewId: string): Promise<DoctorReview | null> {
    try {
      const { data, error } = await this.supabase
        .from('doctor_reviews')
        .select('*')
        .eq('review_id', reviewId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.mapSupabaseReviewToReview(data);
    } catch (error) {
      logger.error('Error finding review by ID', { error, reviewId });
      throw error;
    }
  }

  async create(reviewData: CreateReviewRequest): Promise<DoctorReview> {
    try {
      // Check if patient already reviewed this doctor for this appointment
      if (reviewData.appointment_id) {
        const existingReview = await this.findByAppointment(reviewData.appointment_id);
        if (existingReview) {
          throw new Error('Review already exists for this appointment');
        }
      }

      const { data, error } = await this.supabase
        .from('doctor_reviews')
        .insert([{
          doctor_id: reviewData.doctor_id,
          patient_id: reviewData.patient_id,
          appointment_id: reviewData.appointment_id,
          rating: reviewData.rating,
          review_text: reviewData.review_text,
          is_anonymous: reviewData.is_anonymous || false,
          is_verified: reviewData.appointment_id ? true : false, // Verified if linked to appointment
          helpful_count: 0
        }])
        .select()
        .single();

      if (error) throw error;

      return this.mapSupabaseReviewToReview(data);
    } catch (error) {
      logger.error('Error creating review', { error, reviewData });
      throw error;
    }
  }

  async update(reviewId: string, updateData: Partial<CreateReviewRequest>): Promise<DoctorReview | null> {
    try {
      const { data, error } = await this.supabase
        .from('doctor_reviews')
        .update(updateData)
        .eq('review_id', reviewId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.mapSupabaseReviewToReview(data);
    } catch (error) {
      logger.error('Error updating review', { error, reviewId, updateData });
      throw error;
    }
  }

  async delete(reviewId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('doctor_reviews')
        .delete()
        .eq('review_id', reviewId);

      if (error) throw error;

      return true;
    } catch (error) {
      logger.error('Error deleting review', { error, reviewId });
      throw error;
    }
  }

  async findByAppointment(appointmentId: string): Promise<DoctorReview | null> {
    try {
      const { data, error } = await this.supabase
        .from('doctor_reviews')
        .select('*')
        .eq('appointment_id', appointmentId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.mapSupabaseReviewToReview(data);
    } catch (error) {
      logger.error('Error finding review by appointment', { error, appointmentId });
      throw error;
    }
  }

  async getReviewStats(doctorId: string): Promise<ReviewStats> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_doctor_review_stats', {
          doctor_id_param: doctorId
        });

      if (error) throw error;

      const stats = data[0] || {
        total_reviews: 0,
        average_rating: 0,
        five_star: 0,
        four_star: 0,
        three_star: 0,
        two_star: 0,
        one_star: 0
      };

      // Get recent reviews
      const recentReviews = await this.findByDoctorId(doctorId, 5, 0);

      return {
        total_reviews: Number(stats.total_reviews),
        average_rating: Number(stats.average_rating),
        rating_distribution: {
          five_star: Number(stats.five_star),
          four_star: Number(stats.four_star),
          three_star: Number(stats.three_star),
          two_star: Number(stats.two_star),
          one_star: Number(stats.one_star)
        },
        recent_reviews: recentReviews
      };
    } catch (error) {
      logger.error('Error getting review stats', { error, doctorId });
      throw error;
    }
  }

  async incrementHelpfulCount(reviewId: string): Promise<DoctorReview | null> {
    try {
      // First get the current helpful_count
      const { data: currentData, error: fetchError } = await this.supabase
        .from('doctor_reviews')
        .select('helpful_count')
        .eq('review_id', reviewId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') return null;
        throw fetchError;
      }

      // Then update with incremented value
      const newHelpfulCount = (currentData.helpful_count || 0) + 1;

      const { data, error } = await this.supabase
        .from('doctor_reviews')
        .update({
          helpful_count: newHelpfulCount
        })
        .eq('review_id', reviewId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.mapSupabaseReviewToReview(data);
    } catch (error) {
      logger.error('Error incrementing helpful count', { error, reviewId });
      throw error;
    }
  }

  async getTopRatedDoctors(limit: number = 10): Promise<Array<{doctor_id: string, average_rating: number, total_reviews: number}>> {
    try {
      const { data, error } = await this.supabase
        .from('doctor_reviews')
        .select('doctor_id, rating')
        .order('rating', { ascending: false });

      if (error) throw error;

      // Group by doctor and calculate averages
      const doctorStats = new Map<string, {total: number, sum: number}>();
      
      data?.forEach(review => {
        const current = doctorStats.get(review.doctor_id) || {total: 0, sum: 0};
        current.total += 1;
        current.sum += review.rating;
        doctorStats.set(review.doctor_id, current);
      });

      // Convert to array and sort by average rating
      const topDoctors = Array.from(doctorStats.entries())
        .map(([doctor_id, stats]) => ({
          doctor_id,
          average_rating: Number((stats.sum / stats.total).toFixed(2)),
          total_reviews: stats.total
        }))
        .filter(doctor => doctor.total_reviews >= 3) // Minimum 3 reviews
        .sort((a, b) => b.average_rating - a.average_rating)
        .slice(0, limit);

      return topDoctors;
    } catch (error) {
      logger.error('Error getting top rated doctors', { error });
      throw error;
    }
  }

  async getReviewsByRating(doctorId: string, rating: number, limit: number = 20): Promise<DoctorReview[]> {
    try {
      const { data, error } = await this.supabase
        .from('doctor_reviews')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('rating', rating)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data?.map(this.mapSupabaseReviewToReview) || [];
    } catch (error) {
      logger.error('Error getting reviews by rating', { error, doctorId, rating });
      throw error;
    }
  }

  async searchReviews(doctorId: string, searchTerm: string, limit: number = 20): Promise<DoctorReview[]> {
    try {
      const { data, error } = await this.supabase
        .from('doctor_reviews')
        .select('*')
        .eq('doctor_id', doctorId)
        .ilike('review_text', `%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data?.map(this.mapSupabaseReviewToReview) || [];
    } catch (error) {
      logger.error('Error searching reviews', { error, doctorId, searchTerm });
      throw error;
    }
  }

  async getVerifiedReviews(doctorId: string, limit: number = 20): Promise<DoctorReview[]> {
    try {
      const { data, error } = await this.supabase
        .from('doctor_reviews')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('is_verified', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data?.map(this.mapSupabaseReviewToReview) || [];
    } catch (error) {
      logger.error('Error getting verified reviews', { error, doctorId });
      throw error;
    }
  }

  private mapSupabaseReviewToReview(supabaseReview: any): DoctorReview {
    return {
      review_id: supabaseReview.review_id,
      doctor_id: supabaseReview.doctor_id,
      patient_id: supabaseReview.patient_id,
      appointment_id: supabaseReview.appointment_id,
      rating: supabaseReview.rating,
      review_text: supabaseReview.review_text,
      review_date: new Date(supabaseReview.review_date),
      is_anonymous: supabaseReview.is_anonymous,
      is_verified: supabaseReview.is_verified,
      helpful_count: supabaseReview.helpful_count,
      created_at: new Date(supabaseReview.created_at),
      updated_at: new Date(supabaseReview.updated_at),
      // Include patient information if available
      patients: supabaseReview.patients ? {
        patient_id: supabaseReview.patients.patient_id,
        full_name: supabaseReview.patients.profiles?.full_name || 'Bệnh nhân ẩn danh',
        phone_number: supabaseReview.patients.profiles?.phone_number || ''
      } : undefined
    };
  }
}
