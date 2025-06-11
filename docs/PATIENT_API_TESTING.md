# 🧪 Patient API Integration Testing Guide

## 📋 Overview

This guide helps you test and integrate the frontend with Patient Service APIs. We've created comprehensive testing tools to verify that the frontend can successfully communicate with the Patient Service through the API Gateway.

## 🎯 What We're Testing

### **API Endpoints:**
- `GET /api/patients` - Get all patients with pagination
- `POST /api/patients` - Create new patient
- `GET /api/patients/:id` - Get patient by ID
- `PUT /api/patients/:id` - Update patient
- `GET /api/patients/search` - Search patients
- `GET /api/patients/stats` - Get patient statistics

### **Integration Points:**
- ✅ Frontend API client
- ✅ Authentication flow via API Gateway
- ✅ Department-based ID generation
- ✅ CRUD operations with validation
- ✅ Error handling and responses
- ✅ Response time measurement

## 🚀 Quick Start

### **Method 1: Automated Testing (Recommended)**

```bash
# 1. Run the integration test script
./scripts/test-patient-integration.sh test

# 2. Check service status
./scripts/test-patient-integration.sh status
```

### **Method 2: Manual Frontend Testing**

```bash
# 1. Start your services (API Gateway, Auth Service, Patient Service)
cd backend && docker compose --profile core up -d

# 2. Start frontend
cd frontend && npm run dev

# 3. Open test page
# http://localhost:3000/test/patient-api
```

### **Method 3: Node.js API Testing**

```bash
# Run direct API tests
cd frontend && npm run test:patient-api
```

## 📁 Test Files Created

### **Frontend Test Components:**
```
frontend/
├── app/test/patient-api/page.tsx          # Test page UI
├── components/test/PatientApiTest.tsx     # Test component
├── lib/api/patients.ts                   # Updated API client
└── scripts/test-patient-api.js           # Node.js test script
```

### **Test Scripts:**
```
scripts/
└── test-patient-integration.sh           # Integration test runner
```

## 🔧 Prerequisites

### **Services Must Be Running:**
- ✅ **API Gateway** (Port 3100)
- ✅ **Auth Service** (Port 3001) 
- ✅ **Patient Service** (Port 3003)
- ✅ **Database** (Supabase)

### **Authentication:**
- Valid user account in the system
- User must be logged in to test APIs
- JWT token will be automatically handled

### **Test Data:**
- Test patient will be created automatically
- Uses department-based ID format: `PAT-YYYYMM-XXX`
- Sample data includes Vietnamese patient information

## 📊 Test Coverage

### **Functional Tests:**
- [x] **Authentication Flow** - Login and token management
- [x] **CRUD Operations** - Create, Read, Update, Delete patients
- [x] **Search Functionality** - Search patients by name/ID
- [x] **Pagination** - Handle paginated responses
- [x] **Validation** - Input validation and error handling
- [x] **Department IDs** - Verify ID generation format

### **Performance Tests:**
- [x] **Response Time** - Measure API response times
- [x] **Error Handling** - Test error scenarios
- [x] **Data Integrity** - Verify data structure consistency

### **Integration Tests:**
- [x] **API Gateway Routing** - Test request routing
- [x] **Authentication Middleware** - Verify auth flow
- [x] **Service Communication** - Frontend ↔ Backend
- [x] **Database Operations** - CRUD with Supabase

## 🎮 How to Use the Test Interface

### **Frontend Test Page** (`/test/patient-api`)

1. **Login Required**: Make sure you're logged in first
2. **Run All Tests**: Click "Run All Tests" button
3. **Monitor Results**: Watch real-time test execution
4. **Check Details**: Expand response data for debugging
5. **Verify IDs**: Confirm department-based ID format

### **Expected Results:**
```
✅ GET /api/patients - Retrieved X patients (Total: Y) - 150ms
✅ POST /api/patients - Created patient with ID: PAT-202412-001 - 200ms
✅ GET /api/patients/:id - Retrieved patient: PAT-202412-001 - 120ms
✅ PUT /api/patients/:id - Updated patient: PAT-202412-001 - 180ms
✅ GET /api/patients/search - Found X patients matching "Test" - 140ms
```

## 🐛 Troubleshooting

### **Common Issues:**

#### **1. Authentication Errors**
```
❌ Error: No token provided
```
**Solution:** Make sure you're logged in. Check browser localStorage for `auth_token`.

#### **2. Service Unavailable**
```
❌ Error: Patient service unavailable
```
**Solution:** Check if Patient Service is running on port 3003:
```bash
curl http://localhost:3003/health
```

#### **3. API Gateway Issues**
```
❌ Error: Route not found
```
**Solution:** Verify API Gateway is running and routing correctly:
```bash
curl http://localhost:3100/api/patients
```

#### **4. Database Connection**
```
❌ Error: Failed to create patient
```
**Solution:** Check Supabase connection and database schema.

### **Debug Steps:**

1. **Check Service Status:**
```bash
./scripts/test-patient-integration.sh status
```

2. **Check Logs:**
```bash
cd backend && docker compose logs patient-service
cd backend && docker compose logs api-gateway
```

3. **Test Individual Services:**
```bash
# Test Auth Service
curl http://localhost:3001/health

# Test Patient Service
curl http://localhost:3003/health

# Test API Gateway
curl http://localhost:3100/health
```

## 📈 Performance Benchmarks

### **Expected Response Times:**
- **GET requests**: < 200ms
- **POST requests**: < 300ms
- **PUT requests**: < 250ms
- **Search requests**: < 200ms

### **Success Criteria:**
- ✅ All tests pass (5/5)
- ✅ Response times under 500ms
- ✅ Department-based IDs generated correctly
- ✅ No authentication errors
- ✅ Proper error handling

## 🔄 Next Steps

After successful Patient API testing:

1. **Test Doctor Service APIs**
2. **Test Appointment Service APIs**
3. **Test End-to-End Workflows**
4. **Performance Optimization**
5. **Error Handling Improvements**

## 📝 Test Results Template

```
🧪 Patient API Integration Test Results
=====================================

Date: [DATE]
Environment: Development
Services: API Gateway + Auth Service + Patient Service

Test Results:
✅ GET /api/patients - [TIME]ms
✅ POST /api/patients - [TIME]ms  
✅ GET /api/patients/:id - [TIME]ms
✅ PUT /api/patients/:id - [TIME]ms
✅ GET /api/patients/search - [TIME]ms

Summary: 5/5 tests passed
Average Response Time: [AVG]ms
Department ID Format: PAT-YYYYMM-XXX ✅

Issues Found: [NONE/LIST]
Next Actions: [ACTIONS]
```

## 🎯 Success Indicators

Your Patient API integration is working correctly when:

- ✅ All 5 API tests pass
- ✅ Patient IDs follow format: `PAT-202412-001`
- ✅ Authentication flows work seamlessly
- ✅ CRUD operations complete successfully
- ✅ Search returns relevant results
- ✅ Error handling works properly
- ✅ Response times are acceptable

**🎉 Congratulations!** Your Patient Service is now fully integrated with the frontend!
