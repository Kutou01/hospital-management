const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDoctorAuth() {
  console.log('🔐 CHECKING DOCTOR AUTHENTICATION');
  console.log('='.repeat(50));

  try {
    // Check if user exists in auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Error fetching auth users:', authError.message);
      return;
    }

    const doctorAuthUser = authUsers.users.find(user => user.email === 'doctor@hospital.com');
    
    if (!doctorAuthUser) {
      console.log('❌ Doctor not found in auth.users');
      return;
    }

    console.log('✅ Doctor found in auth.users:');
    console.log(`   ID: ${doctorAuthUser.id}`);
    console.log(`   Email: ${doctorAuthUser.email}`);
    console.log(`   Created: ${doctorAuthUser.created_at}`);
    console.log(`   Email confirmed: ${doctorAuthUser.email_confirmed_at ? 'Yes' : 'No'}`);
    console.log(`   Last sign in: ${doctorAuthUser.last_sign_in_at || 'Never'}`);

    // Check profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'doctor@hospital.com')
      .single();

    if (profileError) {
      console.log('❌ Error fetching profile:', profileError.message);
    } else {
      console.log('\n✅ Doctor profile found:');
      console.log(`   Profile ID: ${profile.id}`);
      console.log(`   Full Name: ${profile.full_name}`);
      console.log(`   Role: ${profile.role}`);
      console.log(`   Active: ${profile.is_active}`);
    }

    // Check doctor record
    const { data: doctorRecord, error: doctorError } = await supabase
      .from('doctors')
      .select('*')
      .eq('profile_id', profile?.id)
      .single();

    if (doctorError) {
      console.log('❌ Error fetching doctor record:', doctorError.message);
    } else {
      console.log('\n✅ Doctor record found:');
      console.log(`   Doctor ID: ${doctorRecord.doctor_id}`);
      console.log(`   Full Name: ${doctorRecord.full_name}`);
      console.log(`   Specialty: ${doctorRecord.specialty}`);
      console.log(`   Active: ${doctorRecord.is_active}`);
    }

    // Test sign in with Supabase client
    console.log('\n🧪 Testing sign in with Supabase client...');
    
    const passwords = ['Doctor123!', 'Doctor123', 'doctor123', 'password123'];
    
    for (const password of passwords) {
      try {
        console.log(`   Trying password: ${password}`);
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: 'doctor@hospital.com',
          password: password
        });

        if (signInError) {
          console.log(`   ❌ Failed: ${signInError.message}`);
        } else {
          console.log(`   ✅ SUCCESS with password: ${password}`);
          console.log(`   Access token: ${signInData.session?.access_token?.substring(0, 20)}...`);
          
          // Sign out
          await supabase.auth.signOut();
          break;
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    // Reset password if needed
    console.log('\n🔧 If login fails, you can reset password:');
    console.log('   1. Go to Supabase Dashboard > Authentication > Users');
    console.log('   2. Find doctor@hospital.com');
    console.log('   3. Click "Reset Password" or "Send Magic Link"');
    console.log('   4. Or update password directly in SQL editor:');
    console.log(`   UPDATE auth.users SET encrypted_password = crypt('Doctor123!', gen_salt('bf')) WHERE email = 'doctor@hospital.com';`);

  } catch (error) {
    console.error('❌ Error checking doctor auth:', error.message);
  }
}

async function main() {
  await checkDoctorAuth();
}

main().catch(console.error);
