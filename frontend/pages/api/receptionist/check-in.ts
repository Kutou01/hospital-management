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

  const { appointmentId, receptionistId, insuranceVerified = false, notes = '' } = req.body;

  if (!appointmentId) {
    return res.status(400).json({ message: 'Appointment ID is required' });
  }

  try {
    // Start transaction
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*')
      .eq('appointment_id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Create check-in record
    const { data: checkIn, error: checkInError } = await supabase
      .from('patient_check_ins')
      .insert({
        patient_id: appointment.patient_id,
        appointment_id: appointmentId,
        receptionist_id: receptionistId,
        check_in_time: new Date().toISOString(),
        insurance_verified: insuranceVerified,
        documents_complete: true,
        notes: notes,
        status: 'checked_in'
      })
      .select()
      .single();

    if (checkInError) {
      console.error('Check-in creation error:', checkInError);
      return res.status(500).json({ message: 'Error creating check-in record' });
    }

    // Update appointment status
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ 
        status: 'checked_in',
        checked_in_at: new Date().toISOString(),
        insurance_verified: insuranceVerified
      })
      .eq('appointment_id', appointmentId);

    if (updateError) {
      console.error('Appointment update error:', updateError);
      return res.status(500).json({ message: 'Error updating appointment' });
    }

    // Update queue status
    const { error: queueError } = await supabase
      .from('appointment_queue')
      .update({ 
        status: 'waiting',
        checked_in_at: new Date().toISOString()
      })
      .eq('appointment_id', appointmentId);

    if (queueError) {
      console.error('Queue update error:', queueError);
      // Don't fail the request if queue update fails
    }

    // Send notification to doctor (optional)
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: appointment.doctor_id,
          type: 'patient_checked_in',
          title: 'Bệnh nhân đã check-in',
          message: `Bệnh nhân ${appointment.patient_id} đã check-in cho cuộc hẹn lúc ${appointment.start_time}`,
          read_at: null,
          created_at: new Date().toISOString()
        });
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(200).json({
      success: true,
      message: 'Patient checked in successfully',
      checkIn
    });

  } catch (error) {
    console.error('Check-in API error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}
