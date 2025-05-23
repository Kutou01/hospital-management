# Deployment Guide

## Overview

This guide covers deployment options for the Hospital Management System.

## Prerequisites

- Docker & Docker Compose
- Node.js 18+
- Supabase account
- Domain name (for production)

## Environment Setup

### Development

1. **Clone repository**
```bash
git clone https://github.com/Kutou01/hospital-management.git
cd hospital-management
```

2. **Install dependencies**
```bash
npm run install:all
```

3. **Setup environment variables**
```bash
# Frontend
cp frontend/.env.example frontend/.env.local
# Backend
cp backend/.env.example backend/.env
```

4. **Start development servers**
```bash
npm run dev
```

### Production

#### Option 1: Docker Deployment

1. **Build and start with Docker**
```bash
npm run docker:prod
```

2. **Environment variables**
Create `.env.production` files:

**Frontend (.env.production):**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Backend (.env.production):**
```env
NODE_ENV=production
DATABASE_URL=your-production-database-url
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-supabase-service-key
JWT_SECRET=your-production-jwt-secret
REDIS_URL=your-redis-url
```

#### Option 2: Manual Deployment

1. **Build applications**
```bash
npm run build
```

2. **Deploy frontend** (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy dist folder to your hosting provider
```

3. **Deploy backend** (VPS/Cloud)
```bash
cd backend
npm run build
npm run start
```

## Docker Configuration

### Development
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=development
  
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
```

### Production
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile.prod
    ports:
      - "80:3000"
  
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
```

## Monitoring

### Health Checks
```bash
# Check all services
npm run health-check

# Check specific service
curl http://localhost:3000/health
```

### Logs
```bash
# View all logs
npm run logs

# View specific service logs
npm run logs:auth
npm run logs:doctor
```

## Security Considerations

1. **Environment Variables**
   - Never commit `.env` files
   - Use different secrets for production
   - Rotate JWT secrets regularly

2. **HTTPS**
   - Always use HTTPS in production
   - Configure SSL certificates

3. **Database**
   - Use connection pooling
   - Enable SSL connections
   - Regular backups

4. **API Security**
   - Rate limiting
   - Input validation
   - CORS configuration

## Scaling

### Horizontal Scaling
- Use load balancers
- Deploy multiple instances
- Database read replicas

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Use caching (Redis)

## Troubleshooting

### Common Issues

1. **Port conflicts**
```bash
# Check port usage
netstat -tulpn | grep :3000
```

2. **Database connection**
```bash
# Test database connection
npm run test:db
```

3. **Service health**
```bash
# Check service status
docker-compose ps
```
