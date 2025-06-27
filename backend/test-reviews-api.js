const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testReviewsAPI() {
  console.log('🧪 Testing doctor reviews API...');
  
  const doctorId = 'GENE-DOC-202506-006';
  
  try {
    // Test direct database query first
    console.log('1️⃣ Testing direct database query...');
    
    const { data: directReviews, error: directError } = await supabase
      .from('doctor_reviews')
      .select(`
        *,
        patients!doctor_reviews_patient_id_fkey(
          patient_id,
          full_name
        )
      `)
      .eq('doctor_id', doctorId);
      
    if (directError) {
      console.log('❌ Direct query error:', directError.message);
    } else {
      console.log(`✅ Direct query success: ${directReviews?.length || 0} reviews`);
      if (directReviews && directReviews.length > 0) {
        console.log('📄 Sample review:');
        console.log(JSON.stringify(directReviews[0], null, 2));
      }
    }
    
    // Test API endpoint
    console.log('\n2️⃣ Testing API endpoint...');
    
    const response = await fetch(`http://localhost:3000/api/doctors/${doctorId}/reviews?page=1&limit=5`);
    const apiData = await response.json();
    
    if (response.ok) {
      console.log('✅ API endpoint success');
      console.log('📊 API response structure:');
      console.log(JSON.stringify(apiData, null, 2));
    } else {
      console.log('❌ API endpoint error:', apiData);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testReviewsAPI().catch(console.error);
