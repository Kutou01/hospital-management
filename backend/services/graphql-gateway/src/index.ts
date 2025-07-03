import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import shared utilities
import logger from '@hospital/shared/dist/utils/logger';
import { 
  EnhancedResponseHelper, 
  addRequestId, 
  globalErrorHandler
} from '@hospital/shared/dist/utils/response-helpers';
import { 
  sanitizeInput 
} from '@hospital/shared/dist/middleware/validation.middleware';
import { 
  createVersioningMiddleware,
  responseTransformMiddleware 
} from '@hospital/shared/dist/middleware/versioning.middleware';

// Import GraphQL schema and resolvers
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { createDataLoaders } from './dataloaders';
import { createContext } from './context';
import { authMiddleware } from './middleware/auth.middleware';
import { rateLimitMiddleware } from './middleware/rateLimit.middleware';
import { complexityLimitMiddleware } from './middleware/complexity.middleware';
import { i18nPlugin } from './middleware/i18n.middleware';
import { subscriptionService } from './services/subscription.service';
import subscriptionRoutes from './routes/subscriptions.routes';

// Load environment variables
dotenv.config();

const PORT = process.env.GRAPHQL_PORT || 3200;
const SERVICE_NAME = 'Hospital GraphQL Gateway';
const SERVICE_VERSION = '1.0.0';

/**
 * GraphQL Gateway Server for Hospital Management System
 * Provides unified GraphQL API over existing REST microservices
 */
async function startServer() {
  try {
    // Create Express app
    const app = express();
    
    // Initialize ResponseHelper
    EnhancedResponseHelper.initialize(SERVICE_NAME, SERVICE_VERSION);

    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    app.use(cors({
      origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:3100'],
      credentials: true,
    }));

    // General middleware
    app.use(addRequestId);
    app.use(morgan('combined'));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Phase 2 Middleware - API Optimization
    app.use(sanitizeInput);
    app.use(createVersioningMiddleware());
    app.use(responseTransformMiddleware());

    // Initialize subscription service
    await subscriptionService.initialize();
    logger.info('✅ Subscription service initialized');

    // Create executable schema
    const schema = makeExecutableSchema({
      typeDefs,
      resolvers,
    });

    // Create Apollo Server
    const apolloServer = new ApolloServer({
      schema,
      context: ({ req, res }) => createContext({ req, res }),
      plugins: [
        // Authentication plugin
        authMiddleware,
        // Rate limiting plugin
        rateLimitMiddleware,
        // Query complexity limiting plugin
        complexityLimitMiddleware,
        // Internationalization plugin
        i18nPlugin,
        // Custom error formatting plugin
        {
          requestDidStart() {
            return {
              didEncounterErrors(requestContext) {
                // Log GraphQL errors with Vietnamese translation
                requestContext.errors?.forEach(error => {
                  logger.error('GraphQL Error:', {
                    message: error.message,
                    path: error.path,
                    source: error.source?.body,
                    positions: error.positions,
                    vietnamese: translateErrorToVietnamese(error.message)
                  });
                });
              },
              willSendResponse(requestContext) {
                // Add Vietnamese error messages to response
                if (requestContext.response.errors) {
                  requestContext.response.errors = requestContext.response.errors.map(error => ({
                    ...error,
                    extensions: {
                      ...error.extensions,
                      vietnamese: translateErrorToVietnamese(error.message)
                    }
                  }));
                }
              }
            };
          }
        }
      ],
      formatError: (error) => {
        // Format errors with Vietnamese messages
        return {
          message: error.message,
          code: error.extensions?.code || 'GRAPHQL_ERROR',
          path: error.path,
          vietnamese: translateErrorToVietnamese(error.message),
          extensions: {
            ...error.extensions,
            vietnamese: translateErrorToVietnamese(error.message)
          }
        };
      },
      introspection: process.env.NODE_ENV !== 'production',
      playground: process.env.NODE_ENV !== 'production' ? {
        settings: {
          'request.credentials': 'include',
        },
      } : false,
    });

    // Start Apollo Server
    await apolloServer.start();

    // Apply Apollo GraphQL middleware
    apolloServer.applyMiddleware({
      app,
      path: '/graphql',
      cors: false // Already handled by Express CORS
    });

    // Add subscription webhook routes
    app.use('/subscriptions', subscriptionRoutes);

    // Create HTTP server
    const httpServer = createServer(app);

    // Create WebSocket server for subscriptions
    const wsServer = new WebSocketServer({
      server: httpServer,
      path: '/graphql',
    });

    // Setup GraphQL subscriptions
    const serverCleanup = useServer({
      schema,
      context: async (ctx) => {
        // Create context for subscriptions
        return createContext({ 
          req: ctx.extra.request,
          connectionParams: ctx.connectionParams 
        });
      },
      onConnect: async (ctx) => {
        // Authenticate WebSocket connections
        logger.info('GraphQL WebSocket connection established');
        return true;
      },
      onDisconnect: () => {
        logger.info('GraphQL WebSocket connection closed');
      },
    }, wsServer);

    // Health check endpoint
    app.get('/health', async (req, res) => {
      try {
        const healthCheck = EnhancedResponseHelper.healthCheck(
          'healthy',
          {
            graphql: {
              status: 'healthy',
              endpoint: '/graphql',
              playground: process.env.NODE_ENV !== 'production'
            },
            websocket: {
              status: 'healthy',
              endpoint: '/graphql',
              connections: wsServer.clients.size
            },
            services: {
              'api-gateway': await checkServiceHealth('http://localhost:3100/health'),
              'auth-service': await checkServiceHealth('http://localhost:3001/health'),
              'doctor-service': await checkServiceHealth('http://localhost:3002/health'),
              'patient-service': await checkServiceHealth('http://localhost:3003/health'),
              'appointment-service': await checkServiceHealth('http://localhost:3004/health'),
              'department-service': await checkServiceHealth('http://localhost:3005/health'),
              'medical-records-service': await checkServiceHealth('http://localhost:3006/health'),
              'prescription-service': await checkServiceHealth('http://localhost:3007/health')
            }
          },
          {
            graphql_gateway: true,
            real_time_subscriptions: true,
            vietnamese_support: true,
            authentication: true,
            rate_limiting: true,
            query_complexity_limiting: true,
            data_loader_optimization: true
          }
        );

        res.status(200).json(healthCheck);
      } catch (error: any) {
        logger.error('Health check error:', error);
        const errorHealthCheck = EnhancedResponseHelper.healthCheck(
          'unhealthy',
          {
            error: error.message
          }
        );
        res.status(503).json(errorHealthCheck);
      }
    });

    // GraphQL Playground redirect
    app.get('/', (req, res) => {
      if (process.env.NODE_ENV !== 'production') {
        res.redirect('/graphql');
      } else {
        res.json({
          service: SERVICE_NAME,
          version: SERVICE_VERSION,
          graphql: '/graphql',
          health: '/health'
        });
      }
    });

    // 404 handler
    app.use('*', (req, res) => {
      const errorResponse = EnhancedResponseHelper.errorVi(
        'NOT_FOUND',
        'ROUTE_NOT_FOUND',
        {
          path: req.originalUrl,
          method: req.method,
          message: `Không tìm thấy đường dẫn ${req.originalUrl}`
        }
      );
      res.status(404).json(errorResponse);
    });

    // Global error handler
    app.use(globalErrorHandler);

    // Start server
    httpServer.listen(PORT, () => {
      logger.info(`🚀 GraphQL Gateway Server ready!`);
      logger.info(`📊 GraphQL endpoint: http://localhost:${PORT}/graphql`);
      logger.info(`🎮 GraphQL Playground: http://localhost:${PORT}/graphql`);
      logger.info(`🔌 WebSocket subscriptions: ws://localhost:${PORT}/graphql`);
      logger.info(`❤️ Health check: http://localhost:${PORT}/health`);
      logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🇻🇳 Vietnamese support: Enabled`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      serverCleanup.dispose();
      await apolloServer.stop();
      httpServer.close(() => {
        logger.info('GraphQL Gateway Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start GraphQL Gateway Server:', error);
    process.exit(1);
  }
}

/**
 * Check health of a microservice
 */
async function checkServiceHealth(url: string): Promise<{ status: string; responseTime?: number }> {
  try {
    const axios = require('axios');
    const startTime = Date.now();
    const response = await axios.get(url, { timeout: 5000 });
    const responseTime = Date.now() - startTime;
    
    return {
      status: response.status === 200 ? 'healthy' : 'unhealthy',
      responseTime
    };
  } catch (error) {
    return {
      status: 'unhealthy'
    };
  }
}

/**
 * Translate GraphQL errors to Vietnamese
 */
function translateErrorToVietnamese(message: string): string {
  const translations: Record<string, string> = {
    'Cannot query field': 'Không thể truy vấn trường',
    'Field is required': 'Trường là bắt buộc',
    'Invalid input': 'Dữ liệu đầu vào không hợp lệ',
    'Unauthorized': 'Yêu cầu xác thực',
    'Forbidden': 'Không có quyền truy cập',
    'Not found': 'Không tìm thấy',
    'Internal server error': 'Lỗi hệ thống',
    'Rate limit exceeded': 'Vượt quá giới hạn yêu cầu',
    'Query too complex': 'Truy vấn quá phức tạp',
    'Validation error': 'Lỗi xác thực dữ liệu'
  };

  for (const [english, vietnamese] of Object.entries(translations)) {
    if (message.toLowerCase().includes(english.toLowerCase())) {
      return message.replace(new RegExp(english, 'gi'), vietnamese);
    }
  }

  return message;
}

// Start the server
if (require.main === module) {
  startServer();
}

export default startServer;
