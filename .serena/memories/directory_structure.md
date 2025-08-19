# Hospital Management System - Directory Structure

## Root Level
```
hospital-management/
├── frontend/           # Next.js frontend application
├── backend/            # Backend microservices and API gateway
├── schemas/            # Database schemas and migrations
├── docs/              # Project documentation
├── scripts/           # Utility scripts and automation
├── test-scripts/      # Testing and validation scripts
├── .serena/           # Serena configuration and cache
└── serena/            # Serena source code (if cloned locally)
```

## Frontend Structure (`frontend/`)
```
frontend/
├── app/               # Next.js 15 app directory (routing)
│   ├── (auth)/        # Authentication routes
│   ├── (marketing)/   # Public marketing pages
│   ├── admin/         # Admin dashboard
│   ├── patient/       # Patient portal
│   ├── doctor/        # Doctor dashboard
│   └── receptionist/  # Receptionist interface
├── components/        # Reusable UI components
│   ├── ui/           # Base UI components (Radix UI)
│   ├── auth/         # Authentication components
│   ├── dashboard/    # Dashboard components
│   ├── forms/        # Form components
│   └── layout/       # Layout components
├── lib/              # Utility libraries and configurations
│   ├── api/          # API client functions
│   ├── auth/         # Authentication utilities
│   ├── supabase/     # Supabase client configuration
│   └── validations/  # Form validation schemas
├── hooks/            # Custom React hooks
└── public/           # Static assets
```

## Backend Structure (`backend/`)
```
backend/
├── services/          # Individual microservices
│   ├── auth-service/     # Authentication and authorization
│   ├── doctor-service/   # Doctor management
│   ├── patient-service/  # Patient management
│   ├── appointment-service/ # Appointment scheduling
│   ├── medical-records-service/ # Medical records
│   ├── payment-service/  # Payment processing
│   ├── notification-service/ # Notifications
│   └── api-gateway/      # API routing and aggregation
├── shared/            # Shared utilities and types
├── lib/               # Common libraries
│   ├── security/      # Security utilities
│   ├── services/      # Service utilities
│   └── validations/   # Validation schemas
├── schemas/           # Database schemas
├── migrations/        # Database migrations
├── docker-compose.yml # Docker orchestration
└── nginx/             # Reverse proxy configuration
```

## Key Service Structure (example: `doctor-service/`)
```
services/doctor-service/
├── src/               # Source code
│   ├── controllers/   # Request handlers
│   ├── models/        # Data models
│   ├── routes/        # API routes
│   ├── services/      # Business logic
│   ├── middleware/    # Custom middleware
│   └── utils/         # Utility functions
├── database/          # Database-specific files
├── tests/             # Test files
├── Dockerfile         # Container configuration
└── package.json       # Dependencies and scripts
```

## Database Structure (`schemas/`)
```
schemas/
├── 01-core-tables.sql     # Core entity tables
├── 02-rls-policies.sql    # Row Level Security policies
├── 03-functions.sql       # Database functions
└── migrations/             # Version-specific migrations
```

## Configuration Files
- `package.json` - Root dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `docker-compose.yml` - Service orchestration
- `.env.example` - Environment variables template
- `eslint.config.mjs` - Code linting rules
- `tailwind.config.ts` - CSS framework configuration

## Development Workflow
1. **Frontend Development**: Work in `frontend/` directory
2. **Backend Development**: Work in `backend/services/[service-name]/`
3. **Database Changes**: Update schemas in `schemas/` and create migrations
4. **Testing**: Use scripts in `test-scripts/` and `scripts/`
5. **Documentation**: Update files in `docs/` directory

## Important Notes
- Each microservice is self-contained with its own dependencies
- Shared code goes in `backend/shared/` or `frontend/lib/`
- Database changes require proper migration scripts
- Frontend and backend can be developed independently
- Docker Compose manages all services together
