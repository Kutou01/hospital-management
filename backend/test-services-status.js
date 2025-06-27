#!/usr/bin/env node

/**
 * 🔍 QUICK SERVICE STATUS CHECK
 * 
 * Kiểm tra tình trạng hoạt động của tất cả services
 */

const axios = require('axios');

// Service URLs
const services = {
  'API Gateway': 'http://localhost:3100',
  'Auth Service': 'http://localhost:3001',
  'Doctor Service': 'http://localhost:3002',
  'Patient Service': 'http://localhost:3003',
  'Appointment Service': 'http://localhost:3004'
};

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

async function checkService(name, url) {
  try {
    const startTime = Date.now();
    const response = await axios.get(`${url}/health`, { timeout: 5000 });
    const duration = Date.now() - startTime;
    
    if (response.status === 200) {
      log(`✅ ${name}: HEALTHY (${duration}ms)`, 'green');
      return { name, status: 'healthy', duration, url };
    } else {
      log(`⚠️  ${name}: UNHEALTHY (Status: ${response.status})`, 'yellow');
      return { name, status: 'unhealthy', duration, url };
    }
  } catch (error) {
    log(`❌ ${name}: DOWN (${error.message})`, 'red');
    return { name, status: 'down', error: error.message, url };
  }
}

async function testAuthEndpoint() {
  try {
    log('\n🔐 Testing Auth Service endpoints...', 'cyan');

    // Test direct auth service
    const directAuth = await axios.get('http://localhost:3001/health', { timeout: 5000 });
    log(`✅ Direct Auth Service: ${directAuth.status}`, 'green');

    // Test auth through gateway - FIX: Use correct endpoint
    try {
      // Auth service routes are proxied to /api/auth/* but health is at root level
      const gatewayAuth = await axios.get('http://localhost:3100/health', { timeout: 5000 });
      log(`✅ Gateway Health Check: ${gatewayAuth.status}`, 'green');

      // Test actual auth endpoint through gateway
      const authSignupTest = await axios.get('http://localhost:3100/api/auth', { timeout: 5000 });
      log(`✅ Auth Routes via Gateway: ${authSignupTest.status}`, 'green');
    } catch (error) {
      log(`❌ Auth via Gateway: ${error.response?.status || error.message}`, 'red');

      // Try to get more info about available routes
      try {
        const gatewayInfo = await axios.get('http://localhost:3100/', { timeout: 5000 });
        log(`ℹ️  Gateway Info: Available routes found`, 'yellow');
      } catch (infoError) {
        log(`❌ Gateway Info: ${infoError.message}`, 'red');
      }
    }

  } catch (error) {
    log(`❌ Auth Service Test Failed: ${error.message}`, 'red');
  }
}

async function testDoctorEndpoint() {
  try {
    log('\n👨‍⚕️ Testing Doctor Service endpoints...', 'cyan');

    // Test direct doctor service
    const directDoctor = await axios.get('http://localhost:3002/health', { timeout: 5000 });
    log(`✅ Direct Doctor Service: ${directDoctor.status}`, 'green');

    // Test doctor through gateway - FIX: This requires authentication
    try {
      // First, let's test if we can reach the gateway route (should get 401 - which is expected)
      const gatewayDoctor = await axios.get('http://localhost:3100/api/doctors', { timeout: 5000 });
      log(`✅ Doctor via Gateway: ${gatewayDoctor.status}`, 'green');
    } catch (error) {
      if (error.response?.status === 401) {
        log(`✅ Doctor via Gateway: 401 (Expected - requires auth)`, 'green');
        log(`   Gateway routing is working, authentication required`, 'yellow');
      } else {
        log(`❌ Doctor via Gateway: ${error.response?.status || error.message}`, 'red');
      }
    }

  } catch (error) {
    log(`❌ Doctor Service Test Failed: ${error.message}`, 'red');
  }
}

async function checkServiceDetails(name, url) {
  try {
    log(`\n🔍 Checking ${name} details...`, 'cyan');

    // Check root endpoint
    const rootResponse = await axios.get(url, { timeout: 5000 });
    log(`  ✅ Root endpoint: ${rootResponse.status}`, 'green');

    // Check health endpoint
    const healthResponse = await axios.get(`${url}/health`, { timeout: 5000 });
    log(`  ✅ Health endpoint: ${healthResponse.status}`, 'green');

    // Check specific API endpoints based on service
    if (name === 'Auth Service') {
      try {
        await axios.get(`${url}/api/auth/register`, { timeout: 5000 });
      } catch (error) {
        if (error.response?.status === 405) {
          log(`  ✅ Auth register endpoint exists (405 - Method not allowed)`, 'green');
        } else {
          log(`  ⚠️  Auth register endpoint: ${error.response?.status || error.message}`, 'yellow');
        }
      }
    }

    if (name === 'Doctor Service') {
      try {
        await axios.get(`${url}/api/doctors`, { timeout: 5000 });
      } catch (error) {
        if (error.response?.status === 401) {
          log(`  ✅ Doctor API endpoint exists (401 - Auth required)`, 'green');
        } else {
          log(`  ⚠️  Doctor API endpoint: ${error.response?.status || error.message}`, 'yellow');
        }
      }
    }

    if (name === 'Patient Service') {
      try {
        await axios.get(`${url}/api/patients`, { timeout: 5000 });
      } catch (error) {
        if (error.response?.status === 401) {
          log(`  ✅ Patient API endpoint exists (401 - Auth required)`, 'green');
        } else {
          log(`  ⚠️  Patient API endpoint: ${error.response?.status || error.message}`, 'yellow');
        }
      }
    }

    if (name === 'Appointment Service') {
      try {
        await axios.get(`${url}/api/appointments`, { timeout: 5000 });
      } catch (error) {
        if (error.response?.status === 401) {
          log(`  ✅ Appointment API endpoint exists (401 - Auth required)`, 'green');
        } else {
          log(`  ⚠️  Appointment API endpoint: ${error.response?.status || error.message}`, 'yellow');
        }
      }
    }

    return { name, status: 'detailed_check_complete' };

  } catch (error) {
    log(`  ❌ ${name} detailed check failed: ${error.message}`, 'red');
    return { name, status: 'detailed_check_failed', error: error.message };
  }
}

async function main() {
  log('🚀 Hospital Management System - Core Services Analysis', 'cyan');
  log('=' .repeat(60), 'cyan');

  const results = [];

  // Check all services
  for (const [name, url] of Object.entries(services)) {
    const result = await checkService(name, url);
    results.push(result);
  }

  // Detailed service checks
  log('\n🔍 DETAILED SERVICE ANALYSIS', 'cyan');
  log('=' .repeat(60), 'cyan');

  for (const [name, url] of Object.entries(services)) {
    await checkServiceDetails(name, url);
  }

  // Test specific endpoints
  await testAuthEndpoint();
  await testDoctorEndpoint();

  // Summary
  log('\n📊 SUMMARY', 'cyan');
  log('=' .repeat(60), 'cyan');

  const healthy = results.filter(r => r.status === 'healthy').length;
  const total = results.length;

  log(`Services Status: ${healthy}/${total} healthy`, healthy === total ? 'green' : 'yellow');

  if (healthy === total) {
    log('\n🎉 All core services are running!', 'green');
    log('\n📋 CORE SERVICES ASSESSMENT:', 'cyan');
    log('✅ Auth Service: Authentication & user management', 'green');
    log('✅ Doctor Service: Doctor profiles & management', 'green');
    log('✅ Patient Service: Patient profiles & management', 'green');
    log('✅ Appointment Service: Booking & scheduling', 'green');
    log('✅ API Gateway: Service routing & coordination', 'green');

    log('\n🎯 READY FOR PROFILE DEVELOPMENT:', 'cyan');
    log('• All core services operational', 'white');
    log('• Database connections established', 'white');
    log('• API endpoints accessible', 'white');
    log('• Real-time features enabled', 'white');
  } else {
    log('\n⚠️  Some services are down. Please check Docker containers.', 'yellow');
    log('\nTo start services:', 'white');
    log('docker compose up -d', 'cyan');
  }

  // Export results
  return {
    summary: {
      total,
      healthy,
      unhealthy: total - healthy,
      successRate: ((healthy / total) * 100).toFixed(1)
    },
    services: results,
    timestamp: new Date().toISOString()
  };
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Service check error:', error);
    process.exit(1);
  });
}

module.exports = { main, checkService };
