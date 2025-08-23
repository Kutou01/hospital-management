# 📋 Codebase Quality Improvement Plan

## 🎯 Mục Tiêu: Nâng cao chất lượng code thay vì chasing features

---

## 1. 🧪 **Testing Strategy - ƯU TIÊN CAO NHẤT**

### Hiện tại: ~0% test coverage
### Mục tiêu: 70% coverage cho critical paths

#### A. Backend Testing Structure
```bash
backend/
├── services/
│   ├── auth-service/
│   │   ├── src/
│   │   └── tests/
│   │       ├── unit/
│   │       │   ├── controllers/
│   │       │   ├── services/
│   │       │   └── utils/
│   │       └── integration/
│   │           └── auth.test.ts
```

#### B. Test Examples Cần Implement Ngay

**1. Auth Service Tests**
```typescript
// backend/services/auth-service/tests/unit/auth.controller.test.ts
describe('AuthController', () => {
  describe('login', () => {
    it('should return JWT token for valid credentials', async () => {
      // Test implementation
    });
    
    it('should reject invalid credentials', async () => {
      // Test implementation
    });
    
    it('should handle rate limiting', async () => {
      // Test implementation
    });
  });
});
```

**2. Appointment Service Tests**
```typescript
// backend/services/appointment-service/tests/integration/booking.test.ts
describe('Appointment Booking Flow', () => {
  it('should create appointment with valid slot', async () => {
    // Test implementation
  });
  
  it('should prevent double booking', async () => {
    // Test implementation
  });
  
  it('should validate doctor availability', async () => {
    // Test implementation
  });
});
```

**3. Frontend Component Tests**
```typescript
// frontend/components/__tests__/AppointmentCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';

describe('AppointmentCard', () => {
  it('renders appointment details correctly', () => {
    // Test implementation
  });
  
  it('handles booking button click', () => {
    // Test implementation
  });
});
```

#### C. Testing Tools Setup
```json
// package.json additions
{
  "devDependencies": {
    // Backend
    "jest": "^29.5.0",
    "supertest": "^6.3.3",
    "@types/jest": "^29.5.0",
    
    // Frontend
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "vitest": "^1.2.0"
  },
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test"
  }
}
```

---

## 2. 🚨 **Error Handling Consistency**

### Vấn đề: Error handling không nhất quán giữa services

#### A. Centralized Error Classes
```typescript
// backend/shared/src/errors/index.ts
export class BaseError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, details?: any) {
    super(400, message, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends BaseError {
  constructor(message = 'Authentication failed') {
    super(401, message, 'AUTH_ERROR');
  }
}

export class NotFoundError extends BaseError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND');
  }
}
```

#### B. Global Error Handler
```typescript
// backend/shared/src/middleware/errorHandler.ts
export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof BaseError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Log unexpected errors
  logger.error('Unexpected error:', err);
  
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
};
```

---

## 3. 📝 **Code Documentation**

### A. JSDoc cho Functions
```typescript
/**
 * Books an appointment for a patient with a doctor
 * @param {string} patientId - The ID of the patient
 * @param {string} doctorId - The ID of the doctor
 * @param {Date} appointmentDate - The date and time of appointment
 * @returns {Promise<Appointment>} The created appointment
 * @throws {ValidationError} If the slot is not available
 * @throws {NotFoundError} If patient or doctor not found
 */
async function bookAppointment(
  patientId: string,
  doctorId: string,
  appointmentDate: Date
): Promise<Appointment> {
  // Implementation
}
```

### B. API Documentation với OpenAPI/Swagger
```yaml
# backend/services/appointment-service/docs/openapi.yaml
paths:
  /appointments:
    post:
      summary: Create new appointment
      description: Books an appointment slot for a patient
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AppointmentRequest'
      responses:
        201:
          description: Appointment created successfully
        400:
          description: Invalid request or slot unavailable
        401:
          description: Unauthorized
```

---

## 4. 🔄 **Remove Code Duplication**

### Vấn đề: Repeated logic across services

#### A. Shared Utilities
```typescript
// backend/shared/src/utils/validation.ts
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone: string): boolean => {
  const vnPhoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
  return vnPhoneRegex.test(phone);
};

export const validateDateRange = (
  startDate: Date,
  endDate: Date
): boolean => {
  return startDate < endDate && startDate >= new Date();
};
```

#### B. Shared Database Queries
```typescript
// backend/shared/src/repositories/baseRepository.ts
export abstract class BaseRepository<T> {
  constructor(protected tableName: string) {}

  async findById(id: string): Promise<T | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw new DatabaseError(error.message);
    return data;
  }

  async findAll(filters?: Record<string, any>): Promise<T[]> {
    let query = supabase.from(this.tableName).select('*');
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    const { data, error } = await query;
    if (error) throw new DatabaseError(error.message);
    return data || [];
  }
}
```

---

## 5. 🎨 **TypeScript Strict Mode**

### Enable Strict Type Checking
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Fix Type Issues
```typescript
// BAD - Implicit any
function processData(data) {
  return data.map(item => item.value);
}

// GOOD - Explicit types
interface DataItem {
  value: string;
  timestamp: Date;
}

function processData(data: DataItem[]): string[] {
  return data.map(item => item.value);
}
```

---

## 6. 🔐 **Security Improvements**

### A. Input Validation Middleware
```typescript
// backend/shared/src/middleware/validation.ts
import { body, validationResult } from 'express-validator';

export const validateAppointmentCreation = [
  body('patientId').isUUID().withMessage('Invalid patient ID'),
  body('doctorId').isUUID().withMessage('Invalid doctor ID'),
  body('appointmentDate').isISO8601().withMessage('Invalid date format'),
  body('reason').isLength({ min: 10, max: 500 }).withMessage('Reason must be 10-500 characters'),
  
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Invalid input', errors.array());
    }
    next();
  }
];
```

### B. Rate Limiting
```typescript
// backend/shared/src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // stricter for auth endpoints
  message: 'Too many authentication attempts',
});
```

---

## 7. 📊 **Monitoring & Logging**

### A. Structured Logging
```typescript
// backend/shared/src/utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: process.env.SERVICE_NAME,
    environment: process.env.NODE_ENV 
  },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
  ],
});

// Log every API request
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('API Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });
  
  next();
};
```

### B. Health Checks
```typescript
// backend/shared/src/health/healthCheck.ts
export const healthCheck = async (req: Request, res: Response) => {
  const checks = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    environment: process.env.NODE_ENV,
    memory: process.memoryUsage(),
    database: await checkDatabaseConnection(),
    redis: await checkRedisConnection(),
    rabbitmq: await checkRabbitMQConnection(),
  };
  
  const isHealthy = checks.database && checks.redis && checks.rabbitmq;
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    checks,
  });
};
```

---

## 8. 🚀 **Performance Optimization**

### A. Database Query Optimization
```typescript
// BAD - N+1 query problem
const appointments = await getAppointments();
for (const appointment of appointments) {
  appointment.patient = await getPatient(appointment.patientId);
  appointment.doctor = await getDoctor(appointment.doctorId);
}

// GOOD - Join query
const appointments = await supabase
  .from('appointments')
  .select(`
    *,
    patient:patients(*),
    doctor:doctors(*)
  `)
  .limit(20);
```

### B. Caching Strategy
```typescript
// backend/shared/src/cache/cacheManager.ts
import Redis from 'ioredis';

class CacheManager {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }
  
  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }
  
  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
  }
  
  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length) {
      await this.redis.del(...keys);
    }
  }
}
```

---

## 📋 **Implementation Roadmap**

### Week 1: Foundation
- [ ] Setup testing framework (Jest, Vitest)
- [ ] Create shared error classes
- [ ] Implement global error handler
- [ ] Setup structured logging

### Week 2: Testing
- [ ] Write tests for auth service (critical path)
- [ ] Write tests for appointment booking flow
- [ ] Add integration tests for API endpoints
- [ ] Setup CI/CD with test automation

### Week 3: Code Quality
- [ ] Enable TypeScript strict mode
- [ ] Fix all type errors
- [ ] Add JSDoc to all public functions
- [ ] Remove duplicated code

### Week 4: Security & Performance
- [ ] Add input validation to all endpoints
- [ ] Implement rate limiting
- [ ] Setup caching layer
- [ ] Optimize database queries

---

## 🎯 **Success Metrics**

1. **Test Coverage**: >= 70% for critical paths
2. **TypeScript Strict**: 0 type errors
3. **Documentation**: 100% public API documented
4. **Performance**: <200ms average response time
5. **Error Rate**: <1% 5xx errors
6. **Security**: Pass OWASP Top 10 checklist

---

## 🔧 **Tools & Scripts**

### Quality Check Script
```bash
#!/bin/bash
# scripts/quality-check.sh

echo "🧪 Running tests..."
npm test

echo "📊 Checking coverage..."
npm run test:coverage

echo "🔍 Running linter..."
npm run lint

echo "📝 Checking TypeScript..."
npm run type-check

echo "🔐 Security audit..."
npm audit

echo "📦 Bundle size check..."
npm run build:analyze
```

### Pre-commit Hook
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm test"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "jest --bail --findRelatedTests"
    ]
  }
}
```

---

## 💡 **Quick Wins** (Làm ngay trong 1-2 ngày)

1. **Add .env.example** với tất cả environment variables
2. **Setup ESLint + Prettier** với rules nghiêm ngặt
3. **Add health check endpoints** cho tất cả services
4. **Create error handling middleware** 
5. **Add request/response logging**
6. **Setup basic unit tests** cho auth flow
7. **Document API với Swagger/OpenAPI**

---

*Nhớ: Code quality > Feature quantity. Một codebase sạch, well-tested sẽ valuable hơn nhiều features nhưng buggy!*
