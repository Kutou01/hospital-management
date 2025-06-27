const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkTableRelationships() {
  console.log('🔍 Checking table relationships...');
  
  try {
    // Check doctor_reviews table structure
    console.log('1️⃣ Checking doctor_reviews table...');
    
    const { data: reviews, error: reviewsError } = await supabase
      .from('doctor_reviews')
      .select('*')
      .limit(1);
      
    if (reviewsError) {
      console.log('❌ doctor_reviews error:', reviewsError.message);
    } else {
      console.log('✅ doctor_reviews table accessible');
      if (reviews && reviews.length > 0) {
        console.log('📄 Sample review structure:');
        console.log(Object.keys(reviews[0]));
      }
    }
    
    // Check patients table structure
    console.log('\n2️⃣ Checking patients table...');
    
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .limit(1);
      
    if (patientsError) {
      console.log('❌ patients error:', patientsError.message);
    } else {
      console.log('✅ patients table accessible');
      if (patients && patients.length > 0) {
        console.log('📄 Sample patient structure:');
        console.log(Object.keys(patients[0]));
      }
    }
    
    // Try simple join without foreign key reference
    console.log('\n3️⃣ Testing manual join...');
    
    const { data: manualJoin, error: joinError } = await supabase
      .from('doctor_reviews')
      .select(`
        review_id,
        doctor_id,
        patient_id,
        rating,
        review_text,
        review_date,
        created_at
      `)
      .eq('doctor_id', 'GENE-DOC-202506-006')
      .limit(3);
      
    if (joinError) {
      console.log('❌ Manual join error:', joinError.message);
    } else {
      console.log(`✅ Manual join success: ${manualJoin?.length || 0} reviews`);
      
      if (manualJoin && manualJoin.length > 0) {
        console.log('📄 Reviews found:');
        for (const review of manualJoin) {
          // Get patient info separately
          const { data: patient, error: patientError } = await supabase
            .from('patients')
            .select('patient_id, full_name')
            .eq('patient_id', review.patient_id)
            .single();
            
          console.log(`   - Review ${review.review_id}: ${review.rating}/5 stars`);
          console.log(`     Patient: ${patient?.full_name || 'Not found'} (${review.patient_id})`);
          console.log(`     Text: ${review.review_text?.substring(0, 50)}...`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTableRelationships().catch(console.error);
