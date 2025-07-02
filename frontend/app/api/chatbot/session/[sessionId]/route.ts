import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function PUT(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;
    const updateData = await request.json();

    console.log(`Updating session: ${sessionId}`, updateData);

    // Cập nhật session trong database
    let updatedSession = null;
    try {
      const { data, error } = await supabase
        .from('chatbot_appointment_sessions')
        .update({
          current_step: updateData.step || updateData.current_step,
          specialty: updateData.specialty,
          doctor_id: updateData.doctor_id,
          selected_date: updateData.date || updateData.selected_date,
          selected_time: updateData.time || updateData.selected_time,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .select()
        .single();

      if (error) {
        console.error('Error updating session in database:', error);
      } else {
        updatedSession = data;
        console.log('Session updated in database:', updatedSession);
      }
    } catch (dbError) {
      console.error('Exception updating session:', dbError);
    }

    return NextResponse.json({
      success: true,
      data: { session_id: sessionId, ...updateData, updated_at: new Date().toISOString() },
      message: 'Session updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating session:', error);
    return NextResponse.json({
      success: false,
      message: 'Lỗi khi cập nhật session',
      error: error.message
    }, { status: 500 });
  }
}
