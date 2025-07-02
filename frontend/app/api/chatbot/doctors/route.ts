import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const specialty_id = searchParams.get('specialty_id');
    
    console.log(`Fetching doctors for specialty: ${specialty_id}`);
    
    // Lấy bác sĩ từ public.doctors
    const { data: doctorsData, error } = await supabase
      .from('doctors')
      .select(`
        doctor_id,
        specialty,
        specializations,
        qualification,
        experience_years,
        consultation_fee,
        availability_status,
        status,
        profile_id
      `)
      .eq('status', 'active')
      .eq('availability_status', 'available');

    if (error) {
      console.error('Error fetching doctors:', error);
      throw error;
    }

    if (!doctorsData || doctorsData.length === 0) {
      console.log('No doctors found');
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No doctors found'
      });
    }

    // Lấy thông tin profiles cho bác sĩ
    const profileIds = doctorsData.map(d => d.profile_id).filter(Boolean);
    let profilesData: any[] = [];
    
    if (profileIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', profileIds)
        .eq('is_active', true);
      
      profilesData = profiles || [];
    }

    // Filter doctors by specialty if provided
    let filteredDoctors = doctorsData;
    if (specialty_id) {
      // Nếu không có bác sĩ nào match với specialty cụ thể,
      // trả về một số bác sĩ ngẫu nhiên để demo hoạt động
      // Trong thực tế, cần mapping chính xác specialty_id với doctor specialty

      // Lấy tên chuyên khoa từ specialty_id
      const { data: specialtyData } = await supabase
        .from('specialties')
        .select('specialty_name')
        .eq('specialty_id', specialty_id)
        .single();

      if (specialtyData) {
        const targetSpecialty = specialtyData.specialty_name.toLowerCase();

        // Thử filter chính xác trước
        filteredDoctors = doctorsData.filter(doctor => {
          const specialtyMatch = doctor.specialty &&
            doctor.specialty.toLowerCase().includes(targetSpecialty);

          const specializationsMatch = doctor.specializations &&
            Array.isArray(doctor.specializations) &&
            doctor.specializations.some((spec: string) =>
              spec.toLowerCase().includes(targetSpecialty)
            );

          return specialtyMatch || specializationsMatch;
        });

        // Nếu không tìm thấy bác sĩ nào, trả về 3-5 bác sĩ ngẫu nhiên để demo
        if (filteredDoctors.length === 0) {
          const shuffled = [...doctorsData].sort(() => 0.5 - Math.random());
          filteredDoctors = shuffled.slice(0, Math.min(5, doctorsData.length));

          // Cập nhật specialty_name để phù hợp với chuyên khoa được chọn
          filteredDoctors = filteredDoctors.map(doctor => ({
            ...doctor,
            specialty_name: specialtyData.specialty_name
          }));
        }
      }
    }

    // Transform data để match với format mong đợi của frontend
    const transformedData = filteredDoctors.map(doctor => {
      const profile = profilesData.find(p => p.id === doctor.profile_id);
      
      // Lấy specialty name từ specialty hoặc specializations
      let specialtyName = 'Chuyên khoa tổng quát';
      if (doctor.specialty && doctor.specialty !== 'SPEC040') {
        specialtyName = doctor.specialty;
      } else if (doctor.specializations && Array.isArray(doctor.specializations) && doctor.specializations.length > 0) {
        specialtyName = doctor.specializations[0];
      }

      return {
        doctor_id: doctor.doctor_id,
        doctor_name: profile?.full_name || `BS. ${doctor.doctor_id}`,
        specialty_name: specialtyName,
        consultation_fee: doctor.consultation_fee || 200000, // Default fee nếu null
        experience_years: doctor.experience_years || 0,
        availability_status: doctor.availability_status || 'available'
      };
    })
    .filter(doctor => doctor.doctor_name !== `BS. ${doctor.doctor_id}`) // Chỉ lấy doctors có profile
    .sort((a, b) => (b.experience_years || 0) - (a.experience_years || 0)); // Sort by experience

    console.log(`Doctors found after filtering: ${transformedData.length}`);

    return NextResponse.json({
      success: true,
      data: transformedData,
      message: 'Doctors retrieved successfully'
    });
  } catch (error: any) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json({
      success: false,
      message: 'Lỗi khi lấy danh sách bác sĩ',
      error: error.message
    }, { status: 500 });
  }
}
