const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkReviewsTable() {
  console.log('🔍 Checking doctor_reviews table structure...');
  
  try {
    // Try to get table structure by attempting an insert with minimal data
    const { error: insertError } = await supabase
      .from('doctor_reviews')
      .insert({})
      .select();

    if (insertError) {
      console.log('📋 Table structure info from error:');
      console.log('   ', insertError.message);
    }
    
    // Try to get existing reviews to see structure
    const { data: existingReviews, error: selectError } = await supabase
      .from('doctor_reviews')
      .select('*')
      .limit(1);
      
    if (selectError) {
      console.log('❌ Error selecting from table:', selectError.message);
    } else {
      console.log('✅ Table exists and accessible');
      if (existingReviews && existingReviews.length > 0) {
        console.log('📄 Sample record structure:');
        console.log(JSON.stringify(existingReviews[0], null, 2));
      } else {
        console.log('📊 Table is empty');
      }
    }
    
    // Check if we need to use 'id' instead of 'review_id'
    console.log('\n🧪 Testing insert with id field...');
    const testReview = {
      doctor_id: 'GENE-DOC-202506-006',
      patient_id: 'PAT-202506-550',
      rating: 5,
      review_text: 'Test review',
      review_date: new Date().toISOString(),
      is_verified: true
    };
    
    const { data: testData, error: testError } = await supabase
      .from('doctor_reviews')
      .insert(testReview)
      .select();
      
    if (testError) {
      console.log('❌ Test insert failed:', testError.message);
    } else {
      console.log('✅ Test insert successful!');
      console.log('📄 Created record structure:');
      console.log(JSON.stringify(testData[0], null, 2));
      
      // Clean up test record
      await supabase
        .from('doctor_reviews')
        .delete()
        .eq('id', testData[0].id);
      console.log('🧹 Cleaned up test record');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkReviewsTable().catch(console.error);
