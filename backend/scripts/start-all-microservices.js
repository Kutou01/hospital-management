#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

function log(color, message, service = '') {
  const timestamp = new Date().toLocaleTimeString();
  const servicePrefix = service ? `[${service}] ` : '';
  console.log(`${colors[color]}${timestamp} ${servicePrefix}${message}${colors.reset}`);
}

// Microservices configuration
const services = [
  {
    name: 'api-gateway',
    path: './api-gateway',
    port: 3000,
    color: 'cyan',
    description: 'API Gateway & Load Balancer'
  },
  {
    name: 'auth-service',
    path: './services/auth-service',
    port: 3001,
    color: 'blue',
    description: 'Authentication & Authorization'
  },
  {
    name: 'doctor-service',
    path: './services/doctor-service',
    port: 3002,
    color: 'green',
    description: 'Doctor Management'
  },
  {
    name: 'patient-service',
    path: './services/patient-service',
    port: 3003,
    color: 'yellow',
    description: 'Patient Management'
  },
  {
    name: 'appointment-service',
    path: './services/appointment-service',
    port: 3004,
    color: 'magenta',
    description: 'Appointment Booking'
  },
  {
    name: 'medical-records-service',
    path: './services/medical-records-service',
    port: 3006,
    color: 'red',
    description: 'Medical Records & Lab Results'
  },
  {
    name: 'prescription-service',
    path: './services/prescription-service',
    port: 3007,
    color: 'cyan',
    description: 'Prescription Management'
  },
  {
    name: 'billing-service',
    path: './services/billing-service',
    port: 3008,
    color: 'blue',
    description: 'Billing & Payments'
  },
  {
    name: 'room-service',
    path: './services/room-service',
    port: 3009,
    color: 'green',
    description: 'Room Management'
  },
  {
    name: 'notification-service',
    path: './services/notification-service',
    port: 3011,
    color: 'yellow',
    description: 'Notifications & Alerts'
  },
  {
    name: 'file-storage-service',
    path: './services/file-storage-service',
    port: 3016,
    color: 'magenta',
    description: 'File Storage & Management'
  },
  {
    name: 'audit-service',
    path: './services/audit-service',
    port: 3017,
    color: 'red',
    description: 'Audit & Logging'
  },
  {
    name: 'chatbot-service',
    path: './services/chatbot-service',
    port: 3018,
    color: 'cyan',
    description: 'AI Chatbot Assistant'
  }
];

const runningProcesses = new Map();

function checkServiceExists(service) {
  const servicePath = path.resolve(service.path);
  const packageJsonPath = path.join(servicePath, 'package.json');
  return fs.existsSync(packageJsonPath);
}

function startService(service) {
  return new Promise((resolve, reject) => {
    const servicePath = path.resolve(service.path);
    
    if (!checkServiceExists(service)) {
      log('yellow', `Service directory not found, skipping...`, service.name);
      resolve(false);
      return;
    }

    log(service.color, `Starting ${service.description}...`, service.name);

    const child = spawn('npm', ['run', 'dev'], {
      cwd: servicePath,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    runningProcesses.set(service.name, child);

    let startupComplete = false;

    // Handle stdout
    child.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        log(service.color, output, service.name);
        
        // Check if service started successfully
        if (output.includes(`running on port ${service.port}`) || 
            output.includes(`listening on port ${service.port}`) ||
            output.includes(`started on port ${service.port}`)) {
          if (!startupComplete) {
            startupComplete = true;
            resolve(true);
          }
        }
      }
    });

    // Handle stderr
    child.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output && !output.includes('DeprecationWarning')) {
        log('red', `ERROR: ${output}`, service.name);
      }
    });

    // Handle process exit
    child.on('close', (code) => {
      runningProcesses.delete(service.name);
      if (code !== 0) {
        log('red', `Process exited with code ${code}`, service.name);
        if (!startupComplete) {
          reject(new Error(`Service failed to start with code ${code}`));
        }
      } else {
        log('yellow', `Process stopped`, service.name);
      }
    });

    child.on('error', (error) => {
      log('red', `Failed to start: ${error.message}`, service.name);
      if (!startupComplete) {
        reject(error);
      }
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!startupComplete) {
        log('yellow', `Startup timeout, assuming service is running...`, service.name);
        resolve(true);
      }
    }, 30000);
  });
}

async function startAllServices() {
  log('cyan', '🏥 Hospital Management - Microservices Startup');
  log('cyan', '===============================================');

  // Check environment
  if (!fs.existsSync('.env')) {
    log('red', '❌ .env file not found. Please copy .env.example to .env and configure it.');
    process.exit(1);
  }

  log('blue', '🔍 Checking available services...');
  
  const availableServices = services.filter(service => {
    const exists = checkServiceExists(service);
    if (exists) {
      log('green', `✅ ${service.description}`, service.name);
    } else {
      log('yellow', `⚠️  Not found, skipping`, service.name);
    }
    return exists;
  });

  if (availableServices.length === 0) {
    log('red', '❌ No services found to start');
    process.exit(1);
  }

  log('blue', `🚀 Starting ${availableServices.length} microservices...`);

  // Start services with delay to avoid port conflicts
  for (let i = 0; i < availableServices.length; i++) {
    const service = availableServices[i];
    
    try {
      const started = await startService(service);
      if (started) {
        log('green', `✅ Started successfully on port ${service.port}`, service.name);
      }
      
      // Add delay between service starts
      if (i < availableServices.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      log('red', `❌ Failed to start: ${error.message}`, service.name);
    }
  }

  log('green', '🎉 All available services started!');
  log('cyan', '');
  log('cyan', '📋 Service Status:');
  availableServices.forEach(service => {
    log(service.color, `  • ${service.description}: http://localhost:${service.port}`, service.name);
  });

  log('cyan', '');
  log('cyan', '🔗 Important URLs:');
  log('cyan', '  • API Gateway: http://localhost:3000');
  log('cyan', '  • API Documentation: http://localhost:3000/docs');
  log('cyan', '  • Health Checks: http://localhost:3000/health');
  log('cyan', '');
  log('cyan', '💡 Tips:');
  log('cyan', '  • Press Ctrl+C to stop all services');
  log('cyan', '  • Check logs above for any startup errors');
  log('cyan', '  • Use docker-compose for production deployment');
}

// Graceful shutdown
function gracefulShutdown() {
  log('yellow', '🛑 Shutting down all services...');
  
  runningProcesses.forEach((process, serviceName) => {
    log('yellow', `Stopping...`, serviceName);
    process.kill('SIGTERM');
  });

  setTimeout(() => {
    runningProcesses.forEach((process, serviceName) => {
      if (!process.killed) {
        log('red', `Force killing...`, serviceName);
        process.kill('SIGKILL');
      }
    });
    process.exit(0);
  }, 5000);
}

// Handle shutdown signals
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log('red', `Uncaught Exception: ${error.message}`);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  log('red', `Unhandled Rejection: ${reason}`);
  gracefulShutdown();
});

// Start the services
if (require.main === module) {
  startAllServices().catch(error => {
    log('red', `❌ Startup failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { startAllServices };
