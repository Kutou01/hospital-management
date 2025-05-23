# 🏥 Hospital Management System

A comprehensive hospital management system built with **Next.js frontend** and **microservices backend architecture**.

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
        │  Supabase    │ │  Supabase   │ │  Supabase  │
        │ (PostgreSQL) │ │(PostgreSQL) │ │(PostgreSQL)│
        └──────────────┘ └─────────────┘ └────────────┘
```

## 📁 Project Structure

```
hospital-management/
├── 📁 frontend/                # Next.js Frontend Application
│   ├── 📁 app/                # Next.js App Router
│   ├── 📁 components/         # React Components
│   ├── 📁 lib/                # Utilities & API clients
│   ├── 📁 hooks/              # Custom React hooks
│   └── 📁 public/             # Static assets
├── 📁 backend/                 # Microservices Backend
│   ├── 📁 api-gateway/        # API Gateway service
│   ├── 📁 services/           # All microservices
│   │   ├── 📁 auth-service/   # Authentication service
│   │   ├── 📁 doctor-service/ # Doctor management
│   │   ├── 📁 patient-service/# Patient management
│   │   └── 📁 appointment-service/ # Appointment booking
│   └── 📁 shared/             # Shared utilities and types
├── 📁 docs/                   # Documentation
├── 📁 deployment/             # Deployment configurations
├── 📁 monitoring/             # Monitoring and logging
└── 📄 README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- Supabase account
- Docker (optional)

### 1. Clone the repository
```bash
git clone https://github.com/Kutou01/hospital-management.git
cd hospital-management
```

### 2. Install dependencies
```bash
npm run install:all
```

### 3. Setup environment variables
```bash
# Frontend
cp frontend/.env.example frontend/.env.local
# Backend
cp backend/.env.example backend/.env
```

### 4. Start development servers
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:3001
- Backend API Gateway: http://localhost:3000
- Microservices: Various ports (3001-3004)

## 🔧 Available Scripts

### Development
```bash
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start only frontend
npm run dev:backend      # Start only backend
```

### Building
```bash
npm run build            # Build both frontend and backend
npm run build:frontend   # Build only frontend
npm run build:backend    # Build only backend
```

### Testing
```bash
npm run test             # Run all tests
npm run test:frontend    # Run frontend tests
npm run test:backend     # Run backend tests
```

### Docker
```bash
npm run docker:dev       # Start with Docker (development)
npm run docker:prod      # Start with Docker (production)
npm run docker:down      # Stop Docker containers
```

## 🔐 Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Backend (.env)
```env
DATABASE_URL=your-supabase-database-url
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-supabase-service-key
JWT_SECRET=your-jwt-secret
```

## 📚 Documentation

- [Frontend Documentation](./frontend/README.md)
- [Backend Documentation](./backend/README.md)
- [API Documentation](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
