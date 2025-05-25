const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testProfileTrigger() {
  console.log('🧪 Testing Profile Creation Trigger...\n');

  const testEmail = `test-trigger-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  try {
    console.log('1️⃣ Creating test user with auth.signUp...');
    
    // Create auth user with metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test Trigger User',
          role: 'patient',
          phone_number: '+84123456789'
        }
      }
    });

    if (authError) {
      console.error('❌ Auth signup failed:', authError);
      return;
    }

    console.log('✅ Auth user created:', authData.user?.id);
    console.log('📧 Email:', authData.user?.email);
    console.log('📋 Metadata:', authData.user?.user_metadata);

    // Wait for trigger to execute
    console.log('\n2️⃣ Waiting for trigger to create profile...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if profile was created by trigger
    console.log('\n3️⃣ Checking profile creation...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile not found:', profileError);
      return;
    }

    console.log('✅ Profile created successfully by trigger!');
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

    // Cleanup: Delete test user
    console.log('\n4️⃣ Cleaning up test user...');
    
    // Delete from profiles first (due to foreign key)
    await supabase
      .from('profiles')
      .delete()
      .eq('id', authData.user.id);

    // Delete from auth.users using admin API
    const { error: deleteError } = await supabase.auth.admin.deleteUser(authData.user.id);
    
    if (deleteError) {
      console.warn('⚠️ Could not delete auth user:', deleteError);
    } else {
      console.log('✅ Test user cleaned up');
    }

    console.log('\n🎉 Profile creation trigger is working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test trigger functionality
testProfileTrigger().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test error:', error);
  process.exit(1);
});
