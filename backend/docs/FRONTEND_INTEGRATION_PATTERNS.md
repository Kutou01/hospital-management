# 🎯 Frontend Integration Patterns - Hospital Management System

## 📋 Decision Matrix: REST vs GraphQL

### Khi nào sử dụng REST API?

| Use Case | Lý do | Ví dụ |
|----------|-------|-------|
| **Simple CRUD** | Đơn giản, cache tốt | Create/Update/Delete doctor |
| **File Upload** | Multipart form data | Upload medical documents |
| **Authentication** | Standard flows | Login/logout/refresh token |
| **Health Checks** | Lightweight | Service monitoring |
| **Webhooks** | External integrations | Payment notifications |
| **Bulk Operations** | Batch processing | Import patient data |

### Khi nào sử dụng GraphQL?

| Use Case | Lý do | Ví dụ |
|----------|-------|-------|
| **Complex Queries** | Multiple relationships | Doctor dashboard with appointments |
| **Real-time Updates** | Subscriptions | Live appointment status |
| **Mobile Optimization** | Precise data fetching | Reduce bandwidth |
| **Dashboard Views** | Aggregate data | Statistics and reports |
| **Search Functionality** | Cross-entity search | Global search |
| **Nested Data** | Avoid N+1 queries | Patient with medical history |

## 🔧 Implementation Examples

### 1. Doctor Dashboard (GraphQL)

```typescript
// ✅ RECOMMENDED: GraphQL cho complex dashboard
const GET_DOCTOR_DASHBOARD = gql`
  query GetDoctorDashboard($doctorId: ID!, $date: Date!) {
    doctor(id: $doctorId) {
      id
      name
      specialty
      
      # Today's schedule
      todayAppointments: appointments(
        date: $date
        status: [SCHEDULED, IN_PROGRESS, COMPLETED]
      ) {
        id
        scheduledAt
        status
        duration
        
        patient {
          id
          name
          age
          phone
          
          # Recent medical history
          recentVisits: medicalRecords(limit: 3) {
            id
            visitDate
            diagnosis
            treatment
          }
          
          # Active prescriptions
          activePrescriptions: prescriptions(status: ACTIVE) {
            id
            medication
            dosage
            frequency
          }
        }
        
        room {
          number
          type
          equipment
        }
      }
      
      # Department info
      department {
        name
        head {
          name
        }
        
        # Available rooms
        availableRooms: rooms(status: AVAILABLE) {
          number
          type
        }
      }
      
      # Statistics
      statistics {
        todayAppointments
        completedToday
        pendingReviews
        totalPatients
        averageRating
      }
    }
  }
`;

// Component usage
const DoctorDashboard = () => {
  const { data, loading, error } = useQuery(GET_DOCTOR_DASHBOARD, {
    variables: { 
      doctorId: user.id, 
      date: new Date().toISOString().split('T')[0] 
    },
    pollInterval: 30000, // Refresh every 30 seconds
  });

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="dashboard">
      <DoctorInfo doctor={data.doctor} />
      <TodaySchedule appointments={data.doctor.todayAppointments} />
      <DepartmentInfo department={data.doctor.department} />
      <StatisticsCards stats={data.doctor.statistics} />
    </div>
  );
};
```

### 2. Patient Registration (REST)

```typescript
// ✅ RECOMMENDED: REST cho simple CRUD operations
const PatientRegistrationForm = () => {
  const [formData, setFormData] = useState<PatientForm>({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: {
      street: '',
      district: '',
      city: ''
    },
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    bloodType: '',
    allergies: [],
    chronicConditions: []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Simple REST API call
      const response = await apiClient.post('/api/patients', formData);
      
      if (response.success) {
        toast.success('Đăng ký bệnh nhân thành công!');
        router.push(`/patients/${response.data.id}`);
      } else {
        toast.error(response.error?.message || 'Đăng ký thất bại');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Có lỗi xảy ra khi đăng ký');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="patient-form">
      <PersonalInfoSection 
        data={formData} 
        onChange={setFormData} 
      />
      <AddressSection 
        data={formData.address} 
        onChange={(address) => setFormData({...formData, address})} 
      />
      <MedicalInfoSection 
        data={formData} 
        onChange={setFormData} 
      />
      <EmergencyContactSection 
        data={formData.emergencyContact} 
        onChange={(contact) => setFormData({...formData, emergencyContact: contact})} 
      />
      
      <button type="submit" className="submit-btn">
        Đăng ký bệnh nhân
      </button>
    </form>
  );
};
```

### 3. Real-time Appointment Updates (GraphQL Subscription)

```typescript
// ✅ RECOMMENDED: GraphQL Subscriptions cho real-time
const APPOINTMENT_UPDATES = gql`
  subscription OnAppointmentUpdate($doctorId: ID!) {
    appointmentUpdated(doctorId: $doctorId) {
      id
      status
      scheduledAt
      updatedAt
      
      patient {
        id
        name
        phone
      }
      
      room {
        number
        type
      }
      
      # Notification details
      notification {
        type
        message
        priority
      }
    }
  }
`;

const AppointmentNotifications = ({ doctorId }: { doctorId: string }) => {
  const { data, loading } = useSubscription(APPOINTMENT_UPDATES, {
    variables: { doctorId },
    onSubscriptionData: ({ subscriptionData }) => {
      const appointment = subscriptionData.data?.appointmentUpdated;
      
      if (appointment) {
        // Show toast notification
        const message = `Lịch hẹn ${appointment.id} đã được cập nhật: ${appointment.status}`;
        toast.info(message);
        
        // Update local state or refetch queries
        // Apollo Client will automatically update cache
      }
    }
  });

  return (
    <div className="notification-center">
      {/* Real-time notifications will appear here */}
    </div>
  );
};
```

### 4. Medical Document Upload (REST)

```typescript
// ✅ RECOMMENDED: REST cho file uploads
const MedicalDocumentUpload = ({ patientId }: { patientId: string }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = async (files: FileList) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        
        formData.append('file', file);
        formData.append('patientId', patientId);
        formData.append('documentType', getDocumentType(file.name));
        formData.append('description', `Medical document - ${file.name}`);

        // Upload with progress tracking
        const response = await apiClient.post(
          '/api/medical-records/documents',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(progress);
            }
          }
        );

        if (response.success) {
          toast.success(`Tải lên ${file.name} thành công!`);
        } else {
          toast.error(`Lỗi tải lên ${file.name}: ${response.error?.message}`);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Có lỗi xảy ra khi tải lên tài liệu');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="document-upload">
      <FileDropzone
        onFilesSelected={handleFileUpload}
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        maxSize={10 * 1024 * 1024} // 10MB
        disabled={uploading}
      />
      
      {uploading && (
        <ProgressBar 
          progress={uploadProgress} 
          message="Đang tải lên tài liệu..." 
        />
      )}
    </div>
  );
};
```

### 5. Global Search (GraphQL)

```typescript
// ✅ RECOMMENDED: GraphQL cho complex search
const GLOBAL_SEARCH = gql`
  query GlobalSearch($query: String!, $types: [SearchType!], $limit: Int) {
    globalSearch(query: $query, types: $types, limit: $limit) {
      totalResults
      
      doctors {
        id
        name
        specialty
        department {
          name
        }
        rating
        availableSlots
      }
      
      patients {
        id
        name
        phone
        email
        lastVisit
        status
      }
      
      appointments {
        id
        scheduledAt
        status
        doctor {
          name
          specialty
        }
        patient {
          name
          phone
        }
        room {
          number
        }
      }
      
      departments {
        id
        name
        description
        doctorCount
        availableRooms
      }
    }
  }
`;

const GlobalSearchComponent = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTypes, setSearchTypes] = useState<SearchType[]>(['DOCTORS', 'PATIENTS']);
  
  const { data, loading, error } = useQuery(GLOBAL_SEARCH, {
    variables: { 
      query: searchQuery, 
      types: searchTypes,
      limit: 20 
    },
    skip: searchQuery.length < 2, // Only search if query is at least 2 characters
    debounceMs: 300 // Debounce search requests
  });

  return (
    <div className="global-search">
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Tìm kiếm bác sĩ, bệnh nhân, lịch hẹn..."
      />
      
      <SearchFilters
        selectedTypes={searchTypes}
        onTypesChange={setSearchTypes}
      />
      
      {loading && <SearchSkeleton />}
      
      {data && (
        <SearchResults>
          {data.globalSearch.doctors.length > 0 && (
            <DoctorResults doctors={data.globalSearch.doctors} />
          )}
          
          {data.globalSearch.patients.length > 0 && (
            <PatientResults patients={data.globalSearch.patients} />
          )}
          
          {data.globalSearch.appointments.length > 0 && (
            <AppointmentResults appointments={data.globalSearch.appointments} />
          )}
          
          {data.globalSearch.departments.length > 0 && (
            <DepartmentResults departments={data.globalSearch.departments} />
          )}
        </SearchResults>
      )}
    </div>
  );
};
```

## 🔄 Hybrid Approach Examples

### 1. Appointment Booking Flow

```typescript
// Combine REST and GraphQL for optimal UX
const AppointmentBookingFlow = () => {
  // Step 1: GraphQL để lấy available slots
  const { data: availableSlots } = useQuery(GET_AVAILABLE_SLOTS, {
    variables: { doctorId, date }
  });
  
  // Step 2: REST để book appointment
  const bookAppointment = async (appointmentData: AppointmentForm) => {
    const response = await apiClient.post('/api/appointments', appointmentData);
    
    if (response.success) {
      // Step 3: GraphQL subscription để track status
      subscribeToAppointmentUpdates(response.data.id);
    }
    
    return response;
  };

  return (
    <BookingWizard
      availableSlots={availableSlots}
      onBook={bookAppointment}
    />
  );
};
```

### 2. Patient Profile Page

```typescript
// Combine both approaches based on data needs
const PatientProfilePage = ({ patientId }: { patientId: string }) => {
  // GraphQL cho complex data với relationships
  const { data: patientData } = useQuery(GET_PATIENT_PROFILE, {
    variables: { patientId }
  });
  
  // REST cho simple updates
  const updateBasicInfo = async (data: Partial<Patient>) => {
    return apiClient.put(`/api/patients/${patientId}`, data);
  };
  
  // REST cho file uploads
  const uploadDocument = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/api/patients/${patientId}/documents`, formData);
  };

  return (
    <div className="patient-profile">
      <PatientBasicInfo 
        patient={patientData?.patient}
        onUpdate={updateBasicInfo}
      />
      <MedicalHistory 
        records={patientData?.patient.medicalRecords}
      />
      <DocumentUpload 
        onUpload={uploadDocument}
      />
    </div>
  );
};
```

## 📊 Performance Optimization

### 1. Apollo Client Configuration

```typescript
// Optimized Apollo Client setup
const apolloClient = new ApolloClient({
  link: from([
    errorLink,
    authLink,
    splitLink
  ]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Pagination merge
          doctors: relayStylePagination(),
          patients: relayStylePagination(),
          appointments: relayStylePagination(),
          
          // Custom merge for search results
          globalSearch: {
            keyArgs: ["query", "types"],
            merge(existing, incoming) {
              return incoming; // Always replace for search
            }
          }
        }
      },
      
      // Entity caching
      Doctor: {
        fields: {
          appointments: relayStylePagination(["status", "date"])
        }
      },
      
      Patient: {
        fields: {
          medicalRecords: relayStylePagination(["dateFrom", "dateTo"])
        }
      }
    }
  }),
  
  // Default options
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network'
    },
    query: {
      errorPolicy: 'all',
      fetchPolicy: 'cache-first'
    }
  }
});
```

### 2. Request Optimization

```typescript
// Batch multiple REST requests
const batchApiCalls = async (requests: ApiRequest[]) => {
  const results = await Promise.allSettled(
    requests.map(req => apiClient.request(req))
  );
  
  return results.map((result, index) => ({
    request: requests[index],
    success: result.status === 'fulfilled',
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason : null
  }));
};

// Use GraphQL fragments để reuse common fields
const PATIENT_BASIC_FRAGMENT = gql`
  fragment PatientBasic on Patient {
    id
    name
    phone
    email
    dateOfBirth
    gender
    bloodType
  }
`;

const PATIENT_MEDICAL_FRAGMENT = gql`
  fragment PatientMedical on Patient {
    allergies
    chronicConditions
    emergencyContact {
      name
      phone
      relationship
    }
  }
`;
```

## 🛡️ Error Handling Patterns

### 1. GraphQL Error Handling

```typescript
// Comprehensive GraphQL error handling
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      const errorCode = extensions?.code;
      
      switch (errorCode) {
        case 'UNAUTHENTICATED':
          // Redirect to login
          authService.logout();
          router.push('/auth/signin');
          break;
          
        case 'FORBIDDEN':
          toast.error('Bạn không có quyền truy cập tài nguyên này');
          break;
          
        case 'VALIDATION_ERROR':
          // Handle validation errors
          const validationErrors = extensions?.validationErrors;
          showValidationErrors(validationErrors);
          break;
          
        default:
          toast.error(message || 'Có lỗi xảy ra');
      }
    });
  }
  
  if (networkError) {
    if (networkError.statusCode === 503) {
      toast.error('Dịch vụ tạm thời không khả dụng');
    } else {
      toast.error('Lỗi kết nối mạng');
    }
  }
});
```

### 2. REST API Error Handling

```typescript
// Centralized REST error handling
const handleApiError = (error: ApiError) => {
  switch (error.status) {
    case 400:
      toast.error(error.message || 'Dữ liệu không hợp lệ');
      break;
    case 401:
      authService.logout();
      router.push('/auth/signin');
      break;
    case 403:
      toast.error('Bạn không có quyền thực hiện hành động này');
      break;
    case 404:
      toast.error('Không tìm thấy tài nguyên');
      break;
    case 409:
      toast.error('Dữ liệu đã tồn tại hoặc xung đột');
      break;
    case 422:
      // Handle validation errors
      if (error.validationErrors) {
        showValidationErrors(error.validationErrors);
      } else {
        toast.error('Dữ liệu không hợp lệ');
      }
      break;
    case 500:
      toast.error('Lỗi máy chủ nội bộ');
      break;
    default:
      toast.error('Có lỗi xảy ra');
  }
};
```
