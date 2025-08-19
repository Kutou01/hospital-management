# API Documentation - Hospital Management Authentication

Complete API documentation for the authentication and registration system.

## 🔗 Base URL
```
Development: http://localhost:3000/api
Production: https://yourdomain.com/api
```

## 🔐 Authentication

All protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## 📋 API Endpoints

### 🔓 Public Endpoints

#### POST /api/auth/captcha/verify
Verify CAPTCHA token before form submission.

**Request Body:**
```json
{
  "token": "captcha_response_token",
  "provider": "MOCK" // Optional: MOCK | HCAPTCHA | TURNSTILE
}
```

**Response:**
```json
{
  "success": true,
  "message": "CAPTCHA verified successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "CAPTCHA verification failed"
}
```

**Rate Limit:** 10 requests per minute per IP

---

#### POST /api/auth/accept-invite
Accept staff invitation and create account.

**Request Body:**
```json
{
  "token": "invitation_token",
  "password": "SecurePassword123!",
  "mfa_opt_in": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invitation accepted successfully",
  "user": {
    "id": "uuid",
    "email": "staff@hospital.com",
    "role": "doctor"
  },
  "isNewUser": true,
  "mfa": {
    "secret": "TOTP_SECRET",
    "qrCode": "otpauth://...",
    "backupCodes": ["CODE1", "CODE2", ...]
  }
}
```

**Rate Limit:** 5 requests per 5 minutes per IP

---

### 🔒 Protected Endpoints

#### GET /api/user/profile
Get current user profile with related data.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "patient",
    "date_of_birth": "1990-01-01",
    "gender": "male",
    "phone": "+84901234567",
    "preferred_language": "vi",
    "contact_channel": "email",
    "is_active": true,
    "email_verified": true,
    "patient_profiles": {
      "patient_id": "PAT-202401-001",
      "blood_type": "O+",
      "allergies": ["Penicillin"],
      "onboarding_completed": true
    },
    "addresses": [...],
    "emergency_contacts": [...],
    "insurances": [...],
    "consents": [...]
  }
}
```

---

#### PUT /api/user/profile
Update user profile information.

**Request Body:**
```json
{
  "full_name": "John Smith",
  "date_of_birth": "1990-01-01",
  "gender": "male",
  "phone": "+84901234567",
  "preferred_language": "en",
  "contact_channel": "both"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "full_name": "John Smith",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Profile updated successfully"
}
```

---

#### POST /api/user/onboarding
Complete patient onboarding process.

**Request Body:**
```json
{
  "phone": "+84901234567",
  "preferred_language": "vi",
  "contact_channel": "email",
  "address": {
    "line1": "123 Main Street",
    "line2": "Apartment 4B",
    "ward": "Ward 1",
    "district": "District 1",
    "city": "Ho Chi Minh City",
    "postal_code": "70000"
  },
  "emergency_contact": {
    "name": "Jane Doe",
    "relation": "Spouse",
    "phone": "+84901234568",
    "email": "jane@example.com"
  },
  "insurance": {
    "provider": "BHXH Vietnam",
    "insurance_number": "VN1234567890",
    "valid_from": "2024-01-01",
    "valid_to": "2024-12-31"
  },
  "medical_info": {
    "blood_type": "O+",
    "allergies": ["Penicillin", "Shellfish"],
    "chronic_conditions": ["Hypertension"],
    "medications": ["Lisinopril"],
    "medical_notes": "No significant medical history"
  },
  "consents": {
    "tos": true,
    "privacy": true,
    "marketing": false,
    "data_processing": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Onboarding completed successfully",
  "data": {
    "patient_id": "PAT-202401-001",
    "onboarding_completed": true
  }
}
```

---

#### GET /api/user/onboarding
Check onboarding completion status.

**Response:**
```json
{
  "success": true,
  "data": {
    "onboarding_completed": true,
    "patient_id": "PAT-202401-001"
  }
}
```

---

### 👑 Admin Endpoints

#### GET /api/admin/invitations
List staff invitations with filtering.

**Query Parameters:**
- `status`: `active` | `consumed` | `expired`
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "doctor@hospital.com",
      "role": "doctor",
      "department_id": 1,
      "expires_at": "2024-01-08T00:00:00Z",
      "consumed_at": null,
      "consumed_by": null,
      "status": "active",
      "invited_by_profile": {
        "full_name": "Admin User",
        "email": "admin@hospital.com"
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

#### POST /api/admin/invitations
Create new staff invitation.

**Request Body:**
```json
{
  "email": "newdoctor@hospital.com",
  "role": "doctor",
  "departmentId": 1,
  "expiresInDays": 7
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "newdoctor@hospital.com",
    "role": "doctor",
    "departmentId": 1,
    "expiresAt": "2024-01-08T00:00:00Z",
    "inviteUrl": "https://yourdomain.com/accept-invite?token=...",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Rate Limit:** 10 invitations per hour per user

---

#### DELETE /api/admin/invitations?id=uuid
Revoke (expire) an invitation.

**Query Parameters:**
- `id`: Invitation UUID

**Response:**
```json
{
  "success": true,
  "message": "Invitation revoked successfully"
}
```

---

## 🚨 Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "type": "ERROR_TYPE",
  "details": {} // Only in development
}
```

### Error Types
- `VALIDATION_ERROR` (400): Invalid input data
- `AUTHENTICATION_ERROR` (401): Invalid or missing authentication
- `AUTHORIZATION_ERROR` (403): Insufficient permissions
- `NOT_FOUND_ERROR` (404): Resource not found
- `RATE_LIMIT_ERROR` (429): Too many requests
- `DATABASE_ERROR` (500): Database operation failed
- `EXTERNAL_SERVICE_ERROR` (502): External service unavailable
- `INTERNAL_ERROR` (500): Unexpected server error

## 🔄 Rate Limiting

Rate limits are applied per IP address and/or user:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/captcha/verify` | 10 requests | 1 minute |
| `/api/auth/accept-invite` | 5 requests | 5 minutes |
| `/api/admin/invitations` (POST) | 10 requests | 1 hour |
| General API | 100 requests | 1 minute |

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 2024-01-01T00:01:00Z
Retry-After: 60
```

## 🔒 Security Headers

All API responses include security headers:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## 📝 Request/Response Examples

### Complete Patient Registration Flow

1. **Verify CAPTCHA**
```bash
curl -X POST /api/auth/captcha/verify \
  -H "Content-Type: application/json" \
  -d '{"token": "captcha_token"}'
```

2. **Register via Supabase Auth** (handled by frontend)

3. **Complete Onboarding**
```bash
curl -X POST /api/user/onboarding \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+84901234567",
    "address": {...},
    "emergency_contact": {...},
    "consents": {...}
  }'
```

### Staff Invitation Flow

1. **Create Invitation** (Admin)
```bash
curl -X POST /api/admin/invitations \
  -H "Authorization: Bearer <admin_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@hospital.com",
    "role": "doctor"
  }'
```

2. **Accept Invitation** (Staff)
```bash
curl -X POST /api/auth/accept-invite \
  -H "Content-Type: application/json" \
  -d '{
    "token": "invitation_token",
    "password": "SecurePassword123!",
    "mfa_opt_in": true
  }'
```

## 🧪 Testing

### Test with curl
```bash
# Set base URL
BASE_URL="http://localhost:3000/api"

# Test CAPTCHA verification
curl -X POST $BASE_URL/auth/captcha/verify \
  -H "Content-Type: application/json" \
  -d '{"token": "test-token"}'

# Test with authentication
JWT_TOKEN="your_jwt_token_here"
curl -X GET $BASE_URL/user/profile \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Postman Collection
Import the provided Postman collection for comprehensive API testing:
- [Download Postman Collection](./postman/hospital-auth-api.json)

## 📊 Monitoring

### Health Check
```bash
curl /api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0",
  "database": "connected"
}
```

### Metrics Endpoints
- `/api/metrics` - Application metrics
- `/api/admin/stats` - User statistics (admin only)
