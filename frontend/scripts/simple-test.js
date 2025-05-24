// Simple test for Supabase Auth
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ciasxktujslgsdgylimv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpYXN4a3R1anNsZ3NkZ3lsaW12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NTU1NjUsImV4cCI6MjA2MzEzMTU2NX0.fd7UdZk2mZsV1K0vKM8V9YWKcfyEY1fr4Q9OQvHd8UQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignUp() {
  console.log('🧪 Testing Supabase Auth signup...');

  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'test@hospital.com',
      password: 'test123',
      options: {
        data: {
          role: 'patient',
          full_name: 'Test User',
          phone_number: '+84123456789'
        }
      }
    });

    if (error) {
      console.error('❌ Signup error:', error.message);
      return;
    }

    console.log('✅ Signup successful!');
    console.log('User ID:', data.user?.id);
    console.log('Email:', data.user?.email);
    console.log('Email confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No');

    // Wait for trigger to complete
    console.log('⏳ Waiting for trigger to complete...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check if custom user was created
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', data.user.id)
      .single();

    if (userError) {
      console.error('❌ Error fetching custom user:', userError.message);
    } else {
      console.log('✅ Custom user created:', userData.user_id);
      console.log('Role:', userData.role);
      console.log('Full name:', userData.full_name);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

async function testSignIn() {
  console.log('\n🔐 Testing Supabase Auth signin...');

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@hospital.com',
      password: 'test123'
    });

    if (error) {
      console.error('❌ Signin error:', error.message);
      return;
    }

    console.log('✅ Signin successful!');
    console.log('User ID:', data.user?.id);
    console.log('Email:', data.user?.email);

    // Get user profile data
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError) {
      console.error('❌ Error fetching user profile:', userError.message);
    } else {
      console.log('✅ User profile data:', {
        id: userData.id,
        role: userData.role,
        full_name: userData.full_name
      });
    }

    // Sign out
    await supabase.auth.signOut();
    console.log('✅ Signed out successfully');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

async function main() {
  console.log('🏥 Simple Supabase Auth Test');
  console.log('============================');

  await testSignUp();
  await testSignIn();

  console.log('\n✅ Test completed!');
}

main();
