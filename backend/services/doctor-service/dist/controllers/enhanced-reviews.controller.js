"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedReviewsController = void 0;
const database_config_1 = require("../config/database.config");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
class EnhancedReviewsController {
    async getDoctorReviews(req, res) {
        try {
            const { doctorId } = req.params;
            const { page = 1, limit = 10, sort = 'newest', rating_filter, verified_only = 'false' } = req.query;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const offset = (pageNum - 1) * limitNum;
            logger_1.default.info('📝 [EnhancedReviews] Getting reviews for doctor', {
                doctorId,
                page: pageNum,
                limit: limitNum,
                sort,
                rating_filter,
                verified_only
            });
            let countQuery = database_config_1.supabaseAdmin
                .from('doctor_reviews')
                .select('*', { count: 'exact', head: true })
                .eq('doctor_id', doctorId);
            if (rating_filter) {
                countQuery = countQuery.eq('rating', parseInt(rating_filter));
            }
            if (verified_only === 'true') {
                countQuery = countQuery.eq('is_verified', true);
            }
            const { count: totalReviews, error: countError } = await countQuery;
            if (countError) {
                logger_1.default.error('❌ [EnhancedReviews] Error counting reviews:', countError);
                res.status(500).json({
                    success: false,
                    error: { message: 'Lỗi khi đếm số lượng đánh giá' }
                });
                return;
            }
            let reviewsQuery = database_config_1.supabaseAdmin
                .from('doctor_reviews')
                .select(`
          review_id,
          rating,
          review_text,
          review_date,
          is_verified,
          helpful_count,
          review_category,
          doctor_response,
          response_date,
          appointment_id,
          patients!inner(
            patient_id,
            profiles!inner(full_name)
          ),
          appointments(
            appointment_date,
            appointment_type
          )
        `)
                .eq('doctor_id', doctorId);
            if (rating_filter) {
                reviewsQuery = reviewsQuery.eq('rating', parseInt(rating_filter));
            }
            if (verified_only === 'true') {
                reviewsQuery = reviewsQuery.eq('is_verified', true);
            }
            switch (sort) {
                case 'oldest':
                    reviewsQuery = reviewsQuery.order('review_date', { ascending: true });
                    break;
                case 'rating_high':
                    reviewsQuery = reviewsQuery.order('rating', { ascending: false });
                    break;
                case 'rating_low':
                    reviewsQuery = reviewsQuery.order('rating', { ascending: true });
                    break;
                case 'helpful':
                    reviewsQuery = reviewsQuery.order('helpful_count', { ascending: false });
                    break;
                default:
                    reviewsQuery = reviewsQuery.order('review_date', { ascending: false });
            }
            reviewsQuery = reviewsQuery.range(offset, offset + limitNum - 1);
            const { data: reviewsData, error: reviewsError } = await reviewsQuery;
            if (reviewsError) {
                logger_1.default.error('❌ [EnhancedReviews] Error getting reviews:', reviewsError);
                res.status(500).json({
                    success: false,
                    error: { message: 'Lỗi khi lấy danh sách đánh giá' }
                });
                return;
            }
            const summary = await this.getReviewSummary(doctorId);
            const reviews = (reviewsData || []).map(review => ({
                review_id: review.review_id,
                patient_name: review.patients?.profiles?.full_name || 'Bệnh nhân ẩn danh',
                patient_initial: this.getPatientInitial(review.patients?.profiles?.full_name),
                rating: review.rating,
                review_text: review.review_text || '',
                review_date: review.review_date,
                is_verified: review.is_verified || false,
                helpful_count: review.helpful_count || 0,
                appointment_date: review.appointments?.appointment_date,
                appointment_type: this.translateAppointmentType(review.appointments?.appointment_type),
                review_category: review.review_category || 'general',
                doctor_response: review.doctor_response,
                response_date: review.response_date
            }));
            const totalPages = Math.ceil((totalReviews || 0) / limitNum);
            const response = {
                reviews,
                summary,
                pagination: {
                    current_page: pageNum,
                    total_pages: totalPages,
                    total_reviews: totalReviews || 0,
                    per_page: limitNum
                }
            };
            logger_1.default.info('✅ [EnhancedReviews] Successfully retrieved reviews', {
                doctorId,
                reviewCount: reviews.length,
                totalReviews: totalReviews || 0,
                averageRating: summary.average_rating
            });
            res.json({
                success: true,
                data: response
            });
        }
        catch (error) {
            logger_1.default.error('💥 [EnhancedReviews] Unexpected error:', error);
            res.status(500).json({
                success: false,
                error: { message: 'Lỗi server khi lấy đánh giá' }
            });
        }
    }
    async getReviewSummary(doctorId) {
        try {
            const { data: allReviews, error } = await database_config_1.supabaseAdmin
                .from('doctor_reviews')
                .select('rating, review_date, is_verified, doctor_response')
                .eq('doctor_id', doctorId);
            if (error || !allReviews) {
                logger_1.default.error('❌ [ReviewSummary] Error getting all reviews:', error);
                return this.getEmptyReviewSummary();
            }
            const totalReviews = allReviews.length;
            const averageRating = totalReviews > 0
                ? allReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
                : 0;
            const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
            allReviews.forEach(review => {
                ratingDistribution[review.rating]++;
            });
            const verifiedReviewsCount = allReviews.filter(review => review.is_verified).length;
            const reviewsWithResponse = allReviews.filter(review => review.doctor_response).length;
            const responseRate = totalReviews > 0 ? (reviewsWithResponse / totalReviews) * 100 : 0;
            const recentTrends = this.calculateMonthlyTrends(allReviews);
            return {
                total_reviews: totalReviews,
                average_rating: Math.round(averageRating * 100) / 100,
                rating_distribution: ratingDistribution,
                recent_trends: recentTrends,
                verified_reviews_count: verifiedReviewsCount,
                response_rate: Math.round(responseRate * 100) / 100
            };
        }
        catch (error) {
            logger_1.default.error('💥 [ReviewSummary] Error:', error);
            return this.getEmptyReviewSummary();
        }
    }
    calculateMonthlyTrends(reviews) {
        const monthlyData = new Map();
        reviews.forEach(review => {
            const reviewDate = new Date(review.review_date);
            const monthKey = `${reviewDate.getFullYear()}-${(reviewDate.getMonth() + 1).toString().padStart(2, '0')}`;
            if (!monthlyData.has(monthKey)) {
                monthlyData.set(monthKey, { ratings: [], count: 0 });
            }
            const monthData = monthlyData.get(monthKey);
            monthData.ratings.push(review.rating);
            monthData.count++;
        });
        const sortedMonths = Array.from(monthlyData.entries())
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, 6)
            .reverse();
        return sortedMonths.map(([monthKey, data]) => ({
            month: monthKey,
            month_name: this.getMonthNameInVietnamese(monthKey),
            average_rating: data.ratings.length > 0
                ? Math.round((data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length) * 100) / 100
                : 0,
            review_count: data.count
        }));
    }
    getPatientInitial(fullName) {
        if (!fullName)
            return 'B.N';
        const nameParts = fullName.trim().split(' ');
        if (nameParts.length === 1) {
            return nameParts[0].charAt(0).toUpperCase() + '.';
        }
        const firstInitial = nameParts[0].charAt(0).toUpperCase();
        const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
        return `${firstInitial}.${lastInitial}`;
    }
    translateAppointmentType(type) {
        if (!type)
            return 'Khám tổng quát';
        const translations = {
            'consultation': 'Khám tư vấn',
            'follow_up': 'Tái khám',
            'emergency': 'Cấp cứu',
            'routine_checkup': 'Khám định kỳ',
            'surgery': 'Phẫu thuật'
        };
        return translations[type] || type;
    }
    getMonthNameInVietnamese(monthKey) {
        const [year, month] = monthKey.split('-');
        const monthNames = [
            'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
            'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
        ];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    }
    getEmptyReviewSummary() {
        return {
            total_reviews: 0,
            average_rating: 0,
            rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            recent_trends: [],
            verified_reviews_count: 0,
            response_rate: 0
        };
    }
}
exports.EnhancedReviewsController = EnhancedReviewsController;
//# sourceMappingURL=enhanced-reviews.controller.js.map