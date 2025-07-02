import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patient_id } = body;

    console.log(`Creating session for patient: ${patient_id}`);

    const sessionId = `CHAT-APPT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    const sessionData = {
      session_id: sessionId,
      patient_id: patient_id || 'GUEST',
      current_step: 'selecting_specialty',
      status: 'active',
      created_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString()
    };

    // Lưu session vào database
    try {
      const { data: savedSession, error } = await supabase
        .from('chatbot_appointment_sessions')
        .insert({
          session_id: sessionId,
          patient_id: patient_id || 'GUEST',
          current_step: 'selecting_specialty',
          status: 'active',
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving session to database:', error);
      } else {
        console.log('Session saved to database:', savedSession);
      }
    } catch (saveError) {
      console.error('Exception saving session:', saveError);
    }

    console.log(`Session created: ${sessionId}`);

    return NextResponse.json({
      success: true,
      data: sessionData,
      message: 'Session created successfully'
    });
  } catch (error: any) {
    console.error('Error creating session:', error);
    return NextResponse.json({
      success: false,
      message: 'Lỗi khi tạo session',
      error: error.message
    }, { status: 500 });
  }
}
