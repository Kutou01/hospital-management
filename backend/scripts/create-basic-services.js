#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Service configurations
const services = [
  {
    name: 'notification-service',
    port: 3011,
    description: 'Notification and Alert Service',
    features: ['email', 'sms', 'push', 'template']
  },
  {
    name: 'room-service',
    port: 3009,
    description: 'Room and Bed Management Service',
    features: ['room', 'bed', 'occupancy', 'assignment']
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

function createBasicStructure(service) {
  const servicePath = path.join(__dirname, '..', 'services', service.name);
  
  // Create directories
  const dirs = [
    servicePath,
    path.join(servicePath, 'src'),
    path.join(servicePath, 'src', 'controllers'),
    path.join(servicePath, 'src', 'routes'),
    path.join(servicePath, 'src', 'repositories'),
    path.join(servicePath, 'src', 'types'),
    path.join(servicePath, 'src', 'services')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Create basic files
  const files = [
    {
      path: path.join(servicePath, 'tsconfig.json'),
      content: JSON.stringify({
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
      }, null, 2)
    },
    {
      path: path.join(servicePath, 'Dockerfile'),
      content: `FROM node:18-alpine

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
CMD ["npm", "start"]`
    },
    {
      path: path.join(servicePath, 'src', 'index.ts'),
      content: `import dotenv from 'dotenv';
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

export default server;`
    },
    {
      path: path.join(servicePath, 'src', 'app.ts'),
      content: `import express from 'express';
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
    }
  ];

  files.forEach(file => {
    if (!fs.existsSync(file.path)) {
      fs.writeFileSync(file.path, file.content);
    }
  });

  return servicePath;
}

// Create basic structure for all services
services.forEach(service => {
  console.log(`Creating basic structure for ${service.name}...`);
  createBasicStructure(service);
  console.log(`✅ ${service.name} basic structure created`);
});

console.log('🎉 All basic service structures created!');
console.log('');
console.log('📋 Services created:');
services.forEach(service => {
  console.log(`  • ${service.description} (Port ${service.port})`);
});
console.log('');
console.log('💡 Next steps:');
console.log('1. Add package.json for each service');
console.log('2. Implement controllers, routes, and repositories');
console.log('3. Add business logic specific to each service');
console.log('4. Test the services');
