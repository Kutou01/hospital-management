# 🏥 Hospital Management System - Project Setup Guide

## 📋 Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

This is a modern hospital management system built with:
- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS, Radix UI
- **Backend**: Microservices architecture with Node.js/Express
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API Gateway**: Express.js with rate limiting and CORS
- **Architecture**: Microservices with API Gateway pattern

## 🔧 Prerequisites

### Required Software
- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **Git**: Latest version
- **VS Code**: Recommended IDE

### Required Accounts
- **Supabase Account**: [supabase.com](https://supabase.com)
- **GitHub Account**: For version control

### System Requirements
- **RAM**: Minimum 8GB (16GB recommended)
- **Storage**: At least 2GB free space
- **OS**: Windows 10+, macOS 10.15+, or Linux

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/Kutou01/hospital-management.git
cd hospital-management
```

### 2. Install Dependencies
```bash
# Install all dependencies (root, frontend, backend)
npm run install:all
```

### 3. Environment Setup
```bash
# Copy environment templates
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
cp backend/api-gateway/.env.example backend/api-gateway/.env
```

### 4. Configure Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Get your project URL and keys
3. Update environment files with your Supabase credentials

### 5. Start Development
```bash
# Start all services
npm run dev
```

**Access Points:**
- Frontend: http://localhost:3000
- API Gateway: http://localhost:3100
- Microservices: Ports 3001-3008

## 📁 Project Structure

```
hospital-management/
├── 📁 frontend/                    # Next.js Frontend
│   ├── 📁 app/                    # App Router pages
│   │   ├── 📁 admin/              # Admin dashboard
│   │   ├── 📁 auth/               # Authentication pages
│   │   ├── 📁 doctor/             # Doctor dashboard
│   │   └── 📁 patient/            # Patient dashboard
│   ├── 📁 components/             # React components
│   │   ├── 📁 auth/               # Auth components
│   │   ├── 📁 dashboard/          # Dashboard components
│   │   ├── 📁 forms/              # Form components
│   │   └── 📁 ui/                 # UI components
│   ├── 📁 lib/                    # Utilities
│   │   ├── 📁 auth/               # Auth utilities
│   │   ├── 📁 api/                # API clients
│   │   └── 📁 hooks/              # Custom hooks
│   └── 📁 public/                 # Static assets
├── 📁 backend/                     # Microservices Backend
│   ├── 📁 api-gateway/            # API Gateway (Port 3100)
│   ├── 📁 services/               # Microservices
│   │   ├── 📁 appointment-service/ # Appointments (Port 3001)
│   │   ├── 📁 doctor-service/     # Doctors (Port 3002)
│   │   ├── 📁 patient-service/    # Patients (Port 3003)
│   │   ├── 📁 billing-service/    # Billing (Port 3004)
│   │   ├── 📁 medical-records-service/ # Records (Port 3005)
│   │   ├── 📁 prescription-service/ # Prescriptions (Port 3006)
│   │   ├── 📁 room-service/       # Rooms (Port 3007)
│   │   └── 📁 notification-service/ # Notifications (Port 3008)
│   └── 📁 shared/                 # Shared utilities
├── 📁 docs/                       # Documentation
├── 📁 deployment/                 # Deployment configs
├── 📁 monitoring/                 # Monitoring setup
└── 📁 scripts/                    # Utility scripts
```

## 🔐 Environment Configuration

### Frontend (.env.local)
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# API Configuration
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3100

# App Configuration
NEXT_PUBLIC_APP_NAME=Hospital Management System
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Backend API Gateway (.env)
```env
# Server Configuration
PORT=3100
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Security
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Microservices (.env)
```env
# Service Configuration
PORT=3001  # Different for each service
NODE_ENV=development

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Logging
LOG_LEVEL=info
```

## 🗄️ Database Setup

### 1. Supabase Project Setup
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Wait for database to be ready
4. Note down your project URL and keys

### 2. Database Schema
The system uses these main tables:
- `auth.users` - Supabase Auth users
- `public.profiles` - User profiles and roles
- `public.doctors` - Doctor information
- `public.patients` - Patient information
- `public.appointments` - Appointment bookings
- `public.medical_records` - Medical records
- `public.prescriptions` - Prescriptions
- `public.billing` - Billing information

### 3. Setup Tables (Optional)
```bash
# Run database setup script
cd backend
node scripts/setup-microservices-tables.js
```

## 🛠️ Development Workflow

### Available Scripts

#### Root Level
```bash
npm run dev                 # Start frontend + backend
npm run dev:frontend        # Start only frontend
npm run dev:backend         # Start only backend
npm run build              # Build all
npm run test               # Run all tests
npm run lint               # Lint all code
npm run install:all        # Install all dependencies
npm run clean              # Clean all build artifacts
```

#### Frontend Specific
```bash
cd frontend
npm run dev                # Start dev server (port 3000)
npm run build              # Build for production
npm run start              # Start production server
npm run lint               # Lint frontend code
```

#### Backend Specific
```bash
cd backend
npm run dev                # Start all microservices
npm run dev:gateway        # Start only API Gateway
npm run dev:doctor         # Start only doctor service
npm run build              # Build all services
npm run test               # Run backend tests
```

### Development Best Practices

1. **Code Style**
   - Use TypeScript for type safety
   - Follow ESLint rules
   - Use Prettier for formatting

2. **Git Workflow**
   - Create feature branches
   - Write descriptive commit messages
   - Use pull requests for code review

3. **Testing**
   - Write unit tests for business logic
   - Test API endpoints
   - Test React components

## 🧪 Testing

### Frontend Testing
```bash
cd frontend
npm run test               # Run frontend tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage
```

### Backend Testing
```bash
cd backend
npm run test               # Run all service tests
npm run test:integration   # Run integration tests
npm run test:e2e          # Run end-to-end tests
```

### Manual Testing
1. **Authentication Flow**
   - Register new user
   - Login with credentials
   - Test role-based access

2. **API Endpoints**
   - Test CRUD operations
   - Verify error handling
   - Check rate limiting

3. **User Interface**
   - Test responsive design
   - Verify form validations
   - Check navigation flow

## 🚀 Deployment

### Development Deployment
```bash
# Using Docker
npm run docker:dev

# Manual deployment
npm run build
npm run start
```

### Production Deployment Options

#### Option 1: Vercel + Railway
1. **Frontend (Vercel)**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy frontend
   cd frontend
   vercel --prod
   ```

2. **Backend (Railway)**
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli

   # Deploy API Gateway
   cd backend/api-gateway
   railway deploy
   ```

#### Option 2: Docker + VPS
```bash
# Build production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Deploy to VPS
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

#### Option 3: Kubernetes
```bash
# Apply Kubernetes manifests
kubectl apply -f deployment/k8s/
```

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## 🔍 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process on port
npx kill-port 3000
npx kill-port 3100
```

#### Dependencies Issues
```bash
# Clean install
npm run clean
npm run install:all
```

#### Supabase Connection Issues
1. Check environment variables
2. Verify Supabase project status
3. Check API keys and URLs

#### Build Errors
```bash
# Clear cache and rebuild
npm run clean
npm run build
```

### Getting Help

1. **Check Documentation**
   - Read this guide thoroughly
   - Check API documentation
   - Review component documentation

2. **Debug Steps**
   - Check console logs
   - Verify environment variables
   - Test API endpoints manually

3. **Community Support**
   - Create GitHub issue
   - Check existing issues
   - Contact project maintainers

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Happy Coding! 🎉**

For questions or issues, please create a GitHub issue or contact the development team.
