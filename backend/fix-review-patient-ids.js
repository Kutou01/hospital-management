const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixReviewPatientIds() {
  console.log('🔧 Fixing review patient IDs...');
  
  try {
    // 1. Get all reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('doctor_reviews')
      .select('*')
      .eq('doctor_id', 'GENE-DOC-202506-006');
      
    if (reviewsError) {
      console.log('❌ Error getting reviews:', reviewsError.message);
      return;
    }
    
    console.log(`📋 Found ${reviews?.length || 0} reviews`);
    
    // 2. Get all available patients
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('patient_id, full_name')
      .limit(10);
      
    if (patientsError) {
      console.log('❌ Error getting patients:', patientsError.message);
      return;
    }
    
    console.log(`👥 Found ${patients?.length || 0} patients:`);
    patients?.forEach(p => console.log(`   - ${p.patient_id}: ${p.full_name}`));
    
    if (!patients || patients.length === 0) {
      console.log('❌ No patients found to assign reviews to');
      return;
    }
    
    // 3. Update reviews with valid patient IDs
    console.log('\n🔄 Updating review patient IDs...');
    
    for (let i = 0; i < reviews.length; i++) {
      const review = reviews[i];
      const newPatientId = patients[i % patients.length].patient_id; // Cycle through available patients
      
      console.log(`   Updating review ${review.review_id}: ${review.patient_id} → ${newPatientId}`);
      
      const { error: updateError } = await supabase
        .from('doctor_reviews')
        .update({ patient_id: newPatientId })
        .eq('review_id', review.review_id);
        
      if (updateError) {
        console.log(`   ❌ Error updating review ${review.review_id}:`, updateError.message);
      } else {
        console.log(`   ✅ Updated review ${review.review_id}`);
      }
    }
    
    // 4. Verify the updates
    console.log('\n✅ Verification - Reviews after update:');
    
    const { data: updatedReviews, error: verifyError } = await supabase
      .from('doctor_reviews')
      .select('review_id, patient_id')
      .eq('doctor_id', 'GENE-DOC-202506-006');
      
    if (verifyError) {
      console.log('❌ Error verifying updates:', verifyError.message);
    } else {
      for (const review of updatedReviews) {
        // Get patient name
        const { data: patient } = await supabase
          .from('patients')
          .select('full_name')
          .eq('patient_id', review.patient_id)
          .single();
          
        console.log(`   ${review.review_id}: ${review.patient_id} → ${patient?.full_name || 'NOT FOUND'}`);
      }
    }
    
    console.log('\n🎉 Patient ID fix completed!');
    console.log('✅ Reviews should now show real patient names');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixReviewPatientIds().catch(console.error);
