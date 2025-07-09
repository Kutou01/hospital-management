#!/usr/bin/env node

/**
 * Core Services Health Check Script
 * Tests all core hospital management services
 */

const https = require("https");
const http = require("http");
const { URL } = require("url");

// Service configurations
const SERVICES = {
  "API Gateway": "http://localhost:3100/health",
  "Auth Service": "http://localhost:3001/health",
  "Doctor Service": "http://localhost:3002/health",
  "Patient Service": "http://localhost:3003/health",
  "Appointment Service": "http://localhost:3004/health",
  "Department Service": "http://localhost:3005/health",
  "Receptionist Service": "http://localhost:3006/health",
  "Medical Records Service": "http://localhost:3007/health",
  "Prescription Service": "http://localhost:3008/health",
  "Payment Service": "http://localhost:3009/health",
  "GraphQL Gateway": "http://localhost:3200/health",
};

// Test statistics
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  results: [],
};

/**
 * Make HTTP request
 */
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === "https:" ? https : http;

    const req = client.get(url, { timeout: 5000 }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          data: data,
        });
      });
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.on("error", reject);
  });
}

/**
 * Test a single service health endpoint
 */
async function testService(name, url) {
  stats.total++;

  try {
    console.log(`🔍 Testing ${name}...`);

    const startTime = Date.now();
    const response = await makeRequest(url);
    const duration = Date.now() - startTime;

    if (response.status === 200) {
      stats.passed++;
      console.log(`✅ ${name}: HEALTHY (${duration}ms)`);
      stats.results.push({
        service: name,
        status: "HEALTHY",
        responseTime: duration,
        data: response.data,
      });
      return true;
    } else {
      stats.failed++;
      console.log(`❌ ${name}: UNHEALTHY (Status: ${response.status})`);
      stats.results.push({
        service: name,
        status: "UNHEALTHY",
        responseTime: duration,
        error: `HTTP ${response.status}`,
      });
      return false;
    }
  } catch (error) {
    stats.failed++;
    const errorMsg =
      error.code === "ECONNREFUSED" ? "Service not running" : error.message;
    console.log(`❌ ${name}: ERROR (${errorMsg})`);
    stats.results.push({
      service: name,
      status: "ERROR",
      error: errorMsg,
    });
    return false;
  }
}

/**
 * Test API Gateway endpoints
 */
async function testAPIGatewayEndpoints() {
  console.log("\n🌐 Testing API Gateway Endpoints...");

  const endpoints = [
    { name: "Root", url: "http://localhost:3100/" },
    { name: "Services Discovery", url: "http://localhost:3100/services" },
    { name: "GraphQL Endpoint", url: "http://localhost:3100/graphql" },
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(endpoint.url);

      if (response.status === 200) {
        console.log(`   ✅ ${endpoint.name}: Working`);
      } else {
        console.log(`   ❌ ${endpoint.name}: Status ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint.name}: ${error.message}`);
    }
  }
}

/**
 * Print test summary
 */
function printSummary() {
  console.log("\n" + "=".repeat(60));
  console.log("📊 CORE SERVICES TEST SUMMARY");
  console.log("=".repeat(60));

  console.log(`Total Services: ${stats.total}`);
  console.log(`✅ Healthy: ${stats.passed}`);
  console.log(`❌ Failed: ${stats.failed}`);
  console.log(
    `📈 Success Rate: ${((stats.passed / stats.total) * 100).toFixed(1)}%`
  );

  console.log("\n📋 Detailed Results:");
  stats.results.forEach((result) => {
    const status = result.status === "HEALTHY" ? "✅" : "❌";
    const time = result.responseTime ? ` (${result.responseTime}ms)` : "";
    console.log(`   ${status} ${result.service}${time}`);
  });

  if (stats.failed > 0) {
    console.log("\n🔧 Next Steps:");
    console.log(
      "1. Start Docker services: docker compose --profile core up -d"
    );
    console.log(
      "2. Check individual service logs: docker compose logs [service-name]"
    );
    console.log("3. Verify environment variables and configurations");
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log("🏥 HOSPITAL MANAGEMENT SYSTEM - CORE SERVICES TEST");
  console.log("=".repeat(60));
  console.log(`Started at: ${new Date().toLocaleString()}\n`);

  // Test all services
  for (const [name, url] of Object.entries(SERVICES)) {
    await testService(name, url);
    await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay
  }

  // Test API Gateway endpoints
  await testAPIGatewayEndpoints();

  // Print summary
  printSummary();

  // Exit with appropriate code
  process.exit(stats.failed > 0 ? 1 : 0);
}

// Handle errors
process.on("unhandledRejection", (error) => {
  console.error("💥 Unhandled error:", error.message);
  process.exit(1);
});

// Run tests
runTests().catch((error) => {
  console.error("💥 Test runner failed:", error.message);
  process.exit(1);
});
