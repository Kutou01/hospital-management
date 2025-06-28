const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ciasxktujslgsdgylimv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpYXN4a3R1anNsZ3NkZ3lsaW12Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzU1NTU2NSwiZXhwIjoyMDYzMTMxNTY1fQ.R2IieQgCFPQ5sgEqPSJmF9uB1hZasJHg5enl2alJpn4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugDoctorAuth() {
  console.log('🔍 Debugging Doctor Authentication...\n');

  try {
    // Test directly with doctor@hospital.com
    console.log('🧪 Testing direct sign in with doctor@hospital.com...');

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'doctor@hospital.com',
      password: 'Doctor123.'
    });

    if (signInError) {
      console.log(`❌ Sign in failed: ${signInError.message}`);

      // Try different passwords
      const passwords = ['Doctor123.', 'Doctor123', 'doctor123', 'password123', 'admin123'];
      console.log('\n🔄 Trying different passwords...');

      for (const password of passwords) {
        try {
          console.log(`   Trying password: ${password}`);
          const { data: testSignIn, error: testError } = await supabase.auth.signInWithPassword({
            email: 'doctor@hospital.com',
            password: password
          });

          if (!testError) {
            console.log(`   ✅ SUCCESS with password: ${password}`);
            await testDoctorAPI(testSignIn.session.access_token, testSignIn.user.id);
            await supabase.auth.signOut();
            return;
          } else {
            console.log(`   ❌ Failed: ${testError.message}`);
          }
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
        }
      }

      console.log('\n❌ All password attempts failed');
      return;
    }

    console.log('✅ Sign in successful with Doctor123!');
    console.log(`   Access token: ${signInData.session?.access_token?.substring(0, 30)}...`);
    console.log(`   User ID: ${signInData.user?.id}`);

    // Test API call
    await testDoctorAPI(signInData.session.access_token, signInData.user.id);

    // Sign out
    await supabase.auth.signOut();

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testDoctorAPI(accessToken, userId) {
  console.log('\n🧪 Testing API call to Doctor Service...');
  console.log(`   User ID: ${userId}`);

  try {
    const response = await fetch('http://localhost:3002/api/doctors/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(result, null, 2));

    if (response.status === 404) {
      console.log('\n🔍 Checking database for this user...');

      // Check profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.log('❌ Profile error:', profileError.message);
        return;
      }

      console.log('✅ Profile found:');
      console.log(`   ID: ${profile.id}`);
      console.log(`   Email: ${profile.email}`);
      console.log(`   Role: ${profile.role}`);
      console.log(`   Full Name: ${profile.full_name}`);

      // Check doctor record
      const { data: doctorRecord, error: doctorError } = await supabase
        .from('doctors')
        .select('*')
        .eq('profile_id', profile.id)
        .single();

      if (doctorError) {
        console.log('❌ Doctor record error:', doctorError.message);
        console.log('   This is why the API returns "Doctor not found"');
        return;
      }

      console.log('✅ Doctor record found:');
      console.log(`   Doctor ID: ${doctorRecord.doctor_id}`);
      console.log(`   Profile ID: ${doctorRecord.profile_id}`);
      console.log(`   Full Name: ${doctorRecord.full_name}`);
      console.log(`   Status: ${doctorRecord.status}`);
    }

  } catch (fetchError) {
    console.log(`   ❌ API call failed: ${fetchError.message}`);
  }
}

async function main() {
  await debugDoctorAuth();
}

main().catch(console.error);
