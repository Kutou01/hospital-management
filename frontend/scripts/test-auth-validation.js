/**
 * Test script for auth validation
 * This script tests the new validation logic
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testIncompleteRegistration() {
  console.log('🧪 Testing incomplete registration...');

  const testEmail = `test-incomplete-${Date.now()}@example.com`;
  const testPassword = 'testpassword123';

  try {
    // Try to create auth user without proper validation
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
          role: 'doctor'
        }
      }
    });

    if (authError) {
      console.error('❌ Auth signup failed:', authError);
      return;
    }

    console.log('✅ Auth user created:', authData.user?.id);

    // Don't create profile - simulate incomplete registration
    console.log('⚠️ Skipping profile creation to simulate incomplete registration');

    // Now try to sign in
    console.log('🔍 Testing sign in with incomplete user...');

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.log('✅ Sign in failed as expected:', signInError.message);
      return;
    }

    // Check if user has profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signInData.user.id)
      .single();

    if (profileError || !profile) {
      console.log('✅ No profile found - user should be signed out');

      // Sign out the user
      await supabase.auth.signOut();
      console.log('✅ User signed out due to incomplete profile');
    } else {
      console.log('❌ Profile found - this shouldn\'t happen in incomplete registration test');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testCompleteRegistration() {
  console.log('\n🧪 Testing complete registration...');

  const testEmail = `test-complete-${Date.now()}@example.com`;
  const testPassword = 'testpassword123';

  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test Complete User',
          role: 'patient'
        }
      }
    });

    if (authError) {
      console.error('❌ Auth signup failed:', authError);
      return;
    }

    console.log('✅ Auth user created:', authData.user?.id);

    // Wait for trigger to create profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify profile was created by trigger
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      console.error('❌ Profile not created by trigger:', profileError);
      return;
    }

    console.log('✅ Profile created by trigger:', profile.role);

    // Create patient data
    const { error: patientError } = await supabase
      .from('patients')
      .insert([{
        profile_id: authData.user.id,
        date_of_birth: '1990-01-01',
        gender: 'male',
        blood_type: 'O+',
        address: '{}',
        emergency_contact: '{}'
      }]);

    if (patientError) {
      console.error('❌ Patient data creation failed:', patientError);
      return;
    }

    console.log('✅ Patient data created');

    // Now try to sign in
    console.log('🔍 Testing sign in with complete user...');

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message);
      return;
    }

    console.log('✅ Sign in successful');

    // Verify profile exists
    const { data: verifiedProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signInData.user.id)
      .single();

    if (profileCheckError || !verifiedProfile) {
      console.error('❌ Profile check failed:', profileCheckError);
      return;
    }

    console.log('✅ Profile verified:', verifiedProfile.role);

    // Verify patient data exists
    const { data: patientData, error: patientCheckError } = await supabase
      .from('patients')
      .select('*')
      .eq('profile_id', signInData.user.id)
      .single();

    if (patientCheckError || !patientData) {
      console.error('❌ Patient data check failed:', patientCheckError);
      return;
    }

    console.log('✅ Patient data verified');

    // Sign out
    await supabase.auth.signOut();
    console.log('✅ Signed out successfully');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function main() {
  console.log('🚀 Starting auth validation tests...\n');

  await testIncompleteRegistration();
  await testCompleteRegistration();

  console.log('\n🏁 Tests completed');
}

if (require.main === module) {
  main().catch(console.error);
}
