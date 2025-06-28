const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDoctorFunction() {
  console.log('🧪 TESTING DOCTOR FUNCTION');
  console.log('='.repeat(40));

  try {
    // Test get_doctor_by_profile_id function
    console.log('Testing get_doctor_by_profile_id...');
    
    const { data: testData, error: testError } = await supabase
      .rpc('get_doctor_by_profile_id', { 
        input_profile_id: '5bdcbd80-f344-40b7-a46b-3760ca487693' 
      });

    if (testError) {
      console.log('❌ Function test failed:', testError.message);
      console.log('Error details:', testError);
      
      // Try alternative - direct query
      console.log('\n🔄 Trying direct query...');
      const { data: directData, error: directError } = await supabase
        .from('doctors')
        .select(`
          *,
          profiles!inner(email, phone_number, date_of_birth)
        `)
        .eq('profile_id', '5bdcbd80-f344-40b7-a46b-3760ca487693')
        .single();

      if (directError) {
        console.log('❌ Direct query failed:', directError.message);
      } else {
        console.log('✅ Direct query successful:');
        console.log('   Doctor ID:', directData.doctor_id);
        console.log('   Full Name:', directData.full_name);
        console.log('   Email:', directData.profiles.email);
      }
    } else {
      console.log('✅ Function test successful!');
      console.log('   Doctor found:', testData?.[0]?.full_name || 'No data');
      console.log('   Doctor ID:', testData?.[0]?.doctor_id || 'No ID');
      console.log('   Email:', testData?.[0]?.email || 'No email');
    }

  } catch (error) {
    console.error('❌ Error testing doctor function:', error.message);
  }
}

async function main() {
  await testDoctorFunction();
}

main().catch(console.error);
