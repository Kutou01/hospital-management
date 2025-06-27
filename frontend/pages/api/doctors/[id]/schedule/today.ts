import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../../lib/supabase-admin';

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
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const todayDate = today.toISOString().split('T')[0];

    // Get today's schedule from doctor_work_schedules
    const { data: todaySchedule, error: scheduleError } = await supabaseAdmin
      .from('doctor_work_schedules')
      .select('*')
      .eq('doctor_id', id)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true);

    if (scheduleError) {
      console.error('Today schedule fetch error:', scheduleError);
      return res.status(500).json({
        error: 'Failed to fetch today schedule',
        message: 'Không thể tải lịch làm việc hôm nay.'
      });
    }

    // Get today's appointments
    const { data: appointments, error: appointmentError } = await supabaseAdmin
      .from('appointments')
      .select(`
        appointment_id,
        appointment_date,
        appointment_time,
        status,
        notes,
        patient:patients!appointments_patient_id_fkey(
          patient_id,
          full_name
        )
      `)
      .eq('doctor_id', id)
      .eq('appointment_date', todayDate)
      .order('appointment_time', { ascending: true });

    if (appointmentError) {
      console.error('Appointments fetch error:', appointmentError);
      // Continue without appointments data
    }

    // Combine schedule and appointments
    const todayData = {
      date: todayDate,
      day_of_week: dayOfWeek,
      schedule: todaySchedule || [],
      appointments: appointments || [],
      summary: {
        total_appointments: (appointments || []).length,
        confirmed_appointments: (appointments || []).filter(apt => apt.status === 'confirmed').length,
        pending_appointments: (appointments || []).filter(apt => apt.status === 'pending').length,
        completed_appointments: (appointments || []).filter(apt => apt.status === 'completed').length,
        has_schedule: (todaySchedule || []).length > 0
      }
    };

    return res.status(200).json({
      success: true,
      data: todayData,
      message: `Retrieved today's schedule for doctor ${id}`
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Có lỗi xảy ra khi tải lịch làm việc hôm nay.'
    });
  }
}
