const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testSupabaseConnection() {
  log('blue', '🔗 Testing Supabase Connection...');
  
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test connection by querying users table
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116') {
        log('yellow', '⚠️  Users table not found in Supabase');
        log('yellow', '📋 Please create the users table first');
        return false;
      }
      throw error;
    }

    log('green', '✅ Supabase connection successful');
    return true;
  } catch (error) {
    log('red', `❌ Supabase connection failed: ${error.message}`);
    return false;
  }
}

async function testMicroserviceHealth() {
  log('blue', '🏥 Testing Microservice Health...');
  
  try {
    // Test API Gateway
    const gatewayResponse = await axios.get('http://localhost:3000/health');
    if (gatewayResponse.status === 200) {
      log('green', '✅ API Gateway is healthy');
    }

    // Test Auth Service
    const authResponse = await axios.get('http://localhost:3001/health');
    if (authResponse.status === 200) {
      log('green', '✅ Auth Service is healthy');
    }

    return true;
  } catch (error) {
    log('red', `❌ Microservice health check failed: ${error.message}`);
    log('yellow', '⚠️  Make sure services are running with: npm run dev');
    return false;
  }
}

async function testAuthFlow() {
  log('blue', '🔐 Testing Authentication Flow...');
  
  try {
    // Test login
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@hospital.com',
      password: 'admin123'
    });

    if (loginResponse.status === 200 && loginResponse.data.success) {
      log('green', '✅ Login successful');
      
      const { access_token, user } = loginResponse.data.data;
      log('cyan', `👤 Logged in as: ${user.full_name} (${user.role})`);

      // Test protected endpoint
      const profileResponse = await axios.get('http://localhost:3000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });

      if (profileResponse.status === 200) {
        log('green', '✅ Protected endpoint access successful');
        return true;
      }
    }
  } catch (error) {
    if (error.response) {
      log('red', `❌ Auth test failed: ${error.response.data.error || error.response.data.message}`);
    } else {
      log('red', `❌ Auth test failed: ${error.message}`);
    }
    return false;
  }
}

async function testSupabaseDataOperations() {
  log('blue', '📊 Testing Supabase Data Operations...');
  
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test reading users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('user_id, email, role, full_name')
      .limit(5);

    if (usersError) throw usersError;

    log('green', `✅ Successfully read ${users.length} users from Supabase`);
    
    users.forEach(user => {
      log('cyan', `  👤 ${user.full_name} (${user.email}) - ${user.role}`);
    });

    // Test creating a test user
    const testUserId = `TEST_${Date.now()}`;
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash('test123', 12);

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([{
        user_id: testUserId,
        email: `test_${Date.now()}@hospital.com`,
        password_hash: passwordHash,
        role: 'patient',
        full_name: 'Test Patient',
        is_active: true
      }])
      .select()
      .single();

    if (createError) throw createError;

    log('green', '✅ Successfully created test user');

    // Clean up test user
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('user_id', testUserId);

    if (deleteError) throw deleteError;

    log('green', '✅ Successfully cleaned up test user');
    return true;
  } catch (error) {
    log('red', `❌ Supabase data operations failed: ${error.message}`);
    return false;
  }
}

async function testEndToEndFlow() {
  log('blue', '🔄 Testing End-to-End Flow...');
  
  try {
    // 1. Register a new user via API
    const registerData = {
      email: `e2e_test_${Date.now()}@hospital.com`,
      password: 'test123456',
      role: 'patient',
      full_name: 'E2E Test Patient',
      phone_number: '+84123456789'
    };

    const registerResponse = await axios.post('http://localhost:3000/api/auth/register', registerData);
    
    if (registerResponse.status === 201) {
      log('green', '✅ User registration successful');
      
      const newUser = registerResponse.data.data.user;
      
      // 2. Login with the new user
      const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
        email: registerData.email,
        password: registerData.password
      });

      if (loginResponse.status === 200) {
        log('green', '✅ Login with new user successful');
        
        // 3. Access protected endpoint
        const { access_token } = loginResponse.data.data;
        const profileResponse = await axios.get('http://localhost:3000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        });

        if (profileResponse.status === 200) {
          log('green', '✅ Protected endpoint access successful');
          
          // 4. Clean up - delete test user from Supabase
          const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
          );

          await supabase
            .from('users')
            .delete()
            .eq('user_id', newUser.id);

          log('green', '✅ Test user cleaned up');
          return true;
        }
      }
    }
  } catch (error) {
    if (error.response) {
      log('red', `❌ E2E test failed: ${error.response.data.error || error.response.data.message}`);
    } else {
      log('red', `❌ E2E test failed: ${error.message}`);
    }
    return false;
  }
}

async function runAllTests() {
  log('magenta', '🧪 Hospital Microservices + Supabase Integration Tests');
  log('magenta', '====================================================');
  
  const results = {
    supabaseConnection: false,
    microserviceHealth: false,
    authFlow: false,
    supabaseDataOps: false,
    endToEndFlow: false
  };

  // Run tests
  results.supabaseConnection = await testSupabaseConnection();
  console.log('');
  
  results.microserviceHealth = await testMicroserviceHealth();
  console.log('');
  
  if (results.supabaseConnection && results.microserviceHealth) {
    results.authFlow = await testAuthFlow();
    console.log('');
    
    results.supabaseDataOps = await testSupabaseDataOperations();
    console.log('');
    
    results.endToEndFlow = await testEndToEndFlow();
    console.log('');
  }

  // Summary
  log('magenta', '📊 Test Results Summary:');
  log('magenta', '========================');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? 'green' : 'red';
    log(color, `${status} ${test}`);
  });

  const allPassed = Object.values(results).every(result => result);
  
  console.log('');
  if (allPassed) {
    log('green', '🎉 All tests passed! Your microservices + Supabase integration is working correctly.');
  } else {
    log('red', '❌ Some tests failed. Please check the configuration and try again.');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  log('red', `❌ Test runner failed: ${error.message}`);
  process.exit(1);
});
