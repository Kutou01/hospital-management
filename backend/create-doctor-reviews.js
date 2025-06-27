const { createClient } = require('@supabase/supabase-js');

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createDoctorReviews() {
  console.log('⭐ Creating doctor reviews with service role...');
  
  const doctorId = 'GENE-DOC-202506-006';
  
  try {
    // Get some patient IDs
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('patient_id')
      .limit(3);
      
    if (patientsError) {
      console.log('❌ Error getting patients:', patientsError.message);
      return;
    }
    
    if (!patients || patients.length === 0) {
      console.log('❌ No patients found in database');
      return;
    }
    
    console.log(`📋 Found ${patients.length} patients for reviews`);
    
    const reviews = [
      {
        review_id: 'REV-202506-001',
        doctor_id: doctorId,
        patient_id: patients[0].patient_id,
        rating: 5,
        review_text: 'Bác sĩ Đức rất tận tâm và chuyên nghiệp. Khám bệnh kỹ lưỡng và giải thích rõ ràng về tình trạng sức khỏe.',
        review_date: new Date('2024-12-01').toISOString(),
        is_verified: true
      },
      {
        review_id: 'REV-202506-002',
        doctor_id: doctorId,
        patient_id: patients[1]?.patient_id || patients[0].patient_id,
        rating: 4,
        review_text: 'Bác sĩ có kinh nghiệm, điều trị hiệu quả. Thái độ thân thiện và lắng nghe bệnh nhân.',
        review_date: new Date('2024-11-15').toISOString(),
        is_verified: true
      },
      {
        review_id: 'REV-202506-003',
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
      console.log('   Details:', reviewError);
    } else {
      console.log(`✅ Created ${reviewData.length} patient reviews`);
      
      // Update doctor's total reviews count
      const { error: updateError } = await supabase
        .from('doctors')
        .update({
          total_reviews: reviewData.length,
          rating: 4.7 // Average of 5, 4, 5
        })
        .eq('doctor_id', doctorId);
        
      if (updateError) {
        console.log('❌ Error updating doctor stats:', updateError.message);
      } else {
        console.log('✅ Updated doctor review statistics');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createDoctorReviews().catch(console.error);
