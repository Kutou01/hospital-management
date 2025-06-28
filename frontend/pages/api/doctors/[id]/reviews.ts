import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const { page = '1', limit = '20' } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      error: 'Invalid doctor ID',
      message: 'ID bác sĩ không hợp lệ.'
    });
  }

  try {
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const offset = (pageNum - 1) * limitNum;

    // Get doctor reviews from doctor_reviews table
    const { data: reviews, error: reviewsError, count } = await supabaseAdmin
      .from('doctor_reviews')
      .select('*', { count: 'exact' })
      .eq('doctor_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (reviewsError) {
      console.error('Reviews fetch error:', reviewsError);
      return res.status(500).json({
        error: 'Failed to fetch reviews',
        message: 'Không thể tải đánh giá của bác sĩ.'
      });
    }

    // Get patient info for each review
    const reviewData = reviews || [];
    const reviewsWithPatients = await Promise.all(
      reviewData.map(async (review) => {
        const { data: patient } = await supabaseAdmin
          .from('patients')
          .select('patient_id, full_name')
          .eq('patient_id', review.patient_id)
          .single();

        return {
          ...review,
          patient_name: patient?.full_name || 'Bệnh nhân ẩn danh',
          patients: patient
        };
      })
    );

    // Calculate review statistics
    const totalReviews = count || 0;
    
    let totalRating = 0;
    let ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    reviewsWithPatients.forEach(review => {
      if (review.rating) {
        totalRating += review.rating;
        ratingCounts[review.rating as keyof typeof ratingCounts]++;
      }
    });

    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

    // Transform review data
    const transformedReviews = reviewsWithPatients.map(review => ({
      review_id: review.review_id || review.id,
      doctor_id: review.doctor_id,
      patient_id: review.patient_id,
      rating: review.rating,
      comment: review.review_text,
      review_text: review.review_text,
      created_at: review.created_at,
      review_date: review.review_date,
      is_verified: review.is_verified,
      patient_name: review.patients?.full_name || 'Bệnh nhân ẩn danh',
      patients: review.patients
    }));

    const responseData = {
      reviews: transformedReviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalReviews,
        totalPages: Math.ceil(totalReviews / limitNum)
      },
      statistics: {
        total_reviews: totalReviews,
        average_rating: Math.round(averageRating * 10) / 10,
        rating_distribution: ratingCounts
      }
    };

    return res.status(200).json({
      success: true,
      data: responseData,
      message: `Retrieved ${transformedReviews.length} reviews for doctor ${id}`
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Có lỗi xảy ra khi tải đánh giá.'
    });
  }
}
