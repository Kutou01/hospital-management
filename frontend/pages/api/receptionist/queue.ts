import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get today's queue with patient and doctor information
    const today = new Date().toISOString().split('T')[0];
    
    const { data: queueData, error: queueError } = await supabase
      .from('appointment_queue')
      .select(`
        *,
        appointments!inner(
          appointment_id,
          appointment_date,
          start_time,
          end_time,
          status,
          patient_id,
          doctor_id
        ),
        patients!inner(
          patient_id,
          profile_id,
          profiles!inner(
            full_name
          )
        ),
        doctors!inner(
          doctor_id,
          profile_id,
          profiles!inner(
            full_name
          )
        )
      `)
      .eq('appointments.appointment_date', today)
      .order('queue_position', { ascending: true });

    if (queueError) {
      console.error('Queue fetch error:', queueError);
      return res.status(500).json({ message: 'Error fetching queue data' });
    }

    // Transform data for frontend
    const queueItems = queueData?.map(item => ({
      id: item.id,
      appointmentId: item.appointment_id,
      patientName: item.patients?.profiles?.full_name || 'Unknown',
      patientId: item.appointments?.patient_id || '',
      doctorName: item.doctors?.profiles?.full_name || 'Unknown',
      appointmentTime: `${item.appointments?.start_time} - ${item.appointments?.end_time}`,
      queuePosition: item.queue_position,
      estimatedWaitTime: item.estimated_wait_time || 0,
      status: item.status,
      checkedInAt: item.checked_in_at,
      insuranceVerified: false, // Will be enhanced later
      documentsComplete: false
    })) || [];

    // Calculate queue statistics
    const stats = {
      totalWaiting: queueItems.filter(item => item.status === 'waiting').length,
      currentlyInProgress: queueItems.filter(item => item.status === 'in_progress').length,
      completedToday: queueItems.filter(item => item.status === 'completed').length,
      averageWaitTime: Math.round(
        queueItems
          .filter(item => item.status === 'waiting')
          .reduce((sum, item) => sum + item.estimatedWaitTime, 0) / 
        Math.max(queueItems.filter(item => item.status === 'waiting').length, 1)
      )
    };

    res.status(200).json({
      success: true,
      queueItems,
      stats
    });

  } catch (error) {
    console.error('Queue API error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}
