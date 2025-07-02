import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: NextRequest,
  { params }: { params: { doctorId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const doctorId = params.doctorId;

    console.log(`Fetching slots for doctor: ${doctorId}, date: ${date}`);

    const targetDate = date ? new Date(date) : new Date();
    const dateStr = targetDate.toISOString().split('T')[0];

    // Kiểm tra xem có bảng doctor_available_slots không
    let slots = [];

    try {
      // Thử lấy từ database trước
      const { data: dbSlots, error } = await supabase
        .from('doctor_available_slots')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('date', dateStr)
        .eq('is_available', true)
        .order('start_time');

      if (!error && dbSlots && dbSlots.length > 0) {
        // Có dữ liệu từ database
        slots = dbSlots.map(slot => ({
          slot_id: slot.slot_id || `SLOT-${doctorId}-${dateStr}-${slot.start_time}`,
          doctor_id: doctorId,
          date: dateStr,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_available: slot.is_available,
          time_display: `${slot.start_time} - ${slot.end_time}`,
          is_morning: parseInt(slot.start_time.split(':')[0]) < 12
        }));
      } else {
        // Không có dữ liệu từ database, tạo slots mặc định
        console.log('No database slots found, generating default slots');
        slots = generateDefaultSlots(doctorId, dateStr);
      }
    } catch (dbError) {
      // Lỗi database, tạo slots mặc định
      console.log('Database error, generating default slots:', dbError);
      slots = generateDefaultSlots(doctorId, dateStr);
    }

    // Phân chia slots theo buổi
    const morningSlots = slots.filter(slot => slot.is_morning);
    const afternoonSlots = slots.filter(slot => !slot.is_morning);

    return NextResponse.json({
      success: true,
      data: {
        morning: morningSlots,
        afternoon: afternoonSlots
      },
      message: 'Time slots retrieved successfully'
    });
  } catch (error: any) {
    console.error('Error fetching time slots:', error);
    return NextResponse.json({
      success: false,
      message: 'Lỗi khi lấy time slots',
      error: error.message
    }, { status: 500 });
  }
}

function generateDefaultSlots(doctorId: string, dateStr: string) {
  const slots = [];

  // Tạo slots từ 8:00 đến 17:00, mỗi slot 30 phút
  for (let hour = 8; hour < 17; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 12 && minute === 0) continue; // Skip lunch break

      const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const endTime = minute === 30
        ? `${(hour + 1).toString().padStart(2, '0')}:00`
        : `${hour.toString().padStart(2, '0')}:30`;

      slots.push({
        slot_id: `SLOT-${doctorId}-${dateStr}-${startTime}`,
        doctor_id: doctorId,
        date: dateStr,
        start_time: startTime,
        end_time: endTime,
        is_available: Math.random() > 0.3, // 70% available
        time_display: `${startTime} - ${endTime}`,
        is_morning: hour < 12
      });
    }
  }

  return slots;
}
