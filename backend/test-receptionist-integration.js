#!/usr/bin/env node

/**
 * Receptionist Service Integration Test
 * Tests receptionist service integration with other core services
 */

const http = require('http');
const { URL } = require('url');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test configurations
const TESTS = {
  'Receptionist Service Health': {
    url: 'http://localhost:3006/health',
    method: 'GET',
    expectedStatus: 200
  },
  'API Gateway Receptionist Route': {
    url: 'http://localhost:3100/api/receptionists/profile',
    method: 'GET',
    expectedStatus: 401, // Should require auth
    headers: {}
  },
  'API Gateway Check-in Route': {
    url: 'http://localhost:3100/api/checkin/queue',
    method: 'GET',
    expectedStatus: 401, // Should require auth
    headers: {}
  },
  'API Gateway Reports Route': {
    url: 'http://localhost:3100/api/reports/daily',
    method: 'GET',
    expectedStatus: 401, // Should require auth
    headers: {}
  },
  'Direct Service Endpoints': {
    url: 'http://localhost:3006/',
    method: 'GET',
    expectedStatus: 200
  }
};

// Test statistics
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  results: []
};

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 5000
    };

    const req = http.request(requestOptions, (res) => {
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

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

/**
 * Run a single test
 */
async function runTest(name, config) {
  const startTime = Date.now();
  
  try {
    console.log(`${colors.blue}Testing:${colors.reset} ${name}`);
    
    const response = await makeRequest(config.url, {
      method: config.method,
      headers: config.headers,
      body: config.body
    });
    
    const duration = Date.now() - startTime;
    const success = response.status === config.expectedStatus;
    
    if (success) {
      console.log(`${colors.green}✓ PASS${colors.reset} ${name} (${duration}ms)`);
      console.log(`  Status: ${response.status}`);
      
      // Try to parse and show relevant data
      try {
        const jsonData = JSON.parse(response.data);
        if (jsonData.service) {
          console.log(`  Service: ${jsonData.service}`);
        }
        if (jsonData.version) {
          console.log(`  Version: ${jsonData.version}`);
        }
        if (jsonData.endpoints) {
          console.log(`  Endpoints: ${Object.keys(jsonData.endpoints).length} available`);
        }
      } catch (e) {
        // Not JSON, that's fine
        if (response.data.length < 200) {
          console.log(`  Response: ${response.data.substring(0, 100)}...`);
        }
      }
      
      stats.passed++;
    } else {
      console.log(`${colors.red}✗ FAIL${colors.reset} ${name} (${duration}ms)`);
      console.log(`  Expected status: ${config.expectedStatus}, Got: ${response.status}`);
      console.log(`  Response: ${response.data.substring(0, 200)}...`);
      stats.failed++;
    }
    
    stats.results.push({
      name,
      success,
      status: response.status,
      expectedStatus: config.expectedStatus,
      duration,
      error: null
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`${colors.red}✗ ERROR${colors.reset} ${name} (${duration}ms)`);
    console.log(`  Error: ${error.message}`);
    
    stats.failed++;
    stats.results.push({
      name,
      success: false,
      status: null,
      expectedStatus: config.expectedStatus,
      duration,
      error: error.message
    });
  }
  
  console.log(''); // Empty line for readability
}

/**
 * Print test summary
 */
function printSummary() {
  console.log(`${colors.bright}${colors.cyan}=== RECEPTIONIST SERVICE INTEGRATION TEST SUMMARY ===${colors.reset}`);
  console.log(`Total tests: ${stats.total}`);
  console.log(`${colors.green}Passed: ${stats.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${stats.failed}${colors.reset}`);
  console.log(`Success rate: ${((stats.passed / stats.total) * 100).toFixed(1)}%`);
  
  if (stats.failed > 0) {
    console.log(`\n${colors.yellow}Failed tests:${colors.reset}`);
    stats.results
      .filter(result => !result.success)
      .forEach(result => {
        console.log(`  - ${result.name}: ${result.error || `Status ${result.status} (expected ${result.expectedStatus})`}`);
      });
  }
  
  console.log(`\n${colors.blue}Integration Status:${colors.reset}`);
  
  const healthPassed = stats.results.find(r => r.name === 'Receptionist Service Health')?.success;
  const gatewayPassed = stats.results.filter(r => r.name.includes('API Gateway')).every(r => r.success);
  
  if (healthPassed) {
    console.log(`${colors.green}✓${colors.reset} Receptionist Service is running`);
  } else {
    console.log(`${colors.red}✗${colors.reset} Receptionist Service is not accessible`);
  }
  
  if (gatewayPassed) {
    console.log(`${colors.green}✓${colors.reset} API Gateway routing is working`);
  } else {
    console.log(`${colors.yellow}⚠${colors.reset} API Gateway routing may have issues (check authentication)`);
  }
  
  console.log(`\n${colors.magenta}Next Steps:${colors.reset}`);
  console.log(`1. If receptionist service is down: docker-compose --profile core up -d receptionist-service`);
  console.log(`2. Test with authentication: node backend/services/receptionist-service/test-receptionist-api.js`);
  console.log(`3. Check logs: docker-compose logs receptionist-service`);
  console.log(`4. Access frontend: http://localhost:3000/receptionist/dashboard`);
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log(`${colors.bright}${colors.blue}🏥 Hospital Management - Receptionist Service Integration Test${colors.reset}`);
  console.log(`${colors.cyan}Testing receptionist service integration with core services...${colors.reset}\n`);
  
  stats.total = Object.keys(TESTS).length;
  
  // Run tests sequentially
  for (const [name, config] of Object.entries(TESTS)) {
    await runTest(name, config);
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  printSummary();
  
  // Exit with appropriate code
  process.exit(stats.failed === 0 ? 0 : 1);
}

// Handle process termination
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}Test interrupted by user${colors.reset}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`${colors.red}Unhandled Rejection at:${colors.reset}`, promise, 'reason:', reason);
  process.exit(1);
});

// Run tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error(`${colors.red}Test runner failed:${colors.reset}`, error);
    process.exit(1);
  });
}

module.exports = { runAllTests, TESTS };
