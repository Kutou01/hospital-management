const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Generate appointment ID based on department pattern
function generateAppointmentId(departmentId) {
  const now = new Date();
  const yearMonth = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0');
  const sequence = Math.floor(Math.random() * 999) + 1;
  
  // Get department code from department_id
  const deptCode = departmentId === 'DEPT001' ? 'CARD' : 
                   departmentId === 'DEPT002' ? 'ORTH' :
                   departmentId === 'DEPT003' ? 'PEDI' : 'GEN';
  
  return `${deptCode}-APT-${yearMonth}-${sequence.toString().padStart(3, '0')}`;
}

// Generate review ID
function generateReviewId() {
  const now = new Date();
  const yearMonth = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0');
  const sequence = Math.floor(Math.random() * 999) + 1;
  return `REV-${yearMonth}-${sequence.toString().padStart(3, '0')}`;
}

async function createAppointmentsAndReviews() {
  console.log('📅 CREATING APPOINTMENTS AND REVIEWS TEST DATA');
  console.log('='.repeat(60));

  try {
    // Get existing doctors and patients
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select('doctor_id, department_id, full_name')
      .eq('status', 'active')
      .limit(5);

    if (doctorsError) {
      console.log('❌ Error fetching doctors:', doctorsError.message);
      return;
    }

    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('patient_id, full_name')
      .eq('status', 'active')
      .limit(3);

    if (patientsError) {
      console.log('❌ Error fetching patients:', patientsError.message);
      return;
    }

    console.log(`📋 Found ${doctors.length} doctors and ${patients.length} patients`);

    if (doctors.length === 0 || patients.length === 0) {
      console.log('❌ Need doctors and patients to create appointments');
      return;
    }

    // Step 1: Create appointments
    console.log('\n📝 Step 1: Creating appointments...');
    
    const today = new Date();
    const appointments = [];

    for (let i = 0; i < 12; i++) {
      const appointmentDate = new Date(today);
      appointmentDate.setDate(today.getDate() + (i - 6)); // Past, present, and future
      
      const hour = 8 + (i % 8); // 8AM to 3PM
      const status = i < 4 ? 'completed' : i < 8 ? 'confirmed' : 'pending';
      const doctor = doctors[i % doctors.length];
      const patient = patients[i % patients.length];
      
      appointments.push({
        appointment_id: generateAppointmentId(doctor.department_id),
        doctor_id: doctor.doctor_id,
        patient_id: patient.patient_id,
        appointment_date: appointmentDate.toISOString().split('T')[0],
        start_time: `${hour.toString().padStart(2, '0')}:00:00`,
        end_time: `${(hour + 1).toString().padStart(2, '0')}:00:00`,
        appointment_type: ['Khám tổng quát', 'Tái khám', 'Khám chuyên khoa'][i % 3],
        status: status,
        notes: `Ghi chú cuộc hẹn ${i + 1}`,
        reason: ['Đau ngực', 'Khám định kỳ', 'Theo dõi điều trị', 'Khám sức khỏe'][i % 4],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    const { data: createdAppointments, error: appointmentError } = await supabase
      .from('appointments')
      .insert(appointments)
      .select();

    if (appointmentError) {
      console.log('❌ Error creating appointments:', appointmentError.message);
      return;
    }

    console.log(`✅ Created ${createdAppointments.length} appointments`);

    // Step 2: Create doctor reviews
    console.log('\n📝 Step 2: Creating doctor reviews...');
    
    const reviews = [];
    const reviewComments = [
      'Bác sĩ rất tận tâm và chuyên nghiệp',
      'Khám bệnh kỹ lưỡng, giải thích rõ ràng',
      'Thái độ thân thiện, điều trị hiệu quả',
      'Bác sĩ giỏi, kinh nghiệm nhiều',
      'Rất hài lòng với dịch vụ khám chữa bệnh',
      'Bác sĩ tư vấn chi tiết, dễ hiểu',
      'Phòng khám sạch sẽ, dịch vụ tốt',
      'Thời gian chờ hợp lý, bác sĩ nhiệt tình',
      'Điều trị hiệu quả, theo dõi tốt',
      'Bác sĩ có kinh nghiệm, đáng tin cậy'
    ];

    for (let i = 0; i < 20; i++) {
      const rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars mostly
      const doctor = doctors[i % doctors.length];
      const patient = patients[i % patients.length];
      const reviewDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      
      reviews.push({
        review_id: generateReviewId(),
        doctor_id: doctor.doctor_id,
        patient_id: patient.patient_id,
        rating: rating,
        comment: reviewComments[i % reviewComments.length],
        review_date: reviewDate.toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    const { data: createdReviews, error: reviewError } = await supabase
      .from('doctor_reviews')
      .insert(reviews)
      .select();

    if (reviewError) {
      console.log('❌ Error creating reviews:', reviewError.message);
      return;
    }

    console.log(`✅ Created ${createdReviews.length} doctor reviews`);

    // Step 3: Update doctor ratings based on reviews
    console.log('\n📝 Step 3: Updating doctor ratings...');
    
    for (const doctor of doctors) {
      const { data: doctorReviews } = await supabase
        .from('doctor_reviews')
        .select('rating')
        .eq('doctor_id', doctor.doctor_id);

      if (doctorReviews && doctorReviews.length > 0) {
        const totalRating = doctorReviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / doctorReviews.length;
        
        await supabase
          .from('doctors')
          .update({
            rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
            total_reviews: doctorReviews.length
          })
          .eq('doctor_id', doctor.doctor_id);
        
        console.log(`   Updated ${doctor.full_name}: ${averageRating.toFixed(1)}/5 (${doctorReviews.length} reviews)`);
      }
    }

    console.log('\n✅ ALL APPOINTMENTS AND REVIEWS CREATED!');
    console.log('='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   - Appointments: ${createdAppointments.length}`);
    console.log(`   - Reviews: ${createdReviews.length}`);
    console.log(`   - Updated doctor ratings: ${doctors.length}`);

    // Final verification
    console.log('\n🔍 Final verification:');
    
    const { count: appointmentCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true });
    
    const { count: reviewCount } = await supabase
      .from('doctor_reviews')
      .select('*', { count: 'exact', head: true });
    
    const { count: doctorCount } = await supabase
      .from('doctors')
      .select('*', { count: 'exact', head: true });
    
    const { count: patientCount } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });

    console.log(`   Total appointments in DB: ${appointmentCount}`);
    console.log(`   Total reviews in DB: ${reviewCount}`);
    console.log(`   Total doctors in DB: ${doctorCount}`);
    console.log(`   Total patients in DB: ${patientCount}`);

  } catch (error) {
    console.error('❌ Error creating appointments and reviews:', error.message);
  }
}

async function main() {
  await createAppointmentsAndReviews();
}

main().catch(console.error);
