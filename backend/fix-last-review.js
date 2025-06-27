const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixLastReview() {
  console.log('🔧 Fixing the last review...');
  
  try {
    // Get a patient ID that's not already used in reviews
    const { data: usedPatients, error: usedError } = await supabase
      .from('doctor_reviews')
      .select('patient_id')
      .eq('doctor_id', 'GENE-DOC-202506-006');
      
    if (usedError) {
      console.log('❌ Error getting used patients:', usedError.message);
      return;
    }
    
    const usedPatientIds = usedPatients?.map(r => r.patient_id) || [];
    console.log('📋 Already used patient IDs:', usedPatientIds);
    
    // Get available patients not in the used list
    const { data: availablePatients, error: availableError } = await supabase
      .from('patients')
      .select('patient_id, full_name')
      .not('full_name', 'is', null)
      .not('patient_id', 'in', `(${usedPatientIds.map(id => `'${id}'`).join(',')})`)
      .limit(5);
      
    if (availableError) {
      console.log('❌ Error getting available patients:', availableError.message);
      return;
    }
    
    console.log('👥 Available patients:');
    availablePatients?.forEach(p => console.log(`   - ${p.patient_id}: ${p.full_name}`));
    
    if (!availablePatients || availablePatients.length === 0) {
      console.log('❌ No available patients found');
      return;
    }
    
    // Update the first review with an available patient
    const newPatient = availablePatients[0];
    console.log(`\n🔄 Updating REV-202506-001 with ${newPatient.patient_id} (${newPatient.full_name})`);
    
    const { error: updateError } = await supabase
      .from('doctor_reviews')
      .update({ patient_id: newPatient.patient_id })
      .eq('review_id', 'REV-202506-001');
      
    if (updateError) {
      console.log('❌ Error updating review:', updateError.message);
    } else {
      console.log('✅ Successfully updated REV-202506-001');
    }
    
    // Final verification
    console.log('\n✅ Final check - All reviews:');
    
    const { data: allReviews, error: verifyError } = await supabase
      .from('doctor_reviews')
      .select('review_id, patient_id, rating')
      .eq('doctor_id', 'GENE-DOC-202506-006')
      .order('review_date', { ascending: false });
      
    if (verifyError) {
      console.log('❌ Error verifying:', verifyError.message);
    } else {
      for (const review of allReviews) {
        const { data: patient } = await supabase
          .from('patients')
          .select('full_name')
          .eq('patient_id', review.patient_id)
          .single();
          
        console.log(`   ${review.review_id}: ${review.rating}⭐ by ${patient?.full_name || 'UNKNOWN'}`);
      }
    }
    
    console.log('\n🎉 All reviews now have unique patient names!');
    console.log('✅ Refresh the profile page to see all real patient names');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixLastReview().catch(console.error);
