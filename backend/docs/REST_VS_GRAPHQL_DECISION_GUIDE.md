# REST vs GraphQL Decision Guide
## Hospital Management System Architecture

> **Mục tiêu**: Hướng dẫn quyết định sử dụng REST hoặc GraphQL cho từng tính năng trong hệ thống hospital management

---

## 📋 **TÓM TẮT QUYẾT ĐỊNH**

### 🟢 **SỬ DỤNG GRAPHQL KHI**
- ✅ Cần truy vấn dữ liệu phức tạp với nhiều relationships
- ✅ Yêu cầu real-time updates (subscriptions)
- ✅ Tối ưu cho mobile/bandwidth
- ✅ Dashboard với aggregate data
- ✅ Search cross-entity
- ✅ Flexible data fetching

### 🔴 **SỬ DỤNG REST KHI**
- ✅ Authentication & authorization flows
- ✅ File uploads/downloads
- ✅ Payment processing
- ✅ Third-party integrations
- ✅ Simple CRUD operations
- ✅ Caching requirements cao
- ✅ Standard HTTP semantics

---

## 🎯 **DECISION MATRIX**

| **Tiêu Chí** | **GraphQL** | **REST** | **Ghi Chú** |
|--------------|-------------|----------|-------------|
| **Data Complexity** | High | Low-Medium | GraphQL cho nested data |
| **Real-time** | Excellent | Limited | Subscriptions vs Polling |
| **Caching** | Complex | Simple | HTTP caching vs Custom |
| **File Handling** | Poor | Excellent | Binary data support |
| **Mobile Optimization** | Excellent | Good | Precise data fetching |
| **Learning Curve** | High | Low | Team expertise |
| **Third-party Integration** | Limited | Excellent | Standard protocols |
| **Error Handling** | Complex | Simple | HTTP status codes |

---

## 🏥 **HOSPITAL MANAGEMENT USE CASES**

### 📊 **DASHBOARD & ANALYTICS** → GraphQL ✅

**Lý do**: Complex data aggregation, multiple relationships

```graphql
# Doctor Dashboard - Perfect GraphQL Use Case
query GetDoctorDashboard($doctorId: ID!, $date: Date!) {
  doctor(id: $doctorId) {
    id
    fullName
    specialization
    department {
      name
      head { fullName }
    }
    
    # Today's schedule with patient details
    todayAppointments(date: $date) {
      id
      time
      status
      patient {
        fullName
        phone
        emergencyContact
      }
      room { number, building }
    }
    
    # Aggregated statistics
    statistics {
      todayAppointments
      completedToday
      pendingReviews
      totalPatients
      averageRating
      monthlyRevenue
    }
    
    # Recent patient reviews
    recentReviews(limit: 5) {
      rating
      comment
      patient { fullName }
      createdAt
    }
  }
}
```

**Benefits**:
- ✅ Single request cho toàn bộ dashboard
- ✅ Avoid N+1 queries
- ✅ Real-time updates via subscriptions
- ✅ Mobile-friendly (precise data)

**Use Cases**:
- 👨‍⚕️ Doctor Dashboard
- 👩‍💼 Admin Analytics
- 📈 Department Reports
- 📊 Patient Overview

### 🔍 **SEARCH & DISCOVERY** → GraphQL ✅

**Lý do**: Cross-entity search, flexible filtering

```graphql
# Global Search - Perfect GraphQL Use Case
query GlobalSearch($query: String!, $types: [SearchType!], $limit: Int) {
  globalSearch(query: $query, types: $types, limit: $limit) {
    doctors {
      id
      fullName
      specialization
      department { name }
      averageRating
      availableToday
    }
    patients {
      id
      fullName
      phone
      lastVisit
      emergencyContact
    }
    appointments {
      id
      date
      time
      status
      doctor { fullName }
      patient { fullName }
    }
    totalCount
    searchTime
  }
}
```

**Benefits**:
- ✅ Unified search across entities
- ✅ Flexible result structure
- ✅ Type-safe queries
- ✅ Efficient data fetching

### 🔐 **AUTHENTICATION** → REST ✅

**Lý do**: Standard flows, security best practices

```typescript
// Authentication API - Perfect REST Use Case
POST /api/auth/signin
{
  "email": "doctor@hospital.com",
  "password": "SecurePassword123!",
  "rememberMe": true
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "jwt_token_here",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": "uuid",
      "email": "doctor@hospital.com",
      "role": "doctor",
      "profile": {
        "fullName": "Dr. Nguyen Van A",
        "avatar": "avatar_url"
      }
    }
  },
  "expiresIn": 3600
}
```

**Benefits**:
- ✅ Standard HTTP status codes
- ✅ Simple error handling
- ✅ Easy caching
- ✅ Security best practices
- ✅ Third-party integration

**Use Cases**:
- 🔐 Login/Logout
- 📧 Password Reset
- 🔄 Token Refresh
- ✅ Email Verification
- 📱 2FA/OTP

### 📄 **FILE OPERATIONS** → REST ✅

**Lý do**: Binary data, progress tracking, standard protocols

```typescript
// File Upload API - Perfect REST Use Case
POST /api/patients/{patientId}/documents
Content-Type: multipart/form-data

FormData:
- file: medical_report.pdf
- category: "medical_report"
- description: "Blood test results"

Response:
{
  "success": true,
  "data": {
    "documentId": "uuid",
    "fileName": "medical_report.pdf",
    "fileSize": 2048576,
    "mimeType": "application/pdf",
    "uploadedAt": "2025-01-09T10:30:00Z",
    "downloadUrl": "/api/documents/uuid/download"
  }
}
```

**Benefits**:
- ✅ Native file upload support
- ✅ Progress tracking
- ✅ Stream processing
- ✅ CDN integration
- ✅ Security scanning

**Use Cases**:
- 📄 Medical Documents
- 🖼️ Patient Photos
- 📊 Lab Reports
- 💾 Backup Files

### 💳 **PAYMENT PROCESSING** → REST ✅

**Lý do**: Third-party integrations, webhooks, security

```typescript
// Payment API - Perfect REST Use Case
POST /api/billing/payments
{
  "billId": "BILL-202501-001",
  "amount": 500000,
  "currency": "VND",
  "paymentMethod": "stripe",
  "customerInfo": {
    "name": "Nguyen Van A",
    "email": "patient@email.com",
    "phone": "0123456789"
  }
}

Response:
{
  "success": true,
  "data": {
    "paymentId": "PAY-202501-001",
    "status": "pending",
    "paymentUrl": "https://checkout.stripe.com/...",
    "expiresAt": "2025-01-09T11:00:00Z"
  }
}
```

**Benefits**:
- ✅ Standard payment protocols
- ✅ Webhook support
- ✅ Security compliance
- ✅ Third-party integration
- ✅ Error handling

---

## 🔄 **HYBRID APPROACH EXAMPLES**

### 📅 **Appointment Booking Flow**

```typescript
// Combine REST + GraphQL for optimal UX
const AppointmentBookingFlow = () => {
  // Step 1: GraphQL - Get available slots (complex query)
  const { data: availableSlots } = useQuery(GET_AVAILABLE_SLOTS, {
    variables: { 
      doctorId, 
      date,
      specialization,
      duration: 30
    }
  });
  
  // Step 2: REST - Book appointment (simple transaction)
  const bookAppointment = async (appointmentData: AppointmentForm) => {
    const response = await apiClient.post('/api/appointments', {
      doctorId: appointmentData.doctorId,
      patientId: appointmentData.patientId,
      date: appointmentData.date,
      time: appointmentData.time,
      reason: appointmentData.reason,
      notes: appointmentData.notes
    });
    
    if (response.success) {
      // Step 3: GraphQL - Real-time status tracking
      subscribeToAppointmentUpdates(response.data.id);
    }
    
    return response;
  };

  // Step 4: GraphQL Subscription - Real-time updates
  useSubscription(APPOINTMENT_STATUS_UPDATED, {
    variables: { appointmentId },
    onData: ({ data }) => {
      toast.info(`Appointment status: ${data.appointmentStatusUpdated.status}`);
    }
  });

  return (
    <BookingWizard
      availableSlots={availableSlots}
      onBook={bookAppointment}
    />
  );
};
```

### 👤 **Patient Profile Management**

```typescript
// Hybrid approach for different data needs
const PatientProfilePage = ({ patientId }: { patientId: string }) => {
  // GraphQL: Complex profile data with relationships
  const { data: patientProfile } = useQuery(GET_PATIENT_PROFILE, {
    variables: { patientId }
  });
  
  // REST: Simple profile updates
  const updateBasicInfo = async (data: Partial<Patient>) => {
    return apiClient.put(`/api/patients/${patientId}`, data);
  };
  
  // REST: File uploads
  const uploadDocument = async (file: File, category: string) => {
    return apiClient.uploadFile(`/api/patients/${patientId}/documents`, file);
  };
  
  // GraphQL: Medical history with relationships
  const { data: medicalHistory } = useQuery(GET_MEDICAL_HISTORY, {
    variables: { 
      patientId,
      dateFrom: startDate,
      dateTo: endDate
    }
  });

  return (
    <div className="patient-profile">
      <ProfileHeader patient={patientProfile?.patient} />
      <BasicInfoForm 
        patient={patientProfile?.patient}
        onUpdate={updateBasicInfo}
      />
      <DocumentUpload onUpload={uploadDocument} />
      <MedicalHistory history={medicalHistory?.medicalRecords} />
    </div>
  );
};
```

---

## 📈 **PERFORMANCE CONSIDERATIONS**

### **GraphQL Performance**
- ✅ **DataLoader**: Batch và cache database queries
- ✅ **Query Complexity**: Limit query depth và complexity
- ✅ **Caching**: Redis cho field-level caching
- ✅ **Pagination**: Relay-style pagination
- ⚠️ **N+1 Problem**: Cần careful resolver design

### **REST Performance**
- ✅ **HTTP Caching**: Browser và CDN caching
- ✅ **Compression**: Gzip/Brotli compression
- ✅ **Rate Limiting**: Request throttling
- ✅ **Pagination**: Offset/limit pagination
- ✅ **ETags**: Conditional requests

---

## 🛡️ **SECURITY CONSIDERATIONS**

### **GraphQL Security**
- 🔒 **Query Depth Limiting**: Prevent deep nested queries
- 🔒 **Query Complexity Analysis**: Limit expensive operations
- 🔒 **Rate Limiting**: Per-field rate limiting
- 🔒 **Authorization**: Field-level permissions
- 🔒 **Input Validation**: Schema-based validation

### **REST Security**
- 🔒 **Authentication**: JWT tokens
- 🔒 **Authorization**: Role-based access control
- 🔒 **Input Validation**: Request body validation
- 🔒 **Rate Limiting**: Endpoint-based limiting
- 🔒 **CORS**: Cross-origin resource sharing

---

## 📱 **MOBILE OPTIMIZATION**

### **GraphQL Advantages**
- 📱 **Precise Data Fetching**: Request only needed fields
- 📱 **Single Request**: Reduce network round trips
- 📱 **Offline Support**: Apollo Client offline capabilities
- 📱 **Real-time**: WebSocket subscriptions

### **REST Advantages**
- 📱 **HTTP Caching**: Native browser caching
- 📱 **Offline Storage**: Service worker caching
- 📱 **Progressive Loading**: Incremental data loading
- 📱 **CDN Support**: Global content delivery

---

## 🔧 **DEVELOPMENT EXPERIENCE**

### **GraphQL DX**
- 🛠️ **Type Safety**: Generated TypeScript types
- 🛠️ **Introspection**: Self-documenting API
- 🛠️ **Playground**: Interactive query testing
- 🛠️ **Code Generation**: Automatic client code
- ⚠️ **Learning Curve**: Complex concepts

### **REST DX**
- 🛠️ **Simplicity**: Easy to understand
- 🛠️ **Tooling**: Mature ecosystem
- 🛠️ **Testing**: Standard HTTP testing
- 🛠️ **Documentation**: OpenAPI/Swagger
- ✅ **Familiarity**: Well-known patterns

---

## 📊 **MONITORING & DEBUGGING**

### **GraphQL Monitoring**
- 📊 **Query Analytics**: Track query performance
- 📊 **Error Tracking**: Field-level error monitoring
- 📊 **Schema Usage**: Track field usage
- 📊 **Real-time Metrics**: Subscription monitoring

### **REST Monitoring**
- 📊 **HTTP Metrics**: Status codes, response times
- 📊 **Endpoint Analytics**: Usage patterns
- 📊 **Error Tracking**: HTTP error monitoring
- 📊 **Performance**: Request/response monitoring

---

## 🎯 **DECISION FLOWCHART**

```
START
  ↓
Is it authentication/authorization?
  ↓ YES → REST
  ↓ NO
Does it involve file operations?
  ↓ YES → REST
  ↓ NO
Is it payment processing?
  ↓ YES → REST
  ↓ NO
Does it need real-time updates?
  ↓ YES → GraphQL
  ↓ NO
Is it a complex query with relationships?
  ↓ YES → GraphQL
  ↓ NO
Is it a simple CRUD operation?
  ↓ YES → REST
  ↓ NO
Is mobile optimization critical?
  ↓ YES → GraphQL
  ↓ NO
Consider hybrid approach
```

---

## 📚 **NEXT STEPS**

1. **[Implementation Roadmap](./IMPLEMENTATION_ROADMAP.md)** - Chi tiết lộ trình triển khai
2. **[Best Practices Guide](./BEST_PRACTICES_GUIDE.md)** - Hướng dẫn best practices
3. **[Performance Optimization](./PERFORMANCE_OPTIMIZATION_GUIDE.md)** - Tối ưu performance

---

*Tài liệu này được cập nhật thường xuyên dựa trên kinh nghiệm thực tế và feedback từ team development.*
