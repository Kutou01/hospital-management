#!/usr/bin/env node

/**
 * Environment Files Checker
 * Validates all service .env files for completeness and correctness
 */

const fs = require('fs');
const path = require('path');

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

// Expected services and their ports
const SERVICES = {
  'api-gateway': { port: 3100, required: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] },
  'auth-service': { port: 3001, required: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] },
  'doctor-service': { port: 3002, required: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] },
  'patient-service': { port: 3003, required: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] },
  'appointment-service': { port: 3004, required: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] },
  'department-service': { port: 3005, required: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] },
  'receptionist-service': { port: 3006, required: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] },
  'medical-records-service': { port: 3007, required: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] },
  'prescription-service': { port: 3008, required: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] },
  'payment-service': { port: 3009, required: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] },
  'notification-service': { port: 3011, required: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] },
  'graphql-gateway': { port: 3200, required: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] }
};

// Common required variables
const COMMON_REQUIRED = [
  'NODE_ENV',
  'PORT',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

// Test statistics
const stats = {
  total: 0,
  found: 0,
  missing: 0,
  valid: 0,
  invalid: 0,
  results: []
};

/**
 * Parse .env file content
 */
function parseEnvFile(content) {
  const env = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  }
  
  return env;
}

/**
 * Check if .env file exists and is valid
 */
function checkEnvFile(serviceName) {
  const serviceConfig = SERVICES[serviceName];
  const envPath = path.join(__dirname, 'services', serviceName, '.env');
  
  const result = {
    service: serviceName,
    path: envPath,
    exists: false,
    valid: false,
    port: serviceConfig.port,
    missing: [],
    invalid: [],
    warnings: []
  };
  
  // Check if file exists
  if (!fs.existsSync(envPath)) {
    result.missing.push('File does not exist');
    stats.missing++;
    return result;
  }
  
  result.exists = true;
  stats.found++;
  
  try {
    // Read and parse file
    const content = fs.readFileSync(envPath, 'utf8');
    const env = parseEnvFile(content);
    
    // Check required variables
    const requiredVars = [...COMMON_REQUIRED, ...serviceConfig.required];
    
    for (const varName of requiredVars) {
      if (!env[varName]) {
        result.missing.push(varName);
      } else if (env[varName].includes('your_') || env[varName].includes('_here')) {
        result.invalid.push(`${varName} has placeholder value`);
      }
    }
    
    // Check port configuration
    if (env.PORT && parseInt(env.PORT) !== serviceConfig.port) {
      result.warnings.push(`Port mismatch: expected ${serviceConfig.port}, got ${env.PORT}`);
    }
    
    // Check Supabase URL format
    if (env.SUPABASE_URL && !env.SUPABASE_URL.startsWith('https://') && !env.SUPABASE_URL.includes('supabase.co')) {
      result.invalid.push('SUPABASE_URL appears to be invalid');
    }
    
    // Check service role key format
    if (env.SUPABASE_SERVICE_ROLE_KEY && !env.SUPABASE_SERVICE_ROLE_KEY.startsWith('eyJ')) {
      result.invalid.push('SUPABASE_SERVICE_ROLE_KEY appears to be invalid JWT format');
    }
    
    // Determine if valid
    result.valid = result.missing.length === 0 && result.invalid.length === 0;
    
    if (result.valid) {
      stats.valid++;
    } else {
      stats.invalid++;
    }
    
  } catch (error) {
    result.invalid.push(`Error reading file: ${error.message}`);
    stats.invalid++;
  }
  
  return result;
}

/**
 * Print service result
 */
function printServiceResult(result) {
  const statusIcon = result.exists ? 
    (result.valid ? '✅' : '⚠️') : '❌';
  
  const statusColor = result.exists ? 
    (result.valid ? colors.green : colors.yellow) : colors.red;
  
  console.log(`${statusIcon} ${colors.bright}${result.service}${colors.reset} (port ${result.port})`);
  
  if (!result.exists) {
    console.log(`   ${colors.red}File missing: ${result.path}${colors.reset}`);
    return;
  }
  
  if (result.missing.length > 0) {
    console.log(`   ${colors.red}Missing variables: ${result.missing.join(', ')}${colors.reset}`);
  }
  
  if (result.invalid.length > 0) {
    console.log(`   ${colors.yellow}Invalid values: ${result.invalid.join(', ')}${colors.reset}`);
  }
  
  if (result.warnings.length > 0) {
    console.log(`   ${colors.yellow}Warnings: ${result.warnings.join(', ')}${colors.reset}`);
  }
  
  if (result.valid) {
    console.log(`   ${colors.green}All required variables present and valid${colors.reset}`);
  }
  
  console.log('');
}

/**
 * Print summary
 */
function printSummary() {
  console.log(`${colors.bright}${colors.cyan}=== ENVIRONMENT FILES SUMMARY ===${colors.reset}`);
  console.log(`Total services: ${stats.total}`);
  console.log(`${colors.green}Files found: ${stats.found}${colors.reset}`);
  console.log(`${colors.red}Files missing: ${stats.missing}${colors.reset}`);
  console.log(`${colors.green}Valid configurations: ${stats.valid}${colors.reset}`);
  console.log(`${colors.yellow}Invalid configurations: ${stats.invalid}${colors.reset}`);
  
  const successRate = ((stats.valid / stats.total) * 100).toFixed(1);
  console.log(`Success rate: ${successRate}%`);
  
  if (stats.missing > 0) {
    console.log(`\n${colors.red}Missing .env files:${colors.reset}`);
    stats.results
      .filter(r => !r.exists)
      .forEach(r => console.log(`  - ${r.service}: ${r.path}`));
  }
  
  if (stats.invalid > 0) {
    console.log(`\n${colors.yellow}Services with configuration issues:${colors.reset}`);
    stats.results
      .filter(r => r.exists && !r.valid)
      .forEach(r => {
        console.log(`  - ${r.service}:`);
        if (r.missing.length > 0) {
          console.log(`    Missing: ${r.missing.join(', ')}`);
        }
        if (r.invalid.length > 0) {
          console.log(`    Invalid: ${r.invalid.join(', ')}`);
        }
      });
  }
  
  console.log(`\n${colors.blue}Next Steps:${colors.reset}`);
  if (stats.missing > 0) {
    console.log(`1. Create missing .env files for services listed above`);
  }
  if (stats.invalid > 0) {
    console.log(`2. Fix configuration issues in invalid services`);
  }
  console.log(`3. Update placeholder values with actual credentials`);
  console.log(`4. Test services: docker-compose --profile full up -d`);
}

/**
 * Main function
 */
function main() {
  console.log(`${colors.bright}${colors.blue}🔧 Hospital Management - Environment Files Checker${colors.reset}`);
  console.log(`${colors.cyan}Checking .env files for all services...${colors.reset}\n`);
  
  stats.total = Object.keys(SERVICES).length;
  
  // Check each service
  for (const serviceName of Object.keys(SERVICES)) {
    const result = checkEnvFile(serviceName);
    stats.results.push(result);
    printServiceResult(result);
  }
  
  printSummary();
  
  // Exit with appropriate code
  process.exit(stats.invalid === 0 && stats.missing === 0 ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { checkEnvFile, SERVICES };
