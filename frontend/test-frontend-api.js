// Frontend API Integration Test
// Tests actual API calls that frontend would make

const http = require('http');

console.log('🧪 Testing Frontend API Integration...\n');

// Test data
const testPatient = {
  email: 'frontend.test.patient@example.com',
  password: 'testpassword123',
  full_name: 'Frontend Test Patient',
  role: 'patient',
  phone_number: '+84123456789',
  profile_data: {
    date_of_birth: '1990-01-01',
    gender: 'male',
    address: '123 Test Street, Ho Chi Minh City'
  }
};

const testDoctor = {
  email: 'frontend.test.doctor@example.com',
  password: 'testpassword123',
  full_name: 'Dr. Frontend Test',
  role: 'doctor',
  phone_number: '+84987654321',
  profile_data: {
    specialization: 'cardiology',
    license_number: 'ML12345678'
  }
};

// HTTP request helper
function makeAPIRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3100, // API Gateway
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: responseData,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test functions
async function testPatientRegistration() {
  console.log('🔍 Testing Patient Registration via API Gateway...');
  
  try {
    const result = await makeAPIRequest('POST', '/api/auth/register', testPatient);
    
    console.log(`   Status: ${result.statusCode}`);
    console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
    
    if (result.statusCode === 201 || result.statusCode === 200) {
      console.log('   ✅ Patient registration successful');
      return true;
    } else if (result.statusCode === 400 && result.data.message && result.data.message.includes('already exists')) {
      console.log('   ✅ Patient already exists (expected for repeated tests)');
      return true;
    } else {
      console.log('   ❌ Patient registration failed');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testDoctorRegistration() {
  console.log('🔍 Testing Doctor Registration via API Gateway...');
  
  try {
    const result = await makeAPIRequest('POST', '/api/auth/register', testDoctor);
    
    console.log(`   Status: ${result.statusCode}`);
    console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
    
    if (result.statusCode === 201 || result.statusCode === 200) {
      console.log('   ✅ Doctor registration successful');
      return true;
    } else if (result.statusCode === 400 && result.data.message && result.data.message.includes('already exists')) {
      console.log('   ✅ Doctor already exists (expected for repeated tests)');
      return true;
    } else {
      console.log('   ❌ Doctor registration failed');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testLogin() {
  console.log('🔍 Testing Login via API Gateway...');
  
  try {
    const loginData = {
      email: testPatient.email,
      password: testPatient.password
    };
    
    const result = await makeAPIRequest('POST', '/api/auth/login', loginData);
    
    console.log(`   Status: ${result.statusCode}`);
    
    if (result.statusCode === 200 && result.data.success) {
      console.log('   ✅ Login successful');
      console.log(`   📊 User: ${result.data.data.user.full_name}`);
      console.log(`   📊 Role: ${result.data.data.user.role}`);
      return result.data.data.access_token;
    } else {
      console.log('   ❌ Login failed');
      console.log(`   Response: ${JSON.stringify(result.data, null, 2)}`);
      return null;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

// Main test runner
async function runAPITests() {
  console.log('🚀 Starting Frontend API Tests...\n');
  
  let passed = 0;
  let total = 0;
  
  // Test 1: Patient Registration
  total++;
  if (await testPatientRegistration()) passed++;
  console.log('');
  
  // Test 2: Doctor Registration  
  total++;
  if (await testDoctorRegistration()) passed++;
  console.log('');
  
  // Test 3: Login
  total++;
  const token = await testLogin();
  if (token) passed++;
  console.log('');
  
  // Summary
  console.log('📋 API Test Summary:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${total - passed}`);
  console.log(`   📊 Total: ${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All API tests passed! Frontend can successfully communicate with backend.');
  } else {
    console.log('\n⚠️  Some API tests failed. Check the responses above.');
  }
}

// Run the tests
runAPITests().catch(console.error);
