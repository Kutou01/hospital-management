const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkConstraints() {
  console.log('🔍 CHECKING APPOINTMENT AND REVIEW CONSTRAINTS');
  console.log('='.repeat(60));

  try {
    // Test appointment status values
    console.log('📅 Testing appointment status values...');
    const testStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show', 'pending'];
    
    const { data: doctors } = await supabase
      .from('doctors')
      .select('doctor_id')
      .limit(1);
    
    const { data: patients } = await supabase
      .from('patients')
      .select('patient_id')
      .limit(1);

    if (!doctors || !patients || doctors.length === 0 || patients.length === 0) {
      console.log('❌ Need at least one doctor and patient for testing');
      return;
    }

    const testDoctor = doctors[0];
    const testPatient = patients[0];

    for (const status of testStatuses) {
      const testAppointment = {
        appointment_id: `TEST-${Date.now()}-${status}`,
        doctor_id: testDoctor.doctor_id,
        patient_id: testPatient.patient_id,
        appointment_date: '2025-06-25',
        start_time: '10:00:00',
        end_time: '11:00:00',
        appointment_type: 'consultation',
        status: status,
        reason: 'Test appointment'
      };

      const { data, error } = await supabase
        .from('appointments')
        .insert(testAppointment)
        .select();

      if (error) {
        console.log(`   ❌ Status "${status}": ${error.message}`);
      } else {
        console.log(`   ✅ Status "${status}": VALID`);
        
        // Clean up test data
        await supabase
          .from('appointments')
          .delete()
          .eq('appointment_id', testAppointment.appointment_id);
      }
    }

    console.log('\n⭐ Testing review constraints...');
    
    // Test review uniqueness
    const testReview1 = {
      review_id: `TEST-REV-${Date.now()}-1`,
      doctor_id: testDoctor.doctor_id,
      patient_id: testPatient.patient_id,
      rating: 5,
      review_date: '2025-06-22'
    };

    const { data: review1, error: reviewError1 } = await supabase
      .from('doctor_reviews')
      .insert(testReview1)
      .select();

    if (reviewError1) {
      console.log(`   ❌ First review: ${reviewError1.message}`);
    } else {
      console.log(`   ✅ First review: SUCCESS`);
      
      // Try duplicate review
      const testReview2 = {
        review_id: `TEST-REV-${Date.now()}-2`,
        doctor_id: testDoctor.doctor_id,
        patient_id: testPatient.patient_id,
        rating: 4,
        review_date: '2025-06-22'
      };

      const { data: review2, error: reviewError2 } = await supabase
        .from('doctor_reviews')
        .insert(testReview2)
        .select();

      if (reviewError2) {
        console.log(`   ❌ Duplicate review: ${reviewError2.message}`);
        console.log(`   ℹ️  This confirms unique constraint exists`);
      } else {
        console.log(`   ⚠️  Duplicate review allowed - no unique constraint`);
        
        // Clean up
        await supabase
          .from('doctor_reviews')
          .delete()
          .eq('review_id', testReview2.review_id);
      }
      
      // Clean up first review
      await supabase
        .from('doctor_reviews')
        .delete()
        .eq('review_id', testReview1.review_id);
    }

  } catch (error) {
    console.error('❌ Error checking constraints:', error.message);
  }
}

async function createValidAppointmentsAndReviews() {
  console.log('\n📅 CREATING VALID APPOINTMENTS AND REVIEWS');
  console.log('='.repeat(60));

  try {
    // Get all doctors and patients
    const { data: doctors } = await supabase
      .from('doctors')
      .select('doctor_id, department_id, full_name')
      .eq('status', 'active');

    const { data: patients } = await supabase
      .from('patients')
      .select('patient_id, full_name')
      .eq('status', 'active');

    console.log(`📋 Found ${doctors.length} doctors and ${patients.length} patients`);

    if (!doctors || !patients || doctors.length === 0 || patients.length === 0) {
      console.log('❌ Need doctors and patients to create appointments');
      return;
    }

    // Create appointments with valid status values
    console.log('\n📅 Creating appointments with valid status...');
    const appointments = [];
    const today = new Date();
    
    // Valid status values based on common appointment systems
    const validStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled'];
    
    for (let i = 0; i < 40; i++) { // Create 40 appointments
      const appointmentDate = new Date(today);
      appointmentDate.setDate(today.getDate() + (i - 20)); // Past, present, future
      
      const hour = 8 + (i % 8); // 8AM to 3PM
      const doctor = doctors[i % doctors.length];
      const patient = patients[i % patients.length];
      
      const status = validStatuses[i % validStatuses.length];
      const appointmentId = `APT${Date.now().toString().slice(-6)}${i.toString().padStart(3, '0')}`;
      
      appointments.push({
        appointment_id: appointmentId,
        doctor_id: doctor.doctor_id,
        patient_id: patient.patient_id,
        appointment_date: appointmentDate.toISOString().split('T')[0],
        start_time: `${hour.toString().padStart(2, '0')}:00:00`,
        end_time: `${(hour + 1).toString().padStart(2, '0')}:00:00`,
        appointment_type: 'consultation',
        status: status,
        reason: `Khám bệnh định kỳ`,
        notes: `Cuộc hẹn số ${i + 1}`
      });
    }

    // Insert appointments in batches to avoid conflicts
    const batchSize = 10;
    let totalCreatedAppointments = 0;

    for (let i = 0; i < appointments.length; i += batchSize) {
      const batch = appointments.slice(i, i + batchSize);
      
      const { data: createdAppointments, error: appointmentError } = await supabase
        .from('appointments')
        .insert(batch)
        .select();

      if (appointmentError) {
        console.log(`   ❌ Batch ${Math.floor(i/batchSize) + 1} error: ${appointmentError.message}`);
      } else {
        totalCreatedAppointments += createdAppointments.length;
        console.log(`   ✅ Batch ${Math.floor(i/batchSize) + 1}: ${createdAppointments.length} appointments`);
      }
    }

    console.log(`📊 Total appointments created: ${totalCreatedAppointments}`);

    // Create unique reviews (one per doctor-patient pair)
    console.log('\n⭐ Creating unique reviews...');
    const reviews = [];
    const reviewPairs = new Set(); // Track doctor-patient pairs
    
    for (let i = 0; i < Math.min(50, doctors.length * 2); i++) {
      const doctor = doctors[i % doctors.length];
      const patient = patients[i % patients.length];
      const pairKey = `${doctor.doctor_id}-${patient.patient_id}`;
      
      // Skip if this doctor-patient pair already has a review
      if (reviewPairs.has(pairKey)) {
        continue;
      }
      
      reviewPairs.add(pairKey);
      
      const rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars
      const reviewDate = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000);
      
      reviews.push({
        review_id: `REV${Date.now().toString().slice(-6)}${i.toString().padStart(3, '0')}`,
        doctor_id: doctor.doctor_id,
        patient_id: patient.patient_id,
        rating: rating,
        review_date: reviewDate.toISOString().split('T')[0]
      });
    }

    // Insert reviews in batches
    let totalCreatedReviews = 0;

    for (let i = 0; i < reviews.length; i += batchSize) {
      const batch = reviews.slice(i, i + batchSize);
      
      const { data: createdReviews, error: reviewError } = await supabase
        .from('doctor_reviews')
        .insert(batch)
        .select();

      if (reviewError) {
        console.log(`   ❌ Review batch ${Math.floor(i/batchSize) + 1} error: ${reviewError.message}`);
      } else {
        totalCreatedReviews += createdReviews.length;
        console.log(`   ✅ Review batch ${Math.floor(i/batchSize) + 1}: ${createdReviews.length} reviews`);
      }
    }

    console.log(`📊 Total reviews created: ${totalCreatedReviews}`);

    // Update doctor ratings based on reviews
    console.log('\n📊 Updating doctor ratings...');
    
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
            rating: Math.round(averageRating * 10) / 10,
            total_reviews: doctorReviews.length
          })
          .eq('doctor_id', doctor.doctor_id);
        
        console.log(`   Updated ${doctor.full_name}: ${averageRating.toFixed(1)}/5 (${doctorReviews.length} reviews)`);
      }
    }

    // Final summary
    console.log('\n✅ APPOINTMENTS AND REVIEWS FIXED!');
    console.log('='.repeat(60));
    
    const { count: finalAppointments } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalReviews } = await supabase
      .from('doctor_reviews')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Final counts:`);
    console.log(`   📅 Total appointments: ${finalAppointments}`);
    console.log(`   ⭐ Total reviews: ${finalReviews}`);
    console.log(`   👨‍⚕️ Doctors with updated ratings: ${doctors.length}`);

  } catch (error) {
    console.error('❌ Error creating appointments and reviews:', error.message);
  }
}

async function main() {
  await checkConstraints();
  await createValidAppointmentsAndReviews();
}

main().catch(console.error);
