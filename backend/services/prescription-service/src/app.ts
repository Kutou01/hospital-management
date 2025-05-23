import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { logger } from '@hospital/shared';
import prescriptionRoutes from './routes/prescription.routes';

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
      title: 'Prescription Service API',
      version: '1.0.0',
      description: 'API for managing prescriptions, medications, and drug interactions',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.hospital.com/prescriptions' 
          : 'http://localhost:3007',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      schemas: {
        Prescription: {
          type: 'object',
          properties: {
            prescription_id: { type: 'string' },
            patient_id: { type: 'string' },
            doctor_id: { type: 'string' },
            appointment_id: { type: 'string' },
            medical_record_id: { type: 'string' },
            prescription_date: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['pending', 'dispensed', 'cancelled', 'expired'] },
            notes: { type: 'string' },
            total_cost: { type: 'number' },
            pharmacy_notes: { type: 'string' },
            dispensed_by: { type: 'string' },
            dispensed_at: { type: 'string', format: 'date-time' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            created_by: { type: 'string' },
            updated_by: { type: 'string' }
          }
        },
        PrescriptionItem: {
          type: 'object',
          properties: {
            item_id: { type: 'string' },
            prescription_id: { type: 'string' },
            medication_id: { type: 'string' },
            medication_name: { type: 'string' },
            dosage: { type: 'string' },
            frequency: { type: 'string' },
            duration: { type: 'string' },
            quantity: { type: 'integer' },
            unit: { type: 'string' },
            instructions: { type: 'string' },
            cost_per_unit: { type: 'number' },
            total_cost: { type: 'number' },
            substitution_allowed: { type: 'boolean' }
          }
        },
        Medication: {
          type: 'object',
          properties: {
            medication_id: { type: 'string' },
            name: { type: 'string' },
            generic_name: { type: 'string' },
            brand_name: { type: 'string' },
            category: { type: 'string' },
            form: { type: 'string' },
            strength: { type: 'string' },
            unit: { type: 'string' },
            manufacturer: { type: 'string' },
            description: { type: 'string' },
            contraindications: { type: 'string' },
            side_effects: { type: 'string' },
            storage_conditions: { type: 'string' },
            price_per_unit: { type: 'number' },
            stock_quantity: { type: 'integer' },
            expiry_date: { type: 'string', format: 'date' },
            requires_prescription: { type: 'boolean' },
            is_controlled_substance: { type: 'boolean' },
            is_active: { type: 'boolean' }
          }
        },
        CreatePrescriptionRequest: {
          type: 'object',
          required: ['patient_id', 'doctor_id', 'prescription_date', 'items'],
          properties: {
            patient_id: { type: 'string' },
            doctor_id: { type: 'string' },
            appointment_id: { type: 'string' },
            medical_record_id: { type: 'string' },
            prescription_date: { type: 'string', format: 'date-time' },
            notes: { type: 'string' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['medication_id', 'dosage', 'frequency', 'duration', 'quantity', 'instructions'],
                properties: {
                  medication_id: { type: 'string' },
                  dosage: { type: 'string' },
                  frequency: { type: 'string' },
                  duration: { type: 'string' },
                  quantity: { type: 'integer' },
                  instructions: { type: 'string' },
                  substitution_allowed: { type: 'boolean' }
                }
              }
            }
          }
        },
        UpdatePrescriptionRequest: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['pending', 'dispensed', 'cancelled', 'expired'] },
            notes: { type: 'string' },
            pharmacy_notes: { type: 'string' },
            dispensed_by: { type: 'string' },
            dispensed_at: { type: 'string', format: 'date-time' }
          }
        },
        CreateMedicationRequest: {
          type: 'object',
          required: ['name', 'category', 'form', 'strength', 'unit'],
          properties: {
            name: { type: 'string' },
            generic_name: { type: 'string' },
            brand_name: { type: 'string' },
            category: { type: 'string' },
            form: { type: 'string' },
            strength: { type: 'string' },
            unit: { type: 'string' },
            manufacturer: { type: 'string' },
            description: { type: 'string' },
            contraindications: { type: 'string' },
            side_effects: { type: 'string' },
            storage_conditions: { type: 'string' },
            price_per_unit: { type: 'number' },
            stock_quantity: { type: 'integer' },
            expiry_date: { type: 'string', format: 'date' },
            requires_prescription: { type: 'boolean' },
            is_controlled_substance: { type: 'boolean' }
          }
        },
        DrugInteractionCheck: {
          type: 'object',
          properties: {
            has_interactions: { type: 'boolean' },
            interactions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  interaction_id: { type: 'string' },
                  medication1_id: { type: 'string' },
                  medication2_id: { type: 'string' },
                  interaction_type: { type: 'string', enum: ['major', 'moderate', 'minor'] },
                  description: { type: 'string' },
                  severity_level: { type: 'integer' },
                  recommendation: { type: 'string' }
                }
              }
            },
            severity_level: { type: 'string', enum: ['low', 'medium', 'high'] },
            recommendations: {
              type: 'array',
              items: { type: 'string' }
            }
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
    service: 'prescription-service',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/prescriptions', prescriptionRoutes);

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
