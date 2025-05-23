import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { logger } from '@hospital/shared';
import billingRoutes from './routes/billing.routes';

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
      title: 'Billing Service API',
      version: '1.0.0',
      description: 'API for managing billing, payments, and insurance',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.hospital.com/billing' 
          : 'http://localhost:3008',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      schemas: {
        Bill: {
          type: 'object',
          properties: {
            bill_id: { type: 'string' },
            patient_id: { type: 'string' },
            appointment_id: { type: 'string' },
            invoice_number: { type: 'string' },
            bill_date: { type: 'string', format: 'date-time' },
            due_date: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['pending', 'paid', 'overdue', 'cancelled', 'refunded'] },
            subtotal: { type: 'number' },
            tax_amount: { type: 'number' },
            discount_amount: { type: 'number' },
            insurance_coverage: { type: 'number' },
            total_amount: { type: 'number' },
            notes: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            created_by: { type: 'string' }
          }
        },
        BillItem: {
          type: 'object',
          properties: {
            item_id: { type: 'string' },
            bill_id: { type: 'string' },
            service_type: { type: 'string', enum: ['consultation', 'procedure', 'medication', 'lab_test', 'room_charge', 'other'] },
            service_id: { type: 'string' },
            description: { type: 'string' },
            quantity: { type: 'integer' },
            unit_price: { type: 'number' },
            total_price: { type: 'number' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Payment: {
          type: 'object',
          properties: {
            payment_id: { type: 'string' },
            bill_id: { type: 'string' },
            payment_method: { type: 'string', enum: ['cash', 'card', 'bank_transfer', 'insurance', 'online'] },
            amount: { type: 'number' },
            payment_date: { type: 'string', format: 'date-time' },
            transaction_id: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'] },
            notes: { type: 'string' },
            processed_by: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Insurance: {
          type: 'object',
          properties: {
            insurance_id: { type: 'string' },
            patient_id: { type: 'string' },
            provider_name: { type: 'string' },
            policy_number: { type: 'string' },
            coverage_percentage: { type: 'number' },
            max_coverage_amount: { type: 'number' },
            deductible_amount: { type: 'number' },
            expiry_date: { type: 'string', format: 'date' },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        CreateBillRequest: {
          type: 'object',
          required: ['patient_id', 'due_date', 'items'],
          properties: {
            patient_id: { type: 'string' },
            appointment_id: { type: 'string' },
            due_date: { type: 'string', format: 'date-time' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['service_type', 'description', 'quantity', 'unit_price'],
                properties: {
                  service_type: { type: 'string', enum: ['consultation', 'procedure', 'medication', 'lab_test', 'room_charge', 'other'] },
                  service_id: { type: 'string' },
                  description: { type: 'string' },
                  quantity: { type: 'integer' },
                  unit_price: { type: 'number' }
                }
              }
            },
            tax_rate: { type: 'number' },
            discount_amount: { type: 'number' },
            insurance_coverage: { type: 'number' },
            notes: { type: 'string' }
          }
        },
        UpdateBillRequest: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['pending', 'paid', 'overdue', 'cancelled', 'refunded'] },
            due_date: { type: 'string', format: 'date-time' },
            discount_amount: { type: 'number' },
            insurance_coverage: { type: 'number' },
            notes: { type: 'string' }
          }
        },
        CreatePaymentRequest: {
          type: 'object',
          required: ['bill_id', 'payment_method', 'amount'],
          properties: {
            bill_id: { type: 'string' },
            payment_method: { type: 'string', enum: ['cash', 'card', 'bank_transfer', 'insurance', 'online'] },
            amount: { type: 'number' },
            transaction_id: { type: 'string' },
            notes: { type: 'string' }
          }
        },
        CreateInsuranceRequest: {
          type: 'object',
          required: ['patient_id', 'provider_name', 'policy_number', 'coverage_percentage'],
          properties: {
            patient_id: { type: 'string' },
            provider_name: { type: 'string' },
            policy_number: { type: 'string' },
            coverage_percentage: { type: 'number' },
            max_coverage_amount: { type: 'number' },
            deductible_amount: { type: 'number' },
            expiry_date: { type: 'string', format: 'date' }
          }
        },
        PaymentSummary: {
          type: 'object',
          properties: {
            total_bills: { type: 'integer' },
            total_amount: { type: 'number' },
            paid_amount: { type: 'number' },
            pending_amount: { type: 'number' },
            overdue_amount: { type: 'number' }
          }
        },
        StripePaymentIntent: {
          type: 'object',
          properties: {
            payment_intent_id: { type: 'string' },
            amount: { type: 'number' },
            currency: { type: 'string' },
            status: { type: 'string' },
            client_secret: { type: 'string' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.ts'],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'billing-service',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/billing', billingRoutes);

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

export default app;
