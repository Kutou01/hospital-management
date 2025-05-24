# 🔐 Auth Service Complete Guide (DEPRECATED)

## ⚠️ **DEPRECATION NOTICE**

**This auth service has been deprecated and replaced with Supabase Auth.**

**Current Auth System:**
- Frontend uses Supabase Auth directly
- No custom auth microservice needed
- Simplified architecture with better security

**Migration Status:** ✅ Complete

## 📋 **Overview** (Historical)

The Auth Service was integrated with the API Gateway and provided comprehensive authentication and authorization functionality for the Hospital Management System.

## 🏗️ **Architecture**

```
Frontend (Port 3000) → API Gateway (Port 3100) → Auth Service (Port 3001)
                                ↓
                        Supabase Database
```

## ✅ **Features Implemented**

### 🔑 **Authentication**
- ✅ User Registration (Doctor/Patient)
- ✅ User Login with JWT tokens
- ✅ Token Refresh mechanism
- ✅ Secure logout
- ✅ Password change
- ✅ Password reset (email-based)

### 👤 **User Management**
- ✅ User profiles with role-based data
- ✅ Get current user information
- ✅ Update user profiles
- ✅ Role-based access control (RBAC)

### 🛡️ **Security Features**
- ✅ JWT token generation and validation
- ✅ Password hashing with bcrypt
- ✅ Session management
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Input validation
- ✅ Error handling

### 📊 **Monitoring & Documentation**
- ✅ Health check endpoints
- ✅ Swagger API documentation
- ✅ Comprehensive logging
- ✅ Service registry integration

## 🚀 **Quick Start**

### **Option 1: Use the automated script**
```bash
# Start both API Gateway and Auth Service
node start-auth-system.js
```

### **Option 2: Manual start**
```bash
# Terminal 1: Start API Gateway
cd hospital-management/backend/api-gateway
npm run build
npm run dev  # Runs on port 3100

# Terminal 2: Start Auth Service
cd hospital-management/backend/services/auth-service
npm run build
npm run dev  # Runs on port 3001

# Terminal 3: Start Frontend
cd hospital-management/frontend
npm run dev  # Runs on port 3000
```

## 🧪 **Testing**

### **Automated Testing**
```bash
# Test complete auth flow via API Gateway
node test-auth-via-gateway.js
```

### **Manual Testing**
1. **Health Check**: http://localhost:3100/health
2. **API Documentation**: http://localhost:3100/docs
3. **Frontend**: http://localhost:3000

## 📡 **API Endpoints**

All endpoints are accessed through the API Gateway at `http://localhost:3100/api`

### **Public Endpoints (No Authentication Required)**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | User login |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/reset-password` | Request password reset |
| POST | `/auth/reset-password/confirm` | Confirm password reset |

### **Protected Endpoints (Authentication Required)**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/me` | Get current user profile |
| POST | `/auth/logout` | User logout |
| POST | `/auth/change-password` | Change password |
| GET | `/users/me` | Get detailed user info |
| PUT | `/users/:id` | Update user profile |
| GET | `/users` | Get all users (admin only) |

## 📝 **Request/Response Examples**

### **Registration**
```bash
curl -X POST http://localhost:3100/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@hospital.com",
    "password": "SecurePassword123!",
    "full_name": "Dr. John Smith",
    "role": "doctor",
    "phone_number": "+1234567890",
    "profile_data": {
      "specialization": "Cardiology",
      "license_number": "DOC123456"
    }
  }'
```

### **Login**
```bash
curl -X POST http://localhost:3100/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@hospital.com",
    "password": "SecurePassword123!"
  }'
```

### **Get Profile (with token)**
```bash
curl -X GET http://localhost:3100/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🔧 **Configuration**

### **Environment Variables**
```env
# Auth Service (.env)
NODE_ENV=development
PORT=3001

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT
JWT_SECRET=hospital-super-secret-jwt-key-2024
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3100
```

### **Frontend Configuration** (Historical)
```env
# Frontend (.env.local) - DEPRECATED
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3100
NEXT_PUBLIC_USE_MICROSERVICES_AUTH=false  # Now disabled - using Supabase Auth
```

## 🔐 **Security Implementation**

### **JWT Token Structure**
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "doctor|patient|admin",
  "full_name": "User Name",
  "profile_id": "profile_id",
  "permissions": ["read:profile", "write:profile"],
  "iat": 1234567890,
  "exp": 1234567890
}
```

### **Role-Based Permissions**
- **Doctor**: Can manage patients, appointments, medical records
- **Patient**: Can view own data, book appointments
- **Admin**: Full system access

### **Password Security**
- Minimum 8 characters
- Hashed with bcrypt (12 rounds)
- Secure password reset with time-limited tokens

## 🔄 **Integration with Frontend**

### **API Client Usage**
```typescript
import { authApi, authUtils } from '@/lib/api';

// Login
const loginResult = await authApi.login({
  email: 'user@example.com',
  password: 'password'
});

// Check authentication
const isAuthenticated = authUtils.isAuthenticated();

// Get current user
const user = authUtils.getStoredUser();

// Logout
await authApi.logout();
```

### **Authentication Flow**
1. User submits login form
2. Frontend calls API Gateway `/api/auth/login`
3. API Gateway proxies to Auth Service
4. Auth Service validates credentials
5. Returns JWT tokens to frontend
6. Frontend stores tokens and user data
7. Subsequent requests include JWT token

## 📊 **Monitoring & Health**

### **Health Check Response**
```json
{
  "service": "api-gateway",
  "status": "healthy",
  "timestamp": "2024-01-20T10:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "services": [
    {
      "name": "auth-service",
      "status": "healthy",
      "lastCheck": "2024-01-20T10:00:00.000Z"
    }
  ]
}
```

### **Service Discovery**
- Auth Service automatically registers with API Gateway
- Health checks every 30 seconds
- Automatic failover handling

## 🐛 **Troubleshooting**

### **Common Issues**

1. **CORS Errors**
   - Check `ALLOWED_ORIGINS` in auth service
   - Ensure frontend is on port 3000

2. **Token Validation Errors**
   - Verify `JWT_SECRET` matches between services
   - Check token expiration

3. **Database Connection Issues**
   - Verify Supabase credentials
   - Check network connectivity

4. **Service Unavailable**
   - Ensure Auth Service is running on port 3001
   - Check API Gateway proxy configuration

### **Debug Commands**
```bash
# Check service health
curl http://localhost:3100/health

# Test auth service directly
curl http://localhost:3001/health

# Check API Gateway logs
cd hospital-management/backend/api-gateway
npm run dev

# Check Auth Service logs
cd hospital-management/backend/services/auth-service
npm run dev
```

## 🎯 **Next Steps**

1. **Email Verification**: Implement email verification for new registrations
2. **Two-Factor Authentication**: Add 2FA support
3. **OAuth Integration**: Add Google/Facebook login
4. **Audit Logging**: Enhanced security logging
5. **Rate Limiting**: Per-user rate limiting
6. **Session Management**: Advanced session controls

## 📚 **Additional Resources**

- **API Documentation**: http://localhost:3100/docs
- **Auth Service Docs**: http://localhost:3001/docs
- **Frontend Integration**: See `FRONTEND_INTEGRATION_GUIDE.md`
- **Deployment Guide**: See `DEPLOYMENT_STATUS.md`

---

✅ **Auth Service is now fully operational and integrated with the API Gateway!**
