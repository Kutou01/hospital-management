import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../../lib/supabase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { period = 'week' } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      error: 'Invalid doctor ID',
      message: 'ID bác sĩ không hợp lệ.'
    });
  }

  try {
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        startDate = new Date(now.getTime() - (dayOfWeek * 24 * 60 * 60 * 1000));
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)); // Default to week
    }

    // Get appointment statistics
    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from('appointments')
      .select(`
        appointment_id,
        appointment_date,
        status,
        appointment_type,
        patient:patients!appointments_patient_id_fkey(
          patient_id,
          full_name
        )
      `)
      .eq('doctor_id', id)
      .gte('appointment_date', startDate.toISOString().split('T')[0])
      .order('appointment_date', { ascending: false });

    if (appointmentsError) {
      console.error('Appointments fetch error:', appointmentsError);
      return res.status(500).json({
        error: 'Failed to fetch appointment statistics',
        message: 'Không thể tải thống kê cuộc hẹn.'
      });
    }

    // Calculate statistics
    const totalAppointments = appointments?.length || 0;
    const confirmedAppointments = appointments?.filter(apt => apt.status === 'confirmed').length || 0;
    const pendingAppointments = appointments?.filter(apt => apt.status === 'pending').length || 0;
    const completedAppointments = appointments?.filter(apt => apt.status === 'completed').length || 0;
    const cancelledAppointments = appointments?.filter(apt => apt.status === 'cancelled').length || 0;

    // Get unique patients
    const uniquePatients = new Set(appointments?.map(apt => apt.patient?.patient_id).filter(Boolean));
    const newPatients = uniquePatients.size;

    // Calculate daily data for charts (last 7 days)
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dateStr = date.toISOString().split('T')[0];
      const dayAppointments = appointments?.filter(apt => apt.appointment_date === dateStr).length || 0;
      dailyData.push(dayAppointments);
    }

    // Get today's appointments
    const today = now.toISOString().split('T')[0];
    const todayAppointments = appointments?.filter(apt => apt.appointment_date === today).length || 0;

    // Get this week's appointments
    const weekStart = new Date(now.getTime() - (now.getDay() * 24 * 60 * 60 * 1000));
    weekStart.setHours(0, 0, 0, 0);
    const thisWeekAppointments = appointments?.filter(apt => {
      const aptDate = new Date(apt.appointment_date);
      return aptDate >= weekStart;
    }).length || 0;

    // Get this month's appointments
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthAppointments = appointments?.filter(apt => {
      const aptDate = new Date(apt.appointment_date);
      return aptDate >= monthStart;
    }).length || 0;

    const statsData = {
      total: totalAppointments,
      confirmed: confirmedAppointments,
      pending: pendingAppointments,
      completed: completedAppointments,
      cancelled: cancelledAppointments,
      new_patients: newPatients,
      follow_ups: totalAppointments - newPatients,
      daily_data: dailyData,
      today_count: todayAppointments,
      this_week_count: thisWeekAppointments,
      this_month_count: thisMonthAppointments,
      period: period,
      date_range: {
        start: startDate.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0]
      }
    };

    return res.status(200).json({
      success: true,
      data: statsData,
      message: `Retrieved appointment statistics for doctor ${id} (${period})`
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Có lỗi xảy ra khi tải thống kê cuộc hẹn.'
    });
  }
}
