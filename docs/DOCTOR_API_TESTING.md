# 🧪 Doctor API Integration Testing Guide

## 📋 Overview

This guide helps you test and integrate the frontend with Doctor Service APIs. We've created comprehensive testing tools to verify that the frontend can successfully communicate with the Doctor Service through the API Gateway.

## 🎯 What We're Testing

### **API Endpoints:**
- `GET /api/doctors` - Get all doctors with pagination
- `POST /api/doctors` - Create new doctor
- `GET /api/doctors/:id` - Get doctor by ID
- `GET /api/doctors/:id/profile` - Get complete doctor profile
- `PUT /api/doctors/:id` - Update doctor
- `GET /api/doctors/search` - Search doctors
- `GET /api/doctors/:id/stats` - Get doctor statistics

### **Integration Points:**
- ✅ Frontend API client
- ✅ Authentication flow via API Gateway
- ✅ Department-based ID generation
- ✅ CRUD operations with validation
- ✅ Doctor profile management
- ✅ Search and filtering functionality
- ✅ Error handling and responses
- ✅ Response time measurement

## 🚀 Quick Start

### **Method 1: Frontend UI Testing (Recommended)**

```bash
# 1. Start your services (API Gateway, Auth Service, Doctor Service)
cd backend && docker compose --profile core up -d

# 2. Start frontend
cd frontend && npm run dev

# 3. Open test page
# http://localhost:3000/test/doctor-api
```

### **Method 2: Node.js API Testing**

```bash
# Run direct API tests
cd frontend && npm run test:doctor-api
```

### **Method 3: Manual API Testing**

```bash
# Test Doctor Service directly
curl http://localhost:3002/health
curl http://localhost:3002/api/doctors

# Test via API Gateway
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3100/api/doctors
```

## 📁 Test Files Created

### **Frontend Test Components:**
```
frontend/
├── app/test/doctor-api/page.tsx              # Doctor test page UI
├── components/test/DoctorApiTest.tsx         # Main test component
├── components/test/SimpleDoctorApiTest.tsx   # Simple connectivity tests
├── lib/api/doctors.ts                        # Enhanced API client
└── scripts/test-doctor-api.js                # Node.js test script
```

### **Documentation:**
```
docs/
└── DOCTOR_API_TESTING.md                     # This testing guide
```

## 🔧 Prerequisites

### **Services Must Be Running:**
- ✅ **API Gateway** (Port 3100)
- ✅ **Auth Service** (Port 3001) 
- ✅ **Doctor Service** (Port 3002)
- ✅ **Database** (Supabase)

### **Authentication:**
- Valid user account in the system
- User must be logged in to test APIs
- JWT token will be automatically handled

### **Test Data:**
- Test doctor will be created automatically
- Uses department-based ID format: `DEPT-DOC-YYYYMM-XXX`
- Sample data includes Vietnamese doctor information

## 📊 Test Coverage

### **Functional Tests:**
- [x] **Authentication Flow** - Login and token management
- [x] **CRUD Operations** - Create, Read, Update, Delete doctors
- [x] **Profile Management** - Complete doctor profile with bio, experience
- [x] **Search Functionality** - Search doctors by name/specialty
- [x] **Pagination** - Handle paginated responses
- [x] **Validation** - Input validation and error handling
- [x] **Department IDs** - Verify ID generation format
- [x] **Statistics** - Doctor performance metrics

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

### **Frontend Test Page** (`/test/doctor-api`)

1. **Login Required**: Make sure you're logged in first
2. **Simple Tests**: Run "Simple Doctor Tests" to check connectivity
3. **Full Integration**: Run "Run All Tests" for complete testing
4. **Monitor Results**: Watch real-time test execution
5. **Check Details**: Expand response data for debugging
6. **Verify IDs**: Confirm department-based ID format

### **Expected Results:**
```
✅ GET /api/doctors - Retrieved X doctors (Total: Y) - 150ms
✅ POST /api/doctors - Created doctor with ID: CARD-DOC-202412-001 - 200ms
✅ GET /api/doctors/:id - Retrieved doctor: CARD-DOC-202412-001 - 120ms
✅ GET /api/doctors/:id/profile - Retrieved doctor profile - 140ms
✅ PUT /api/doctors/:id - Updated doctor: CARD-DOC-202412-001 - 180ms
✅ GET /api/doctors/search - Found X doctors matching "Test" - 140ms
✅ GET /api/doctors/:id/stats - Retrieved doctor statistics - 160ms
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
❌ Error: Doctor service unavailable
```
**Solution:** Check if Doctor Service is running on port 3002:
```bash
curl http://localhost:3002/health
```

#### **3. API Gateway Issues**
```
❌ Error: Route not found
```
**Solution:** Verify API Gateway is running and routing correctly:
```bash
curl http://localhost:3100/api/doctors
```

#### **4. Database Connection**
```
❌ Error: Failed to create doctor
```
**Solution:** Check Supabase connection and database schema.

### **Debug Steps:**

1. **Check Service Status:**
```bash
# Check all services
curl http://localhost:3100/health  # API Gateway
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # Doctor Service
```

2. **Check Logs:**
```bash
# Check service logs
cd backend && docker compose logs doctor-service
cd backend && docker compose logs api-gateway
cd backend && docker compose logs auth-service
```

3. **Test Individual Services:**
```bash
# Test Doctor Service directly
curl http://localhost:3002/api/doctors

# Test with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3100/api/doctors
```

## 📈 Performance Benchmarks

### **Expected Response Times:**
- **GET requests**: < 200ms
- **POST requests**: < 300ms
- **PUT requests**: < 250ms
- **Search requests**: < 200ms
- **Profile requests**: < 250ms

### **Success Criteria:**
- ✅ All tests pass (7/7)
- ✅ Response times under 500ms
- ✅ Department-based IDs generated correctly
- ✅ No authentication errors
- ✅ Proper error handling
- ✅ Complete profile data retrieval

## 🔄 Next Steps

After successful Doctor API testing:

1. **Test Appointment Service APIs**
2. **Test Doctor-Patient relationships**
3. **Test Doctor scheduling features**
4. **Test End-to-End Workflows**
5. **Performance Optimization**
6. **Error Handling Improvements**

## 📝 Test Results Template

```
🧪 Doctor API Integration Test Results
=====================================

Date: [DATE]
Environment: Development
Services: API Gateway + Auth Service + Doctor Service

Test Results:
✅ GET /api/doctors - [TIME]ms
✅ POST /api/doctors - [TIME]ms  
✅ GET /api/doctors/:id - [TIME]ms
✅ GET /api/doctors/:id/profile - [TIME]ms
✅ PUT /api/doctors/:id - [TIME]ms
✅ GET /api/doctors/search - [TIME]ms
✅ GET /api/doctors/:id/stats - [TIME]ms

Summary: 7/7 tests passed
Average Response Time: [AVG]ms
Department ID Format: DEPT-DOC-YYYYMM-XXX ✅

Issues Found: [NONE/LIST]
Next Actions: [ACTIONS]
```

## 🎯 Success Indicators

Your Doctor API integration is working correctly when:

- ✅ All 7 API tests pass
- ✅ Doctor IDs follow format: `CARD-DOC-202412-001`
- ✅ Authentication flows work seamlessly
- ✅ CRUD operations complete successfully
- ✅ Profile data is complete and accurate
- ✅ Search returns relevant results
- ✅ Statistics are calculated correctly
- ✅ Error handling works properly
- ✅ Response times are acceptable

**🎉 Congratulations!** Your Doctor Service is now fully integrated with the frontend!
