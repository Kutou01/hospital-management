import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import logger from '@hospital/shared/src/utils/logger';
import { createClient } from '@supabase/supabase-js';

// Load environment variables FIRST
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Error: Missing environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please create or update your .env file with these variables');
  process.exit(1);
}

// App constants
const app = express();
const PORT = process.env.PORT || 3003;
const SERVICE_NAME = 'patient-service';

// Initialize Supabase client
let supabase: ReturnType<typeof createClient>;

try {
  const supabaseUrl = process.env.SUPABASE_URL as string;
  const supabaseKey = process.env.SUPABASE_KEY as string;

  logger.info(`Initializing Supabase connection to ${supabaseUrl}`);
  supabase = createClient(supabaseUrl, supabaseKey);

  // Simple test query to verify connection
  (async () => {
    try {
      const { count, error } = await supabase
        .from('patients')
        .select('count', { count: 'exact', head: true });

      if (error) {
        logger.error('Failed to connect to Supabase:', error);
      } else {
        logger.info(`Successfully connected to Supabase. Patient count: ${count}`);
      }
    } catch (err: any) {
      logger.error('Error testing Supabase connection:', err);
    }
  })();
} catch (error) {
  logger.error('Failed to initialize Supabase client:', error);
  process.exit(1);
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    service: 'Hospital Patient Service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Patients endpoint - get data from Supabase
app.get('/patients', async (req, res) => {
  try {
    logger.info('Fetching patients data from Supabase');

    // Query Supabase for patients data
    const { data, error, count } = await supabase
      .from('patients')
      .select('*', { count: 'exact' });

    if (error) {
      logger.error('Error fetching patients from Supabase:', error);
      throw error;
    }

    logger.info(`Successfully retrieved ${data?.length || 0} patients`);

    res.json({
      message: 'Patient data retrieved successfully',
      patients: data || [],
      count: count || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    logger.error('Failed to fetch patients:', err);
    res.status(500).json({
      error: 'Failed to fetch patients data',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
  }
});

// Get a single patient by ID
app.get('/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Fetching patient with ID: ${id}`);

    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        logger.warn(`Patient not found with ID: ${id}`);
        return res.status(404).json({
          error: 'Patient not found',
          message: `No patient found with ID: ${id}`
        });
      }
      logger.error(`Error fetching patient ${id}:`, error);
      throw error;
    }

    return res.json({
      message: 'Patient retrieved successfully',
      patient: data,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    logger.error('Failed to fetch patient by ID:', err);
    return res.status(500).json({
      error: 'Failed to fetch patient data',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Hospital Patient Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', { error: err.message, stack: err.stack });
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Patient Service running on port ${PORT}`, {
    service: SERVICE_NAME,
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
  });
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully`);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  process.exit(1);
});
