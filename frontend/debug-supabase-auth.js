// Debug script for Supabase Auth registration
import { supabase } from './lib/supabase.js';

async function debugRegistration() {
  console.log('=== Supabase Auth Debug ===');
  
  try {
    // Test 1: Check Supabase connection
    console.log('1. Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('hospital_users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Supabase connection failed:', testError);
      return;
    }
    console.log('✅ Supabase connection successful');
    
    // Test 2: Check existing users
    console.log('2. Checking existing users...');
    const { data: users, error: usersError } = await supabase
      .from('hospital_users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
    } else {
      console.log('✅ Existing users:', users.length);
      console.log('Users:', users);
    }
    
    // Test 3: Test registration
    console.log('3. Testing registration...');
    const testUser = {
      email: 'test.doctor@example.com',
      password: 'Test123456',
      options: {
        data: {
          full_name: 'Dr. Test Doctor',
          role: 'doctor',
          phone_number: '0123456789'
        }
      }
    };
    
    const { data: authData, error: authError } = await supabase.auth.signUp(testUser);
    
    if (authError) {
      console.error('❌ Registration failed:', authError);
      return;
    }
    
    console.log('✅ Auth user created:', authData.user?.id);
    
    // Wait for trigger to complete
    console.log('4. Waiting for trigger to complete...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if user profile was created
    const { data: profile, error: profileError } = await supabase
      .from('hospital_users')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile not created:', profileError);
    } else {
      console.log('✅ Profile created:', profile);
    }
    
    // Clean up - delete test user
    if (authData.user) {
      console.log('5. Cleaning up test user...');
      const { error: deleteError } = await supabase.auth.admin.deleteUser(authData.user.id);
      if (deleteError) {
        console.error('❌ Failed to delete test user:', deleteError);
      } else {
        console.log('✅ Test user deleted');
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run debug if this script is executed directly
if (typeof window !== 'undefined') {
  window.debugSupabaseAuth = debugRegistration;
  console.log('Debug function available as window.debugSupabaseAuth()');
} else {
  debugRegistration();
}
