#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Hospital Management System...\n');

// Function to spawn a process with colored output
function spawnProcess(command, args, options, color) {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
  };

  const proc = spawn(command, args, {
    stdio: 'pipe',
    shell: true,
    ...options
  });

  proc.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(`${colors[color]}[${options.name}]${colors.reset} ${output}`);
    }
  });

  proc.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(`${colors.red}[${options.name} ERROR]${colors.reset} ${output}`);
    }
  });

  proc.on('close', (code) => {
    if (code !== 0) {
      console.log(`${colors.red}[${options.name}] Process exited with code ${code}${colors.reset}`);
    }
  });

  return proc;
}

// Start microservices
console.log('📦 Starting microservices...');
const microservicesProcess = spawnProcess(
  'npm',
  ['run', 'dev'],
  {
    cwd: path.join(__dirname, '../hospital-microservices'),
    name: 'MICROSERVICES'
  },
  'blue'
);

// Wait a bit for microservices to start
setTimeout(() => {
  console.log('🌐 Starting frontend...');
  const frontendProcess = spawnProcess(
    'npm',
    ['run', 'dev'],
    {
      cwd: path.join(__dirname, '..'),
      name: 'FRONTEND'
    },
    'green'
  );

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    microservicesProcess.kill('SIGINT');
    frontendProcess.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down...');
    microservicesProcess.kill('SIGTERM');
    frontendProcess.kill('SIGTERM');
    process.exit(0);
  });

}, 3000);

console.log('\n📋 Services starting:');
console.log('   🔵 API Gateway: http://localhost:3000');
console.log('   🟢 Frontend: http://localhost:3001');
console.log('   📚 API Docs: http://localhost:3000/docs');
console.log('\n⏳ Please wait for all services to start...\n');
