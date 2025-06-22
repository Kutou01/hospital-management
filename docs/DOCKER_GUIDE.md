# 🐳 Docker Management Guide - Hospital Management System

## 📋 Tổng Quan Docker Setup

Hệ thống sử dụng Docker Compose để orchestrate các microservices với 3 profiles khác nhau:
- **Core**: Essential services only
- **Full**: All services including monitoring
- **Monitoring**: Only monitoring stack

## 🏗️ Docker Architecture

```
Docker Network: hospital-network
├── 🚪 API Gateway (3100)
├── 🔐 Auth Service (3001)
├── 👨‍⚕️ Doctor Service (3002)
├── 🏥 Patient Service (3003)
├── 📅 Appointment Service (3004)
├── 🗄️ PostgreSQL (5432)
├── 🔴 Redis (6379)
├── 🐰 RabbitMQ (5672, 15672)
├── 📊 Prometheus (9090)
├── 📈 Grafana (3010)
└── 📊 Node Exporter (9100)
```

## 🚀 Quick Start Commands

### Chạy Core Services (Khuyến nghị cho development)
```bash
cd backend
docker-compose --profile core up -d
```

### Chạy Full System (Bao gồm monitoring)
```bash
cd backend
docker-compose --profile full up -d
```

### Chạy Chỉ Monitoring Stack
```bash
cd backend
docker-compose --profile monitoring up -d
```

## 📊 Service Profiles Chi Tiết

### Core Profile
**Services bao gồm:**
- api-gateway
- auth-service
- doctor-service
- patient-service
- appointment-service
- doctor-db (PostgreSQL)
- redis
- rabbitmq

**Resource Usage:**
- Memory: ~1.5GB
- CPU: ~2 cores
- Disk: ~500MB

### Full Profile
**Services bao gồm:** Core + Monitoring
- prometheus
- grafana
- node-exporter

**Resource Usage:**
- Memory: ~2.5GB
- CPU: ~3 cores
- Disk: ~1GB

### Monitoring Profile
**Services bao gồm:**
- prometheus
- grafana
- node-exporter

**Resource Usage:**
- Memory: ~800MB
- CPU: ~1 core
- Disk: ~300MB

## 🔧 Docker Commands Chi Tiết

### Khởi Động Services

**Start tất cả services:**
```bash
docker-compose up -d
```

**Start specific profile:**
```bash
docker-compose --profile core up -d
docker-compose --profile full up -d
docker-compose --profile monitoring up -d
```

**Start specific service:**
```bash
docker-compose up -d api-gateway
docker-compose up -d auth-service
```

### Quản Lý Services

**Stop tất cả services:**
```bash
docker-compose down
```

**Stop và remove volumes:**
```bash
docker-compose down -v
```

**Restart service:**
```bash
docker-compose restart [service-name]
```

**Scale service:**
```bash
docker-compose up -d --scale doctor-service=2
```

### Monitoring & Debugging

**Xem logs:**
```bash
# Tất cả services
docker-compose logs -f

# Specific service
docker-compose logs -f api-gateway
docker-compose logs -f auth-service

# Last 100 lines
docker-compose logs --tail=100 -f [service-name]
```

**Check service status:**
```bash
docker-compose ps
```

**Execute commands trong container:**
```bash
docker-compose exec api-gateway bash
docker-compose exec redis redis-cli
docker-compose exec doctor-db psql -U postgres -d doctor_db
```

### Build & Rebuild

**Build tất cả services:**
```bash
docker-compose build
```

**Build specific service:**
```bash
docker-compose build api-gateway
```

**Build without cache:**
```bash
docker-compose build --no-cache
```

**Rebuild và restart:**
```bash
docker-compose build --no-cache
docker-compose up -d
```

## 🗄️ Volume Management

### Persistent Volumes

```yaml
volumes:
  auth_data:          # Auth database data
  doctor_data:        # Doctor database data
  patient_data:       # Patient database data
  appointment_data:   # Appointment database data
  department_data:    # Department database data
  file_uploads:       # File storage
  redis_data:         # Redis cache data
  rabbitmq_data:      # RabbitMQ data
  prometheus_data:    # Prometheus metrics
  grafana_data:       # Grafana dashboards
```

### Volume Commands

**List volumes:**
```bash
docker volume ls
```

**Inspect volume:**
```bash
docker volume inspect hospital-management_doctor_data
```

**Backup volume:**
```bash
docker run --rm -v hospital-management_doctor_data:/data -v $(pwd):/backup alpine tar czf /backup/doctor_data_backup.tar.gz -C /data .
```

**Restore volume:**
```bash
docker run --rm -v hospital-management_doctor_data:/data -v $(pwd):/backup alpine tar xzf /backup/doctor_data_backup.tar.gz -C /data
```

**Remove unused volumes:**
```bash
docker volume prune
```

## 🌐 Network Configuration

### Hospital Network
```yaml
networks:
  hospital-network:
    driver: bridge
```

**Network commands:**
```bash
# List networks
docker network ls

# Inspect network
docker network inspect hospital-management_hospital-network

# Connect container to network
docker network connect hospital-management_hospital-network [container-name]
```

## 🔍 Troubleshooting

### Common Issues

**1. Port conflicts:**
```bash
# Check what's using the port
netstat -tulpn | grep :3100

# Kill process using port
sudo kill -9 $(lsof -t -i:3100)
```

**2. Out of disk space:**
```bash
# Clean up Docker
docker system prune -a
docker volume prune
docker image prune -a
```

**3. Memory issues:**
```bash
# Check Docker resource usage
docker stats

# Restart Docker Desktop
# Or increase memory limit in Docker Desktop settings
```

**4. Service won't start:**
```bash
# Check logs
docker-compose logs [service-name]

# Check service health
docker-compose ps

# Restart service
docker-compose restart [service-name]
```

### Health Checks

**Check all services:**
```bash
curl http://localhost:3100/health  # API Gateway
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # Doctor Service
curl http://localhost:3003/health  # Patient Service
curl http://localhost:3004/health  # Appointment Service
```

**Database health:**
```bash
docker-compose exec doctor-db pg_isready -U postgres
```

**Redis health:**
```bash
docker-compose exec redis redis-cli ping
```

**RabbitMQ health:**
```bash
curl http://localhost:15672/api/overview -u admin:admin
```

## 🔧 Development Workflow

### Development Setup

1. **Start core services:**
```bash
docker-compose --profile core up -d
```

2. **Develop specific service locally:**
```bash
# Stop the containerized service
docker-compose stop doctor-service

# Run locally
cd backend/services/doctor-service
npm run dev
```

3. **Test changes:**
```bash
# Run tests
npm test

# Check logs
docker-compose logs -f
```

4. **Rebuild and deploy:**
```bash
docker-compose build doctor-service
docker-compose up -d doctor-service
```

### Production Deployment

1. **Build production images:**
```bash
docker-compose -f docker-compose.prod.yml build
```

2. **Deploy to production:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

3. **Monitor deployment:**
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

## 📊 Resource Monitoring

### Resource Limits

Mỗi service có resource limits được định nghĩa:

```yaml
deploy:
  resources:
    limits:
      memory: 256M
      cpus: '0.5'
    reservations:
      memory: 128M
      cpus: '0.25'
```

### Monitoring Commands

**Real-time resource usage:**
```bash
docker stats
```

**Service resource usage:**
```bash
docker-compose top
```

**System resource usage:**
```bash
docker system df
```

## 🚀 Performance Optimization

### Optimization Tips

1. **Use multi-stage builds** để reduce image size
2. **Implement health checks** cho all services
3. **Use .dockerignore** để exclude unnecessary files
4. **Optimize Dockerfile** với proper layer caching
5. **Use Alpine images** khi có thể

### Example Optimized Dockerfile

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1
CMD ["npm", "start"]
```

## 📚 Best Practices

1. **Always use specific image tags** thay vì `latest`
2. **Implement proper health checks** cho all services
3. **Use environment variables** cho configuration
4. **Implement graceful shutdown** trong applications
5. **Monitor resource usage** regularly
6. **Backup volumes** before major changes
7. **Use Docker secrets** cho sensitive data
8. **Implement proper logging** strategy

---

*Để biết thêm chi tiết về specific services, xem DETAILED_GUIDE.md*
