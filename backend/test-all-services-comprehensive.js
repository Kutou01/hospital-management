#!/usr/bin/env node

/**
 * 🧪 COMPREHENSIVE ALL SERVICES TEST SCRIPT
 * 
 * Tests all enabled services in the Hospital Management System
 * - API Gateway
 * - Auth Service
 * - Doctor Service
 * - Patient Service
 * - Appointment Service
 * - Department Service
 * - Medical Records Service
 * - Prescription Service
 * - Billing Service
 * - Notification Service
 * 
 * Usage: node test-all-services-comprehensive.js
 */

const axios = require('axios');

// Configuration
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3100';
const TEST_TIMEOUT = 10000; // 10 seconds

// Test Statistics
let testStats = {
  total: 0,
  passed: 0,
  failed: 0,
  startTime: Date.now(),
  endTime: null
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, status, details = '') {
  const statusColor = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  log(`  ${statusIcon} ${testName}: ${status} ${details}`, statusColor);
  
  testStats.total++;
  if (status === 'PASS') testStats.passed++;
  else testStats.failed++;
}

async function makeRequest(method, url, data = null) {
  try {
    const config = {
      method,
      url,
      timeout: TEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 0,
      error: error.message,
      data: error.response?.data
    };
  }
}

async function testServiceHealth(serviceName, port) {
  log(`\n🔍 Testing ${serviceName}...`, 'cyan');
  
  // Test direct service health
  const directResult = await makeRequest('GET', `http://localhost:${port}/health`);
  if (directResult.success) {
    logTest(`${serviceName} Direct Health`, 'PASS', `Status: ${directResult.status}`);
  } else {
    logTest(`${serviceName} Direct Health`, 'FAIL', `Error: ${directResult.error}`);
  }
  
  // Test via API Gateway (if not API Gateway itself)
  if (serviceName !== 'API Gateway') {
    // Map service names to correct API paths
    const servicePathMap = {
      'Auth Service': 'auth/verify',  // Use a specific endpoint that exists
      'Doctor Service': 'doctors',
      'Patient Service': 'patients',
      'Appointment Service': 'appointments',
      'Department Service': 'departments',
      'Medical Records Service': 'medical-records',
      'Prescription Service': 'prescriptions',
      'Billing Service': 'billing',
      'Notification Service': 'notifications'
    };

    const gatewayPath = servicePathMap[serviceName] || serviceName.toLowerCase().replace(' service', '').replace(' ', '-');
    const gatewayResult = await makeRequest('GET', `${API_GATEWAY_URL}/api/${gatewayPath}`);
    // 401 is expected for protected routes, 400 is expected for auth endpoints without proper data
    if (gatewayResult.success || gatewayResult.status === 401 || (serviceName === 'Auth Service' && gatewayResult.status === 400)) {
      logTest(`${serviceName} via Gateway`, 'PASS', `Status: ${gatewayResult.status}`);
    } else {
      logTest(`${serviceName} via Gateway`, 'FAIL', `Error: ${gatewayResult.error}`);
    }
  }
}

async function testAPIGateway() {
  log('\n🚪 Testing API Gateway...', 'cyan');
  
  // Test root endpoint
  const rootResult = await makeRequest('GET', `${API_GATEWAY_URL}/`);
  if (rootResult.success) {
    logTest('API Gateway Root', 'PASS', `Available services: ${rootResult.data.availableServices?.length || 0}`);
  } else {
    logTest('API Gateway Root', 'FAIL', `Error: ${rootResult.error}`);
  }
  
  // Test health endpoint
  const healthResult = await makeRequest('GET', `${API_GATEWAY_URL}/health`);
  if (healthResult.success) {
    logTest('API Gateway Health', 'PASS', `Status: ${healthResult.status}`);
  } else {
    logTest('API Gateway Health', 'FAIL', `Error: ${healthResult.error}`);
  }
  
  // Test services discovery
  const servicesResult = await makeRequest('GET', `${API_GATEWAY_URL}/services`);
  if (servicesResult.success) {
    const serviceCount = Object.keys(servicesResult.data.availableServices || {}).length;
    logTest('Services Discovery', 'PASS', `Found ${serviceCount} services`);
  } else {
    logTest('Services Discovery', 'FAIL', `Error: ${servicesResult.error}`);
  }
}

async function runAllTests() {
  log('🚀 STARTING COMPREHENSIVE SERVICES TESTING', 'bright');
  log(`📅 ${new Date().toISOString()}`, 'reset');
  log('=' .repeat(60), 'cyan');
  
  try {
    // Test API Gateway first
    await testAPIGateway();
    
    // Test all services
    const services = [
      { name: 'Auth Service', port: 3001 },
      { name: 'Doctor Service', port: 3002 },
      { name: 'Patient Service', port: 3003 },
      { name: 'Appointment Service', port: 3004 },
      { name: 'Department Service', port: 3005 },
      { name: 'Medical Records Service', port: 3006 },
      { name: 'Prescription Service', port: 3007 },
      { name: 'Billing Service', port: 3008 },
      { name: 'Notification Service', port: 3011 }
    ];
    
    for (const service of services) {
      await testServiceHealth(service.name, service.port);
    }
    
    // Generate summary
    testStats.endTime = Date.now();
    const duration = Math.round((testStats.endTime - testStats.startTime) / 1000);
    
    log('\n📊 TEST SUMMARY', 'cyan');
    log('=' .repeat(60), 'cyan');
    log(`Total Tests: ${testStats.total}`, 'white');
    log(`Passed: ${testStats.passed}`, 'green');
    log(`Failed: ${testStats.failed}`, 'red');
    log(`Success Rate: ${Math.round((testStats.passed / testStats.total) * 100)}%`, 'yellow');
    log(`Duration: ${duration} seconds`, 'white');
    
    if (testStats.failed === 0) {
      log('\n🎉 ALL SERVICES ARE HEALTHY!', 'green');
      log('✅ Hospital Management System is ready for use', 'green');
    } else {
      log('\n⚠️  Some services have issues', 'yellow');
      log('💡 Check Docker containers: docker compose ps', 'yellow');
      log('💡 Check logs: docker compose logs [service-name]', 'yellow');
    }
    
    log('\n📚 Next Steps:', 'cyan');
    log('   1. Start all services: docker compose --profile core up -d', 'white');
    log('   2. Access API Gateway: http://localhost:3100', 'white');
    log('   3. Access Frontend: http://localhost:3000', 'white');
    log('   4. Access Grafana: http://localhost:3010 (admin/admin)', 'white');
    
  } catch (error) {
    log(`❌ Test runner failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run tests
runAllTests();
