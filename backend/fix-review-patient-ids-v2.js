const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixReviewPatientIdsV2() {
  console.log('🔧 Fixing review patient IDs (v2)...');
  
  try {
    // 1. Get patients with valid names only
    const { data: validPatients, error: patientsError } = await supabase
      .from('patients')
      .select('patient_id, full_name')
      .not('full_name', 'is', null)
      .limit(10);
      
    if (patientsError) {
      console.log('❌ Error getting patients:', patientsError.message);
      return;
    }
    
    console.log(`👥 Found ${validPatients?.length || 0} patients with valid names:`);
    validPatients?.forEach(p => console.log(`   - ${p.patient_id}: ${p.full_name}`));
    
    if (!validPatients || validPatients.length < 3) {
      console.log('❌ Need at least 3 patients with valid names');
      return;
    }
    
    // 2. Get reviews that need fixing
    const { data: reviews, error: reviewsError } = await supabase
      .from('doctor_reviews')
      .select('review_id, patient_id')
      .eq('doctor_id', 'GENE-DOC-202506-006');
      
    if (reviewsError) {
      console.log('❌ Error getting reviews:', reviewsError.message);
      return;
    }
    
    console.log(`\n📋 Found ${reviews?.length || 0} reviews to update`);
    
    // 3. Update each review with a valid patient ID
    const updates = [
      { review_id: 'REV-202506-001', new_patient_id: validPatients[0].patient_id },
      { review_id: 'REV-202506-002', new_patient_id: validPatients[1].patient_id },
      { review_id: 'REV-202506-003', new_patient_id: validPatients[2].patient_id }
    ];
    
    console.log('\n🔄 Updating reviews with valid patient IDs...');
    
    for (const update of updates) {
      const patient = validPatients.find(p => p.patient_id === update.new_patient_id);
      console.log(`   ${update.review_id} → ${update.new_patient_id} (${patient?.full_name})`);
      
      const { error: updateError } = await supabase
        .from('doctor_reviews')
        .update({ patient_id: update.new_patient_id })
        .eq('review_id', update.review_id);
        
      if (updateError) {
        console.log(`   ❌ Error updating ${update.review_id}:`, updateError.message);
      } else {
        console.log(`   ✅ Updated ${update.review_id}`);
      }
    }
    
    // 4. Verify the updates
    console.log('\n✅ Final verification:');
    
    const { data: finalReviews, error: verifyError } = await supabase
      .from('doctor_reviews')
      .select('review_id, patient_id, rating, review_text')
      .eq('doctor_id', 'GENE-DOC-202506-006')
      .order('review_date', { ascending: false });
      
    if (verifyError) {
      console.log('❌ Error verifying:', verifyError.message);
    } else {
      for (const review of finalReviews) {
        const { data: patient } = await supabase
          .from('patients')
          .select('full_name')
          .eq('patient_id', review.patient_id)
          .single();
          
        console.log(`   ${review.review_id}: ${review.rating}⭐ by ${patient?.full_name || 'UNKNOWN'}`);
        console.log(`      "${review.review_text?.substring(0, 50)}..."`);
      }
    }
    
    console.log('\n🎉 All reviews now have valid patient names!');
    console.log('✅ Refresh the profile page to see real patient names');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixReviewPatientIdsV2().catch(console.error);
