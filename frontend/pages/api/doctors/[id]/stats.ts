import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

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
    // Get doctor basic info
    const { data: doctor, error: doctorError } = await supabaseAdmin
      .from('doctors')
      .select('doctor_id, full_name, specialty, experience_years, rating, total_reviews')
      .eq('doctor_id', id)
      .single();

    if (doctorError) {
      console.error('Doctor fetch error:', doctorError);
      return res.status(404).json({
        error: 'Doctor not found',
        message: `Bác sĩ với ID ${id} không tồn tại.`
      });
    }

    // Get appointment statistics
    const { data: appointments, error: appointmentError } = await supabaseAdmin
      .from('appointments')
      .select('appointment_id, status, appointment_date, created_at')
      .eq('doctor_id', id);

    if (appointmentError) {
      console.error('Appointments fetch error:', appointmentError);
    }

    // Get review statistics
    const { data: reviews, error: reviewsError } = await supabaseAdmin
      .from('reviews')
      .select('rating, created_at')
      .eq('doctor_id', id);

    if (reviewsError) {
      console.error('Reviews fetch error:', reviewsError);
    }

    // Calculate appointment statistics
    const appointmentData = appointments || [];
    const currentDate = new Date();
    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);

    const appointmentStats = {
      total: appointmentData.length,
      completed: appointmentData.filter(apt => apt.status === 'completed').length,
      pending: appointmentData.filter(apt => apt.status === 'pending').length,
      confirmed: appointmentData.filter(apt => apt.status === 'confirmed').length,
      cancelled: appointmentData.filter(apt => apt.status === 'cancelled').length,
      this_month: appointmentData.filter(apt => 
        new Date(apt.appointment_date) >= currentMonth
      ).length,
      last_month: appointmentData.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate >= lastMonth && aptDate < currentMonth;
      }).length
    };

    // Calculate review statistics
    const reviewData = reviews || [];
    const reviewStats = {
      total: reviewData.length,
      average_rating: doctor.rating || 0,
      rating_distribution: {
        5: reviewData.filter(r => r.rating === 5).length,
        4: reviewData.filter(r => r.rating === 4).length,
        3: reviewData.filter(r => r.rating === 3).length,
        2: reviewData.filter(r => r.rating === 2).length,
        1: reviewData.filter(r => r.rating === 1).length
      }
    };

    // Calculate success rate
    const completedAppointments = appointmentStats.completed;
    const totalAppointments = appointmentStats.total;
    const successRate = totalAppointments > 0 ? 
      Math.round((completedAppointments / totalAppointments) * 100) : 0;

    // Calculate monthly growth
    const monthlyGrowth = appointmentStats.last_month > 0 ? 
      Math.round(((appointmentStats.this_month - appointmentStats.last_month) / appointmentStats.last_month) * 100) : 0;

    const statsData = {
      doctor: {
        doctor_id: doctor.doctor_id,
        full_name: doctor.full_name,
        specialty: doctor.specialty,
        experience_years: doctor.experience_years || 0
      },
      appointments: appointmentStats,
      reviews: reviewStats,
      performance: {
        success_rate: successRate,
        monthly_growth: monthlyGrowth,
        patient_satisfaction: doctor.rating || 0,
        total_patients: appointmentData.length > 0 ? 
          [...new Set(appointmentData.map(apt => apt.patient_id))].length : 0
      },
      summary: {
        total_appointments: appointmentStats.total,
        total_reviews: reviewStats.total,
        average_rating: reviewStats.average_rating,
        success_rate: successRate,
        experience_years: doctor.experience_years || 0
      }
    };

    return res.status(200).json({
      success: true,
      data: statsData,
      message: `Retrieved statistics for doctor ${id}`
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Có lỗi xảy ra khi tải thống kê bác sĩ.'
    });
  }
}
