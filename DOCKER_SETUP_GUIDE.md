# 🐳 Docker Setup Guide - Hospital Management System

## 📋 Overview

This guide covers Docker setup for the Hospital Management System, including development and production environments.

## 🔧 Prerequisites

### Required Software
- **Docker**: >= 20.10.0
- **Docker Compose**: >= 2.0.0
- **Node.js**: >= 18.0.0 (for local development)

### Installation
```bash
# Install Docker Desktop (Windows/Mac)
# Download from: https://www.docker.com/products/docker-desktop

# Install Docker (Linux)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Verify installation
docker --version
docker-compose --version
```

## 🏗️ Docker Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Network                           │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Frontend   │  │ API Gateway │  │    Microservices    │ │
│  │  (Next.js)  │  │  (Express)  │  │                     │ │
│  │   :3000     │  │    :3100    │  │  ┌─────┐ ┌─────┐   │ │
│  └─────────────┘  └─────────────┘  │  │:3001│ │:3002│   │ │
│                                     │  └─────┘ └─────┘   │ │
│  ┌─────────────┐  ┌─────────────┐  │  ┌─────┐ ┌─────┐   │ │
│  │    Redis    │  │  PostgreSQL │  │  │:3003│ │:3004│   │ │
│  │    :6379    │  │    :5432    │  │  └─────┘ └─────┘   │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Docker Files Structure

```
hospital-management/
├── 📄 docker-compose.yml          # Main compose file
├── 📄 docker-compose.dev.yml      # Development overrides
├── 📄 docker-compose.prod.yml     # Production overrides
├── 📄 Dockerfile                  # Multi-stage build
├── 📁 frontend/
│   └── 📄 Dockerfile              # Frontend specific
├── 📁 backend/
│   ├── 📄 Dockerfile              # Backend API Gateway
│   └── 📁 services/
│       ├── 📁 appointment-service/
│       │   └── 📄 Dockerfile
│       ├── 📁 doctor-service/
│       │   └── 📄 Dockerfile
│       └── 📁 ...other services/
└── 📁 docker/
    ├── 📄 nginx.conf              # Nginx configuration
    ├── 📄 redis.conf              # Redis configuration
    └── 📁 scripts/                # Docker utility scripts
```

## 🚀 Quick Start with Docker

### 1. Development Environment
```bash
# Clone repository
git clone https://github.com/Kutou01/hospital-management.git
cd hospital-management

# Copy environment files
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env

# Start development environment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Or use npm script
npm run docker:dev
```

### 2. Production Environment
```bash
# Build and start production environment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

# Or use npm script
npm run docker:prod
```

### 3. Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Clean up everything
npm run docker:clean
```

## 📝 Docker Compose Files

### Main Compose File (docker-compose.yml)
```yaml
version: '3.8'

services:
  # Frontend Service
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - api-gateway
    networks:
      - hospital-network

  # API Gateway
  api-gateway:
    build:
      context: ./backend/api-gateway
      dockerfile: Dockerfile
    ports:
      - "3100:3100"
    environment:
      - NODE_ENV=production
      - PORT=3100
    depends_on:
      - redis
    networks:
      - hospital-network

  # Microservices
  appointment-service:
    build:
      context: ./backend/services/appointment-service
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    networks:
      - hospital-network

  doctor-service:
    build:
      context: ./backend/services/doctor-service
      dockerfile: Dockerfile
    ports:
      - "3002:3002"
    networks:
      - hospital-network

  # Redis for caching
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - hospital-network

  # Nginx Load Balancer
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - frontend
      - api-gateway
    networks:
      - hospital-network

volumes:
  redis-data:

networks:
  hospital-network:
    driver: bridge
```

### Development Overrides (docker-compose.dev.yml)
```yaml
version: '3.8'

services:
  frontend:
    build:
      target: development
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_DEBUG=true
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev

  api-gateway:
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=debug
    volumes:
      - ./backend/api-gateway:/app
      - /app/node_modules
    command: npm run dev

  appointment-service:
    environment:
      - NODE_ENV=development
    volumes:
      - ./backend/services/appointment-service:/app
      - /app/node_modules
    command: npm run dev
```

## 🔧 Environment Variables for Docker

### Docker Environment (.env.docker)
```env
# Docker Configuration
COMPOSE_PROJECT_NAME=hospital-management
DOCKER_BUILDKIT=1
COMPOSE_DOCKER_CLI_BUILD=1

# Network Configuration
HOSPITAL_NETWORK=hospital-network

# Volume Configuration
REDIS_DATA_VOLUME=hospital-redis-data
POSTGRES_DATA_VOLUME=hospital-postgres-data

# Port Configuration
FRONTEND_PORT=3000
API_GATEWAY_PORT=3100
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443
REDIS_PORT=6379

# Resource Limits
FRONTEND_MEMORY=512m
API_GATEWAY_MEMORY=256m
MICROSERVICE_MEMORY=128m
REDIS_MEMORY=128m
```

## 🛠️ Docker Commands Reference

### Basic Commands
```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build frontend

# Start services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs

# View logs for specific service
docker-compose logs frontend

# Stop services
docker-compose stop

# Remove containers
docker-compose down

# Remove containers and volumes
docker-compose down -v
```

### Development Commands
```bash
# Start development environment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Rebuild and start
docker-compose up --build

# Scale microservices
docker-compose up --scale appointment-service=3

# Execute commands in container
docker-compose exec frontend bash
docker-compose exec api-gateway npm test
```

### Debugging Commands
```bash
# View container status
docker-compose ps

# View resource usage
docker stats

# Inspect container
docker inspect hospital-management_frontend_1

# View container logs
docker logs hospital-management_frontend_1

# Access container shell
docker exec -it hospital-management_frontend_1 bash
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find process using port
lsof -i :3000
netstat -tulpn | grep :3000

# Kill process
kill -9 <PID>

# Or use different ports in docker-compose.yml
```

#### 2. Build Failures
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Remove all containers and rebuild
docker-compose down -v
docker-compose up --build
```

#### 3. Volume Issues
```bash
# Remove all volumes
docker-compose down -v

# Remove specific volume
docker volume rm hospital-management_redis-data

# List volumes
docker volume ls
```

#### 4. Network Issues
```bash
# Recreate network
docker-compose down
docker network prune
docker-compose up
```

### Performance Optimization

#### 1. Multi-stage Builds
```dockerfile
# Use multi-stage builds to reduce image size
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

#### 2. Resource Limits
```yaml
services:
  frontend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

## 📊 Monitoring with Docker

### Health Checks
```yaml
services:
  api-gateway:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3100/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Logging
```yaml
services:
  frontend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 🚀 Production Deployment

### 1. Build Production Images
```bash
# Build optimized production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Tag images for registry
docker tag hospital-management_frontend:latest your-registry/hospital-frontend:v1.0.0
```

### 2. Deploy to Production
```bash
# Deploy to production server
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Update specific service
docker-compose up -d --no-deps frontend
```

### 3. Backup and Restore
```bash
# Backup volumes
docker run --rm -v hospital-management_redis-data:/data -v $(pwd):/backup alpine tar czf /backup/redis-backup.tar.gz -C /data .

# Restore volumes
docker run --rm -v hospital-management_redis-data:/data -v $(pwd):/backup alpine tar xzf /backup/redis-backup.tar.gz -C /data
```

---

**Happy Dockerizing! 🐳**
