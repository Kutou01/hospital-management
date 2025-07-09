import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { appointmentId } = req.body;

  if (!appointmentId) {
    return res.status(400).json({ message: 'Appointment ID is required' });
  }

  try {
    // Get appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        patients!inner(
          patient_id,
          profile_id,
          profiles!inner(
            full_name,
            phone_number
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
      .eq('appointment_id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Update queue status to "called"
    const { error: queueError } = await supabase
      .from('appointment_queue')
      .update({ 
        status: 'in_progress',
        called_at: new Date().toISOString()
      })
      .eq('appointment_id', appointmentId);

    if (queueError) {
      console.error('Queue update error:', queueError);
      return res.status(500).json({ message: 'Error updating queue' });
    }

    // Update appointment status
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ 
        status: 'in_progress',
        actual_start_time: new Date().toISOString()
      })
      .eq('appointment_id', appointmentId);

    if (updateError) {
      console.error('Appointment update error:', updateError);
      return res.status(500).json({ message: 'Error updating appointment' });
    }

    // Send notification to patient
    try {
      const patientProfileId = appointment.patients?.profile_id;
      if (patientProfileId) {
        await supabase
          .from('notifications')
          .insert({
            user_id: patientProfileId,
            type: 'appointment_called',
            title: 'Đến lượt khám',
            message: `Xin mời bệnh nhân ${appointment.patients?.profiles?.full_name} vào phòng khám bác sĩ ${appointment.doctors?.profiles?.full_name}`,
            read_at: null,
            created_at: new Date().toISOString()
          });
      }
    } catch (notificationError) {
      console.error('Patient notification error:', notificationError);
    }

    // Send notification to doctor
    try {
      const doctorProfileId = appointment.doctors?.profile_id;
      if (doctorProfileId) {
        await supabase
          .from('notifications')
          .insert({
            user_id: doctorProfileId,
            type: 'patient_ready',
            title: 'Bệnh nhân sẵn sàng',
            message: `Bệnh nhân ${appointment.patients?.profiles?.full_name} đã được gọi vào phòng khám`,
            read_at: null,
            created_at: new Date().toISOString()
          });
      }
    } catch (notificationError) {
      console.error('Doctor notification error:', notificationError);
    }

    // Optional: Send SMS notification (if phone number available)
    const phoneNumber = appointment.patients?.profiles?.phone_number;
    if (phoneNumber) {
      try {
        // SMS integration would go here
        // For now, just log the action
        console.log(`SMS would be sent to ${phoneNumber}: Đến lượt khám bệnh`);
      } catch (smsError) {
        console.error('SMS error:', smsError);
      }
    }

    // Update wait times for remaining patients
    try {
      const { data: remainingQueue } = await supabase
        .from('appointment_queue')
        .select('*')
        .eq('status', 'waiting')
        .order('queue_position', { ascending: true });

      if (remainingQueue && remainingQueue.length > 0) {
        const updates = remainingQueue.map((item, index) => ({
          id: item.id,
          estimated_wait_time: (index + 1) * 15 // 15 minutes per patient
        }));

        for (const update of updates) {
          await supabase
            .from('appointment_queue')
            .update({ estimated_wait_time: update.estimated_wait_time })
            .eq('id', update.id);
        }
      }
    } catch (waitTimeError) {
      console.error('Wait time update error:', waitTimeError);
    }

    res.status(200).json({
      success: true,
      message: 'Patient called successfully',
      appointment: {
        id: appointment.appointment_id,
        patientName: appointment.patients?.profiles?.full_name,
        doctorName: appointment.doctors?.profiles?.full_name,
        time: appointment.start_time
      }
    });

  } catch (error) {
    console.error('Call next API error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}
