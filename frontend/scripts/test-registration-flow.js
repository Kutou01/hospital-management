const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Use anon key like the frontend does
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

async function testRegistrationFlow() {
  console.log('🧪 Testing Real Registration Flow with Trigger...\n');

  const testEmail = `test-registration-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  try {
    console.log('1️⃣ Simulating frontend registration...');
    
    // Simulate the exact registration flow from frontend
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test Registration User',
          role: 'patient',
          phone_number: '+84123456789'
        }
      }
    });

    if (authError) {
      console.error('❌ Registration failed:', authError);
      return;
    }

    console.log('✅ User registered successfully');
    console.log('👤 User ID:', authData.user?.id);
    console.log('📧 Email:', authData.user?.email);
    console.log('📋 Metadata:', authData.user?.user_metadata);

    // Wait for trigger
    console.log('\n2️⃣ Waiting for trigger to create profile...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check profile using anon key (like frontend would)
    console.log('\n3️⃣ Checking profile creation...');
    
    // First, sign in to get session
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.error('❌ Sign in failed:', signInError);
      return;
    }

    console.log('✅ Signed in successfully');

    // Now check profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile not found:', profileError);
      return;
    }

    console.log('✅ Profile found successfully!');
    console.log('👤 Profile data:', {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
      phone_number: profile.phone_number,
      email_verified: profile.email_verified,
      is_active: profile.is_active,
      created_at: profile.created_at
    });

    // Test profile update
    console.log('\n4️⃣ Testing profile update...');
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        full_name: 'Updated Test User',
        phone_number: '+84999888777'
      })
      .eq('id', authData.user.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Profile update failed:', updateError);
    } else {
      console.log('✅ Profile updated successfully:', {
        full_name: updatedProfile.full_name,
        phone_number: updatedProfile.phone_number
      });
    }

    // Sign out
    console.log('\n5️⃣ Signing out...');
    await supabase.auth.signOut();
    console.log('✅ Signed out successfully');

    console.log('\n🎉 Registration flow test completed successfully!');
    console.log('✅ Trigger is working perfectly with the frontend registration flow.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testRegistrationFlow().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test error:', error);
  process.exit(1);
});
