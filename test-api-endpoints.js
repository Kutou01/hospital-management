#!/usr/bin/env node

/**
 * API Endpoints Test Script
 * Tests all microservices and dashboard APIs
 */

const http = require('http');
const https = require('https');

// Test colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`🧪 ${title}`, 'bright');
  log('='.repeat(60), 'cyan');
}

function logTest(testName, status, details = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  const color = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  log(`${icon} ${testName}`, color);
  if (details) {
    log(`   ${details}`, 'reset');
  }
}

// Simple HTTP request function
function makeRequest(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, { timeout }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Test functions
async function testMicroservices() {
  logSection('MICROSERVICES HEALTH CHECK');
  
  const services = [
    { name: 'API Gateway', url: 'http://localhost:3100/health' },
    { name: 'Auth Service', url: 'http://localhost:3001/health' },
    { name: 'Doctor Service', url: 'http://localhost:3002/health' },
    { name: 'Patient Service', url: 'http://localhost:3003/health' },
    { name: 'Appointment Service', url: 'http://localhost:3004/health' },
    { name: 'Department Service', url: 'http://localhost:3005/health' }
  ];

  const results = [];
  
  for (const service of services) {
    try {
      const response = await makeRequest(service.url);
      if (response.status === 200) {
        logTest(service.name, 'PASS', `Status: ${response.status}`);
        results.push({ name: service.name, status: 'PASS', code: response.status });
      } else {
        logTest(service.name, 'WARN', `Status: ${response.status}`);
        results.push({ name: service.name, status: 'WARN', code: response.status });
      }
    } catch (error) {
      logTest(service.name, 'FAIL', `Error: ${error.message}`);
      results.push({ name: service.name, status: 'FAIL', error: error.message });
    }
  }
  
  return results;
}

async function testStatsEndpoints() {
  logSection('STATS ENDPOINTS TESTING');
  
  const endpoints = [
    { name: 'Patients Stats', url: 'http://localhost:3100/api/patients/stats' },
    { name: 'Doctors Stats', url: 'http://localhost:3100/api/doctors/stats' },
    { name: 'Appointments Stats', url: 'http://localhost:3100/api/appointments/stats' },
    { name: 'Departments Stats', url: 'http://localhost:3100/api/departments/stats' }
  ];

  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(endpoint.url);
      if (response.status === 200) {
        logTest(endpoint.name, 'PASS', `Status: ${response.status}`);
        results.push({ name: endpoint.name, status: 'PASS', code: response.status });
      } else {
        logTest(endpoint.name, 'WARN', `Status: ${response.status}`);
        results.push({ name: endpoint.name, status: 'WARN', code: response.status });
      }
    } catch (error) {
      logTest(endpoint.name, 'FAIL', `Error: ${error.message}`);
      results.push({ name: endpoint.name, status: 'FAIL', error: error.message });
    }
  }
  
  return results;
}

async function testDirectServices() {
  logSection('DIRECT SERVICE ENDPOINTS');
  
  const endpoints = [
    { name: 'Patients Direct', url: 'http://localhost:3003/api/patients/health' },
    { name: 'Doctors Direct', url: 'http://localhost:3002/api/doctors/health' },
    { name: 'Appointments Direct', url: 'http://localhost:3004/api/appointments/health' },
    { name: 'Departments Direct', url: 'http://localhost:3005/api/departments/health' }
  ];

  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(endpoint.url);
      if (response.status === 200) {
        logTest(endpoint.name, 'PASS', `Status: ${response.status}`);
        results.push({ name: endpoint.name, status: 'PASS', code: response.status });
      } else {
        logTest(endpoint.name, 'WARN', `Status: ${response.status}`);
        results.push({ name: endpoint.name, status: 'WARN', code: response.status });
      }
    } catch (error) {
      logTest(endpoint.name, 'FAIL', `Error: ${error.message}`);
      results.push({ name: endpoint.name, status: 'FAIL', error: error.message });
    }
  }
  
  return results;
}

async function testFrontendServer() {
  logSection('FRONTEND SERVER TESTING');
  
  const endpoints = [
    { name: 'Frontend Home', url: 'http://localhost:3000/' },
    { name: 'Admin Dashboard', url: 'http://localhost:3000/admin/dashboard' },
    { name: 'Doctor Dashboard', url: 'http://localhost:3000/doctors/dashboard' },
    { name: 'Patient Dashboard', url: 'http://localhost:3000/patient/dashboard' }
  ];

  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(endpoint.url, 10000); // Longer timeout for frontend
      if (response.status === 200 || response.status === 302) {
        logTest(endpoint.name, 'PASS', `Status: ${response.status}`);
        results.push({ name: endpoint.name, status: 'PASS', code: response.status });
      } else {
        logTest(endpoint.name, 'WARN', `Status: ${response.status}`);
        results.push({ name: endpoint.name, status: 'WARN', code: response.status });
      }
    } catch (error) {
      logTest(endpoint.name, 'FAIL', `Error: ${error.message}`);
      results.push({ name: endpoint.name, status: 'FAIL', error: error.message });
    }
  }
  
  return results;
}

function generateTestReport(allResults) {
  logSection('API TEST REPORT SUMMARY');
  
  const totalTests = allResults.reduce((sum, category) => sum + category.results.length, 0);
  const passedTests = allResults.reduce((sum, category) => 
    sum + category.results.filter(r => r.status === 'PASS').length, 0);
  const failedTests = allResults.reduce((sum, category) => 
    sum + category.results.filter(r => r.status === 'FAIL').length, 0);
  const warnTests = allResults.reduce((sum, category) => 
    sum + category.results.filter(r => r.status === 'WARN').length, 0);

  log(`📊 Total API Tests: ${totalTests}`, 'bright');
  log(`✅ Passed: ${passedTests}`, 'green');
  log(`❌ Failed: ${failedTests}`, 'red');
  log(`⚠️  Warnings: ${warnTests}`, 'yellow');
  
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  log(`📈 API Success Rate: ${successRate}%`, successRate > 80 ? 'green' : successRate > 60 ? 'yellow' : 'red');

  // Detailed breakdown
  log('\n📋 DETAILED BREAKDOWN:', 'bright');
  allResults.forEach(category => {
    log(`\n${category.name}:`, 'cyan');
    category.results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      log(`  ${icon} ${result.name} ${result.code ? `(${result.code})` : ''}`);
    });
  });

  // Recommendations
  log('\n💡 RECOMMENDATIONS:', 'bright');
  if (failedTests === 0 && passedTests > 0) {
    log('• All APIs are working! Dashboard is ready for testing', 'green');
    log('• Open browser: http://localhost:3000/admin/dashboard', 'green');
    log('• Test real-time features and UI components', 'green');
  } else if (failedTests > 0) {
    log('• Some services are down - check Docker containers', 'yellow');
    log('• Run: docker-compose ps', 'yellow');
    log('• Restart failed services if needed', 'yellow');
  }
  
  if (warnTests > 0) {
    log('• Some endpoints returned non-200 status (might be normal)', 'yellow');
  }
}

// Main test runner
async function runAllTests() {
  log('🚀 STARTING API ENDPOINTS TESTING', 'bright');
  log(`📅 ${new Date().toISOString()}`, 'reset');
  
  try {
    const microservicesResults = await testMicroservices();
    const statsResults = await testStatsEndpoints();
    const directResults = await testDirectServices();
    const frontendResults = await testFrontendServer();

    const allResults = [
      { name: 'Microservices Health', results: microservicesResults },
      { name: 'Stats Endpoints', results: statsResults },
      { name: 'Direct Services', results: directResults },
      { name: 'Frontend Server', results: frontendResults }
    ];

    generateTestReport(allResults);
    
  } catch (error) {
    log(`❌ Test runner failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    log(`❌ Fatal error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testMicroservices,
  testStatsEndpoints,
  testDirectServices,
  testFrontendServer
};
