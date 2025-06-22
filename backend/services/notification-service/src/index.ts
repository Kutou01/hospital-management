import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3011;

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    service: 'Hospital Notification Service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: {
      email: true,
      sms: false, // Will be enabled when Twilio is configured
      push: false, // Will be enabled when Firebase is configured
      realtime: true
    }
  });
});

// Basic notification endpoints
app.post('/api/notifications/send', (req, res) => {
  // Placeholder for sending notifications
  res.json({
    success: true,
    message: 'Notification service is ready - implementation coming soon',
    data: {
      type: req.body.type || 'email',
      recipient: req.body.recipient,
      message: req.body.message
    }
  });
});

app.get('/api/notifications', (req, res) => {
  // Placeholder for getting notifications
  res.json({
    success: true,
    message: 'Notification service is running',
    data: []
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🔔 Notification Service running on port ${PORT}`);
  console.log(`📧 Email notifications: ${process.env.SMTP_HOST ? 'Configured' : 'Not configured'}`);
  console.log(`📱 SMS notifications: ${process.env.TWILIO_ACCOUNT_SID ? 'Configured' : 'Not configured'}`);
  console.log(`🔥 Push notifications: ${process.env.FIREBASE_SERVER_KEY ? 'Configured' : 'Not configured'}`);
});

export default app;
