// Simple Frontend Test Script
// Tests basic connectivity between frontend and backend services

const https = require('https');
const http = require('http');

// Disable SSL verification for development
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

console.log('🧪 Starting Frontend Integration Tests...\n');

// Test configuration
const tests = [
  {
    name: 'Frontend Server',
    url: 'http://localhost:3000',
    expected: 200
  },
  {
    name: 'API Gateway Health',
    url: 'http://localhost:3100/health',
    expected: 200
  },
  {
    name: 'Auth Service Health',
    url: 'http://localhost:3001/health',
    expected: 200
  },
  {
    name: 'Doctor Service Health',
    url: 'http://localhost:3002/health',
    expected: 200
  },
  {
    name: 'Patient Service Health',
    url: 'http://localhost:3003/health',
    expected: 200
  }
];

// Simple HTTP request function
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Run tests
async function runTests() {
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`🔍 Testing: ${test.name}`);
      console.log(`   URL: ${test.url}`);
      
      const result = await makeRequest(test.url);
      
      if (result.statusCode === test.expected) {
        console.log(`   ✅ PASS - Status: ${result.statusCode}`);
        passed++;
      } else {
        console.log(`   ❌ FAIL - Expected: ${test.expected}, Got: ${result.statusCode}`);
        failed++;
      }
      
      // Try to parse JSON response for health checks
      if (test.url.includes('/health')) {
        try {
          const jsonData = JSON.parse(result.data);
          console.log(`   📊 Service: ${jsonData.service || 'unknown'}`);
          console.log(`   📊 Status: ${jsonData.status || 'unknown'}`);
        } catch (e) {
          // Not JSON, that's ok
        }
      }
      
    } catch (error) {
      console.log(`   ❌ FAIL - Error: ${error.message}`);
      failed++;
    }
    
    console.log(''); // Empty line for readability
  }
  
  // Summary
  console.log('📋 Test Summary:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📊 Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Frontend and backend are working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the services above.');
  }
}

// Run the tests
runTests().catch(console.error);
