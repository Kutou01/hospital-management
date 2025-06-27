const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const TEST_DOCTOR_ID = 'CARD-DOC-202412-001';

// Test configuration
const config = {
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

async function testAPI(endpoint, description) {
  console.log(`\n🔍 Testing: ${description}`);
  console.log(`   Endpoint: ${endpoint}`);

  const startTime = Date.now();

  try {
    const response = await axios.get(`${BASE_URL}${endpoint}`, config);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Success (${duration}ms)`);
    console.log(`   Status: ${response.status}`);
    
    if (response.data) {
      if (response.data.success) {
        console.log(`   Success: ${response.data.success}`);
        console.log(`   Message: ${response.data.message || 'N/A'}`);
        
        // Show data summary
        if (response.data.data) {
          const data = response.data.data;
          
          if (Array.isArray(data)) {
            console.log(`   Data: Array with ${data.length} items`);
          } else if (typeof data === 'object') {
            const keys = Object.keys(data);
            console.log(`   Data: Object with keys: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`);
          } else {
            console.log(`   Data: ${typeof data}`);
          }
        }
      } else {
        console.log(`   Error: ${response.data.error || 'Unknown error'}`);
      }
    }
    
    return { success: true, data: response.data, duration };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ Failed (${duration}ms)`);

    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data?.error || error.response.statusText}`);
      console.log(`   Message: ${error.response.data?.message || 'N/A'}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }

    return { success: false, error: error.message, duration };
  }
}

async function runProfileTests() {
  console.log('🧪 Doctor Profile API Tests');
  console.log('============================');
  console.log(`Testing with Doctor ID: ${TEST_DOCTOR_ID}`);
  
  const tests = [
    {
      endpoint: `/doctors/${TEST_DOCTOR_ID}/profile`,
      description: 'Get Doctor Profile'
    },
    {
      endpoint: `/doctors/${TEST_DOCTOR_ID}/schedule`,
      description: 'Get Doctor Schedule'
    },
    {
      endpoint: `/doctors/${TEST_DOCTOR_ID}/schedule/today`,
      description: 'Get Today\'s Schedule'
    },
    {
      endpoint: `/doctors/${TEST_DOCTOR_ID}/reviews`,
      description: 'Get Doctor Reviews'
    },
    {
      endpoint: `/doctors/${TEST_DOCTOR_ID}/experiences`,
      description: 'Get Doctor Experiences'
    },
    {
      endpoint: `/doctors/${TEST_DOCTOR_ID}/stats`,
      description: 'Get Doctor Statistics'
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await testAPI(test.endpoint, test.description);
    results.push({
      ...test,
      ...result
    });
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.success).forEach(test => {
      console.log(`   • ${test.description}: ${test.error}`);
    });
  }
  
  console.log('\n💡 Next Steps:');
  console.log('   1. Check the test results above');
  console.log('   2. Open http://localhost:3000/test/doctor-api to test in browser');
  console.log('   3. Verify API endpoints are working correctly');
  console.log('   4. Check database for test data if needed');
}

// Run tests
if (require.main === module) {
  runProfileTests().catch(error => {
    console.error('❌ Test runner error:', error);
    process.exit(1);
  });
}

module.exports = {
  runProfileTests,
  testAPI
};
