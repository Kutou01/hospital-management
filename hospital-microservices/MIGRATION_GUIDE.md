# 🔄 Migration Guide: Monolith to Microservices

This guide will help you migrate your existing Hospital Management monolith to a microservices architecture.

## 📋 Prerequisites

Before starting the migration, ensure you have:

- [x] Node.js 18+ installed
- [x] Docker and Docker Compose installed
- [x] Access to your current monolith codebase
- [x] Backup of your current database
- [x] At least 8GB RAM available for running all services

## 🎯 Migration Strategy

We'll use a **Strangler Fig Pattern** approach:

1. **Phase 1**: Set up microservices infrastructure
2. **Phase 2**: Migrate data to individual service databases
3. **Phase 3**: Update frontend to use API Gateway
4. **Phase 4**: Gradually route traffic to microservices
5. **Phase 5**: Decommission monolith

## 🚀 Quick Start Migration

### Step 1: Clone and Setup Microservices

```bash
# Clone the microservices repository
git clone <microservices-repo-url>
cd hospital-microservices

# Make scripts executable
chmod +x scripts/*.sh

# Run setup script
./scripts/setup.sh
```

### Step 2: Configure Environment

```bash
# Copy and edit environment variables
cp .env.example .env
nano .env

# Update the following key variables:
# - Database URLs
# - JWT secrets
# - Service URLs
# - External API keys
```

### Step 3: Run Migration Script

```bash
# Run the migration script
./scripts/migrate-from-monolith.sh
```

### Step 4: Start Development Environment

```bash
# Start all services in development mode
./scripts/dev.sh
```

## 📊 Detailed Migration Steps

### Phase 1: Infrastructure Setup

1. **Start Infrastructure Services**
   ```bash
   docker-compose up -d auth-db doctor-db patient-db appointment-db redis rabbitmq
   ```

2. **Verify Infrastructure**
   ```bash
   # Check database connections
   docker-compose ps
   
   # Check Redis
   docker exec -it hospital-microservices_redis_1 redis-cli ping
   
   # Check RabbitMQ
   curl http://localhost:15672 # admin/admin
   ```

### Phase 2: Data Migration

1. **Export Data from Monolith**
   ```bash
   # Export users
   node scripts/export-users.js > data/users.json
   
   # Export doctors
   node scripts/export-doctors.js > data/doctors.json
   
   # Export patients
   node scripts/export-patients.js > data/patients.json
   
   # Export appointments
   node scripts/export-appointments.js > data/appointments.json
   ```

2. **Import Data to Microservices**
   ```bash
   # Import to auth service
   node scripts/import-users.js data/users.json
   
   # Import to doctor service
   node scripts/import-doctors.js data/doctors.json
   
   # Import to patient service
   node scripts/import-patients.js data/patients.json
   
   # Import to appointment service
   node scripts/import-appointments.js data/appointments.json
   ```

### Phase 3: Frontend Migration

1. **Update API Client**
   ```typescript
   // Replace direct Supabase calls
   // OLD:
   const { data } = await supabase.from('doctors').select('*')
   
   // NEW:
   const { data } = await apiClient.get('/api/doctors')
   ```

2. **Update Authentication**
   ```typescript
   // Update useAuth hook to use API Gateway
   const { user, login, logout } = useAuth()
   ```

3. **Update Environment Variables**
   ```env
   NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3000
   NEXT_PUBLIC_SUPABASE_URL= # Remove or comment out
   ```

### Phase 4: Service-by-Service Migration

#### Auth Service Migration
```bash
# 1. Start auth service
docker-compose up -d auth-service

# 2. Update frontend auth calls
# Replace Supabase auth with API Gateway auth

# 3. Test authentication flow
npm run test:auth
```

#### Doctor Service Migration
```bash
# 1. Start doctor service
docker-compose up -d doctor-service

# 2. Update doctor-related API calls
# 3. Test doctor functionality
npm run test:doctor
```

#### Patient Service Migration
```bash
# 1. Start patient service
docker-compose up -d patient-service

# 2. Update patient-related API calls
# 3. Test patient functionality
npm run test:patient
```

#### Appointment Service Migration
```bash
# 1. Start appointment service
docker-compose up -d appointment-service

# 2. Update appointment-related API calls
# 3. Test appointment functionality
npm run test:appointment
```

## 🔍 Testing Migration

### Unit Tests
```bash
# Test individual services
npm run test:auth
npm run test:doctor
npm run test:patient
npm run test:appointment
```

### Integration Tests
```bash
# Test service interactions
npm run test:integration
```

### End-to-End Tests
```bash
# Test complete user flows
npm run test:e2e
```

### Manual Testing Checklist

- [ ] User registration and login
- [ ] Doctor profile management
- [ ] Patient profile management
- [ ] Appointment booking
- [ ] Dashboard functionality
- [ ] Role-based access control
- [ ] Data consistency across services

## 🚨 Rollback Plan

If issues are encountered during migration:

### Immediate Rollback
```bash
# Stop microservices
docker-compose down

# Restore monolith
cd ../hospital-management
npm run dev

# Restore database from backup
# (Follow your backup restoration procedure)
```

### Partial Rollback
```bash
# Route specific functionality back to monolith
# Update API Gateway routing configuration
# Gradually move services back
```

## 📊 Monitoring Migration

### Health Checks
```bash
# Check all services
curl http://localhost:3000/health

# Check individual services
curl http://localhost:3001/health # Auth
curl http://localhost:3002/health # Doctor
curl http://localhost:3003/health # Patient
curl http://localhost:3004/health # Appointment
```

### Performance Monitoring
- Monitor response times
- Check database connections
- Monitor memory usage
- Check error rates

### Logging
```bash
# View all logs
npm run logs

# View specific service logs
npm run logs:auth
npm run logs:doctor
npm run logs:patient
npm run logs:appointment
```

## 🎯 Post-Migration Tasks

### 1. Performance Optimization
- [ ] Implement caching strategies
- [ ] Optimize database queries
- [ ] Set up load balancing
- [ ] Configure auto-scaling

### 2. Security Hardening
- [ ] Review and update security policies
- [ ] Implement rate limiting
- [ ] Set up API authentication
- [ ] Configure HTTPS

### 3. Monitoring and Alerting
- [ ] Set up Prometheus metrics
- [ ] Configure Grafana dashboards
- [ ] Set up alerting rules
- [ ] Implement distributed tracing

### 4. Documentation
- [ ] Update API documentation
- [ ] Create service documentation
- [ ] Update deployment guides
- [ ] Train team on new architecture

## 🆘 Troubleshooting

### Common Issues

1. **Service Connection Issues**
   ```bash
   # Check service discovery
   curl http://localhost:3000/services
   
   # Check network connectivity
   docker network ls
   docker network inspect hospital-microservices_hospital-network
   ```

2. **Database Connection Issues**
   ```bash
   # Check database status
   docker-compose ps
   
   # Check database logs
   docker-compose logs auth-db
   ```

3. **Authentication Issues**
   ```bash
   # Check JWT configuration
   # Verify JWT secrets match across services
   # Check token expiration settings
   ```

### Getting Help

- Check the logs: `npm run logs`
- Review the migration report: `migration-report.md`
- Check service health: `curl http://localhost:3000/health`
- Review Docker status: `docker-compose ps`

## 📈 Benefits After Migration

- **Scalability**: Scale services independently
- **Technology Flexibility**: Use different tech stacks per service
- **Team Independence**: Teams can work on different services
- **Fault Isolation**: Service failures don't affect entire system
- **Deployment Flexibility**: Deploy services independently
- **Better Resource Utilization**: Optimize resources per service

## 🎉 Success Criteria

Migration is considered successful when:

- [ ] All services are running and healthy
- [ ] All functionality works as expected
- [ ] Performance is equal or better than monolith
- [ ] Data integrity is maintained
- [ ] Security is not compromised
- [ ] Team is comfortable with new architecture

---

**Need help?** Check the troubleshooting section or create an issue in the repository.
