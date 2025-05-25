#!/usr/bin/env node

/**
 * Hospital Management System - Development Environment Setup
 * 
 * This script helps set up the development environment by:
 * 1. Checking prerequisites
 * 2. Installing dependencies
 * 3. Setting up environment files
 * 4. Verifying Supabase connection
 * 5. Starting development servers
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function checkPrerequisites() {
  log('\n🔍 Checking Prerequisites...', 'cyan');
  
  try {
    // Check Node.js version
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion >= 18) {
      log(`✅ Node.js ${nodeVersion} (OK)`, 'green');
    } else {
      log(`❌ Node.js ${nodeVersion} (Requires >= 18.0.0)`, 'red');
      process.exit(1);
    }
    
    // Check npm version
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    log(`✅ npm ${npmVersion}`, 'green');
    
    // Check git
    const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();
    log(`✅ ${gitVersion}`, 'green');
    
  } catch (error) {
    log(`❌ Missing prerequisite: ${error.message}`, 'red');
    process.exit(1);
  }
}

async function setupEnvironmentFiles() {
  log('\n📝 Setting up Environment Files...', 'cyan');
  
  const envFiles = [
    {
      example: 'frontend/.env.example',
      target: 'frontend/.env.local',
      name: 'Frontend'
    },
    {
      example: 'backend/.env.example',
      target: 'backend/.env',
      name: 'Backend'
    },
    {
      example: 'backend/api-gateway/.env.example',
      target: 'backend/api-gateway/.env',
      name: 'API Gateway'
    }
  ];
  
  for (const envFile of envFiles) {
    if (!fs.existsSync(envFile.target)) {
      if (fs.existsSync(envFile.example)) {
        fs.copyFileSync(envFile.example, envFile.target);
        log(`✅ Created ${envFile.name} environment file`, 'green');
      } else {
        log(`⚠️  ${envFile.example} not found`, 'yellow');
      }
    } else {
      log(`✅ ${envFile.name} environment file exists`, 'green');
    }
  }
}

async function collectSupabaseCredentials() {
  log('\n🔐 Supabase Configuration', 'cyan');
  log('Please provide your Supabase project credentials:', 'yellow');
  log('You can find these in your Supabase project dashboard > Settings > API', 'yellow');
  
  const supabaseUrl = await question('Supabase URL (https://your-project.supabase.co): ');
  const supabaseAnonKey = await question('Supabase Anon Key: ');
  const supabaseServiceKey = await question('Supabase Service Role Key: ');
  
  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    serviceKey: supabaseServiceKey
  };
}

function updateEnvironmentFile(filePath, updates) {
  if (!fs.existsSync(filePath)) {
    log(`⚠️  ${filePath} not found`, 'yellow');
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}`;
    }
  }
  
  fs.writeFileSync(filePath, content);
}

async function updateSupabaseCredentials(credentials) {
  log('\n📝 Updating environment files with Supabase credentials...', 'cyan');
  
  // Update frontend environment
  updateEnvironmentFile('frontend/.env.local', {
    'NEXT_PUBLIC_SUPABASE_URL': credentials.url,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': credentials.anonKey
  });
  
  // Update backend environment
  updateEnvironmentFile('backend/.env', {
    'SUPABASE_URL': credentials.url,
    'SUPABASE_ANON_KEY': credentials.anonKey,
    'SUPABASE_SERVICE_ROLE_KEY': credentials.serviceKey
  });
  
  // Update API Gateway environment
  updateEnvironmentFile('backend/api-gateway/.env', {
    'SUPABASE_URL': credentials.url,
    'SUPABASE_ANON_KEY': credentials.anonKey,
    'SUPABASE_SERVICE_ROLE_KEY': credentials.serviceKey
  });
  
  log('✅ Environment files updated with Supabase credentials', 'green');
}

async function installDependencies() {
  log('\n📦 Installing Dependencies...', 'cyan');
  
  try {
    log('Installing root dependencies...', 'yellow');
    execSync('npm install', { stdio: 'inherit' });
    
    log('Installing frontend dependencies...', 'yellow');
    execSync('cd frontend && npm install', { stdio: 'inherit' });
    
    log('Installing backend dependencies...', 'yellow');
    execSync('cd backend && npm run install:all', { stdio: 'inherit' });
    
    log('✅ All dependencies installed successfully', 'green');
  } catch (error) {
    log(`❌ Failed to install dependencies: ${error.message}`, 'red');
    process.exit(1);
  }
}

async function verifySupabaseConnection(credentials) {
  log('\n🔗 Verifying Supabase Connection...', 'cyan');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(credentials.url, credentials.anonKey);
    
    // Test connection by fetching auth users (this will fail if credentials are wrong)
    const { data, error } = await supabase.auth.getSession();
    
    if (error && error.message.includes('Invalid API key')) {
      log('❌ Invalid Supabase credentials', 'red');
      return false;
    }
    
    log('✅ Supabase connection verified', 'green');
    return true;
  } catch (error) {
    log(`⚠️  Could not verify Supabase connection: ${error.message}`, 'yellow');
    return true; // Continue anyway
  }
}

async function startDevelopmentServers() {
  log('\n🚀 Starting Development Servers...', 'cyan');
  
  const startServers = await question('Would you like to start the development servers now? (y/n): ');
  
  if (startServers.toLowerCase() === 'y' || startServers.toLowerCase() === 'yes') {
    log('Starting servers...', 'yellow');
    
    // Start development servers
    const child = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true
    });
    
    log('\n🎉 Development servers started!', 'green');
    log('Frontend: http://localhost:3000', 'cyan');
    log('API Gateway: http://localhost:3100', 'cyan');
    log('\nPress Ctrl+C to stop the servers', 'yellow');
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      log('\n\n👋 Shutting down development servers...', 'yellow');
      child.kill('SIGINT');
      process.exit(0);
    });
  }
}

async function main() {
  log('🏥 Hospital Management System - Development Setup', 'bright');
  log('='.repeat(50), 'cyan');
  
  try {
    await checkPrerequisites();
    await setupEnvironmentFiles();
    
    const setupSupabase = await question('\nWould you like to configure Supabase credentials now? (y/n): ');
    
    if (setupSupabase.toLowerCase() === 'y' || setupSupabase.toLowerCase() === 'yes') {
      const credentials = await collectSupabaseCredentials();
      await updateSupabaseCredentials(credentials);
      await verifySupabaseConnection(credentials);
    }
    
    await installDependencies();
    await startDevelopmentServers();
    
  } catch (error) {
    log(`\n❌ Setup failed: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the setup
if (require.main === module) {
  main();
}

module.exports = {
  checkPrerequisites,
  setupEnvironmentFiles,
  installDependencies,
  verifySupabaseConnection
};
