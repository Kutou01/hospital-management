const http = require('http');

// Test data for different scenarios
const testCases = [
  {
    name: "Patient Registration - Complete",
    data: {
      email: "patient.test@example.com",
      password: "password123",
      full_name: "John Patient",
      role: "patient",
      phone_number: "+84123456789",
      profile_data: {
        date_of_birth: "1990-01-01",
        gender: "male",
        address: "123 Main Street, Ho Chi Minh City"
      }
    }
  },
  {
    name: "Doctor Registration - Complete",
    data: {
      email: "doctor.test@example.com",
      password: "password123",
      full_name: "Dr. Jane Smith",
      role: "doctor",
      phone_number: "+84987654321",
      profile_data: {
        specialization: "cardiology",
        license_number: "ML12345678"
      }
    }
  },
  {
    name: "Patient Registration - Missing required fields",
    data: {
      email: "patient.incomplete@example.com",
      password: "password123",
      full_name: "Incomplete Patient",
      role: "patient",
      phone_number: "+84123456789"
      // Missing profile_data
    }
  },
  {
    name: "Doctor Registration - Missing required fields",
    data: {
      email: "doctor.incomplete@example.com",
      password: "password123",
      full_name: "Dr. Incomplete",
      role: "doctor",
      phone_number: "+84987654321",
      profile_data: {
        specialization: "cardiology"
        // Missing license_number
      }
    }
  }
];

async function testRegistration(testCase) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(testCase.data);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`📤 Data:`, JSON.stringify(testCase.data, null, 2));

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`📊 Status: ${res.statusCode}`);
        try {
          const parsed = JSON.parse(data);
          if (parsed.success) {
            console.log(`✅ Success: User created with ID ${parsed.data?.user?.id}`);
            console.log(`👤 User role: ${parsed.data?.user?.role}`);
            console.log(`🆔 Profile ID: ${parsed.data?.user?.profile_id}`);
          } else {
            console.log(`❌ Error: ${parsed.error}`);
          }
        } catch (e) {
          console.log(`❌ Failed to parse response: ${data}`);
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log(`❌ Request Error: ${err.message}`);
      resolve();
    });

    req.setTimeout(5000, () => {
      console.log(`⏰ Timeout`);
      req.destroy();
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting Registration Tests...');
  console.log('🔗 Testing against: http://localhost:3001/api/auth/register');
  
  for (const testCase of testCases) {
    await testRegistration(testCase);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
  }
  
  console.log('\n✨ All tests completed!');
}

// Run tests
runTests().catch(console.error);
