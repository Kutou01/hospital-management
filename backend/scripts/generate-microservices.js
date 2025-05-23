#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Service configurations
const services = [
  {
    name: 'billing-service',
    port: 3008,
    description: 'Billing and Payment Management Service',
    features: ['billing', 'payment', 'invoice', 'stripe']
  },
  {
    name: 'room-service',
    port: 3009,
    description: 'Room and Bed Management Service',
    features: ['room', 'bed', 'occupancy', 'assignment']
  },
  {
    name: 'notification-service',
    port: 3011,
    description: 'Notification and Alert Service',
    features: ['email', 'sms', 'push', 'template']
  },
  {
    name: 'file-storage-service',
    port: 3016,
    description: 'File Storage and Management Service',
    features: ['upload', 'download', 'storage', 's3']
  },
  {
    name: 'audit-service',
    port: 3017,
    description: 'Audit and Logging Service',
    features: ['audit', 'logging', 'tracking', 'compliance']
  },
  {
    name: 'chatbot-service',
    port: 3018,
    description: 'AI Chatbot Assistant Service',
    features: ['chatbot', 'ai', 'openai', 'conversation']
  }
];

// Template files
const templates = {
  packageJson: (service) => ({
    name: `@hospital/${service.name}`,
    version: "1.0.0",
    description: service.description,
    main: "dist/index.js",
    scripts: {
      start: "node dist/index.js",
      dev: "nodemon src/index.ts",
      build: "tsc",
      test: "jest",
      "test:watch": "jest --watch",
      "test:coverage": "jest --coverage",
      lint: "eslint src/**/*.ts",
      format: "prettier --write src/**/*.ts"
    },
    dependencies: {
      "@hospital/shared": "file:../../shared",
      "@supabase/supabase-js": "^2.38.0",
      express: "^4.18.2",
      cors: "^2.8.5",
      helmet: "^7.0.0",
      morgan: "^1.10.0",
      "express-rate-limit": "^7.1.5",
      "express-validator": "^7.0.1",
      dotenv: "^16.3.0",
      zod: "^3.21.4",
      uuid: "^9.0.0",
      "swagger-jsdoc": "^6.2.8",
      "swagger-ui-express": "^5.0.0",
      axios: "^1.6.0",
      ...(service.features.includes('stripe') && { stripe: "^14.7.0" }),
      ...(service.features.includes('upload') && { multer: "^1.4.5-lts.1", sharp: "^0.32.6" }),
      ...(service.features.includes('email') && { nodemailer: "^6.9.7" }),
      ...(service.features.includes('openai') && { openai: "^4.20.1" }),
      ...(service.features.includes('pdf') && { "pdf-lib": "^1.17.1", pdfkit: "^0.13.0" })
    },
    devDependencies: {
      "@types/express": "^4.17.21",
      "@types/cors": "^2.8.17",
      "@types/morgan": "^1.9.9",
      "@types/uuid": "^9.0.7",
      "@types/swagger-jsdoc": "^6.0.4",
      "@types/swagger-ui-express": "^4.1.6",
      "@types/node": "^20.10.4",
      typescript: "^5.3.3",
      nodemon: "^3.0.2",
      "ts-node": "^10.9.2",
      jest: "^29.7.0",
      "@types/jest": "^29.5.8",
      "ts-jest": "^29.1.1",
      supertest: "^6.3.3",
      "@types/supertest": "^6.0.2",
      eslint: "^8.55.0",
      prettier: "^3.1.0",
      ...(service.features.includes('upload') && { "@types/multer": "^1.4.11" }),
      ...(service.features.includes('email') && { "@types/nodemailer": "^6.4.14" })
    },
    keywords: ["microservice", service.name.replace('-service', ''), "hospital", "healthcare"],
    author: "Hospital Management Team",
    license: "MIT"
  }),

  tsconfig: {
    compilerOptions: {
      target: "ES2020",
      module: "commonjs",
      lib: ["ES2020"],
      outDir: "./dist",
      rootDir: "./src",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      declaration: true,
      declarationMap: true,
      sourceMap: true,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
      moduleResolution: "node",
      allowSyntheticDefaultImports: true,
      noImplicitAny: true,
      noImplicitReturns: true,
      noImplicitThis: true,
      noUnusedLocals: false,
      noUnusedParameters: false,
      exactOptionalPropertyTypes: false,
      noImplicitOverride: true,
      noPropertyAccessFromIndexSignature: false,
      noUncheckedIndexedAccess: false
    },
    include: ["src/**/*"],
    exclude: ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
  },

  dockerfile: (service) => `FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy shared library
COPY ../../shared ./shared
RUN cd shared && npm ci && npm run build

# Copy source code
COPY src ./src

# Build the application
RUN npm run build

# Expose port
EXPOSE ${service.port}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:${service.port}/health || exit 1

# Start the application
CMD ["npm", "start"]`,

  indexTs: (service) => `import dotenv from 'dotenv';
import app from './app';
import { logger } from '@hospital/shared';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || ${service.port};
const SERVICE_NAME = '${service.name}';

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  logger.info(\`\${signal} received. Starting graceful shutdown...\`);
  
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });

  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Start server
const server = app.listen(PORT, () => {
  logger.info(\`\${SERVICE_NAME} is running on port \${PORT}\`, {
    service: SERVICE_NAME,
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
  
  logger.info(\`Health check available at: http://localhost:\${PORT}/health\`);
  logger.info(\`API documentation available at: http://localhost:\${PORT}/docs\`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;`,

  appTs: (service) => `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { logger } from '@hospital/shared';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '${service.description} API',
      version: '1.0.0',
      description: 'API for ${service.description.toLowerCase()}',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.hospital.com/${service.name.replace('-service', '')}' 
          : 'http://localhost:${service.port}',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: '${service.name}',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
// TODO: Add your routes here
// app.use('/api/${service.name.replace('-service', '')}', yourRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: error.message, stack: error.stack });
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

export default app;`
};

function createServiceStructure(service) {
  const servicePath = path.join(__dirname, '..', 'services', service.name);
  
  // Create directories
  const dirs = [
    servicePath,
    path.join(servicePath, 'src'),
    path.join(servicePath, 'src', 'controllers'),
    path.join(servicePath, 'src', 'routes'),
    path.join(servicePath, 'src', 'repositories'),
    path.join(servicePath, 'src', 'types'),
    path.join(servicePath, 'src', 'services'),
    path.join(servicePath, 'src', 'middleware')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Create files
  const files = [
    {
      path: path.join(servicePath, 'package.json'),
      content: JSON.stringify(templates.packageJson(service), null, 2)
    },
    {
      path: path.join(servicePath, 'tsconfig.json'),
      content: JSON.stringify(templates.tsconfig, null, 2)
    },
    {
      path: path.join(servicePath, 'Dockerfile'),
      content: templates.dockerfile(service)
    },
    {
      path: path.join(servicePath, 'src', 'index.ts'),
      content: templates.indexTs(service)
    },
    {
      path: path.join(servicePath, 'src', 'app.ts'),
      content: templates.appTs(service)
    }
  ];

  files.forEach(file => {
    if (!fs.existsSync(file.path)) {
      fs.writeFileSync(file.path, file.content);
    }
  });

  return servicePath;
}

async function generateMicroservices() {
  log('cyan', '🏥 Hospital Management - Microservices Generator');
  log('cyan', '===============================================');

  log('blue', `🚀 Generating ${services.length} microservices...`);

  for (const service of services) {
    try {
      log('yellow', `📦 Creating ${service.name}...`);
      
      const servicePath = createServiceStructure(service);
      
      log('green', `✅ ${service.name} created successfully`);
      log('blue', `   📁 Location: ${servicePath}`);
      log('blue', `   🌐 Port: ${service.port}`);
      log('blue', `   📝 Description: ${service.description}`);
      log('blue', `   🔧 Features: ${service.features.join(', ')}`);
      
    } catch (error) {
      log('red', `❌ Failed to create ${service.name}: ${error.message}`);
    }
  }

  log('green', '🎉 All microservices generated successfully!');
  log('cyan', '');
  log('cyan', '📋 Next Steps:');
  log('cyan', '1. Install dependencies: npm run install:all');
  log('cyan', '2. Setup database tables: npm run setup:tables');
  log('cyan', '3. Configure environment: cp .env.example .env');
  log('cyan', '4. Start services: npm run dev');
  log('cyan', '');
  log('cyan', '💡 Each service includes:');
  log('cyan', '   • Basic Express.js setup');
  log('cyan', '   • Swagger documentation');
  log('cyan', '   • Health check endpoint');
  log('cyan', '   • Error handling');
  log('cyan', '   • TypeScript configuration');
  log('cyan', '   • Docker support');
}

// Run the generator
if (require.main === module) {
  generateMicroservices();
}

module.exports = { generateMicroservices };
