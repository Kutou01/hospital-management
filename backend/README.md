# Hospital Management Microservices

A comprehensive hospital management system built with microservices architecture.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Load Balancer │
│   (Next.js)     │◄──►│   (Express)     │◄──►│   (Nginx)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
        │ Auth Service │ │Doctor Service│ │Patient Svc │
        │   (Node.js)  │ │  (Node.js)   │ │ (Node.js)  │
        └──────────────┘ └─────────────┘ └────────────┘
                │               │               │
        ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
        │   Auth DB    │ │ Doctor DB   │ │ Patient DB │
        │ (PostgreSQL) │ │(PostgreSQL) │ │(PostgreSQL)│
        └──────────────┘ └─────────────┘ └────────────┘
```

## 🔧 Services

- **API Gateway**: Entry point, routing, authentication
- **Auth Service**: User authentication, authorization, session management
- **Doctor Service**: Doctor profiles, schedules, availability
- **Patient Service**: Patient records, medical history
- **Appointment Service**: Booking, scheduling, calendar management
- **Department Service**: Hospital departments and rooms
- **Medical Service**: Medical records, prescriptions, diagnoses
- **Billing Service**: Payments, invoicing, billing
- **Notification Service**: Email, SMS, push notifications
- **Analytics Service**: Reports, analytics, data insights

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL
- Redis

### Development Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd hospital-microservices
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start services with Docker**
```bash
docker-compose up -d
```

5. **Run database migrations**
```bash
npm run migrate:all
```

6. **Start development servers**
```bash
npm run dev
```

## 📁 Project Structure

```
hospital-microservices/
├── api-gateway/           # API Gateway service
├── services/              # All microservices
│   ├── auth-service/      # Authentication service
│   ├── doctor-service/    # Doctor management
│   ├── patient-service/   # Patient management
│   ├── appointment-service/ # Appointment booking
│   └── ...
├── shared/                # Shared utilities and types
├── frontend/              # Next.js frontend application
├── deployment/            # Deployment configurations
├── monitoring/            # Monitoring and logging
└── docs/                  # Documentation
```

## 🔐 Environment Variables

Create `.env` file in root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/hospital

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Services
AUTH_SERVICE_URL=http://localhost:3001
DOCTOR_SERVICE_URL=http://localhost:3002
PATIENT_SERVICE_URL=http://localhost:3003
APPOINTMENT_SERVICE_URL=http://localhost:3004

# External Services
SENDGRID_API_KEY=your-sendgrid-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests for specific service
npm run test:auth
npm run test:doctor
npm run test:patient

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e
```

## 📊 Monitoring

- **Health Checks**: `/health` endpoint on each service
- **Metrics**: Prometheus metrics at `/metrics`
- **Logs**: Centralized logging with ELK stack
- **Tracing**: Distributed tracing with Jaeger

## 🚀 Deployment

### Development
```bash
docker-compose -f docker-compose.dev.yml up
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up
```

### Kubernetes
```bash
kubectl apply -f deployment/kubernetes/
```

## 📚 API Documentation

- **API Gateway**: http://localhost:3000/docs
- **Auth Service**: http://localhost:3001/docs
- **Doctor Service**: http://localhost:3002/docs
- **Patient Service**: http://localhost:3003/docs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
