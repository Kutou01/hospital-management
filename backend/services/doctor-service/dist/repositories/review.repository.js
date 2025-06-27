"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewRepository = void 0;
const database_config_1 = require("../config/database.config");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
class ReviewRepository {
    constructor() {
        this.supabase = (0, database_config_1.getSupabase)();
    }
    async findByDoctorId(doctorId, limit = 50, offset = 0) {
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
            if (error)
                throw error;
            return data?.map(this.mapSupabaseReviewToReview) || [];
        }
        catch (error) {
            logger_1.default.error('Error finding reviews by doctor ID', { error, doctorId });
            throw error;
        }
    }
    async findByPatientId(patientId, limit = 50, offset = 0) {
        try {
            const { data, error } = await this.supabase
                .from('doctor_reviews')
                .select('*')
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
            if (error)
                throw error;
            return data?.map(this.mapSupabaseReviewToReview) || [];
        }
        catch (error) {
            logger_1.default.error('Error finding reviews by patient ID', { error, patientId });
            throw error;
        }
    }
    async findById(reviewId) {
        try {
            const { data, error } = await this.supabase
                .from('doctor_reviews')
                .select('*')
                .eq('review_id', reviewId)
                .single();
            if (error) {
                if (error.code === 'PGRST116')
                    return null;
                throw error;
            }
            return this.mapSupabaseReviewToReview(data);
        }
        catch (error) {
            logger_1.default.error('Error finding review by ID', { error, reviewId });
            throw error;
        }
    }
    async create(reviewData) {
        try {
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
                    is_verified: reviewData.appointment_id ? true : false,
                    helpful_count: 0
                }])
                .select()
                .single();
            if (error)
                throw error;
            return this.mapSupabaseReviewToReview(data);
        }
        catch (error) {
            logger_1.default.error('Error creating review', { error, reviewData });
            throw error;
        }
    }
    async update(reviewId, updateData) {
        try {
            const { data, error } = await this.supabase
                .from('doctor_reviews')
                .update(updateData)
                .eq('review_id', reviewId)
                .select()
                .single();
            if (error) {
                if (error.code === 'PGRST116')
                    return null;
                throw error;
            }
            return this.mapSupabaseReviewToReview(data);
        }
        catch (error) {
            logger_1.default.error('Error updating review', { error, reviewId, updateData });
            throw error;
        }
    }
    async delete(reviewId) {
        try {
            const { error } = await this.supabase
                .from('doctor_reviews')
                .delete()
                .eq('review_id', reviewId);
            if (error)
                throw error;
            return true;
        }
        catch (error) {
            logger_1.default.error('Error deleting review', { error, reviewId });
            throw error;
        }
    }
    async findByAppointment(appointmentId) {
        try {
            const { data, error } = await this.supabase
                .from('doctor_reviews')
                .select('*')
                .eq('appointment_id', appointmentId)
                .single();
            if (error) {
                if (error.code === 'PGRST116')
                    return null;
                throw error;
            }
            return this.mapSupabaseReviewToReview(data);
        }
        catch (error) {
            logger_1.default.error('Error finding review by appointment', { error, appointmentId });
            throw error;
        }
    }
    async getReviewStats(doctorId) {
        try {
            const { data, error } = await this.supabase
                .rpc('get_doctor_review_stats', {
                doctor_id_param: doctorId
            });
            if (error)
                throw error;
            const stats = data[0] || {
                total_reviews: 0,
                average_rating: 0,
                five_star: 0,
                four_star: 0,
                three_star: 0,
                two_star: 0,
                one_star: 0
            };
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
        }
        catch (error) {
            logger_1.default.error('Error getting review stats', { error, doctorId });
            throw error;
        }
    }
    async incrementHelpfulCount(reviewId) {
        try {
            const { data: currentData, error: fetchError } = await this.supabase
                .from('doctor_reviews')
                .select('helpful_count')
                .eq('review_id', reviewId)
                .single();
            if (fetchError) {
                if (fetchError.code === 'PGRST116')
                    return null;
                throw fetchError;
            }
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
                if (error.code === 'PGRST116')
                    return null;
                throw error;
            }
            return this.mapSupabaseReviewToReview(data);
        }
        catch (error) {
            logger_1.default.error('Error incrementing helpful count', { error, reviewId });
            throw error;
        }
    }
    async getTopRatedDoctors(limit = 10) {
        try {
            const { data, error } = await this.supabase
                .from('doctor_reviews')
                .select('doctor_id, rating')
                .order('rating', { ascending: false });
            if (error)
                throw error;
            const doctorStats = new Map();
            data?.forEach(review => {
                const current = doctorStats.get(review.doctor_id) || { total: 0, sum: 0 };
                current.total += 1;
                current.sum += review.rating;
                doctorStats.set(review.doctor_id, current);
            });
            const topDoctors = Array.from(doctorStats.entries())
                .map(([doctor_id, stats]) => ({
                doctor_id,
                average_rating: Number((stats.sum / stats.total).toFixed(2)),
                total_reviews: stats.total
            }))
                .filter(doctor => doctor.total_reviews >= 3)
                .sort((a, b) => b.average_rating - a.average_rating)
                .slice(0, limit);
            return topDoctors;
        }
        catch (error) {
            logger_1.default.error('Error getting top rated doctors', { error });
            throw error;
        }
    }
    async getReviewsByRating(doctorId, rating, limit = 20) {
        try {
            const { data, error } = await this.supabase
                .from('doctor_reviews')
                .select('*')
                .eq('doctor_id', doctorId)
                .eq('rating', rating)
                .order('created_at', { ascending: false })
                .limit(limit);
            if (error)
                throw error;
            return data?.map(this.mapSupabaseReviewToReview) || [];
        }
        catch (error) {
            logger_1.default.error('Error getting reviews by rating', { error, doctorId, rating });
            throw error;
        }
    }
    async searchReviews(doctorId, searchTerm, limit = 20) {
        try {
            const { data, error } = await this.supabase
                .from('doctor_reviews')
                .select('*')
                .eq('doctor_id', doctorId)
                .ilike('review_text', `%${searchTerm}%`)
                .order('created_at', { ascending: false })
                .limit(limit);
            if (error)
                throw error;
            return data?.map(this.mapSupabaseReviewToReview) || [];
        }
        catch (error) {
            logger_1.default.error('Error searching reviews', { error, doctorId, searchTerm });
            throw error;
        }
    }
    async getVerifiedReviews(doctorId, limit = 20) {
        try {
            const { data, error } = await this.supabase
                .from('doctor_reviews')
                .select('*')
                .eq('doctor_id', doctorId)
                .eq('is_verified', true)
                .order('created_at', { ascending: false })
                .limit(limit);
            if (error)
                throw error;
            return data?.map(this.mapSupabaseReviewToReview) || [];
        }
        catch (error) {
            logger_1.default.error('Error getting verified reviews', { error, doctorId });
            throw error;
        }
    }
    mapSupabaseReviewToReview(supabaseReview) {
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
            patients: supabaseReview.patients ? {
                patient_id: supabaseReview.patients.patient_id,
                full_name: supabaseReview.patients.profiles?.full_name || 'Bệnh nhân ẩn danh',
                phone_number: supabaseReview.patients.profiles?.phone_number || ''
            } : undefined
        };
    }
}
exports.ReviewRepository = ReviewRepository;
//# sourceMappingURL=review.repository.js.map