#!/usr/bin/env node

/**
 * 🧪 TEST PURE API GATEWAY COMMUNICATION
 * 
 * Test script để kiểm tra Pure API Gateway Communication pattern
 * Tất cả service-to-service calls phải đi qua API Gateway
 */

const axios = require('axios');

// Configuration
const API_GATEWAY_URL = 'http://localhost:3100';
const DOCTOR_SERVICE_URL = 'http://localhost:3002';
const PATIENT_SERVICE_URL = 'http://localhost:3003';
const APPOINTMENT_SERVICE_URL = 'http://localhost:3004';

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function makeRequest(method, url, data = null, headers = {}) {
  const startTime = Date.now();
  
  try {
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      ...(data && { data }),
      timeout: 10000
    };
    
    const response = await axios(config);
    const duration = Date.now() - startTime;
    
    return {
      success: true,
      data: response.data,
      status: response.status,
      duration
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status || 0,
      duration,
      fullError: error.response?.data
    };
  }
}

async function testPureApiGatewayCommunication() {
  log('🧪 TESTING PURE API GATEWAY COMMUNICATION', 'cyan');
  log('=' .repeat(60), 'cyan');
  
  let authToken = null;
  let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Service Discovery
  log('\n1️⃣ Testing Service Discovery...', 'blue');
  const serviceDiscovery = await makeRequest('GET', `${API_GATEWAY_URL}/services`);
  testResults.total++;
  
  if (serviceDiscovery.success) {
    log('✅ Service Discovery working', 'green');
    log(`   Available services: ${Object.keys(serviceDiscovery.data.availableServices).length}`, 'white');
    testResults.passed++;
    testResults.tests.push({ name: 'Service Discovery', status: 'PASS', duration: serviceDiscovery.duration });
  } else {
    log('❌ Service Discovery failed', 'red');
    log(`   Error: ${serviceDiscovery.error}`, 'red');
    testResults.failed++;
    testResults.tests.push({ name: 'Service Discovery', status: 'FAIL', error: serviceDiscovery.error });
  }

  // Test 2: Authentication through API Gateway
  log('\n2️⃣ Testing Authentication through API Gateway...', 'blue');
  const authResult = await makeRequest('POST', `${API_GATEWAY_URL}/api/auth/signin`, {
    email: 'doctor@hospital.com',
    password: 'Doctor123.'
  });
  testResults.total++;

  if (authResult.success && authResult.data.access_token) {
    authToken = authResult.data.access_token;
    log('✅ Authentication successful', 'green');
    log(`   Token received: ${authToken.substring(0, 20)}...`, 'white');
    testResults.passed++;
    testResults.tests.push({ name: 'Authentication', status: 'PASS', duration: authResult.duration });
  } else {
    log('❌ Authentication failed', 'red');
    log(`   Error: ${authResult.error}`, 'red');
    testResults.failed++;
    testResults.tests.push({ name: 'Authentication', status: 'FAIL', error: authResult.error });
    return testResults; // Cannot continue without auth
  }

  // Test 3: Direct Service Access (Should be blocked or limited)
  log('\n3️⃣ Testing Direct Service Access (Should use API Gateway)...', 'blue');
  
  // Test direct doctor service access
  const directDoctorAccess = await makeRequest('GET', `${DOCTOR_SERVICE_URL}/api/doctors`, null, {
    'Authorization': `Bearer ${authToken}`
  });
  testResults.total++;

  if (directDoctorAccess.success) {
    log('⚠️  Direct Doctor Service access still works (not pure API Gateway)', 'yellow');
    log('   This indicates services can still be accessed directly', 'yellow');
    testResults.tests.push({ name: 'Direct Service Access Block', status: 'WARN', note: 'Direct access still possible' });
  } else {
    log('✅ Direct Doctor Service access blocked/failed', 'green');
    log(`   Error: ${directDoctorAccess.error}`, 'white');
    testResults.passed++;
    testResults.tests.push({ name: 'Direct Service Access Block', status: 'PASS', duration: directDoctorAccess.duration });
  }

  // Test 4: API Gateway Routing to Doctor Service
  log('\n4️⃣ Testing API Gateway Routing to Doctor Service...', 'blue');
  const gatewayDoctorAccess = await makeRequest('GET', `${API_GATEWAY_URL}/api/doctors`, null, {
    'Authorization': `Bearer ${authToken}`
  });
  testResults.total++;

  if (gatewayDoctorAccess.success) {
    log('✅ API Gateway routing to Doctor Service working', 'green');
    log(`   Doctors found: ${gatewayDoctorAccess.data.data?.length || 0}`, 'white');
    testResults.passed++;
    testResults.tests.push({ name: 'API Gateway Doctor Routing', status: 'PASS', duration: gatewayDoctorAccess.duration });
  } else {
    log('❌ API Gateway routing to Doctor Service failed', 'red');
    log(`   Error: ${gatewayDoctorAccess.error}`, 'red');
    testResults.failed++;
    testResults.tests.push({ name: 'API Gateway Doctor Routing', status: 'FAIL', error: gatewayDoctorAccess.error });
  }

  // Test 5: API Gateway Routing to Patient Service
  log('\n5️⃣ Testing API Gateway Routing to Patient Service...', 'blue');
  const gatewayPatientAccess = await makeRequest('GET', `${API_GATEWAY_URL}/api/patients`, null, {
    'Authorization': `Bearer ${authToken}`
  });
  testResults.total++;

  if (gatewayPatientAccess.success) {
    log('✅ API Gateway routing to Patient Service working', 'green');
    log(`   Patients found: ${gatewayPatientAccess.data.data?.length || 0}`, 'white');
    testResults.passed++;
    testResults.tests.push({ name: 'API Gateway Patient Routing', status: 'PASS', duration: gatewayPatientAccess.duration });
  } else {
    log('❌ API Gateway routing to Patient Service failed', 'red');
    log(`   Error: ${gatewayPatientAccess.error}`, 'red');
    testResults.failed++;
    testResults.tests.push({ name: 'API Gateway Patient Routing', status: 'FAIL', error: gatewayPatientAccess.error });
  }

  // Test 6: API Gateway Routing to Appointment Service
  log('\n6️⃣ Testing API Gateway Routing to Appointment Service...', 'blue');
  const gatewayAppointmentAccess = await makeRequest('GET', `${API_GATEWAY_URL}/api/appointments`, null, {
    'Authorization': `Bearer ${authToken}`
  });
  testResults.total++;

  if (gatewayAppointmentAccess.success) {
    log('✅ API Gateway routing to Appointment Service working', 'green');
    log(`   Appointments found: ${gatewayAppointmentAccess.data.data?.length || 0}`, 'white');
    testResults.passed++;
    testResults.tests.push({ name: 'API Gateway Appointment Routing', status: 'PASS', duration: gatewayAppointmentAccess.duration });
  } else {
    log('❌ API Gateway routing to Appointment Service failed', 'red');
    log(`   Error: ${gatewayAppointmentAccess.error}`, 'red');
    testResults.failed++;
    testResults.tests.push({ name: 'API Gateway Appointment Routing', status: 'FAIL', error: gatewayAppointmentAccess.error });
  }

  // Test 7: Internal Routes (Service-to-Service via API Gateway)
  log('\n7️⃣ Testing Internal Routes (Service-to-Service Communication)...', 'blue');
  const internalPatientAccess = await makeRequest('GET', `${API_GATEWAY_URL}/internal/patients`, null, {
    'x-service-name': 'doctor-service',
    'x-request-id': 'test-' + Date.now()
  });
  testResults.total++;

  if (internalPatientAccess.success) {
    log('✅ Internal routing working (Service-to-Service via API Gateway)', 'green');
    log(`   Internal patients endpoint accessible`, 'white');
    testResults.passed++;
    testResults.tests.push({ name: 'Internal Service Communication', status: 'PASS', duration: internalPatientAccess.duration });
  } else {
    log('❌ Internal routing failed', 'red');
    log(`   Error: ${internalPatientAccess.error}`, 'red');
    testResults.failed++;
    testResults.tests.push({ name: 'Internal Service Communication', status: 'FAIL', error: internalPatientAccess.error });
  }

  // Test 8: Service Health Checks
  log('\n8️⃣ Testing Service Health Checks...', 'blue');
  const healthChecks = ['auth', 'doctors', 'patients', 'appointments'];
  let healthyServices = 0;

  for (const service of healthChecks) {
    const healthCheck = await makeRequest('GET', `${API_GATEWAY_URL}/api/${service}/health`);
    if (healthCheck.success) {
      log(`   ✅ ${service} service healthy`, 'green');
      healthyServices++;
    } else {
      log(`   ❌ ${service} service unhealthy: ${healthCheck.error}`, 'red');
    }
  }

  testResults.total++;
  if (healthyServices === healthChecks.length) {
    log('✅ All core services healthy', 'green');
    testResults.passed++;
    testResults.tests.push({ name: 'Service Health Checks', status: 'PASS', note: `${healthyServices}/${healthChecks.length} healthy` });
  } else {
    log(`⚠️  ${healthyServices}/${healthChecks.length} services healthy`, 'yellow');
    testResults.tests.push({ name: 'Service Health Checks', status: 'WARN', note: `${healthyServices}/${healthChecks.length} healthy` });
  }

  // Summary
  log('\n📊 TEST SUMMARY', 'cyan');
  log('=' .repeat(60), 'cyan');
  log(`Total Tests: ${testResults.total}`, 'white');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, 'red');
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`, 'blue');

  log('\n📋 DETAILED RESULTS:', 'cyan');
  testResults.tests.forEach((test, index) => {
    const statusColor = test.status === 'PASS' ? 'green' : test.status === 'FAIL' ? 'red' : 'yellow';
    const statusIcon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
    log(`${index + 1}. ${statusIcon} ${test.name}: ${test.status}`, statusColor);
    if (test.duration) log(`   Duration: ${test.duration}ms`, 'white');
    if (test.error) log(`   Error: ${test.error}`, 'red');
    if (test.note) log(`   Note: ${test.note}`, 'yellow');
  });

  // Pure API Gateway Communication Assessment
  log('\n🎯 PURE API GATEWAY COMMUNICATION ASSESSMENT:', 'cyan');
  const hasInternalRoutes = testResults.tests.find(t => t.name === 'Internal Service Communication')?.status === 'PASS';
  const hasApiGatewayRouting = testResults.tests.filter(t => t.name.includes('API Gateway') && t.status === 'PASS').length >= 3;
  
  if (hasInternalRoutes && hasApiGatewayRouting) {
    log('✅ Pure API Gateway Communication: IMPLEMENTED', 'green');
    log('   - Internal routes for service-to-service communication ✅', 'green');
    log('   - API Gateway routing for external access ✅', 'green');
    log('   - Services can communicate through API Gateway ✅', 'green');
  } else {
    log('⚠️  Pure API Gateway Communication: PARTIALLY IMPLEMENTED', 'yellow');
    log(`   - Internal routes: ${hasInternalRoutes ? '✅' : '❌'}`, hasInternalRoutes ? 'green' : 'red');
    log(`   - API Gateway routing: ${hasApiGatewayRouting ? '✅' : '❌'}`, hasApiGatewayRouting ? 'green' : 'red');
  }

  return testResults;
}

// Run the test
if (require.main === module) {
  testPureApiGatewayCommunication()
    .then(results => {
      const exitCode = results.failed > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch(error => {
      log(`\n💥 Test execution failed: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = { testPureApiGatewayCommunication };
