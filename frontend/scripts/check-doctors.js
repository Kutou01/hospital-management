const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkDoctors() {
  try {
    console.log('🔍 Kiểm tra số lượng bác sĩ trong database...\n');

    // Đếm tổng số bác sĩ
    const { count: totalDoctors, error: countError } = await supabase
      .from('doctors')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Lỗi đếm bác sĩ:', countError);
      return;
    }

    console.log(`📊 Tổng số bác sĩ: ${totalDoctors}`);

    // Lấy danh sách bác sĩ với thông tin cơ bản
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select(`
        doctor_id,
        full_name,
        specialty,
        department_id,
        consultation_fee,
        availability_status,
        rating,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (doctorsError) {
      console.error('❌ Lỗi lấy danh sách bác sĩ:', doctorsError);
      return;
    }

    console.log('\n👨‍⚕️ Danh sách bác sĩ:');
    console.log('='.repeat(80));

    doctors.forEach((doctor, index) => {
      console.log(`${index + 1}. ${doctor.full_name}`);
      console.log(`   ID: ${doctor.doctor_id}`);
      console.log(`   Chuyên khoa: ${doctor.specialty}`);
      console.log(`   Phí khám: ${doctor.consultation_fee?.toLocaleString('vi-VN')} VNĐ`);
      console.log(`   Trạng thái: ${doctor.availability_status}`);
      console.log(`   Đánh giá: ${doctor.rating}/5`);
      console.log(`   Tạo lúc: ${new Date(doctor.created_at).toLocaleString('vi-VN')}`);
      console.log('   ' + '-'.repeat(60));
    });

    // Thống kê theo chuyên khoa
    const specialtyStats = doctors.reduce((acc, doctor) => {
      acc[doctor.specialty] = (acc[doctor.specialty] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📈 Thống kê theo chuyên khoa:');
    console.log('='.repeat(40));
    Object.entries(specialtyStats).forEach(([specialty, count]) => {
      console.log(`${specialty}: ${count} bác sĩ`);
    });

  } catch (error) {
    console.error('❌ Lỗi:', error);
  }
}

checkDoctors();