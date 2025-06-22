# 🧪 Frontend Testing Guide - Core Services Integration

**Comprehensive guide to test all core services through frontend interface**

---

## 🎯 **OVERVIEW**

Dự án đã có **hệ thống testing frontend hoàn chỉnh** để test tất cả core services. Bạn có thể test qua:
1. **Frontend UI Testing** - Interactive test pages
2. **API Testing Scripts** - Automated test scripts  
3. **Dashboard Integration** - Real-time monitoring
4. **Manual Testing** - Step-by-step workflows

---

## 🚀 **QUICK START - TEST ALL SERVICES**

### **Step 1: Start All Services**
```bash
# Start backend services
cd backend
docker compose --profile core up -d

# Start frontend
cd frontend
npm install
npm run dev
```

### **Step 2: Access Test Pages**
- **Main Test Hub**: http://localhost:3000/api-test
- **Doctor API Test**: http://localhost:3000/test/doctor-api
- **Patient API Test**: http://localhost:3000/test/patient-api
- **Admin Dashboard**: http://localhost:3000/admin/dashboard

---

## 🧪 **DETAILED TESTING METHODS**

### **Method 1: Interactive Frontend Testing (Recommended)**

#### **🏥 Admin Dashboard Testing**
```
URL: http://localhost:3000/admin/dashboard
Login: admin@hospital.com / Admin123

Tests:
✅ Real-time statistics from all services
✅ Service health monitoring
✅ Dashboard API integration
✅ Microservices communication
✅ Error handling and fallbacks
```

#### **👨‍⚕️ Doctor Dashboard Testing**
```
URL: http://localhost:3000/doctors/dashboard  
Login: doctor@hospital.com / Doctor123

Tests:
✅ Doctor profile management
✅ Appointment scheduling
✅ Patient management
✅ Review and rating system
✅ Inter-service communication
```

#### **🏥 Patient Dashboard Testing**
```
URL: http://localhost:3000/patient/dashboard
Login: patient@hospital.com / Patient123

Tests:
✅ Patient profile management
✅ Appointment booking
✅ Medical records access
✅ Health metrics tracking
✅ Service integration
```

### **Method 2: Dedicated Test Pages**

#### **🔬 Comprehensive Test Page** ⭐ **NEW & RECOMMENDED**
```
URL: http://localhost:3000/test/comprehensive

Features:
✅ 3 Test Modes: Public, Authenticated, Comprehensive
✅ Real-time authentication status
✅ JWT token information display
✅ All 5 core services testing
✅ Public + Protected endpoint testing
✅ Performance metrics tracking
✅ Detailed error analysis
✅ Interactive authentication flow
```

**Test Modes:**
- **Public Only**: Tests health checks and validation (no auth required)
- **Authenticated**: Logs in first, then tests protected endpoints
- **Comprehensive**: Runs both public and authenticated tests

#### **🔬 Doctor API Test Page**
```
URL: http://localhost:3000/test/doctor-api

Features:
✅ Simple API tests (health, stats, direct calls)
✅ Comprehensive CRUD operations
✅ Authentication flow testing
✅ API Gateway integration
✅ Error handling validation
✅ Real-time results display
```

#### **🔬 Patient API Test Page**
```
URL: http://localhost:3000/test/patient-api

Features:
✅ Patient service health checks
✅ CRUD operations testing
✅ Auth service integration
✅ Data validation testing
✅ Service communication testing
✅ Unified test runner
```

#### **🔬 General API Test Page**
```
URL: http://localhost:3000/api-test

Features:
✅ All services health check
✅ API Gateway testing
✅ Authentication flow
✅ Service discovery
✅ Error handling
✅ Performance monitoring
```

### **Method 3: Automated Test Scripts**

#### **🚀 Comprehensive Integration Test** ⭐ **NEW & RECOMMENDED**
```bash
cd frontend
node scripts/test-comprehensive-integration.js

Tests:
✅ Public endpoint testing (health checks)
✅ Authentication flow validation
✅ Auth protection verification
✅ Authenticated endpoint testing
✅ Performance metrics
✅ Detailed success/failure reporting
✅ Color-coded console output
✅ Production-ready test suite
```

#### **📊 Dashboard Integration Test**
```bash
cd frontend
node scripts/test-dashboard-integration.js

Tests:
✅ API endpoints (/patients/stats, /doctors/stats, etc.)
✅ Service health checks
✅ Dashboard page loading
✅ Real-time metrics
✅ Error handling
```

#### **👨‍⚕️ Doctor API Test Script**
```bash
cd frontend
node scripts/test-doctor-api.js

Tests:
✅ Authentication flow
✅ CRUD operations
✅ Search functionality
✅ Statistics endpoints
✅ Profile management
✅ Performance metrics
```

#### **🏥 Patient API Test Script**
```bash
cd frontend
node scripts/test-patient-api.js

Tests:
✅ Patient registration
✅ Profile management
✅ Search and filtering
✅ Data validation
✅ Service integration
```

---

## 📋 **COMPREHENSIVE TEST CHECKLIST**

### **✅ Auth Service Testing**
- [ ] Login/logout functionality
- [ ] Role-based access control
- [ ] Token management
- [ ] Session handling
- [ ] Password reset flow

**Test via:**
- Login pages: `/auth/login`
- Dashboard access control
- API authentication headers

### **✅ Doctor Service Testing**
- [ ] Doctor profile CRUD
- [ ] Schedule management
- [ ] Review system
- [ ] Statistics calculation
- [ ] Inter-service communication

**Test via:**
- Doctor dashboard: `/doctors/dashboard`
- Test page: `/test/doctor-api`
- Admin management: `/admin/doctors`

### **✅ Patient Service Testing**
- [ ] Patient registration
- [ ] Profile management
- [ ] Health metrics
- [ ] Search functionality
- [ ] Data validation

**Test via:**
- Patient dashboard: `/patient/dashboard`
- Test page: `/test/patient-api`
- Admin management: `/admin/patients`

### **✅ Appointment Service Testing**
- [ ] Appointment booking
- [ ] Schedule viewing
- [ ] Status management
- [ ] Conflict detection
- [ ] Real-time updates

**Test via:**
- Appointment pages: `/admin/appointments`
- Calendar integration
- Dashboard statistics

### **✅ Department Service Testing**
- [ ] Department hierarchy
- [ ] Specialty management
- [ ] Room allocation
- [ ] Service discovery

**Test via:**
- Department pages: `/admin/departments`
- Doctor registration (department selection)
- Room management: `/admin/rooms`

---

## 🔍 **STEP-BY-STEP TESTING WORKFLOW**

### **Phase 1: Basic Service Health**
1. **Start all services**
   ```bash
   cd backend && docker compose --profile core up -d
   cd frontend && npm run dev
   ```

2. **Check service status**
   - Visit: http://localhost:3000/api-test
   - Click "Run All Tests"
   - Verify all services show "PASS"

### **Phase 2: Authentication Testing**
1. **Test login flow**
   - Visit: http://localhost:3000/auth/login
   - Login with: admin@hospital.com / Admin123
   - Verify redirect to dashboard

2. **Test role-based access**
   - Try accessing different dashboards
   - Verify proper access control

### **Phase 3: Core Service Integration**
1. **Doctor Service**
   - Visit: http://localhost:3000/test/doctor-api
   - Run "Simple Tests" first
   - Then run "Comprehensive Tests"
   - Check all operations pass

2. **Patient Service**
   - Visit: http://localhost:3000/test/patient-api
   - Run "Unified Tests"
   - Verify CRUD operations
   - Check data validation

3. **Dashboard Integration**
   - Visit: http://localhost:3000/admin/dashboard
   - Verify real-time statistics
   - Check service health indicators
   - Test data refresh

### **Phase 4: End-to-End Workflows**
1. **Doctor Registration Flow**
   - Register new doctor via Auth Service
   - Verify profile creation
   - Check department assignment
   - Test dashboard access

2. **Patient Registration Flow**
   - Register new patient
   - Verify profile creation
   - Test appointment booking
   - Check medical records

3. **Appointment Workflow**
   - Book appointment as patient
   - Verify in doctor dashboard
   - Update appointment status
   - Check real-time updates

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues & Solutions**

#### **❌ Services Not Responding**
```bash
# Check service status
docker compose ps

# Restart specific service
docker compose restart doctor-service

# Check logs
docker compose logs doctor-service
```

#### **❌ Authentication Failures**
- Clear browser localStorage
- Check Auth Service health
- Verify token in Network tab
- Try different test accounts

#### **❌ API Gateway Issues**
- Check port 3100 accessibility
- Verify service routing
- Check CORS configuration
- Review gateway logs

#### **❌ Database Connection Issues**
- Verify Supabase connection
- Check environment variables
- Test direct database queries
- Review RLS policies

---

## 📊 **TEST RESULTS INTERPRETATION**

### **✅ Success Indicators**
- All health checks return 200 OK
- CRUD operations complete successfully
- Real-time updates work
- Authentication flows properly
- Inter-service communication works

### **⚠️ Warning Signs**
- Slow response times (>2 seconds)
- Intermittent failures
- Fallback mechanisms activating
- Missing data in responses

### **❌ Failure Indicators**
- 500 server errors
- Authentication failures
- Service unavailable errors
- Database connection issues

---

## 🎯 **NEXT STEPS**

After successful testing:

1. **Document Results**
   - Screenshot test results
   - Note performance metrics
   - Record any issues found

2. **Performance Optimization**
   - Identify slow endpoints
   - Optimize database queries
   - Implement caching where needed

3. **Expand Testing**
   - Add more test scenarios
   - Implement automated CI/CD tests
   - Create load testing scripts

4. **Production Readiness**
   - Security testing
   - Error handling validation
   - Monitoring setup

---

**🎉 Your microservices architecture is ready for graduation thesis defense!**

The comprehensive testing system demonstrates enterprise-level software development practices and validates the complete integration between frontend and backend services.
