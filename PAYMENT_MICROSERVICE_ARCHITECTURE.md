# 🏥 Hospital Management System - Payment Microservice Architecture

## 📋 Overview

This document describes the **microservice payment architecture** implemented for the Hospital Management System, following industry-standard patterns for healthcare payment processing.

## 🏗️ Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │ Payment Service │    │   PayOS API     │
│   Components    │    │   (Port 3100)   │    │   (Port 3009)   │    │   (External)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         │ 1. Payment Request    │                       │                       │
         ├──────────────────────►│                       │                       │
         │                       │ 2. Route to Service   │                       │
         │                       ├──────────────────────►│                       │
         │                       │                       │ 3. PayOS API Call    │
         │                       │                       ├──────────────────────►│
         │                       │                       │ 4. PayOS Response    │
         │                       │                       │◄──────────────────────┤
         │                       │ 5. Service Response   │                       │
         │                       │◄──────────────────────┤                       │
         │ 6. Final Response     │                       │                       │
         │◄──────────────────────┤                       │                       │
         │                       │                       │                       │
         │                       │                       │ 7. Save to Database  │
         │                       │                       ├──────────────────────►│
         │                       │                       │                       │ Supabase
```

## 🎯 Key Benefits

### ✅ **Security**
- PayOS credentials secured in backend service
- No sensitive data exposed to frontend
- JWT authentication for all payment endpoints
- Webhook signature validation

### ✅ **Maintainability**
- Centralized payment logic in dedicated service
- Single source of truth for payment processing
- Consistent error handling and logging
- Easy to update PayOS integration

### ✅ **Scalability**
- Payment service can scale independently
- Load balancing through API Gateway
- Resource isolation from other services
- Horizontal scaling capability

### ✅ **Consistency**
- Matches existing 11 microservices architecture
- Follows hospital management system patterns
- Standardized API responses and error codes
- Unified logging and monitoring

## 🔧 Implementation Details

### **1. Frontend Layer**

#### **Components Updated:**
- `PaymentGateway.tsx` - Main payment interface
- `DirectPaymentButton.tsx` - Quick payment button
- `paymentApi` client - Microservice communication

#### **API Flow:**
```typescript
// OLD: Direct PayOS call
await fetch('/api/payment/checkout', { ... })

// NEW: Microservice call
await paymentApi.createPayOSPayment({
  appointmentId: 'APT-123',
  amount: 500000,
  serviceName: 'Khám bệnh với BS Nguyễn',
  // ... other params
})
```

### **2. API Gateway Layer**

#### **Routing Configuration:**
```yaml
# Payment Service Routes
/api/payments/* → payment-service:3009
/api/webhooks/* → payment-service:3009 (no auth)
```

#### **Features:**
- Authentication middleware for payment endpoints
- Webhook routes bypass authentication
- Error handling and service discovery
- Request/response logging

### **3. Payment Service Layer**

#### **Service Structure:**
```
backend/services/payment-service/
├── src/
│   ├── controllers/     # Request handlers
│   ├── services/        # PayOS integration
│   ├── repositories/    # Database operations
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth & validation
│   ├── types/           # TypeScript definitions
│   └── utils/           # Logger & utilities
├── dist/                # Compiled JavaScript
├── logs/                # Service logs
├── package.json         # Dependencies
└── Dockerfile           # Container config
```

#### **Key Endpoints:**
- `POST /api/payments/payos/create` - Create PayOS payment
- `POST /api/payments/cash/create` - Create cash payment
- `GET /api/payments/verify` - Verify payment status
- `GET /api/payments/history` - Payment history
- `POST /api/webhooks/payos` - PayOS webhook handler

### **4. Database Integration**

#### **Enhanced Schema:**
```sql
-- New PayOS-specific columns added
ALTER TABLE payments ADD COLUMN checkout_url TEXT;
ALTER TABLE payments ADD COLUMN qr_code TEXT;
ALTER TABLE payments ADD COLUMN user_id UUID;
ALTER TABLE payments ADD COLUMN patient_info JSONB;
ALTER TABLE payments ADD COLUMN cancel_reason TEXT;
ALTER TABLE payments ADD COLUMN failure_reason TEXT;
```

#### **Foreign Key Relationships:**
```sql
-- Link payments to user profiles
ALTER TABLE payments 
ADD CONSTRAINT fk_payments_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
```

## 🔄 Payment Flow Examples

### **1. PayOS Payment Creation**

```typescript
// 1. Frontend initiates payment
const response = await paymentApi.createPayOSPayment({
  appointmentId: 'APT-202506-001',
  amount: 500000,
  description: 'Khám tim mạch',
  serviceName: 'Khám bệnh với BS Nguyễn Văn A',
  patientInfo: {
    doctorName: 'BS Nguyễn Văn A',
    department: 'Khoa Tim mạch',
    appointmentDate: '2024-12-30',
    timeSlot: '09:00 - 10:00'
  }
});

// 2. API Gateway routes to Payment Service
// 3. Payment Service calls PayOS API
// 4. Payment record saved to Supabase
// 5. Response with checkout URL returned
```

### **2. Webhook Processing**

```typescript
// 1. PayOS sends webhook to /api/webhooks/payos
// 2. API Gateway routes to Payment Service (no auth)
// 3. Payment Service verifies webhook signature
// 4. Payment status updated in database
// 5. Success response sent to PayOS
```

## 🧪 Testing & Validation

### **Service Health Check**
```bash
# Check payment service health
curl http://localhost:3100/api/payments/health

# Response includes:
{
  "status": "healthy",
  "service": "Hospital Payment Service",
  "features": {
    "payos_integration": true,
    "microservice_architecture": true
  },
  "environment": {
    "payos_configured": true,
    "database_connected": true
  }
}
```

### **End-to-End Testing**
1. **Frontend Component Test** - Payment button functionality
2. **API Gateway Test** - Request routing and authentication
3. **Payment Service Test** - PayOS integration and database operations
4. **Webhook Test** - Payment status updates

## 🚀 Deployment Configuration

### **Docker Compose**
```yaml
payment-service:
  build: ./services/payment-service
  ports:
    - "3009:3009"
  environment:
    - PAYOS_CLIENT_ID=${PAYOS_CLIENT_ID}
    - PAYOS_API_KEY=${PAYOS_API_KEY}
    - PAYOS_CHECKSUM_KEY=${PAYOS_CHECKSUM_KEY}
    - SUPABASE_URL=${SUPABASE_URL}
    - JWT_SECRET=${JWT_SECRET}
  networks:
    - hospital-network
```

### **Environment Variables**
```bash
# PayOS Configuration
PAYOS_CLIENT_ID=your_client_id
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key
PAYOS_ENVIRONMENT=sandbox

# Service Configuration
PAYMENT_SERVICE_URL=http://payment-service:3009
FRONTEND_URL=http://localhost:3000
```

## 📊 Integration with Hospital System

### **Existing Microservices (11 total):**
1. **API Gateway** (3100) - Request routing
2. **GraphQL Gateway** (3200) - GraphQL API
3. **Auth Service** (3001) - Authentication
4. **Doctor Service** (3002) - Doctor management
5. **Patient Service** (3003) - Patient management
6. **Appointment Service** (3004) - Appointment scheduling
7. **Department Service** (3005) - Department management
8. **Receptionist Service** (3006) - Reception operations
9. **Medical Records Service** (3007) - Medical records
10. **Billing Service** (3008) - Billing operations
11. **Notification Service** (3011) - Notifications
12. **Payment Service** (3009) - **NEW** Payment processing

### **Service Communication:**
- All services communicate through API Gateway
- Shared Supabase database for data consistency
- JWT authentication across all services
- Unified logging and monitoring

## 🎓 Academic Value

This implementation demonstrates:
- **Enterprise Architecture Patterns** - Microservice design
- **Security Best Practices** - Credential management, authentication
- **Industry Standards** - Healthcare payment processing
- **Scalable Design** - Independent service scaling
- **Modern Technologies** - Docker, TypeScript, PayOS integration

Perfect for graduation thesis demonstrating advanced software architecture skills in healthcare domain.

---

**Status:** ✅ **IMPLEMENTATION COMPLETE**
**Architecture:** ✅ **MICROSERVICE PATTERN**
**Security:** ✅ **ENTERPRISE GRADE**
**Scalability:** ✅ **PRODUCTION READY**
