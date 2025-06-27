const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function mainAccountsSummary() {
  console.log('🎯 MAIN TEST ACCOUNTS - COMPREHENSIVE SUMMARY');
  console.log('='.repeat(70));

  try {
    // Get doctor info
    const { data: doctorProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'doctor@hospital.com')
      .single();

    const { data: doctorRecord } = await supabase
      .from('doctors')
      .select('*')
      .eq('profile_id', doctorProfile?.id)
      .single();

    // Get patient info
    const { data: patientProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'patient@hospital.com')
      .single();

    const { data: patientRecord } = await supabase
      .from('patients')
      .select('*')
      .eq('profile_id', patientProfile?.id)
      .single();

    // Get appointments between them
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('doctor_id', doctorRecord?.doctor_id)
      .eq('patient_id', patientRecord?.patient_id)
      .order('appointment_date', { ascending: false });

    // Get reviews
    const { data: reviews } = await supabase
      .from('doctor_reviews')
      .select('*')
      .eq('doctor_id', doctorRecord?.doctor_id)
      .eq('patient_id', patientRecord?.patient_id);

    console.log('👨‍⚕️ DOCTOR ACCOUNT - doctor@hospital.com');
    console.log('='.repeat(50));
    console.log(`📧 Email: doctor@hospital.com`);
    console.log(`🔑 Password: Doctor123!`);
    console.log(`👤 Full Name: ${doctorRecord?.full_name || 'BS. Nguyễn Văn Đức'}`);
    console.log(`🆔 Doctor ID: ${doctorRecord?.doctor_id}`);
    console.log(`📜 License: ${doctorRecord?.license_number}`);
    console.log(`🏥 Department: Khoa Tim Mạch (DEPT001)`);
    console.log(`🩺 Specialty: Tim Mạch Học (SPEC028)`);
    console.log(`📅 Experience: ${doctorRecord?.experience_years} years`);
    console.log(`💰 Consultation Fee: ${doctorRecord?.consultation_fee?.toLocaleString()} VND`);
    console.log(`⭐ Rating: ${doctorRecord?.rating}/5 (${doctorRecord?.total_reviews} reviews)`);
    console.log(`📱 Phone: ${doctorProfile?.phone_number}`);
    console.log(`🎂 Date of Birth: ${doctorProfile?.date_of_birth}`);
    console.log(`🏠 Address: 123 Đường Nguyễn Văn Cừ, Quận 1, TP.HCM`);
    console.log(`🎓 Qualification: ${doctorRecord?.qualification}`);
    console.log(`🌐 Languages: Vietnamese, English, French`);
    console.log(`📝 Bio: Bác sĩ chuyên khoa Tim mạch với 20 năm kinh nghiệm...`);

    console.log('\n🤒 PATIENT ACCOUNT - patient@hospital.com');
    console.log('='.repeat(50));
    console.log(`📧 Email: patient@hospital.com`);
    console.log(`🔑 Password: Patient123!`);
    console.log(`👤 Full Name: ${patientRecord?.full_name || 'Trần Thị Hương'}`);
    console.log(`🆔 Patient ID: ${patientRecord?.patient_id}`);
    console.log(`👩 Gender: ${patientRecord?.gender}`);
    console.log(`🩸 Blood Type: ${patientRecord?.blood_type}`);
    console.log(`📱 Phone: ${patientProfile?.phone_number}`);
    console.log(`🎂 Date of Birth: ${patientProfile?.date_of_birth} (Age: 39)`);
    console.log(`🏠 Address: 456 Đường Lê Lợi, Quận 1, TP.HCM`);
    console.log(`🏥 Insurance: BHYT - DN1234567890`);
    console.log(`👨‍👩‍👧‍👦 Emergency Contact: Trần Văn Minh (Chồng) - 0912345678`);
    
    if (patientRecord?.chronic_conditions) {
      console.log(`🏥 Chronic Conditions: ${patientRecord.chronic_conditions.join(', ')}`);
    }
    
    if (patientRecord?.allergies) {
      console.log(`⚠️ Allergies: ${patientRecord.allergies.join(', ')}`);
    }
    
    if (patientRecord?.current_medications) {
      console.log(`💊 Current Medications:`);
      Object.entries(patientRecord.current_medications).forEach(([med, instruction]) => {
        console.log(`     - ${med}: ${instruction}`);
      });
    }

    console.log('\n📅 APPOINTMENTS BETWEEN MAIN ACCOUNTS');
    console.log('='.repeat(50));
    console.log(`📊 Total Appointments: ${appointments?.length || 0}`);
    
    if (appointments && appointments.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const past = appointments.filter(a => a.appointment_date < today);
      const future = appointments.filter(a => a.appointment_date >= today);
      const completed = appointments.filter(a => a.status === 'completed');
      const confirmed = appointments.filter(a => a.status === 'confirmed');
      const scheduled = appointments.filter(a => a.status === 'scheduled');

      console.log(`   📈 Past appointments: ${past.length}`);
      console.log(`   📅 Future appointments: ${future.length}`);
      console.log(`   ✅ Completed: ${completed.length}`);
      console.log(`   🔄 Confirmed: ${confirmed.length}`);
      console.log(`   📋 Scheduled: ${scheduled.length}`);

      console.log('\n   📋 Recent Appointments:');
      appointments.slice(0, 5).forEach((apt, index) => {
        const status = apt.status === 'completed' ? '✅' : 
                     apt.status === 'confirmed' ? '🔄' : 
                     apt.status === 'scheduled' ? '📋' : '❌';
        console.log(`     ${index + 1}. ${apt.appointment_date} ${apt.start_time} ${status}`);
        console.log(`        Type: ${apt.appointment_type} | Reason: ${apt.reason}`);
      });
    }

    console.log('\n⭐ REVIEWS BETWEEN MAIN ACCOUNTS');
    console.log('='.repeat(50));
    console.log(`📊 Total Reviews: ${reviews?.length || 0}`);
    
    if (reviews && reviews.length > 0) {
      reviews.forEach((review, index) => {
        console.log(`   ${index + 1}. ${review.rating}/5 stars - ${review.review_date}`);
      });
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      console.log(`   📊 Average Rating: ${avgRating.toFixed(1)}/5`);
    }

    console.log('\n🧪 TESTING CAPABILITIES');
    console.log('='.repeat(50));
    console.log('✅ Doctor Service Testing:');
    console.log('   - Login with doctor@hospital.com');
    console.log('   - View comprehensive doctor dashboard');
    console.log('   - Manage appointments with real data');
    console.log('   - View patient reviews and ratings');
    console.log('   - Update doctor profile and settings');
    console.log('   - Schedule management and availability');
    console.log('');
    console.log('✅ Patient Service Testing:');
    console.log('   - Login with patient@hospital.com');
    console.log('   - View patient dashboard with medical history');
    console.log('   - Book appointments with doctors');
    console.log('   - View appointment history and status');
    console.log('   - Manage medical records and medications');
    console.log('   - Leave reviews for doctors');
    console.log('   - Update personal and emergency contact info');
    console.log('');
    console.log('✅ Appointment Service Testing:');
    console.log('   - Create new appointments');
    console.log('   - Modify existing appointments');
    console.log('   - Cancel and reschedule');
    console.log('   - View appointment calendar');
    console.log('   - Status management (pending → confirmed → completed)');
    console.log('');
    console.log('✅ Review System Testing:');
    console.log('   - Patient can review doctors after appointments');
    console.log('   - Rating system (1-5 stars)');
    console.log('   - Review history and management');
    console.log('   - Doctor rating calculations');

    console.log('\n🌐 TESTING URLS');
    console.log('='.repeat(50));
    console.log('🔗 Frontend URLs:');
    console.log('   - Login: http://localhost:3001/auth/login');
    console.log('   - Doctor Dashboard: http://localhost:3001/doctors/dashboard');
    console.log('   - Patient Dashboard: http://localhost:3001/patients/dashboard');
    console.log('   - Appointments: http://localhost:3001/appointments');
    console.log('');
    console.log('🔗 API Endpoints:');
    console.log('   - Doctor API: http://localhost:3002/api/doctors');
    console.log('   - Patient API: http://localhost:3003/api/patients');
    console.log('   - Appointment API: http://localhost:3004/api/appointments');
    console.log('   - Auth API: http://localhost:3005/api/auth');

    console.log('\n🎯 READY FOR COMPREHENSIVE TESTING!');
    console.log('='.repeat(50));
    console.log('🔑 Main Login Credentials:');
    console.log('   👨‍⚕️ Doctor: doctor@hospital.com / Doctor123!');
    console.log('   🤒 Patient: patient@hospital.com / Patient123!');
    console.log('');
    console.log('📊 Test Data Summary:');
    console.log(`   - ${appointments?.length || 0} appointments between main accounts`);
    console.log(`   - ${reviews?.length || 0} reviews from patient to doctor`);
    console.log('   - Complete medical history and medications');
    console.log('   - Emergency contacts and insurance info');
    console.log('   - Professional qualifications and certifications');
    console.log('');
    console.log('🚀 Start testing by logging into either account!');

  } catch (error) {
    console.error('❌ Error generating main accounts summary:', error.message);
  }
}

async function main() {
  await mainAccountsSummary();
}

main().catch(console.error);
