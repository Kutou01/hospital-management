const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateFinalSummary() {
  console.log('📊 DOCTOR SERVICE TEST DATA - FINAL SUMMARY');
  console.log('='.repeat(60));

  try {
    // Get comprehensive data overview
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, role, full_name, is_active')
      .eq('role', 'doctor');

    const { data: doctors } = await supabase
      .from('doctors')
      .select(`
        doctor_id,
        profile_id,
        full_name,
        specialty,
        department_id,
        license_number,
        experience_years,
        consultation_fee,
        rating,
        total_reviews,
        status,
        availability_status
      `)
      .eq('status', 'active');

    const { data: patients } = await supabase
      .from('patients')
      .select('patient_id, profile_id, full_name, gender, status')
      .eq('status', 'active');

    const { data: appointments } = await supabase
      .from('appointments')
      .select(`
        appointment_id,
        doctor_id,
        patient_id,
        appointment_date,
        start_time,
        appointment_type,
        status
      `)
      .order('appointment_date', { ascending: false });

    const { data: reviews } = await supabase
      .from('doctor_reviews')
      .select(`
        review_id,
        doctor_id,
        patient_id,
        rating,
        review_date
      `)
      .order('review_date', { ascending: false });

    const { data: departments } = await supabase
      .from('departments')
      .select('department_id, department_name, department_code')
      .eq('is_active', true);

    const { data: specialties } = await supabase
      .from('specialties')
      .select('specialty_id, specialty_name, department_id')
      .eq('is_active', true);

    console.log('📋 DATA OVERVIEW:');
    console.log('='.repeat(40));
    console.log(`   👨‍⚕️ Doctor profiles: ${profiles?.length || 0}`);
    console.log(`   👨‍⚕️ Doctor records: ${doctors?.length || 0}`);
    console.log(`   🤒 Patient records: ${patients?.length || 0}`);
    console.log(`   📅 Appointments: ${appointments?.length || 0}`);
    console.log(`   ⭐ Reviews: ${reviews?.length || 0}`);
    console.log(`   🏥 Departments: ${departments?.length || 0}`);
    console.log(`   🩺 Specialties: ${specialties?.length || 0}`);

    // Doctor details
    console.log('\n👨‍⚕️ DOCTOR DETAILS:');
    console.log('='.repeat(40));
    if (doctors && doctors.length > 0) {
      doctors.forEach((doctor, index) => {
        const profile = profiles?.find(p => p.id === doctor.profile_id);
        const specialty = specialties?.find(s => s.specialty_id === doctor.specialty);
        const department = departments?.find(d => d.department_id === doctor.department_id);
        
        console.log(`   ${index + 1}. ${doctor.doctor_id}`);
        console.log(`      Name: ${doctor.full_name || profile?.full_name || 'N/A'}`);
        console.log(`      Email: ${profile?.email || 'N/A'}`);
        console.log(`      Department: ${department?.department_name || doctor.department_id}`);
        console.log(`      Specialty: ${specialty?.specialty_name || doctor.specialty}`);
        console.log(`      License: ${doctor.license_number}`);
        console.log(`      Experience: ${doctor.experience_years} years`);
        console.log(`      Fee: ${doctor.consultation_fee ? doctor.consultation_fee.toLocaleString() + ' VND' : 'N/A'}`);
        console.log(`      Rating: ${doctor.rating || 0}/5 (${doctor.total_reviews || 0} reviews)`);
        console.log(`      Status: ${doctor.status} / ${doctor.availability_status}`);
        console.log('');
      });
    } else {
      console.log('   ❌ No doctors found');
    }

    // Appointment summary
    console.log('📅 APPOINTMENT SUMMARY:');
    console.log('='.repeat(40));
    if (appointments && appointments.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = appointments.filter(a => a.appointment_date === today);
      const upcomingAppointments = appointments.filter(a => a.appointment_date > today);
      const pastAppointments = appointments.filter(a => a.appointment_date < today);
      const completedAppointments = appointments.filter(a => a.status === 'completed');
      const confirmedAppointments = appointments.filter(a => a.status === 'confirmed');
      const pendingAppointments = appointments.filter(a => a.status === 'pending');

      console.log(`   📊 Total appointments: ${appointments.length}`);
      console.log(`   📅 Today's appointments: ${todayAppointments.length}`);
      console.log(`   ⏭️ Upcoming appointments: ${upcomingAppointments.length}`);
      console.log(`   ⏮️ Past appointments: ${pastAppointments.length}`);
      console.log(`   ✅ Completed: ${completedAppointments.length}`);
      console.log(`   🔄 Confirmed: ${confirmedAppointments.length}`);
      console.log(`   ⏳ Pending: ${pendingAppointments.length}`);

      console.log('\n   Recent appointments:');
      appointments.slice(0, 5).forEach((apt, index) => {
        const doctor = doctors?.find(d => d.doctor_id === apt.doctor_id);
        const patient = patients?.find(p => p.patient_id === apt.patient_id);
        console.log(`     ${index + 1}. ${apt.appointment_date} ${apt.start_time}`);
        console.log(`        Doctor: ${doctor?.full_name || apt.doctor_id}`);
        console.log(`        Patient: ${patient?.full_name || apt.patient_id}`);
        console.log(`        Type: ${apt.appointment_type} | Status: ${apt.status}`);
      });
    } else {
      console.log('   ❌ No appointments found');
    }

    // Review summary
    console.log('\n⭐ REVIEW SUMMARY:');
    console.log('='.repeat(40));
    if (reviews && reviews.length > 0) {
      const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      const ratingDistribution = {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length
      };

      console.log(`   📊 Total reviews: ${reviews.length}`);
      console.log(`   ⭐ Average rating: ${averageRating.toFixed(1)}/5`);
      console.log(`   📈 Rating distribution:`);
      console.log(`     5 stars: ${ratingDistribution[5]} reviews`);
      console.log(`     4 stars: ${ratingDistribution[4]} reviews`);
      console.log(`     3 stars: ${ratingDistribution[3]} reviews`);
      console.log(`     2 stars: ${ratingDistribution[2]} reviews`);
      console.log(`     1 star: ${ratingDistribution[1]} reviews`);

      // Doctor review breakdown
      console.log('\n   Doctor review breakdown:');
      doctors?.forEach(doctor => {
        const doctorReviews = reviews.filter(r => r.doctor_id === doctor.doctor_id);
        if (doctorReviews.length > 0) {
          const avgRating = doctorReviews.reduce((sum, r) => sum + r.rating, 0) / doctorReviews.length;
          console.log(`     ${doctor.full_name || doctor.doctor_id}: ${avgRating.toFixed(1)}/5 (${doctorReviews.length} reviews)`);
        }
      });
    } else {
      console.log('   ❌ No reviews found');
    }

    // Test readiness assessment
    console.log('\n🧪 TEST READINESS ASSESSMENT:');
    console.log('='.repeat(40));
    
    const hasEnoughDoctors = doctors && doctors.length >= 3;
    const hasEnoughPatients = patients && patients.length >= 2;
    const hasAppointments = appointments && appointments.length >= 3;
    const hasReviews = reviews && reviews.length >= 1;
    const hasDepartments = departments && departments.length >= 3;
    const hasSpecialties = specialties && specialties.length >= 3;

    console.log(`   👨‍⚕️ Doctors (≥3): ${hasEnoughDoctors ? '✅' : '❌'} ${doctors?.length || 0}`);
    console.log(`   🤒 Patients (≥2): ${hasEnoughPatients ? '✅' : '❌'} ${patients?.length || 0}`);
    console.log(`   📅 Appointments (≥3): ${hasAppointments ? '✅' : '❌'} ${appointments?.length || 0}`);
    console.log(`   ⭐ Reviews (≥1): ${hasReviews ? '✅' : '❌'} ${reviews?.length || 0}`);
    console.log(`   🏥 Departments (≥3): ${hasDepartments ? '✅' : '❌'} ${departments?.length || 0}`);
    console.log(`   🩺 Specialties (≥3): ${hasSpecialties ? '✅' : '❌'} ${specialties?.length || 0}`);

    const isReady = hasEnoughDoctors && hasEnoughPatients && hasAppointments && hasReviews && hasDepartments && hasSpecialties;

    console.log('\n🎯 FINAL VERDICT:');
    console.log('='.repeat(40));
    if (isReady) {
      console.log('🎉 DOCTOR SERVICE IS READY FOR TESTING!');
      console.log('');
      console.log('✅ What you can test:');
      console.log('   - Doctor Dashboard with real statistics');
      console.log('   - Doctor login and authentication');
      console.log('   - Appointment management');
      console.log('   - Patient reviews and ratings');
      console.log('   - Department and specialty filtering');
      console.log('   - Doctor profile management');
      console.log('');
      console.log('🔑 Test login credentials:');
      profiles?.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.email} / Doctor123!`);
      });
      console.log('');
      console.log('🌐 Test URLs:');
      console.log('   - Doctor Dashboard: http://localhost:3001/doctors/dashboard');
      console.log('   - Doctor Login: http://localhost:3001/auth/login');
    } else {
      console.log('⚠️ DOCTOR SERVICE NEEDS MORE TEST DATA');
      console.log('');
      console.log('❌ Missing requirements:');
      if (!hasEnoughDoctors) console.log('   - Need more doctors (minimum 3)');
      if (!hasEnoughPatients) console.log('   - Need more patients (minimum 2)');
      if (!hasAppointments) console.log('   - Need more appointments (minimum 3)');
      if (!hasReviews) console.log('   - Need more reviews (minimum 1)');
      if (!hasDepartments) console.log('   - Need more departments (minimum 3)');
      if (!hasSpecialties) console.log('   - Need more specialties (minimum 3)');
    }

  } catch (error) {
    console.error('❌ Error generating summary:', error.message);
  }
}

async function main() {
  await generateFinalSummary();
}

main().catch(console.error);
