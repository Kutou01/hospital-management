#!/usr/bin/env node

/**
 * Port Validation Script for Hospital Management System
 * Validates that all services are configured with correct ports
 */

const fs = require('fs');
const path = require('path');

// Expected port configuration
const EXPECTED_PORTS = {
  'auth-service': 3001,
  'doctor-service': 3002,
  'patient-service': 3003,
  'appointment-service': 3004,
  'department-service': 3005,
  'medical-records-service': 3006,
  'prescription-service': 3007,
  'billing-service': 3008,
  'payment-service': 3009,
  'notification-service': 3011,
  'api-gateway': 3100,
  'graphql-gateway': 3200
};

// Services that should NOT exist
const DEPRECATED_SERVICES = ['room-service'];

console.log('🔍 Hospital Management System - Port Validation');
console.log('================================================\n');

let hasErrors = false;

// 1. Validate Docker Compose Configuration
console.log('📋 Checking Docker Compose Configuration...');
try {
  const dockerComposePath = path.join(__dirname, '../docker-compose.yml');
  const dockerComposeContent = fs.readFileSync(dockerComposePath, 'utf8');

  // Check each expected service port mapping
  Object.entries(EXPECTED_PORTS).forEach(([serviceName, expectedPort]) => {
    const expectedMapping = `"${expectedPort}:${expectedPort}"`;
    const alternativeMapping = `- "${expectedPort}:${expectedPort}"`;

    if (dockerComposeContent.includes(expectedMapping) || dockerComposeContent.includes(alternativeMapping)) {
      console.log(`✅ ${serviceName}: Port ${expectedPort} correctly configured`);
    } else {
      console.log(`❌ ${serviceName}: Port ${expectedPort} not found in docker-compose.yml`);
      hasErrors = true;
    }

    // Check environment PORT variable
    const envPattern = `PORT=${expectedPort}`;
    if (dockerComposeContent.includes(envPattern)) {
      console.log(`✅ ${serviceName}: Environment PORT=${expectedPort} correct`);
    } else {
      console.log(`⚠️  ${serviceName}: Environment PORT=${expectedPort} not explicitly set (may use default)`);
    }
  });

  // Check for deprecated services
  DEPRECATED_SERVICES.forEach(serviceName => {
    if (dockerComposeContent.includes(`${serviceName}:`)) {
      console.log(`❌ Deprecated service '${serviceName}' still exists in docker-compose.yml`);
      hasErrors = true;
    } else {
      console.log(`✅ Deprecated service '${serviceName}' correctly removed`);
    }
  });

} catch (error) {
  console.log(`❌ Error reading docker-compose.yml: ${error.message}`);
  hasErrors = true;
}

console.log('\n📡 Checking Service Registry Configuration...');

// 2. Validate Service Registry
try {
  const serviceRegistryPath = path.join(__dirname, '../services/api-gateway/src/services/service-registry.ts');
  const serviceRegistryContent = fs.readFileSync(serviceRegistryPath, 'utf8');

  // Check for correct port registrations
  Object.entries(EXPECTED_PORTS).forEach(([serviceName, expectedPort]) => {
    if (serviceName === 'api-gateway' || serviceName === 'graphql-gateway') return; // Skip these

    const expectedUrl = `http://${serviceName}:${expectedPort}`;
    if (serviceRegistryContent.includes(expectedUrl)) {
      console.log(`✅ Service Registry: ${serviceName} correctly registered at port ${expectedPort}`);
    } else {
      console.log(`❌ Service Registry: ${serviceName} not found with port ${expectedPort}`);
      hasErrors = true;
    }
  });

  // Check that room-service is not registered (exclude comments)
  const roomServiceRegistration = serviceRegistryContent.includes("'room-service'") ||
                                  serviceRegistryContent.includes('"room-service"') ||
                                  serviceRegistryContent.includes('registerService(\'room-service\'');
  if (roomServiceRegistration) {
    console.log(`❌ Service Registry: room-service still registered (should be removed)`);
    hasErrors = true;
  } else {
    console.log(`✅ Service Registry: room-service correctly removed`);
  }

} catch (error) {
  console.log(`❌ Error reading service-registry.ts: ${error.message}`);
  hasErrors = true;
}

console.log('\n🌐 Checking Frontend Configuration...');

// 3. Validate Frontend Configuration
try {
  const frontendEnvPath = path.join(__dirname, '../../frontend/.env.local');
  const frontendEnvContent = fs.readFileSync(frontendEnvPath, 'utf8');

  // Check GraphQL URLs
  const expectedGraphQLUrl = 'NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3100/graphql';
  const expectedGraphQLWsUrl = 'NEXT_PUBLIC_GRAPHQL_WS_URL=ws://localhost:3100/graphql';

  if (frontendEnvContent.includes(expectedGraphQLUrl)) {
    console.log(`✅ Frontend: GraphQL URL correctly points to API Gateway (3100)`);
  } else {
    console.log(`❌ Frontend: GraphQL URL not pointing to API Gateway`);
    hasErrors = true;
  }

  if (frontendEnvContent.includes(expectedGraphQLWsUrl)) {
    console.log(`✅ Frontend: GraphQL WebSocket URL correctly points to API Gateway (3100)`);
  } else {
    console.log(`❌ Frontend: GraphQL WebSocket URL not pointing to API Gateway`);
    hasErrors = true;
  }

} catch (error) {
  console.log(`❌ Error reading frontend .env.local: ${error.message}`);
  hasErrors = true;
}

// 4. Summary
console.log('\n📊 Validation Summary');
console.log('====================');

if (hasErrors) {
  console.log('❌ Port validation FAILED - Please fix the issues above');
  process.exit(1);
} else {
  console.log('✅ All port configurations are CORRECT!');
  console.log('\n🎉 Ready to deploy with fixed port conflicts!');
  
  console.log('\n📋 Service Port Summary:');
  Object.entries(EXPECTED_PORTS).forEach(([service, port]) => {
    console.log(`   ${service}: ${port}`);
  });
  
  process.exit(0);
}
