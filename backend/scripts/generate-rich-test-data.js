const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🏥 GENERATING RICH TEST DATA FOR DOCTOR PROFILE');
console.log('==============================================\n');

// Vietnamese patient names
const vietnameseNames = [
  'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Văn Cường', 'Phạm Thị Dung',
  'Hoàng Văn Em', 'Vũ Thị Phương', 'Đặng Văn Giang', 'Bùi Thị Hoa',
  'Đinh Văn Inh', 'Cao Thị Kim', 'Lý Văn Long', 'Phan Thị Mai',
  'Tạ Văn Nam', 'Đỗ Thị Oanh', 'Võ Văn Phúc', 'Chu Thị Quỳnh',
  'Hồ Văn Rồng', 'Lưu Thị Sương', 'Mã Văn Tài', 'Ông Thị Uyên'
];

// Vietnamese review texts
const vietnameseReviews = [
  'Bác sĩ rất tận tâm và chuyên nghiệp. Giải thích rõ ràng về tình trạng bệnh.',
  'Phẫu thuật thành công, bác sĩ có tay nghề cao. Rất hài lòng với dịch vụ.',
  'Bác sĩ khám rất kỹ, tuy nhiên thời gian chờ hơi lâu.',
  'Điều trị hiệu quả, bệnh đã khỏi hoàn toàn. Cảm ơn bác sĩ rất nhiều.',
  'Bác sĩ thân thiện, tư vấn chi tiết. Sẽ giới thiệu cho bạn bè.',
  'Khám bệnh nhanh chóng, chẩn đoán chính xác. Rất chuyên nghiệp.',
  'Bác sĩ có kinh nghiệm, điều trị đúng cách. Bệnh đã thuyên giảm nhiều.',
  'Thái độ tốt, giải thích dễ hiểu. Cảm thấy an tâm khi khám ở đây.',
  'Bác sĩ rất kiên nhẫn, lắng nghe tâm sự của bệnh nhân.',
  'Điều trị thành công, không có biến chứng. Rất tin tưởng bác sĩ.'
];

async function generateRichTestData() {
  try {
    console.log('📊 Step 1: Updating existing appointments with new fields...');
    
    // Update existing appointments with patient_type and priority
    const { data: existingAppointments, error: fetchError } = await supabase
      .from('appointments')
      .select('appointment_id');

    if (fetchError) {
      console.error('❌ Error fetching appointments:', fetchError);
      return;
    }

    // Update existing appointments
    for (const apt of existingAppointments || []) {
      const patientType = Math.random() > 0.6 ? 'new' : 'returning';
      const priority = Math.random() > 0.9 ? 'urgent' : 'normal';
      const rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars

      await supabase
        .from('appointments')
        .update({
          patient_type: patientType,
          priority: priority,
          appointment_rating: rating,
          consultation_duration: Math.floor(Math.random() * 30) + 20 // 20-50 minutes
        })
        .eq('appointment_id', apt.appointment_id);
    }

    console.log(`✅ Updated ${existingAppointments?.length || 0} existing appointments`);

    console.log('\n📅 Step 2: Generating additional appointments...');
    
    // Get test doctor
    const { data: testDoctor, error: doctorError } = await supabase
      .from('doctors')
      .select('doctor_id')
      .eq('doctor_id', 'GENE-DOC-202506-006')
      .single();

    if (doctorError || !testDoctor) {
      console.error('❌ Test doctor not found');
      return;
    }

    // Get test patients
    const { data: testPatients, error: patientsError } = await supabase
      .from('patients')
      .select('patient_id')
      .limit(10);

    if (patientsError || !testPatients || testPatients.length === 0) {
      console.error('❌ No test patients found');
      return;
    }

    // Generate appointments for the last 30 days and next 7 days
    const appointments = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    for (let i = 0; i < 37; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      // Skip weekends for some variety
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        if (Math.random() > 0.3) continue;
      }

      // Generate 1-4 appointments per day
      const appointmentsPerDay = Math.floor(Math.random() * 4) + 1;
      
      for (let j = 0; j < appointmentsPerDay; j++) {
        const hour = 8 + Math.floor(Math.random() * 8); // 8 AM to 4 PM
        const minute = Math.random() > 0.5 ? 0 : 30;
        
        const appointmentDate = currentDate.toISOString().split('T')[0];
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
        const endHour = minute === 30 ? hour + 1 : hour;
        const endMinute = minute === 30 ? 0 : 30;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}:00`;
        
        // Determine status based on date
        let status = 'scheduled';
        if (currentDate < new Date()) {
          status = Math.random() > 0.1 ? 'completed' : 'cancelled';
        }

        const patientType = Math.random() > 0.4 ? 'returning' : 'new';
        const priority = Math.random() > 0.95 ? 'urgent' : 'normal';
        const rating = status === 'completed' ? Math.floor(Math.random() * 2) + 4 : null;

        appointments.push({
          appointment_id: `APT-${Math.floor(Math.random() * 900000) + 100000}`,
          doctor_id: testDoctor.doctor_id,
          patient_id: testPatients[Math.floor(Math.random() * testPatients.length)].patient_id,
          appointment_date: appointmentDate,
          start_time: startTime,
          end_time: endTime,
          appointment_type: 'consultation',
          status: status,
          reason: 'Khám tổng quát',
          patient_type: patientType,
          priority: priority,
          consultation_duration: Math.floor(Math.random() * 30) + 20,
          appointment_rating: rating,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }

    // Insert appointments in batches
    const batchSize = 10;
    for (let i = 0; i < appointments.length; i += batchSize) {
      const batch = appointments.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('appointments')
        .insert(batch);

      if (insertError) {
        console.error('❌ Error inserting appointment batch:', insertError);
      }
    }

    console.log(`✅ Generated ${appointments.length} additional appointments`);

    console.log('\n⭐ Step 3: Generating additional reviews...');
    
    // Generate more reviews
    const reviews = [];
    for (let i = 0; i < 15; i++) {
      const reviewDate = new Date();
      reviewDate.setDate(reviewDate.getDate() - Math.floor(Math.random() * 60));
      
      reviews.push({
        review_id: `REV-${Math.floor(Math.random() * 900000) + 100000}`,
        doctor_id: testDoctor.doctor_id,
        patient_id: testPatients[Math.floor(Math.random() * testPatients.length)].patient_id,
        rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars mostly
        review_text: vietnameseReviews[Math.floor(Math.random() * vietnameseReviews.length)],
        review_date: reviewDate.toISOString(),
        is_verified: Math.random() > 0.3,
        helpful_count: Math.floor(Math.random() * 10),

        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    const { error: reviewsError } = await supabase
      .from('doctor_reviews')
      .insert(reviews);

    if (reviewsError) {
      console.error('❌ Error inserting reviews:', reviewsError);
    } else {
      console.log(`✅ Generated ${reviews.length} additional reviews`);
    }

    console.log('\n📈 Step 4: Generating performance metrics...');
    
    // Generate performance metrics for the last 30 days
    const metrics = [];
    for (let i = 0; i < 30; i++) {
      const metricDate = new Date();
      metricDate.setDate(metricDate.getDate() - i);
      
      const dateStr = metricDate.toISOString().split('T')[0];
      
      metrics.push({
        metric_id: `MET-${Math.floor(Math.random() * 900000) + 100000}`,
        doctor_id: testDoctor.doctor_id,
        metric_date: dateStr,
        total_appointments: Math.floor(Math.random() * 8) + 2,
        completed_appointments: Math.floor(Math.random() * 6) + 2,
        cancelled_appointments: Math.floor(Math.random() * 2),
        no_show_appointments: Math.floor(Math.random() * 1),
        new_patients: Math.floor(Math.random() * 3) + 1,
        returning_patients: Math.floor(Math.random() * 4) + 1,
        total_unique_patients: Math.floor(Math.random() * 6) + 3,
        average_consultation_time: Math.floor(Math.random() * 20) + 25,
        on_time_percentage: Math.floor(Math.random() * 20) + 80,
        patient_satisfaction_score: (Math.random() * 1 + 4).toFixed(2),
        success_rate: Math.floor(Math.random() * 15) + 85,
        total_revenue: (Math.random() * 2000000 + 1000000).toFixed(2),
        average_revenue_per_patient: (Math.random() * 300000 + 200000).toFixed(2),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    // Insert metrics in batches
    for (let i = 0; i < metrics.length; i += batchSize) {
      const batch = metrics.slice(i, i + batchSize);
      const { error: metricsError } = await supabase
        .from('doctor_performance_metrics')
        .upsert(batch, { onConflict: 'doctor_id,metric_date' });

      if (metricsError) {
        console.error('❌ Error inserting metrics batch:', metricsError);
      }
    }

    console.log(`✅ Generated ${metrics.length} performance metrics`);

    console.log('\n🎯 Step 5: Updating doctor rating based on reviews...');
    
    // Calculate and update doctor's overall rating
    const { data: allReviews, error: allReviewsError } = await supabase
      .from('doctor_reviews')
      .select('rating')
      .eq('doctor_id', testDoctor.doctor_id);

    if (!allReviewsError && allReviews && allReviews.length > 0) {
      const averageRating = allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length;
      
      await supabase
        .from('doctors')
        .update({
          rating: Math.round(averageRating * 100) / 100,
          total_reviews: allReviews.length
        })
        .eq('doctor_id', testDoctor.doctor_id);

      console.log(`✅ Updated doctor rating: ${averageRating.toFixed(2)} (${allReviews.length} reviews)`);
    }

    console.log('\n✅ RICH TEST DATA GENERATION COMPLETED!');
    console.log('=====================================');
    console.log(`📊 Generated data summary:`);
    console.log(`   • ${appointments.length} new appointments`);
    console.log(`   • ${reviews.length} new reviews`);
    console.log(`   • ${metrics.length} performance metrics`);
    console.log(`   • Updated doctor ratings`);
    console.log('\n🎉 Your doctor profile page now has rich data for testing!');

  } catch (error) {
    console.error('💥 Error generating test data:', error);
  }
}

// Run the data generation
generateRichTestData()
  .then(() => {
    console.log('\n🏁 Test data generation completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test data generation failed:', error);
    process.exit(1);
  });
