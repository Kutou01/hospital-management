const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDoctorAPI() {
  console.log('🧪 TESTING DOCTOR API DATA FOR DASHBOARD');
  console.log('='.repeat(60));

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

    console.log('👨‍⚕️ DOCTOR INFO:');
    console.log(`   Profile ID: ${doctorProfile?.id}`);
    console.log(`   Doctor ID: ${doctorRecord?.doctor_id}`);
    console.log(`   Full Name: ${doctorRecord?.full_name}`);
    console.log(`   Email: ${doctorProfile?.email}`);

    // Test 1: Today's appointments
    console.log('\n📅 TEST 1: TODAY\'S APPOINTMENTS');
    console.log('='.repeat(40));
    
    const today = new Date().toISOString().split('T')[0];
    console.log(`   Today's date: ${today}`);
    
    const { data: todayAppointments, error: todayError } = await supabase
      .from('appointments')
      .select(`
        *,
        patients!inner(full_name, patient_id)
      `)
      .eq('doctor_id', doctorRecord?.doctor_id)
      .eq('appointment_date', today)
      .order('start_time');

    if (todayError) {
      console.log(`   ❌ Error: ${todayError.message}`);
    } else {
      console.log(`   ✅ Found ${todayAppointments?.length || 0} appointments for today`);
      todayAppointments?.forEach((apt, index) => {
        console.log(`     ${index + 1}. ${apt.start_time} - ${apt.patients?.full_name}`);
        console.log(`        Status: ${apt.status} | Type: ${apt.appointment_type}`);
      });
    }

    // Test 2: All appointments statistics
    console.log('\n📊 TEST 2: APPOINTMENT STATISTICS');
    console.log('='.repeat(40));
    
    const { data: allAppointments, error: allError } = await supabase
      .from('appointments')
      .select('*')
      .eq('doctor_id', doctorRecord?.doctor_id);

    if (allError) {
      console.log(`   ❌ Error: ${allError.message}`);
    } else {
      const total = allAppointments?.length || 0;
      const completed = allAppointments?.filter(a => a.status === 'completed').length || 0;
      const confirmed = allAppointments?.filter(a => a.status === 'confirmed').length || 0;
      const scheduled = allAppointments?.filter(a => a.status === 'scheduled').length || 0;
      const cancelled = allAppointments?.filter(a => a.status === 'cancelled').length || 0;

      console.log(`   📊 Total Appointments: ${total}`);
      console.log(`   ✅ Completed: ${completed}`);
      console.log(`   🔄 Confirmed: ${confirmed}`);
      console.log(`   📋 Scheduled: ${scheduled}`);
      console.log(`   ❌ Cancelled: ${cancelled}`);
    }

    // Test 3: Patient count
    console.log('\n🤒 TEST 3: PATIENT STATISTICS');
    console.log('='.repeat(40));
    
    // Get unique patients who have appointments with this doctor
    const { data: doctorPatients, error: patientsError } = await supabase
      .from('appointments')
      .select('patient_id')
      .eq('doctor_id', doctorRecord?.doctor_id);

    if (patientsError) {
      console.log(`   ❌ Error: ${patientsError.message}`);
    } else {
      const uniquePatients = [...new Set(doctorPatients?.map(a => a.patient_id))];
      console.log(`   👥 Total Patients: ${uniquePatients.length}`);
    }

    // Test 4: Reviews and ratings
    console.log('\n⭐ TEST 4: REVIEWS AND RATINGS');
    console.log('='.repeat(40));
    
    const { data: reviews, error: reviewsError } = await supabase
      .from('doctor_reviews')
      .select('*')
      .eq('doctor_id', doctorRecord?.doctor_id);

    if (reviewsError) {
      console.log(`   ❌ Error: ${reviewsError.message}`);
    } else {
      const totalReviews = reviews?.length || 0;
      const avgRating = totalReviews > 0 ? 
        reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;

      console.log(`   📊 Total Reviews: ${totalReviews}`);
      console.log(`   ⭐ Average Rating: ${avgRating.toFixed(1)}/5`);
      console.log(`   📈 Rating Distribution:`);
      
      for (let i = 5; i >= 1; i--) {
        const count = reviews?.filter(r => r.rating === i).length || 0;
        console.log(`     ${i} stars: ${count} reviews`);
      }
    }

    // Test 5: Upcoming appointments
    console.log('\n📅 TEST 5: UPCOMING APPOINTMENTS');
    console.log('='.repeat(40));
    
    const { data: upcomingAppointments, error: upcomingError } = await supabase
      .from('appointments')
      .select(`
        *,
        patients!inner(full_name, patient_id)
      `)
      .eq('doctor_id', doctorRecord?.doctor_id)
      .gte('appointment_date', today)
      .order('appointment_date')
      .order('start_time')
      .limit(5);

    if (upcomingError) {
      console.log(`   ❌ Error: ${upcomingError.message}`);
    } else {
      console.log(`   📅 Next ${upcomingAppointments?.length || 0} appointments:`);
      upcomingAppointments?.forEach((apt, index) => {
        console.log(`     ${index + 1}. ${apt.appointment_date} ${apt.start_time}`);
        console.log(`        Patient: ${apt.patients?.full_name}`);
        console.log(`        Status: ${apt.status} | Reason: ${apt.reason}`);
      });
    }

    // Test 6: Recent activity
    console.log('\n🔄 TEST 6: RECENT ACTIVITY');
    console.log('='.repeat(40));
    
    const { data: recentAppointments, error: recentError } = await supabase
      .from('appointments')
      .select(`
        *,
        patients!inner(full_name, patient_id)
      `)
      .eq('doctor_id', doctorRecord?.doctor_id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) {
      console.log(`   ❌ Error: ${recentError.message}`);
    } else {
      console.log(`   🔄 Recent activity (${recentAppointments?.length || 0} items):`);
      recentAppointments?.forEach((apt, index) => {
        console.log(`     ${index + 1}. ${apt.appointment_date} - ${apt.patients?.full_name}`);
        console.log(`        Action: ${apt.status} appointment`);
      });
    }

    // Summary for dashboard
    console.log('\n📋 DASHBOARD DATA SUMMARY');
    console.log('='.repeat(40));
    console.log('🎯 Data that should appear in dashboard:');
    console.log(`   👨‍⚕️ Doctor Name: ${doctorRecord?.full_name}`);
    console.log(`   📅 Today's Appointments: ${todayAppointments?.length || 0}`);
    console.log(`   📊 Total Appointments: ${allAppointments?.length || 0}`);
    console.log(`   👥 Total Patients: ${[...new Set(doctorPatients?.map(a => a.patient_id))].length}`);
    console.log(`   ⭐ Average Rating: ${reviews?.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 0}/5`);
    console.log(`   📝 Total Reviews: ${reviews?.length || 0}`);

    console.log('\n🔧 RECOMMENDATIONS:');
    console.log('='.repeat(40));
    if ((todayAppointments?.length || 0) === 0) {
      console.log('⚠️ No appointments for today - check if appointment dates are correct');
    }
    if ((allAppointments?.length || 0) === 0) {
      console.log('⚠️ No appointments found - check doctor_id matching');
    }
    if (doctorRecord?.full_name !== 'BS. Nguyễn Văn Đức') {
      console.log('⚠️ Doctor name not updated - check doctor record update');
    }
    console.log('✅ API endpoints should return this data to frontend');

  } catch (error) {
    console.error('❌ Error testing doctor API:', error.message);
  }
}

async function main() {
  await testDoctorAPI();
}

main().catch(console.error);
