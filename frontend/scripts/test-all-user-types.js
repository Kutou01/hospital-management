const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testUserType(userType, userData) {
  console.log(`\n🧪 Testing ${userType.toUpperCase()} user creation...`);

  const testEmail = `test-${userType}-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  try {
    // Create auth user with metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: userData
      }
    });

    if (authError) {
      console.error(`❌ ${userType} auth signup failed:`, authError);
      return false;
    }

    console.log(`✅ ${userType} auth user created:`, authData.user?.id);

    // Wait for trigger
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check profile creation
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error(`❌ ${userType} profile not created:`, profileError);
      return false;
    }

    console.log(`✅ ${userType} profile created:`, {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
      phone_number: profile.phone_number,
      email_verified: profile.email_verified
    });

    // Cleanup
    await supabase.from('profiles').delete().eq('id', authData.user.id);
    await supabase.auth.admin.deleteUser(authData.user.id);

    return true;

  } catch (error) {
    console.error(`❌ ${userType} test failed:`, error);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Testing Profile Creation Trigger for All User Types\n');

  const testCases = [
    {
      type: 'patient',
      data: {
        full_name: 'Test Patient User',
        role: 'patient',
        phone_number: '+84123456789'
      }
    },
    {
      type: 'doctor',
      data: {
        full_name: 'Test Doctor User',
        role: 'doctor',
        phone_number: '+84987654321'
      }
    },
    {
      type: 'admin',
      data: {
        full_name: 'Test Admin User',
        role: 'admin',
        phone_number: '+84555666777'
      }
    }
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    const success = await testUserType(testCase.type, testCase.data);
    if (success) passedTests++;
  }

  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Profile creation trigger is working for all user types.');
  } else {
    console.log('⚠️ Some tests failed. Please check the trigger configuration.');
  }

  return passedTests === totalTests;
}

runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
