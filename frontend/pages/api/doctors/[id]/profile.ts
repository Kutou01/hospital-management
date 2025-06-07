import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../lib/supabase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Doctor ID is required' });
  }

  try {
    // Get doctor basic info
    const { data: doctor, error: doctorError } = await supabaseAdmin
      .from('doctors')
      .select('*')
      .eq('doctor_id', id)
      .single();

    if (doctorError) {
      console.error('Doctor fetch error:', doctorError);
      return res.status(404).json({
        error: 'Doctor not found',
        message: `Bác sĩ với ID ${id} không tồn tại.`
      });
    }

    // Get department info separately
    let departmentInfo = null;
    if (doctor.department_id) {
      const { data: dept, error: deptError } = await supabaseAdmin
        .from('departments')
        .select('department_id, name, description, location')
        .eq('department_id', doctor.department_id)
        .single();

      if (!deptError && dept) {
        departmentInfo = dept;
      }
    }

    // Get doctor schedules
    const { data: schedules, error: schedulesError } = await supabaseAdmin
      .from('doctor_schedules')
      .select('*')
      .eq('doctor_id', id)
      .order('day_of_week');

    // Get doctor experiences
    const { data: experiences, error: experiencesError } = await supabaseAdmin
      .from('doctor_experiences')
      .select('*')
      .eq('doctor_id', id)
      .order('start_date', { ascending: false });

    // Get doctor reviews with stats
    const { data: reviews, error: reviewsError } = await supabaseAdmin
      .from('doctor_reviews')
      .select(`
        *,
        patients (
          patient_id,
          full_name
        )
      `)
      .eq('doctor_id', id)
      .order('review_date', { ascending: false })
      .limit(10);

    // Calculate review stats
    let reviewStats = {
      total_reviews: 0,
      average_rating: 0,
      rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    if (reviews && reviews.length > 0) {
      reviewStats.total_reviews = reviews.length;
      reviewStats.average_rating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
      
      reviews.forEach(review => {
        reviewStats.rating_distribution[review.rating as keyof typeof reviewStats.rating_distribution]++;
      });
    }

    // Get upcoming shifts
    const { data: shifts, error: shiftsError } = await supabaseAdmin
      .from('doctor_shifts')
      .select('*')
      .eq('doctor_id', id)
      .gte('shift_date', new Date().toISOString().split('T')[0])
      .order('shift_date')
      .limit(5);

    // Calculate total experience
    let totalExperience = 0;
    if (experiences && experiences.length > 0) {
      experiences.forEach(exp => {
        const startDate = new Date(exp.start_date);
        const endDate = exp.end_date ? new Date(exp.end_date) : new Date();
        const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
        totalExperience += years;
      });
    }

    // Prepare response data
    const profileData = {
      doctor: {
        ...doctor,
        departments: departmentInfo
      },
      schedules: schedules || [],
      experiences: experiences || [],
      reviews: reviews || [],
      reviewStats,
      upcomingShifts: shifts || [],
      totalExperience: Math.round(totalExperience * 10) / 10,
      stats: {
        total_patients: 0, // TODO: Calculate from appointments
        total_appointments: 0, // TODO: Calculate from appointments
        success_rate: 95, // TODO: Calculate from actual data
        years_experience: Math.floor(totalExperience)
      }
    };

    return res.status(200).json({
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Có lỗi xảy ra khi tải thông tin bác sĩ.'
    });
  }
}
