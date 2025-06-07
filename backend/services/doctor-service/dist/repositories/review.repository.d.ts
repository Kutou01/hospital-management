import { DoctorReview, CreateReviewRequest, ReviewStats } from '@hospital/shared/dist/types/doctor.types';
export declare class ReviewRepository {
    private supabase;
    constructor();
    findByDoctorId(doctorId: string, limit?: number, offset?: number): Promise<DoctorReview[]>;
    findByPatientId(patientId: string, limit?: number, offset?: number): Promise<DoctorReview[]>;
    findById(reviewId: string): Promise<DoctorReview | null>;
    create(reviewData: CreateReviewRequest): Promise<DoctorReview>;
    update(reviewId: string, updateData: Partial<CreateReviewRequest>): Promise<DoctorReview | null>;
    delete(reviewId: string): Promise<boolean>;
    findByAppointment(appointmentId: string): Promise<DoctorReview | null>;
    getReviewStats(doctorId: string): Promise<ReviewStats>;
    incrementHelpfulCount(reviewId: string): Promise<DoctorReview | null>;
    getTopRatedDoctors(limit?: number): Promise<Array<{
        doctor_id: string;
        average_rating: number;
        total_reviews: number;
    }>>;
    getReviewsByRating(doctorId: string, rating: number, limit?: number): Promise<DoctorReview[]>;
    searchReviews(doctorId: string, searchTerm: string, limit?: number): Promise<DoctorReview[]>;
    getVerifiedReviews(doctorId: string, limit?: number): Promise<DoctorReview[]>;
    private mapSupabaseReviewToReview;
}
//# sourceMappingURL=review.repository.d.ts.map