# Hospital Management System - Development Commands

## Essential Development Commands

### Project Setup

```bash
# Install all dependencies
npm run install:all

# Setup environment variables
npm run setup:env

# Setup database tables
npm run setup:tables

# Setup security configurations
npm run setup:security
```

### Development Servers

```bash
# Start all microservices
npm run dev:all

# Start core services only
npm run dev:core

# Start specific service
npm run dev:doctor
npm run dev:patient
npm run dev:appointment
npm run dev:auth

# Start frontend
npm run dev:frontend

# Start with API gateway
npm run dev:complete-with-gateway
```

### Docker Operations

```bash
# Start all services with Docker
npm run docker:complete

# Start development environment
npm run docker:dev

# Start production environment
npm run docker:prod

# Stop all services
npm run docker:down

# Clean up containers and images
npm run docker:clean
```

### Database Operations

```bash
# Check database status
npm run db:check

# Setup database
npm run db:setup

# Deploy complete database
npm run db:deploy-complete

# Verify database setup
npm run db:verify-complete

# Seed test data
npm run db:seed

# Verify test data
npm run db:verify

# Cleanup test data
npm run db:cleanup
```

### Testing

```bash
# Run all tests
npm test

# Run specific service tests
npm run test:doctor
npm run test:patient
npm run test:appointment

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e

# Test specific APIs
npm run test:patient-api
npm run test:doctor-api
```

### Code Quality

```bash
# Lint all code
npm run lint

# Format code with Prettier
npm run format

# Security audit
npm run security:audit

# Check git security
npm run security:check
```

### Building

```bash
# Build all services
npm run build

# Build specific components
npm run build:frontend
npm run build:gateway
npm run build:services

# Build core services
npm run build:core
```

### Health Checks

```bash
# Check service health
npm run health-check

# View logs
npm run logs

# View specific service logs
npm run logs:doctor
npm run logs:patient
npm run logs:appointment
```

## Frontend Commands (from frontend directory)

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint

# Clean build cache
npm run clean
```

## Serena Commands

```bash
# Start Serena MCP server
uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant --project $(pwd)

# Index project for better performance
uvx --from git+https://github.com/oraios/serena serena project index

# Edit global configuration
uvx --from git+https://github.com/oraios/serena serena config edit

# Edit project configuration
uvx --from git+https://github.com/oraios/serena serena project generate-yml
```

## Environment Variables

Make sure to set up these environment variables:

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `JWT_SECRET` - JWT signing secret
- `DATABASE_URL` - Database connection string
- `EMAIL_SERVICE_API_KEY` - Email service credentials
- `PAYMENT_GATEWAY_KEY` - Payment gateway API key

## Quick Development Workflow

1. **Start services**: `npm run dev:core`
2. **Start frontend**: `cd frontend && npm run dev`
3. **Make changes** in your preferred editor
4. **Test changes** with appropriate test commands
5. **Commit changes** with meaningful messages
6. **Deploy** using Docker commands when ready

## Troubleshooting

- **Service won't start**: Check logs with `npm run logs:[service]`
- **Database issues**: Run `npm run db:check` and `npm run db:setup`
- **Build failures**: Clean and reinstall with `npm run clean && npm run install:all`
- **Docker issues**: Use `npm run docker:clean` and restart

