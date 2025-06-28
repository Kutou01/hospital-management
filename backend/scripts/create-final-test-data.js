const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createFinalTestData() {
  console.log('🏥 CREATING FINAL TEST DATA FOR DOCTOR SERVICE');
  console.log('='.repeat(60));

  try {
    // Step 1: Get existing doctors and patients
    console.log('📊 Step 1: Getting existing data...');
    
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select('doctor_id, profile_id, full_name, department_id, status')
      .eq('status', 'active');

    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('patient_id, profile_id, full_name, status')
      .eq('status', 'active');

    if (doctorsError || patientsError) {
      console.log('❌ Error fetching data:', doctorsError?.message || patientsError?.message);
      return;
    }

    console.log(`   👨‍⚕️ Found ${doctors.length} doctors`);
    console.log(`   🤒 Found ${patients.length} patients`);

    if (doctors.length === 0 || patients.length === 0) {
      console.log('❌ Need doctors and patients to create test data');
      return;
    }

    // Step 2: Create appointments with short IDs
    console.log('\n📅 Step 2: Creating appointments...');
    
    const appointments = [];
    const today = new Date();
    
    for (let i = 0; i < 8; i++) {
      const appointmentDate = new Date(today);
      appointmentDate.setDate(today.getDate() + (i - 4)); // Past, present, future
      
      const hour = 9 + (i % 6); // 9AM to 2PM
      const doctor = doctors[i % doctors.length];
      const patient = patients[i % patients.length];
      
      // Create short appointment ID (max 20 chars)
      const shortId = `APT${Date.now().toString().slice(-8)}${i.toString().padStart(2, '0')}`;
      
      appointments.push({
        appointment_id: shortId,
        doctor_id: doctor.doctor_id,
        patient_id: patient.patient_id,
        appointment_date: appointmentDate.toISOString().split('T')[0],
        start_time: `${hour.toString().padStart(2, '0')}:00:00`,
        end_time: `${(hour + 1).toString().padStart(2, '0')}:00:00`,
        appointment_type: 'consultation',
        status: i < 3 ? 'completed' : i < 6 ? 'confirmed' : 'pending',
        reason: `Test appointment ${i + 1}`,
        notes: `Notes for appointment ${i + 1}`
      });
    }

    console.log(`   Creating ${appointments.length} appointments...`);
    
    const { data: createdAppointments, error: appointmentError } = await supabase
      .from('appointments')
      .insert(appointments)
      .select();

    if (appointmentError) {
      console.log(`   ❌ Error creating appointments: ${appointmentError.message}`);
      
      // Try one by one to see which field is causing issues
      console.log('   🔄 Trying individual appointments...');
      for (let i = 0; i < Math.min(3, appointments.length); i++) {
        const singleAppointment = appointments[i];
        const { data: singleResult, error: singleError } = await supabase
          .from('appointments')
          .insert(singleAppointment)
          .select();
        
        if (singleError) {
          console.log(`     ❌ Appointment ${i + 1}: ${singleError.message}`);
        } else {
          console.log(`     ✅ Appointment ${i + 1}: ${singleResult[0].appointment_id}`);
        }
      }
    } else {
      console.log(`   ✅ Created ${createdAppointments.length} appointments`);
    }

    // Step 3: Check doctor_reviews table structure
    console.log('\n⭐ Step 3: Checking doctor_reviews structure...');
    
    const { data: reviewSample, error: reviewSampleError } = await supabase
      .from('doctor_reviews')
      .select('*')
      .limit(1);

    if (reviewSampleError && !reviewSampleError.message.includes('0 rows')) {
      console.log(`   ❌ Error checking reviews table: ${reviewSampleError.message}`);
    } else {
      console.log('   📋 Doctor reviews table exists');
      
      // Try to create a simple review to understand structure
      const testReview = {
        review_id: `REV${Date.now().toString().slice(-10)}`,
        doctor_id: doctors[0].doctor_id,
        patient_id: patients[0].patient_id,
        rating: 5
      };

      const { data: testReviewResult, error: testReviewError } = await supabase
        .from('doctor_reviews')
        .insert(testReview)
        .select();

      if (testReviewError) {
        console.log(`   ❌ Test review failed: ${testReviewError.message}`);
        
        // Try with minimal data
        const minimalReview = {
          review_id: `REV${Date.now().toString().slice(-10)}`,
          doctor_id: doctors[0].doctor_id,
          rating: 5
        };

        const { data: minimalResult, error: minimalError } = await supabase
          .from('doctor_reviews')
          .insert(minimalReview)
          .select();

        if (minimalError) {
          console.log(`   ❌ Minimal review failed: ${minimalError.message}`);
        } else {
          console.log(`   ✅ Minimal review created: ${minimalResult[0].review_id}`);
        }
      } else {
        console.log(`   ✅ Test review created: ${testReviewResult[0].review_id}`);
        
        // Create more reviews
        console.log('   📝 Creating additional reviews...');
        const reviews = [];
        
        for (let i = 0; i < 12; i++) {
          const doctor = doctors[i % doctors.length];
          const patient = patients[i % patients.length];
          const rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars
          
          reviews.push({
            review_id: `REV${Date.now().toString().slice(-8)}${i.toString().padStart(2, '0')}`,
            doctor_id: doctor.doctor_id,
            patient_id: patient.patient_id,
            rating: rating,
            review_date: new Date().toISOString().split('T')[0]
          });
        }

        const { data: createdReviews, error: reviewsError } = await supabase
          .from('doctor_reviews')
          .insert(reviews)
          .select();

        if (reviewsError) {
          console.log(`   ❌ Error creating reviews: ${reviewsError.message}`);
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
              
              console.log(`     Updated ${doctor.doctor_id}: ${avgRating.toFixed(1)}/5 (${doctorReviews.length} reviews)`);
            }
          }
        }
      }
    }

    // Step 4: Final verification
    console.log('\n🔍 Step 4: Final verification...');
    
    const { count: finalAppointments } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalReviews } = await supabase
      .from('doctor_reviews')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalDoctors } = await supabase
      .from('doctors')
      .select('*', { count: 'exact', head: true });

    const { count: finalPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });

    console.log('\n✅ FINAL TEST DATA STATUS:');
    console.log('='.repeat(50));
    console.log(`   👨‍⚕️ Total doctors: ${finalDoctors}`);
    console.log(`   🤒 Total patients: ${finalPatients}`);
    console.log(`   📅 Total appointments: ${finalAppointments}`);
    console.log(`   ⭐ Total reviews: ${finalReviews}`);

    if (finalDoctors >= 5 && finalAppointments >= 5 && finalReviews >= 5) {
      console.log('\n🎉 DOCTOR SERVICE TEST DATA IS COMPLETE!');
      console.log('   ✅ You can now test the Doctor Dashboard');
      console.log('   ✅ All APIs should return real data');
      console.log('   ✅ Statistics and charts will show actual numbers');
      
      console.log('\n🔑 Test login credentials:');
      console.log('   - doctor1@hospital.com / Doctor123!');
      console.log('   - doctor2@hospital.com / Doctor123!');
      console.log('   - doctor3@hospital.com / Doctor123!');
      console.log('   - doctor4@hospital.com / Doctor123!');
      console.log('   - doctor5@hospital.com / Doctor123!');
    } else {
      console.log('\n⚠️ Test data may still be incomplete');
      console.log('   Consider checking individual table constraints');
    }

  } catch (error) {
    console.error('❌ Error creating final test data:', error.message);
  }
}

async function main() {
  await createFinalTestData();
}

main().catch(console.error);
