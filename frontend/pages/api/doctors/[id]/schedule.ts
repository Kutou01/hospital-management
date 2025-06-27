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
    // Get doctor's schedule from work_schedules table
    const { data: schedules, error: scheduleError } = await supabaseAdmin
      .from('work_schedules')
      .select(`
        *,
        doctor:doctors!work_schedules_doctor_id_fkey(
          doctor_id,
          full_name,
          specialty
        )
      `)
      .eq('doctor_id', id)
      .order('day_of_week', { ascending: true });

    if (scheduleError) {
      console.error('Schedule fetch error:', scheduleError);
      return res.status(500).json({
        error: 'Failed to fetch schedule',
        message: 'Không thể tải lịch làm việc của bác sĩ.'
      });
    }

    // Transform schedule data
    const transformedSchedules = (schedules || []).map(schedule => ({
      id: schedule.id,
      doctor_id: schedule.doctor_id,
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      is_available: schedule.is_available,
      break_start: schedule.break_start,
      break_end: schedule.break_end,
      max_patients: schedule.max_patients,
      notes: schedule.notes,
      created_at: schedule.created_at,
      updated_at: schedule.updated_at,
      doctor: schedule.doctor
    }));

    return res.status(200).json({
      success: true,
      data: transformedSchedules,
      message: `Retrieved ${transformedSchedules.length} schedule entries for doctor ${id}`
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Có lỗi xảy ra khi tải lịch làm việc.'
    });
  }
}
