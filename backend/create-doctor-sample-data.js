const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createDoctorSampleData() {
  console.log('🏥 Creating sample data for doctor@hospital.com...');
  
  const doctorId = 'GENE-DOC-202506-006';
  const profileId = '5bdcbd80-f344-40b7-a46b-3760ca487693';
  
  try {
    // 1. Create doctor experiences
    console.log('📝 Creating work experiences...');
    
    const experiences = [
      {
        doctor_id: doctorId,
        institution_name: 'Bệnh viện Chợ Rẫy',
        position: 'Bác sĩ Nội khoa',
        start_date: '2020-01-01',
        end_date: null,
        is_current: true,
        description: 'Bác sĩ điều trị chuyên khoa Nội tổng hợp, chuyên về tiêu hóa và tim mạch',
        experience_type: 'work'
      },
      {
        doctor_id: doctorId,
        institution_name: 'Đại học Y Dược TP.HCM',
        position: 'Bác sĩ thực tập',
        start_date: '2018-01-01',
        end_date: '2019-12-31',
        is_current: false,
        description: 'Thực tập tại khoa Nội tổng hợp',
        experience_type: 'education'
      }
    ];
    
    const { data: expData, error: expError } = await supabase
      .from('doctor_experiences')
      .insert(experiences)
      .select();
      
    if (expError) {
      console.log('❌ Error creating experiences:', expError.message);
    } else {
      console.log(`✅ Created ${expData.length} work experiences`);
    }
    
    // 2. Create doctor reviews
    console.log('⭐ Creating patient reviews...');
    
    // First, get some patient IDs
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('patient_id')
      .limit(3);
      
    if (patients && patients.length > 0) {
      const reviews = [
        {
          doctor_id: doctorId,
          patient_id: patients[0].patient_id,
          rating: 5,
          review_text: 'Bác sĩ Đức rất tận tâm và chuyên nghiệp. Khám bệnh kỹ lưỡng và giải thích rõ ràng về tình trạng sức khỏe.',
          review_date: new Date('2024-12-01').toISOString(),
          is_verified: true
        },
        {
          doctor_id: doctorId,
          patient_id: patients[1]?.patient_id || patients[0].patient_id,
          rating: 4,
          review_text: 'Bác sĩ có kinh nghiệm, điều trị hiệu quả. Thái độ thân thiện và lắng nghe bệnh nhân.',
          review_date: new Date('2024-11-15').toISOString(),
          is_verified: true
        },
        {
          doctor_id: doctorId,
          patient_id: patients[2]?.patient_id || patients[0].patient_id,
          rating: 5,
          review_text: 'Rất hài lòng với dịch vụ khám chữa bệnh. Bác sĩ tư vấn chi tiết và theo dõi sát sao.',
          review_date: new Date('2024-11-01').toISOString(),
          is_verified: true
        }
      ];
      
      const { data: reviewData, error: reviewError } = await supabase
        .from('doctor_reviews')
        .insert(reviews)
        .select();
        
      if (reviewError) {
        console.log('❌ Error creating reviews:', reviewError.message);
      } else {
        console.log(`✅ Created ${reviewData.length} patient reviews`);
      }
    }
    
    // 3. Create doctor schedules
    console.log('📅 Creating work schedules...');
    
    const schedules = [
      {
        doctor_id: doctorId,
        day_of_week: 1, // Monday
        start_time: '08:00:00',
        end_time: '17:00:00',
        is_available: true,
        break_start: '12:00:00',
        break_end: '13:00:00',
        max_appointments: 20,
        slot_duration: 30
      },
      {
        doctor_id: doctorId,
        day_of_week: 2, // Tuesday
        start_time: '08:00:00',
        end_time: '17:00:00',
        is_available: true,
        break_start: '12:00:00',
        break_end: '13:00:00',
        max_appointments: 20,
        slot_duration: 30
      },
      {
        doctor_id: doctorId,
        day_of_week: 3, // Wednesday
        start_time: '08:00:00',
        end_time: '17:00:00',
        is_available: true,
        break_start: '12:00:00',
        break_end: '13:00:00',
        max_appointments: 20,
        slot_duration: 30
      },
      {
        doctor_id: doctorId,
        day_of_week: 4, // Thursday
        start_time: '08:00:00',
        end_time: '17:00:00',
        is_available: true,
        break_start: '12:00:00',
        break_end: '13:00:00',
        max_appointments: 20,
        slot_duration: 30
      },
      {
        doctor_id: doctorId,
        day_of_week: 5, // Friday
        start_time: '08:00:00',
        end_time: '17:00:00',
        is_available: true,
        break_start: '12:00:00',
        break_end: '13:00:00',
        max_appointments: 20,
        slot_duration: 30
      }
    ];
    
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('doctor_schedules')
      .insert(schedules)
      .select();
      
    if (scheduleError) {
      console.log('❌ Error creating schedules:', scheduleError.message);
    } else {
      console.log(`✅ Created ${scheduleData.length} work schedules`);
    }
    
    // 4. Update doctor stats
    console.log('📊 Updating doctor statistics...');
    
    const { data: updateData, error: updateError } = await supabase
      .from('doctors')
      .update({
        rating: 4.7,
        total_reviews: 3,
        success_rate: 96.5,
        total_revenue: 25000000,
        average_consultation_time: 35
      })
      .eq('doctor_id', doctorId)
      .select();
      
    if (updateError) {
      console.log('❌ Error updating doctor stats:', updateError.message);
    } else {
      console.log('✅ Updated doctor statistics');
    }
    
    console.log('\n🎉 Sample data creation completed!');
    console.log('✅ Doctor profile should now display properly with real data');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createDoctorSampleData().catch(console.error);
