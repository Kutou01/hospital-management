#!/usr/bin/env node

/**
 * Script to start Auth System (API Gateway + Auth Service)
 * This ensures both services are built and running properly
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const services = [
  {
    name: 'API Gateway',
    path: './backend/api-gateway',
    port: 3100,
    buildCommand: 'npm run build',
    startCommand: 'npm run dev',
    healthEndpoint: 'http://localhost:3100/health',
    color: '\x1b[36m', // Cyan
  },
  {
    name: 'Auth Service',
    path: './backend/services/auth-service',
    port: 3001,
    buildCommand: 'npm run build',
    startCommand: 'npm run dev',
    healthEndpoint: 'http://localhost:3001/health',
    color: '\x1b[34m', // Blue
  }
];

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Helper functions
function log(color, message, serviceName = '') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = serviceName ? `[${serviceName}]` : '';
  console.log(`${color}${timestamp} ${prefix} ${message}${colors.reset}`);
}

function checkServiceExists(servicePath) {
  const fullPath = path.resolve(servicePath);
  const packageJsonPath = path.join(fullPath, 'package.json');
  return fs.existsSync(packageJsonPath);
}

async function buildService(service) {
  return new Promise((resolve, reject) => {
    log(service.color, `Building ${service.name}...`, service.name);

    const buildProcess = spawn('npm', ['run', 'build'], {
      cwd: path.resolve(service.path),
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    let output = '';
    let errorOutput = '';

    buildProcess.stdout.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        output += message + '\n';
        log(service.color, `BUILD: ${message}`, service.name);
      }
    });

    buildProcess.stderr.on('data', (data) => {
      const message = data.toString().trim();
      if (message && !message.includes('DeprecationWarning')) {
        errorOutput += message + '\n';
        log(colors.yellow, `BUILD WARNING: ${message}`, service.name);
      }
    });

    buildProcess.on('close', (code) => {
      if (code === 0) {
        log(colors.green, `✅ Build completed successfully`, service.name);
        resolve(true);
      } else {
        log(colors.red, `❌ Build failed with code ${code}`, service.name);
        if (errorOutput) {
          log(colors.red, `Error output: ${errorOutput}`, service.name);
        }
        reject(new Error(`Build failed for ${service.name}`));
      }
    });

    buildProcess.on('error', (error) => {
      log(colors.red, `❌ Build process error: ${error.message}`, service.name);
      reject(error);
    });
  });
}

async function startService(service) {
  return new Promise((resolve, reject) => {
    log(service.color, `Starting ${service.name} on port ${service.port}...`, service.name);

    const startProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.resolve(service.path),
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    let startupComplete = false;
    const startupTimeout = setTimeout(() => {
      if (!startupComplete) {
        log(colors.yellow, `⚠️ Startup timeout, but process is running`, service.name);
        resolve(startProcess);
      }
    }, 30000); // 30 second timeout

    startProcess.stdout.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        log(service.color, message, service.name);

        // Check for successful startup indicators
        if (message.includes(`running on port ${service.port}`) ||
            message.includes(`listening on port ${service.port}`) ||
            message.includes(`started on port ${service.port}`) ||
            message.includes(`🚀`)) {
          if (!startupComplete) {
            startupComplete = true;
            clearTimeout(startupTimeout);
            log(colors.green, `✅ Started successfully on port ${service.port}`, service.name);
            resolve(startProcess);
          }
        }
      }
    });

    startProcess.stderr.on('data', (data) => {
      const message = data.toString().trim();
      if (message && !message.includes('DeprecationWarning')) {
        log(colors.yellow, `STDERR: ${message}`, service.name);
      }
    });

    startProcess.on('close', (code) => {
      log(colors.red, `❌ Process exited with code ${code}`, service.name);
      if (!startupComplete) {
        reject(new Error(`${service.name} failed to start`));
      }
    });

    startProcess.on('error', (error) => {
      log(colors.red, `❌ Process error: ${error.message}`, service.name);
      reject(error);
    });

    // Store process reference
    service.process = startProcess;
  });
}

async function checkHealth(service) {
  try {
    const response = await fetch(service.healthEndpoint);
    if (response.ok) {
      const data = await response.json();
      log(colors.green, `✅ Health check passed`, service.name);
      return true;
    } else {
      log(colors.yellow, `⚠️ Health check returned ${response.status}`, service.name);
      return false;
    }
  } catch (error) {
    log(colors.yellow, `⚠️ Health check failed: ${error.message}`, service.name);
    return false;
  }
}

async function waitForService(service, maxWaitTime = 60000) {
  const startTime = Date.now();
  const checkInterval = 2000; // Check every 2 seconds

  log(service.color, `Waiting for ${service.name} to be ready...`, service.name);

  while (Date.now() - startTime < maxWaitTime) {
    if (await checkHealth(service)) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }

  log(colors.yellow, `⚠️ Service did not become healthy within ${maxWaitTime/1000}s`, service.name);
  return false;
}

async function main() {
  log(colors.cyan, '🏥 Hospital Management - Auth System Startup');
  log(colors.cyan, '='.repeat(50));

  // Check if all services exist
  log(colors.blue, '🔍 Checking service directories...');
  for (const service of services) {
    if (!checkServiceExists(service.path)) {
      log(colors.red, `❌ Service directory not found: ${service.path}`, service.name);
      process.exit(1);
    } else {
      log(colors.green, `✅ Found service directory`, service.name);
    }
  }

  // Build all services
  log(colors.blue, '🔨 Building services...');
  for (const service of services) {
    try {
      await buildService(service);
    } catch (error) {
      log(colors.red, `❌ Failed to build ${service.name}: ${error.message}`);
      process.exit(1);
    }
  }

  // Start all services
  log(colors.blue, '🚀 Starting services...');
  const runningProcesses = [];

  for (const service of services) {
    try {
      const process = await startService(service);
      runningProcesses.push({ service, process });

      // Wait a bit between service starts
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      log(colors.red, `❌ Failed to start ${service.name}: ${error.message}`);

      // Kill any running processes
      runningProcesses.forEach(({ process }) => {
        if (process && !process.killed) {
          process.kill();
        }
      });

      process.exit(1);
    }
  }

  // Wait for all services to be healthy
  log(colors.blue, '🏥 Checking service health...');
  for (const service of services) {
    await waitForService(service);
  }

  // Final status
  log(colors.green, '✅ All services started successfully!');
  log(colors.cyan, '📋 Service Status:');
  log(colors.cyan, `   • API Gateway: http://localhost:3100`);
  log(colors.cyan, `   • API Gateway Health: http://localhost:3100/health`);
  log(colors.cyan, `   • API Gateway Docs: http://localhost:3100/docs`);
  log(colors.cyan, `   • Auth Service: http://localhost:3001`);
  log(colors.cyan, `   • Auth Service Health: http://localhost:3001/health`);
  log(colors.cyan, `   • Auth Service Docs: http://localhost:3001/docs`);

  log(colors.yellow, '🧪 To test the system:');
  log(colors.yellow, '   node test-auth-via-gateway.js');

  log(colors.yellow, '🌐 To start frontend:');
  log(colors.yellow, '   cd frontend && npm run dev');

  // Graceful shutdown
  const gracefulShutdown = (signal) => {
    log(colors.yellow, `\n📴 Received ${signal}, shutting down services...`);

    runningProcesses.forEach(({ service, process }) => {
      if (process && !process.killed) {
        log(colors.yellow, `Stopping ${service.name}...`, service.name);
        process.kill();
      }
    });

    setTimeout(() => {
      log(colors.green, '✅ All services stopped');
      process.exit(0);
    }, 2000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Keep the process running
  log(colors.green, '🎯 Services are running. Press Ctrl+C to stop.');
}

// Handle unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  log(colors.red, `❌ Unhandled Rejection: ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log(colors.red, `❌ Uncaught Exception: ${error.message}`);
  process.exit(1);
});

// Start the system
main().catch((error) => {
  log(colors.red, `❌ Failed to start system: ${error.message}`);
  process.exit(1);
});
