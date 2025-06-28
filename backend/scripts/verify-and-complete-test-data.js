const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyAndCompleteTestData() {
  console.log('🏥 VERIFYING AND COMPLETING DOCTOR SERVICE TEST DATA');
  console.log('='.repeat(60));

  try {
    // Step 1: Check current data status
    console.log('📊 Step 1: Checking current data status...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, role, full_name')
      .eq('role', 'doctor');

    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select('doctor_id, profile_id, full_name, specialty, department_id, status');

    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('patient_id, profile_id, full_name, status');

    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('appointment_id, doctor_id, patient_id, status');

    const { data: reviews, error: reviewsError } = await supabase
      .from('doctor_reviews')
      .select('review_id, doctor_id, patient_id, rating');

    console.log(`   📋 Doctor profiles: ${profiles?.length || 0}`);
    console.log(`   👨‍⚕️ Doctor records: ${doctors?.length || 0}`);
    console.log(`   🤒 Patient records: ${patients?.length || 0}`);
    console.log(`   📅 Appointments: ${appointments?.length || 0}`);
    console.log(`   ⭐ Reviews: ${reviews?.length || 0}`);

    // Step 2: Verify doctor data completeness
    console.log('\n🔍 Step 2: Verifying doctor data completeness...');
    
    if (doctors && doctors.length > 0) {
      console.log('   Doctor details:');
      doctors.forEach((doctor, index) => {
        console.log(`   ${index + 1}. ${doctor.doctor_id}`);
        console.log(`      Profile ID: ${doctor.profile_id}`);
        console.log(`      Name: ${doctor.full_name || 'NULL'}`);
        console.log(`      Specialty: ${doctor.specialty}`);
        console.log(`      Department: ${doctor.department_id}`);
        console.log(`      Status: ${doctor.status}`);
        console.log('');
      });

      // Check if doctors have corresponding profiles
      for (const doctor of doctors) {
        const profile = profiles?.find(p => p.id === doctor.profile_id);
        if (!profile) {
          console.log(`   ⚠️ Doctor ${doctor.doctor_id} missing profile!`);
        } else {
          console.log(`   ✅ Doctor ${doctor.doctor_id} has profile: ${profile.full_name}`);
        }
      }
    }

    // Step 3: Create simple appointments with basic data
    console.log('\n📅 Step 3: Creating simple appointments...');
    
    if (doctors && doctors.length > 0 && patients && patients.length > 0) {
      console.log(`   Using ${doctors.length} doctors and ${patients.length} patients`);
      
      // Create appointments with minimal required fields
      const simpleAppointments = [];
      const today = new Date();
      
      for (let i = 0; i < Math.min(6, doctors.length * 2); i++) {
        const appointmentDate = new Date(today);
        appointmentDate.setDate(today.getDate() + (i - 3)); // Past, present, future
        
        const hour = 9 + (i % 6); // 9AM to 2PM
        const doctor = doctors[i % doctors.length];
        const patient = patients[i % patients.length];
        
        // Generate simple appointment ID
        const appointmentId = `APT-${Date.now()}-${i.toString().padStart(3, '0')}`;
        
        simpleAppointments.push({
          appointment_id: appointmentId,
          doctor_id: doctor.doctor_id,
          patient_id: patient.patient_id,
          appointment_date: appointmentDate.toISOString().split('T')[0],
          start_time: `${hour.toString().padStart(2, '0')}:00:00`,
          end_time: `${(hour + 1).toString().padStart(2, '0')}:00:00`,
          appointment_type: 'consultation', // Use simple English value
          status: i < 2 ? 'completed' : i < 4 ? 'confirmed' : 'pending',
          reason: `Appointment ${i + 1}`,
          notes: `Test appointment ${i + 1}`
        });
      }

      console.log(`   Creating ${simpleAppointments.length} appointments...`);
      
      const { data: createdAppointments, error: appointmentError } = await supabase
        .from('appointments')
        .insert(simpleAppointments)
        .select();

      if (appointmentError) {
        console.log(`   ❌ Error creating appointments: ${appointmentError.message}`);
        
        // Try with even simpler data
        console.log('   🔄 Trying with minimal data...');
        const minimalAppointment = {
          appointment_id: `APT-${Date.now()}-MIN`,
          doctor_id: doctors[0].doctor_id,
          patient_id: patients[0].patient_id,
          appointment_date: today.toISOString().split('T')[0],
          start_time: '10:00:00',
          end_time: '11:00:00',
          status: 'pending'
        };

        const { data: minimalResult, error: minimalError } = await supabase
          .from('appointments')
          .insert(minimalAppointment)
          .select();

        if (minimalError) {
          console.log(`   ❌ Minimal appointment failed: ${minimalError.message}`);
        } else {
          console.log(`   ✅ Minimal appointment created: ${minimalResult[0].appointment_id}`);
        }
      } else {
        console.log(`   ✅ Created ${createdAppointments.length} appointments`);
      }
    } else {
      console.log('   ⚠️ Need doctors and patients to create appointments');
    }

    // Step 4: Create simple reviews
    console.log('\n⭐ Step 4: Creating simple reviews...');
    
    if (doctors && doctors.length > 0 && patients && patients.length > 0) {
      const simpleReviews = [];
      
      for (let i = 0; i < Math.min(10, doctors.length * 3); i++) {
        const doctor = doctors[i % doctors.length];
        const patient = patients[i % patients.length];
        const rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars
        
        const reviewId = `REV-${Date.now()}-${i.toString().padStart(3, '0')}`;
        
        simpleReviews.push({
          review_id: reviewId,
          doctor_id: doctor.doctor_id,
          patient_id: patient.patient_id,
          rating: rating,
          comment: `Great doctor! Rating: ${rating}/5`,
          review_date: new Date().toISOString().split('T')[0]
        });
      }

      console.log(`   Creating ${simpleReviews.length} reviews...`);
      
      const { data: createdReviews, error: reviewError } = await supabase
        .from('doctor_reviews')
        .insert(simpleReviews)
        .select();

      if (reviewError) {
        console.log(`   ❌ Error creating reviews: ${reviewError.message}`);
      } else {
        console.log(`   ✅ Created ${createdReviews.length} reviews`);
        
        // Update doctor ratings
        console.log('   📊 Updating doctor ratings...');
        for (const doctor of doctors) {
          const doctorReviews = createdReviews.filter(r => r.doctor_id === doctor.doctor_id);
          if (doctorReviews.length > 0) {
            const avgRating = doctorReviews.reduce((sum, r) => sum + r.rating, 0) / doctorReviews.length;
            
            await supabase
              .from('doctors')
              .update({
                rating: Math.round(avgRating * 10) / 10,
                total_reviews: doctorReviews.length
              })
              .eq('doctor_id', doctor.doctor_id);
            
            console.log(`     Updated ${doctor.doctor_id}: ${avgRating.toFixed(1)}/5`);
          }
        }
      }
    }

    // Step 5: Final verification
    console.log('\n🔍 Step 5: Final verification...');
    
    const { count: finalAppointments } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalReviews } = await supabase
      .from('doctor_reviews')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalDoctors } = await supabase
      .from('doctors')
      .select('*', { count: 'exact', head: true });

    console.log('\n✅ FINAL STATUS:');
    console.log('='.repeat(40));
    console.log(`   👨‍⚕️ Total doctors: ${finalDoctors}`);
    console.log(`   📅 Total appointments: ${finalAppointments}`);
    console.log(`   ⭐ Total reviews: ${finalReviews}`);

    if (finalDoctors >= 3 && finalAppointments >= 5 && finalReviews >= 5) {
      console.log('\n🎉 DOCTOR SERVICE TEST DATA IS READY!');
      console.log('   You can now test the Doctor Dashboard with real data');
    } else {
      console.log('\n⚠️ Test data may be incomplete. Consider running individual scripts.');
    }

  } catch (error) {
    console.error('❌ Error verifying test data:', error.message);
  }
}

async function main() {
  await verifyAndCompleteTestData();
}

main().catch(console.error);
