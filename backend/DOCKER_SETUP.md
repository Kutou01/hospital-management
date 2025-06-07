# Docker Setup Guide for Hospital Management API Gateway

## Overview

This guide helps you run the Hospital Management API Gateway using Docker for easy development and testing.

## Prerequisites

- Docker Desktop installed and running
- Git (to clone the repository)
- Basic knowledge of Docker and command line

## Quick Start

### Windows (PowerShell)
```powershell
# Navigate to backend directory
cd backend

# Start API Gateway with Docker
.\start-api-gateway-docker.ps1

# Stop services when done
.\stop-docker.ps1
```

### Linux/Mac (Bash)
```bash
# Navigate to backend directory
cd backend

# Make script executable
chmod +x start-api-gateway-docker.sh

# Start API Gateway with Docker
./start-api-gateway-docker.sh

# Stop services when done
docker-compose down
```

## What Gets Started

The Docker setup starts these services:

1. **API Gateway** (port 3100) - Main gateway service
2. **Doctor Service** (port 3002) - Doctor management microservice
3. **Redis** (port 6379) - Caching and session storage
4. **RabbitMQ** (ports 5672, 15672) - Message queue
5. **PostgreSQL** (port 5432) - Doctor database

## Service URLs

After starting, you can access:

- 🌐 **API Gateway**: http://localhost:3100
- 📚 **API Documentation**: http://localhost:3100/docs
- ❤️ **Health Check**: http://localhost:3100/health
- 🔧 **Service Status**: http://localhost:3100/services
- 👨‍⚕️ **Doctor API**: http://localhost:3100/api/doctors
- 🐰 **RabbitMQ Management**: http://localhost:15672 (admin/admin)

## Configuration

### Environment Variables

The API Gateway uses environment variables from `api-gateway/.env`:

```env
# Server Configuration
PORT=3100
NODE_ENV=development
DOCTOR_ONLY_MODE=true

# Supabase Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Service URLs (Docker internal network)
DOCTOR_SERVICE_URL=http://doctor-service:3002
REDIS_URL=redis://redis:6379
RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672
```

### Doctor-Only Mode

Currently running in **DOCTOR-ONLY MODE** for development:
- ✅ Doctor service is active
- ❌ Other services return 503 (temporarily unavailable)

## Useful Docker Commands

```bash
# View running containers
docker-compose ps

# View logs for specific service
docker-compose logs -f api-gateway
docker-compose logs -f doctor-service

# Restart a specific service
docker-compose restart api-gateway

# Stop all services
docker-compose down

# Stop and remove all data
docker-compose down -v

# Rebuild and start services
docker-compose up -d --build

# Access container shell
docker-compose exec api-gateway sh
```

## Troubleshooting

### Port Already in Use
If you get port conflicts:
```bash
# Check what's using the port
netstat -ano | findstr :3100  # Windows
lsof -i :3100                 # Linux/Mac

# Stop conflicting services or change ports in docker-compose.yml
```

### Service Won't Start
```bash
# Check logs
docker-compose logs api-gateway

# Rebuild container
docker-compose up -d --build api-gateway

# Check if all dependencies are running
docker-compose ps
```

### Database Connection Issues
```bash
# Check if doctor-db is running
docker-compose ps doctor-db

# View database logs
docker-compose logs doctor-db

# Connect to database directly
docker-compose exec doctor-db psql -U postgres -d doctor_db
```

### Environment Variables Not Loading
1. Ensure `api-gateway/.env` file exists
2. Check file permissions
3. Verify Supabase credentials are correct
4. Restart containers: `docker-compose restart api-gateway`

## Development Workflow

1. **Start Services**: Run the startup script
2. **Develop**: Make changes to your code
3. **Test**: Use the API endpoints to test functionality
4. **Rebuild**: If you change dependencies, rebuild with `--build` flag
5. **Stop**: Use stop script when done

## Production Considerations

For production deployment:
1. Change `NODE_ENV=production`
2. Use proper secrets management
3. Configure proper CORS origins
4. Set up SSL/TLS
5. Use production-grade databases
6. Configure monitoring and logging

## Support

If you encounter issues:
1. Check the logs: `docker-compose logs -f`
2. Verify all services are running: `docker-compose ps`
3. Check environment variables in `.env` file
4. Ensure Docker Desktop is running and has enough resources
