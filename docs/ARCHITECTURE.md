# 🏗️ System Architecture

## Overview

The Hospital Management System is built using a modern microservices architecture designed for scalability, maintainability, and performance.

## 🎯 Architecture Goals

- **Scalability**: Handle 5000+ concurrent users
- **Reliability**: 99.95% uptime availability
- **Performance**: < 200ms API response time
- **Security**: HIPAA compliance and enterprise-grade security
- **Maintainability**: Clean, modular, and testable code

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer (Nginx)                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  API Gateway                                │
│              (Express.js + Rate Limiting)                  │
└─────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────┘
      │         │         │         │         │         │
┌─────▼───┐ ┌───▼───┐ ┌───▼───┐ ┌───▼───┐ ┌───▼───┐ ┌───▼───┐
│  Auth   │ │Doctor │ │Patient│ │Appoint│ │ Dept  │ │Notify │
│Service  │ │Service│ │Service│ │Service│ │Service│ │Service│
│:3001    │ │:3002  │ │:3003  │ │:3004  │ │:3005  │ │:3006  │
└─────────┘ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘
      │         │         │         │         │         │
      └─────────┼─────────┼─────────┼─────────┼─────────┘
                │         │         │         │
        ┌───────▼─────────▼─────────▼─────────▼───────┐
        │            Supabase (PostgreSQL)            │
        │          + Row Level Security               │
        └─────────────────────────────────────────────┘
```

## 🖥️ Frontend Architecture

### **Technology Stack:**
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **State Management**: React Context + Zustand
- **Authentication**: Supabase Auth

### **Folder Structure:**
```
frontend/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   └── api/               # API routes
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── forms/            # Form components
│   └── layout/           # Layout components
├── lib/                  # Utilities and configurations
│   ├── auth.ts          # Authentication utilities
│   ├── api.ts           # API client
│   └── utils.ts         # Helper functions
└── hooks/               # Custom React hooks
```

## ⚙️ Backend Architecture

### **Microservices Design:**

#### **1. API Gateway (Port 3000)**
- **Purpose**: Central entry point for all requests
- **Responsibilities**:
  - Request routing to appropriate services
  - Rate limiting and throttling
  - Authentication middleware
  - Request/response logging
  - CORS handling

#### **2. Auth Service (Port 3001)**
- **Purpose**: Authentication and authorization
- **Responsibilities**:
  - User registration and login
  - JWT token management
  - Role-based access control (RBAC)
  - Password reset and email verification
  - 2FA implementation

#### **3. Doctor Service (Port 3002)**
- **Purpose**: Doctor management
- **Responsibilities**:
  - Doctor profile CRUD operations
  - Schedule management
  - Specialty assignments
  - License validation
  - Performance metrics

#### **4. Patient Service (Port 3003)**
- **Purpose**: Patient management
- **Responsibilities**:
  - Patient registration and profiles
  - Medical history management
  - BHYT integration
  - Health records
  - Patient search and filtering

#### **5. Appointment Service (Port 3004)**
- **Purpose**: Appointment booking and management
- **Responsibilities**:
  - Appointment scheduling
  - Availability management
  - Conflict detection
  - Notification triggers
  - Waiting list management

#### **6. Department Service (Port 3005)**
- **Purpose**: Department and room management
- **Responsibilities**:
  - Department CRUD operations
  - Room and bed management
  - Equipment tracking
  - Specialty management
  - Resource allocation

#### **7. Notification Service (Port 3006)**
- **Purpose**: Communication and notifications
- **Responsibilities**:
  - Email notifications
  - SMS messaging
  - In-app notifications
  - Push notifications
  - Template management

## 🗄️ Database Architecture

### **Database Design:**
- **Primary Database**: Supabase (PostgreSQL)
- **Security**: Row Level Security (RLS)
- **ID System**: Department-based ID generation
- **Backup**: Automated daily backups
- **Scaling**: Read replicas for performance

### **Key Tables:**
```sql
-- Core Tables
users (id, email, role, created_at)
profiles (user_id, full_name, phone, date_of_birth)
departments (dept_id, name, description)
specialties (specialty_id, name, department_id)

-- Domain Tables
doctors (doctor_id, user_id, license_number, specialty_id)
patients (patient_id, user_id, bhyt_number, medical_history)
appointments (appointment_id, doctor_id, patient_id, datetime, status)
```

## 🔒 Security Architecture

### **Authentication Flow:**
1. User login → Supabase Auth
2. JWT token generation
3. Token validation on each request
4. Role-based access control
5. Session management

### **Security Measures:**
- **Encryption**: AES-256 for sensitive data
- **HTTPS**: All communications encrypted
- **Input Validation**: Comprehensive sanitization
- **Rate Limiting**: API abuse prevention
- **Audit Logging**: All actions tracked
- **HIPAA Compliance**: Medical data protection

## 📊 Monitoring & Observability

### **Monitoring Stack:**
- **Metrics**: Prometheus
- **Visualization**: Grafana
- **Logging**: Structured JSON logs
- **Alerting**: Custom alert rules
- **Health Checks**: Service health endpoints

### **Key Metrics:**
- API response times
- Database query performance
- Service availability
- Error rates
- User activity

## 🚀 Deployment Architecture

### **Development Environment:**
- Docker Compose for local development
- Hot reload for rapid development
- Local database for testing

### **Production Environment:**
- Kubernetes orchestration
- Load balancing with Nginx
- Auto-scaling based on demand
- Blue-green deployment strategy
- Monitoring and alerting

## 📈 Scalability Strategy

### **Horizontal Scaling:**
- Multiple service instances
- Load balancer distribution
- Database read replicas
- CDN for static assets

### **Vertical Scaling:**
- Resource optimization
- Database indexing
- Caching strategies (Redis)
- Query optimization

## 🔄 Data Flow

### **Typical Request Flow:**
1. **Frontend** → API Gateway
2. **API Gateway** → Authentication check
3. **API Gateway** → Route to appropriate service
4. **Service** → Database query
5. **Service** → Response to API Gateway
6. **API Gateway** → Response to Frontend

### **Real-time Features:**
- WebSocket connections for live updates
- Event-driven architecture
- Message queues for async processing
- Push notifications for mobile

## 🎯 Performance Targets

- **Page Load**: < 1.5s (mobile), < 1s (desktop)
- **API Response**: < 200ms average
- **Database Queries**: < 100ms
- **Concurrent Users**: 5000+
- **Uptime**: 99.95%

This architecture is designed to support the hospital management system's growth from a small clinic to a large hospital network while maintaining performance, security, and reliability standards.
