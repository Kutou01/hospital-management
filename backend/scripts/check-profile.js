const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProfile() {
  console.log('🔍 CHECKING PROFILE IN DATABASE');
  console.log('='.repeat(50));

  try {
    const userId = '5bdcbd80-f344-40b7-a46b-3760ca487693';
    
    // Step 1: Check if profile exists
    console.log('📋 Step 1: Check profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.log('❌ Profile error:', profileError.message);
    } else if (profile) {
      console.log('✅ Profile found:');
      console.log('   ID:', profile.id);
      console.log('   Email:', profile.email);
      console.log('   Role:', profile.role);
      console.log('   Full Name:', profile.full_name);
      console.log('   Is Active:', profile.is_active);
    } else {
      console.log('❌ Profile not found');
    }

    // Step 2: Check if doctor record exists
    console.log('\n👨‍⚕️ Step 2: Check doctor record...');
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .select('*')
      .eq('profile_id', userId)
      .single();

    if (doctorError) {
      console.log('❌ Doctor error:', doctorError.message);
    } else if (doctor) {
      console.log('✅ Doctor found:');
      console.log('   Doctor ID:', doctor.doctor_id);
      console.log('   Profile ID:', doctor.profile_id);
      console.log('   Full Name:', doctor.full_name);
      console.log('   Specialty:', doctor.specialty);
      console.log('   Is Active:', doctor.is_active);
    } else {
      console.log('❌ Doctor not found');
    }

    // Step 3: Check with JOIN query
    console.log('\n🔗 Step 3: Check with JOIN query...');
    const { data: joinData, error: joinError } = await supabase
      .from('doctors')
      .select(`
        *,
        profiles!inner(email, phone_number, date_of_birth, role, is_active)
      `)
      .eq('profile_id', userId)
      .single();

    if (joinError) {
      console.log('❌ JOIN error:', joinError.message);
    } else if (joinData) {
      console.log('✅ JOIN query successful:');
      console.log('   Doctor ID:', joinData.doctor_id);
      console.log('   Profile Email:', joinData.profiles.email);
      console.log('   Profile Role:', joinData.profiles.role);
      console.log('   Profile Active:', joinData.profiles.is_active);
    } else {
      console.log('❌ JOIN query returned no data');
    }

  } catch (error) {
    console.error('❌ Error checking profile:', error.message);
  }
}

checkProfile().catch(console.error);
