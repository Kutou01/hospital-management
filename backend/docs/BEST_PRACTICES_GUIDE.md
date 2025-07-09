# Best Practices Guide: Hybrid REST + GraphQL Architecture

## Hospital Management System

> **Mục tiêu**: Hướng dẫn best practices cho việc sử dụng hybrid REST+GraphQL architecture trong hệ thống hospital management

---

## 🎯 **ARCHITECTURAL PRINCIPLES**

### **1. API-First Design**

- ✅ Design API trước khi implement
- ✅ Schema-driven development cho GraphQL
- ✅ OpenAPI specification cho REST
- ✅ Contract testing giữa services

### **2. Separation of Concerns**

- ✅ GraphQL cho complex queries
- ✅ REST cho simple operations
- ✅ Clear boundaries giữa services
- ✅ Single responsibility principle

### **3. Performance by Design**

- ✅ Caching strategy từ đầu
- ✅ Pagination cho large datasets
- ✅ Lazy loading cho expensive operations
- ✅ Connection pooling

---

## 🔧 **GRAPHQL BEST PRACTICES**

### **Schema Design**

```graphql
# ✅ GOOD: Clear, descriptive types
type Doctor {
  id: ID!
  doctorId: DoctorID! # Custom scalar for validation
  fullName: String!
  specialization: String!

  # Relationships with clear naming
  department: Department
  appointments(
    status: AppointmentStatus
    dateFrom: Date
    dateTo: Date
    first: Int = 10
    after: String
  ): AppointmentConnection!

  # Computed fields with clear purpose
  isAvailableToday: Boolean!
  nextAvailableSlot: DateTime
  averageRating: Float
}

# ❌ BAD: Vague, unclear types
type Doctor {
  id: String
  name: String
  data: JSON # Avoid generic types
  stuff: [Thing] # Unclear relationships
}
```

### **Resolver Best Practices**

```typescript
// ✅ GOOD: Efficient resolver with DataLoader
export const doctorResolvers = {
  Doctor: {
    // Use DataLoader to prevent N+1 queries
    department: async (
      doctor: Doctor,
      _: any,
      { dataSources }: GraphQLContext
    ) => {
      return dataSources.departmentLoader.load(doctor.departmentId);
    },

    // Computed fields with caching
    averageRating: async (
      doctor: Doctor,
      _: any,
      { dataSources, cache }: GraphQLContext
    ) => {
      const cacheKey = `doctor:${doctor.id}:rating`;
      const cached = await cache.get(cacheKey);

      if (cached) return cached;

      const rating = await dataSources.reviewService.getAverageRating(
        doctor.id
      );
      await cache.set(cacheKey, rating, { ttl: 300 }); // 5 minutes

      return rating;
    },

    // Paginated relationships
    appointments: async (
      doctor: Doctor,
      { status, dateFrom, dateTo, first, after }: AppointmentArgs,
      { dataSources }: GraphQLContext
    ) => {
      return dataSources.appointmentService.getAppointmentsByDoctor({
        doctorId: doctor.id,
        status,
        dateFrom,
        dateTo,
        first,
        after,
      });
    },
  },
};

// ❌ BAD: Inefficient resolver
export const badDoctorResolvers = {
  Doctor: {
    // N+1 query problem
    department: async (doctor: Doctor) => {
      return await db.departments.findById(doctor.departmentId);
    },

    // No caching, expensive operation
    averageRating: async (doctor: Doctor) => {
      const reviews = await db.reviews.findByDoctorId(doctor.id);
      return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    },
  },
};
```

### **Query Complexity & Security**

```typescript
// ✅ GOOD: Query complexity analysis
import { createComplexityLimitRule } from "graphql-query-complexity";

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [
    createComplexityLimitRule(1000, {
      // Custom complexity calculation
      scalarCost: 1,
      objectCost: 2,
      listFactor: 10,
      introspectionCost: 1000,

      // Field-specific costs
      fieldExtensions: {
        "Doctor.statistics": { complexity: 50 },
        "Patient.medicalHistory": { complexity: 100 },
      },
    }),
  ],
});

// ✅ GOOD: Query depth limiting
import depthLimit from "graphql-depth-limit";

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [depthLimit(10)],
});
```

### **Error Handling**

```typescript
// ✅ GOOD: Structured error handling
import {
  UserInputError,
  ForbiddenError,
  ApolloError,
} from "apollo-server-express";

export class HospitalError extends ApolloError {
  constructor(message: string, code: string, properties?: Record<string, any>) {
    super(message, code, properties);
    this.name = "HospitalError";
  }
}

// Specific error types
export class PatientNotFoundError extends HospitalError {
  constructor(patientId: string) {
    super(
      `Không tìm thấy bệnh nhân với ID: ${patientId}`,
      "PATIENT_NOT_FOUND",
      { patientId }
    );
  }
}

// In resolvers
const getPatient = async (patientId: string) => {
  if (!isValidPatientId(patientId)) {
    throw new UserInputError("ID bệnh nhân không hợp lệ", {
      field: "patientId",
      value: patientId,
    });
  }

  const patient = await patientService.findById(patientId);
  if (!patient) {
    throw new PatientNotFoundError(patientId);
  }

  return patient;
};
```

---

## 🌐 **REST API BEST PRACTICES**

### **URL Design**

```typescript
// ✅ GOOD: RESTful URL design
GET / api / patients; // List patients
GET / api / patients / { id }; // Get specific patient
POST / api / patients; // Create patient
PUT / api / patients / { id }; // Update patient
DELETE / api / patients / { id }; // Delete patient

// Nested resources
GET / api / patients / { id } / appointments; // Patient's appointments
POST / api / patients / { id } / documents; // Upload patient document

// Actions
POST / api / appointments / { id } / confirm; // Confirm appointment
POST / api / appointments / { id } / cancel; // Cancel appointment

// ❌ BAD: Non-RESTful URLs
GET / api / getPatients;
POST / api / createPatient;
GET / api / patient - appointments / { id };
POST / api / confirmAppointment;
```

### **Request/Response Format**

```typescript
// ✅ GOOD: Consistent response format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: PaginationMeta;
    timestamp: string;
    requestId: string;
  };
}

// Success response
{
  "success": true,
  "data": {
    "id": "PAT-202501-001",
    "fullName": "Nguyen Van A",
    "phone": "0123456789"
  },
  "meta": {
    "timestamp": "2025-01-09T10:30:00Z",
    "requestId": "req-123456"
  }
}

// Error response
{
  "success": false,
  "error": {
    "code": "PATIENT_NOT_FOUND",
    "message": "Không tìm thấy bệnh nhân với ID: PAT-202501-001",
    "details": {
      "patientId": "PAT-202501-001"
    }
  },
  "meta": {
    "timestamp": "2025-01-09T10:30:00Z",
    "requestId": "req-123456"
  }
}
```

### **HTTP Status Codes**

```typescript
// ✅ GOOD: Proper HTTP status usage
export const HTTP_STATUS = {
  // Success
  OK: 200, // GET, PUT successful
  CREATED: 201, // POST successful
  NO_CONTENT: 204, // DELETE successful

  // Client errors
  BAD_REQUEST: 400, // Invalid request data
  UNAUTHORIZED: 401, // Authentication required
  FORBIDDEN: 403, // Access denied
  NOT_FOUND: 404, // Resource not found
  CONFLICT: 409, // Resource conflict
  UNPROCESSABLE_ENTITY: 422, // Validation errors

  // Server errors
  INTERNAL_SERVER_ERROR: 500, // Server error
  SERVICE_UNAVAILABLE: 503, // Service down
} as const;

// Usage in controllers
export class PatientController {
  async getPatient(req: Request, res: Response) {
    try {
      const patient = await this.patientService.findById(req.params.id);

      if (!patient) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            code: "PATIENT_NOT_FOUND",
            message: "Không tìm thấy bệnh nhân",
          },
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: patient,
      });
    } catch (error) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Lỗi server nội bộ",
        },
      });
    }
  }
}
```

### **Input Validation**

```typescript
// ✅ GOOD: Comprehensive validation
import { body, param, query, validationResult } from "express-validator";

export const validateCreatePatient = [
  body("fullName")
    .isLength({ min: 2, max: 100 })
    .withMessage("Họ tên phải từ 2-100 ký tự"),

  body("phone")
    .matches(/^0\d{9}$/)
    .withMessage("Số điện thoại phải có 10 số và bắt đầu bằng 0"),

  body("email").isEmail().normalizeEmail().withMessage("Email không hợp lệ"),

  body("dateOfBirth")
    .isISO8601()
    .toDate()
    .custom((value) => {
      const age = new Date().getFullYear() - new Date(value).getFullYear();
      if (age < 0 || age > 150) {
        throw new Error("Tuổi không hợp lệ");
      }
      return true;
    }),

  body("gender")
    .isIn(["MALE", "FEMALE", "OTHER"])
    .withMessage("Giới tính không hợp lệ"),
];

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Dữ liệu đầu vào không hợp lệ",
        details: errors.array(),
      },
    });
  }

  next();
};
```

---

## 🔄 **HYBRID INTEGRATION PATTERNS**

### **Pattern 1: GraphQL for Reads, REST for Writes**

```typescript
// ✅ GOOD: Hybrid appointment booking
const AppointmentBooking = () => {
  // GraphQL: Complex read operations
  const { data: availableSlots } = useQuery(GET_AVAILABLE_SLOTS, {
    variables: { doctorId, date, duration }
  });

  const { data: doctorInfo } = useQuery(GET_DOCTOR_INFO, {
    variables: { doctorId }
  });

  // REST: Simple write operations
  const bookAppointment = async (appointmentData: AppointmentForm) => {
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointmentData)
    });

    if (response.ok) {
      // Invalidate GraphQL cache
      apolloClient.refetchQueries({
        include: [GET_AVAILABLE_SLOTS, GET_DOCTOR_APPOINTMENTS]
      });
    }

    return response.json();
  };

  return (
    <BookingForm
      availableSlots={availableSlots}
      doctor={doctorInfo}
      onSubmit={bookAppointment}
    />
  );
};
```

### **Pattern 2: REST for Files, GraphQL for Metadata**

```typescript
// ✅ GOOD: File upload with metadata
const DocumentUpload = ({ patientId }: { patientId: string }) => {
  // REST: File upload
  const uploadFile = async (file: File, metadata: DocumentMetadata) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', metadata.category);
    formData.append('description', metadata.description);

    const response = await fetch(`/api/patients/${patientId}/documents`, {
      method: 'POST',
      body: formData
    });

    return response.json();
  };

  // GraphQL: Query documents with metadata
  const { data: documents, refetch } = useQuery(GET_PATIENT_DOCUMENTS, {
    variables: { patientId }
  });

  const handleUpload = async (file: File, metadata: DocumentMetadata) => {
    const result = await uploadFile(file, metadata);

    if (result.success) {
      // Refetch GraphQL data
      await refetch();
      toast.success('Tải lên thành công!');
    }
  };

  return (
    <div>
      <FileUploader onUpload={handleUpload} />
      <DocumentList documents={documents?.patientDocuments} />
    </div>
  );
};
```

### **Pattern 3: Progressive Enhancement**

```typescript
// ✅ GOOD: Fallback to REST if GraphQL fails
const usePatientData = (patientId: string) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try GraphQL first
        const result = await apolloClient.query({
          query: GET_PATIENT_PROFILE,
          variables: { patientId },
          errorPolicy: "none",
        });

        setData(result.data.patient);
      } catch (graphqlError) {
        console.warn("GraphQL failed, falling back to REST:", graphqlError);

        try {
          // Fallback to REST
          const response = await fetch(`/api/patients/${patientId}`);
          const restData = await response.json();

          if (restData.success) {
            setData(restData.data);
          } else {
            setError(restData.error);
          }
        } catch (restError) {
          setError(restError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [patientId]);

  return { data, loading, error };
};
```

---

## 🚀 **PERFORMANCE OPTIMIZATION**

### **GraphQL Performance**

```typescript
// ✅ GOOD: DataLoader implementation
export class HospitalDataLoaders {
  // Batch loading for departments
  departmentLoader = new DataLoader(
    async (departmentIds: string[]) => {
      const departments =
        await this.departmentService.getDepartmentsByIds(departmentIds);
      return departmentIds.map(
        (id) => departments.find((d) => d.id === id) || null
      );
    },
    {
      // Cache for 5 minutes
      cacheKeyFn: (key) => key,
      cacheMap: new Map(),
      maxBatchSize: 100,
    }
  );

  // Batch loading for patient appointments
  appointmentsByPatientLoader = new DataLoader(async (patientIds: string[]) => {
    const appointments =
      await this.appointmentService.getAppointmentsByPatientIds(patientIds);
    return patientIds.map((id) =>
      appointments.filter((a) => a.patientId === id)
    );
  });

  // Clear cache when data changes
  clearCache() {
    this.departmentLoader.clearAll();
    this.appointmentsByPatientLoader.clearAll();
  }
}

// ✅ GOOD: Query complexity calculation
const complexityMap = {
  "Doctor.appointments": 10,
  "Patient.medicalHistory": 20,
  "Appointment.prescriptions": 15,
  "Department.doctors": 5,
};

// ✅ GOOD: Redis caching for expensive operations
export class GraphQLCacheService {
  private redis: Redis;

  async cacheResolver(
    key: string,
    resolver: () => Promise<any>,
    ttl: number = 300
  ) {
    const cached = await this.redis.get(key);

    if (cached) {
      return JSON.parse(cached);
    }

    const result = await resolver();
    await this.redis.setex(key, ttl, JSON.stringify(result));

    return result;
  }

  // Cache invalidation patterns
  async invalidatePattern(pattern: string) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

### **REST Performance**

```typescript
// ✅ GOOD: HTTP caching headers
export const cacheMiddleware = (duration: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set cache headers
    res.set({
      "Cache-Control": `public, max-age=${duration}`,
      ETag: generateETag(req.url),
      "Last-Modified": new Date().toUTCString(),
    });

    // Handle conditional requests
    if (req.headers["if-none-match"] === res.get("ETag")) {
      return res.status(304).end();
    }

    next();
  };
};

// ✅ GOOD: Compression middleware
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6,
    threshold: 1024,
  })
);

// ✅ GOOD: Rate limiting
export const createRateLimit = (windowMs: number, max: number) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Quá nhiều requests, vui lòng thử lại sau",
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};
```

---

## 🔒 **SECURITY BEST PRACTICES**

### **GraphQL Security**

```typescript
// ✅ GOOD: Query depth limiting
import depthLimit from "graphql-depth-limit";
import costAnalysis from "graphql-cost-analysis";

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [
    depthLimit(10),
    costAnalysis({
      maximumCost: 1000,
      defaultCost: 1,
      scalarCost: 1,
      objectCost: 2,
      listFactor: 10,
      introspectionCost: 1000,
    }),
  ],
  plugins: [
    // Query whitelist for production
    process.env.NODE_ENV === "production" && {
      requestDidStart() {
        return {
          didResolveOperation({ request, operationName }) {
            if (!isAllowedQuery(operationName)) {
              throw new ForbiddenError("Query not allowed");
            }
          },
        };
      },
    },
  ].filter(Boolean),
});

// ✅ GOOD: Field-level authorization
const resolvers = {
  Patient: {
    // Only allow access to own data or authorized users
    medicalHistory: async (patient, args, { user, dataSources }) => {
      if (user.role === "patient" && user.patientId !== patient.id) {
        throw new ForbiddenError("Không có quyền truy cập");
      }

      if (user.role === "doctor") {
        // Check if doctor has permission to view this patient
        const hasPermission =
          await dataSources.permissionService.checkDoctorPatientAccess(
            user.doctorId,
            patient.id
          );

        if (!hasPermission) {
          throw new ForbiddenError("Không có quyền truy cập hồ sơ bệnh nhân");
        }
      }

      return dataSources.medicalRecordService.getByPatientId(patient.id);
    },
  },
};
```

### **REST Security**

```typescript
// ✅ GOOD: Input sanitization
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss";

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

app.use(mongoSanitize());

// XSS protection middleware
export const xssProtection = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === "string") {
        req.body[key] = xss(req.body[key]);
      }
    }
  }
  next();
};

// ✅ GOOD: Role-based access control
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Chưa đăng nhập" },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Không có quyền truy cập" },
      });
    }

    next();
  };
};
```

---

## 📊 **MONITORING & OBSERVABILITY**

### **GraphQL Monitoring**

```typescript
// ✅ GOOD: Apollo Studio integration
const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    ApolloServerPluginUsageReporting({
      sendVariableValues: { all: true },
      sendHeaders: { all: true },
    }),
    // Custom metrics plugin
    {
      requestDidStart() {
        return {
          didResolveOperation(requestContext) {
            const { operationName, operation } = requestContext;

            // Track operation metrics
            metrics.increment("graphql.operation.count", {
              operation: operationName || "anonymous",
              type: operation?.operation || "unknown",
            });
          },

          willSendResponse(requestContext) {
            const { response, operationName } = requestContext;

            // Track response metrics
            metrics.histogram(
              "graphql.operation.duration",
              Date.now() - requestContext.request.http?.startTime,
              {
                operation: operationName || "anonymous",
              }
            );

            // Track errors
            if (response.errors?.length) {
              metrics.increment("graphql.operation.error", {
                operation: operationName || "anonymous",
              });
            }
          },
        };
      },
    },
  ],
});

// ✅ GOOD: Query performance tracking
export class QueryPerformanceTracker {
  private slowQueries = new Map<string, number>();

  trackQuery(operationName: string, duration: number) {
    if (duration > 1000) {
      // Slow query threshold: 1 second
      this.slowQueries.set(operationName, duration);

      logger.warn("Slow GraphQL query detected", {
        operation: operationName,
        duration,
        threshold: 1000,
      });
    }
  }

  getSlowQueries() {
    return Array.from(this.slowQueries.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
  }
}
```

### **REST Monitoring**

```typescript
// ✅ GOOD: Request/Response logging
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();
  const requestId = uuidv4();

  req.requestId = requestId;

  // Log request
  logger.info("HTTP Request", {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get("User-Agent"),
    ip: req.ip,
    userId: req.user?.id,
  });

  // Log response
  res.on("finish", () => {
    const duration = Date.now() - start;

    logger.info("HTTP Response", {
      requestId,
      statusCode: res.statusCode,
      duration,
      contentLength: res.get("Content-Length"),
    });

    // Track metrics
    metrics.histogram("http.request.duration", duration, {
      method: req.method,
      route: req.route?.path || req.url,
      status_code: res.statusCode.toString(),
    });
  });

  next();
};

// ✅ GOOD: Health check endpoint
app.get("/health", async (req, res) => {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {
      database: await checkDatabaseHealth(),
      redis: await checkRedisHealth(),
      external: await checkExternalServices(),
    },
  };

  const isHealthy = Object.values(health.services).every(
    (service) => service.status === "healthy"
  );

  res.status(isHealthy ? 200 : 503).json(health);
});
```

---

## 🧪 **TESTING STRATEGIES**

### **GraphQL Testing**

```typescript
// ✅ GOOD: GraphQL integration tests
describe("Doctor GraphQL API", () => {
  let server: ApolloServer;
  let testClient: ApolloServerTestClient;

  beforeAll(async () => {
    server = new ApolloServer({ typeDefs, resolvers });
    testClient = createTestClient(server);
  });

  it("should get doctor dashboard data", async () => {
    const GET_DOCTOR_DASHBOARD = gql`
      query GetDoctorDashboard($doctorId: ID!) {
        doctor(id: $doctorId) {
          id
          fullName
          todayAppointments {
            id
            time
            patient {
              fullName
            }
          }
          statistics {
            todayAppointments
            averageRating
          }
        }
      }
    `;

    const { data, errors } = await testClient.query({
      query: GET_DOCTOR_DASHBOARD,
      variables: { doctorId: "CARD-DOC-202501-001" },
    });

    expect(errors).toBeUndefined();
    expect(data.doctor).toBeDefined();
    expect(data.doctor.todayAppointments).toBeInstanceOf(Array);
    expect(data.doctor.statistics.todayAppointments).toBeGreaterThanOrEqual(0);
  });

  it("should handle invalid doctor ID", async () => {
    const { errors } = await testClient.query({
      query: GET_DOCTOR_DASHBOARD,
      variables: { doctorId: "INVALID-ID" },
    });

    expect(errors).toBeDefined();
    expect(errors[0].extensions.code).toBe("DOCTOR_NOT_FOUND");
  });
});

// ✅ GOOD: Query complexity testing
it("should reject overly complex queries", async () => {
  const COMPLEX_QUERY = gql`
    query ComplexQuery {
      doctors {
        appointments {
          patient {
            medicalHistory {
              prescriptions {
                medications {
                  interactions {
                    # This creates exponential complexity
                    relatedMedications {
                      interactions {
                        relatedMedications {
                          name
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const { errors } = await testClient.query({ query: COMPLEX_QUERY });

  expect(errors).toBeDefined();
  expect(errors[0].extensions.code).toBe("QUERY_COMPLEXITY_TOO_HIGH");
});
```

### **REST Testing**

```typescript
// ✅ GOOD: REST API integration tests
describe("Patient REST API", () => {
  let app: Express;
  let authToken: string;

  beforeAll(async () => {
    app = createApp();
    authToken = await getTestAuthToken("doctor");
  });

  describe("GET /api/patients/:id", () => {
    it("should return patient data for authorized user", async () => {
      const response = await request(app)
        .get("/api/patients/PAT-202501-001")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe("PAT-202501-001");
      expect(response.body.data.fullName).toBeDefined();
    });

    it("should return 404 for non-existent patient", async () => {
      const response = await request(app)
        .get("/api/patients/PAT-999999-999")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("PATIENT_NOT_FOUND");
    });

    it("should return 401 for unauthorized access", async () => {
      await request(app).get("/api/patients/PAT-202501-001").expect(401);
    });
  });

  describe("POST /api/patients", () => {
    it("should create new patient with valid data", async () => {
      const patientData = {
        fullName: "Nguyen Van Test",
        phone: "0123456789",
        email: "test@example.com",
        dateOfBirth: "1990-01-01",
        gender: "MALE",
      };

      const response = await request(app)
        .post("/api/patients")
        .set("Authorization", `Bearer ${authToken}`)
        .send(patientData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.fullName).toBe(patientData.fullName);
    });

    it("should validate required fields", async () => {
      const invalidData = {
        fullName: "A", // Too short
        phone: "123", // Invalid format
        email: "invalid-email",
      };

      const response = await request(app)
        .post("/api/patients")
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.details).toBeInstanceOf(Array);
    });
  });
});
```

---

## 📚 **DOCUMENTATION STANDARDS**

### **GraphQL Documentation**

```graphql
# ✅ GOOD: Well-documented schema
"""
Represents a doctor in the hospital system
Doctors can have multiple specializations and work in different departments
"""
type Doctor {
  "Unique identifier for the doctor"
  id: ID!

  "Hospital-specific doctor ID following format: DEPT-DOC-YYYYMM-XXX"
  doctorId: DoctorID!

  "Full name of the doctor"
  fullName: String!

  "Primary medical specialization"
  specialization: String!

  "Department where the doctor works"
  department: Department

  """
  Appointments for this doctor
  Supports filtering by status and date range
  Results are paginated using cursor-based pagination
  """
  appointments(
    "Filter by appointment status"
    status: AppointmentStatus
    "Start date for filtering (inclusive)"
    dateFrom: Date
    "End date for filtering (inclusive)"
    dateTo: Date
    "Number of appointments to return (max 50)"
    first: Int = 10
    "Cursor for pagination"
    after: String
  ): AppointmentConnection!

  "Whether the doctor is available today"
  isAvailableToday: Boolean!

  "Average rating from patient reviews (1-5 scale)"
  averageRating: Float
}

"""
Input for creating a new appointment
All fields are required except notes
"""
input CreateAppointmentInput {
  "ID of the doctor for this appointment"
  doctorId: ID!

  "ID of the patient for this appointment"
  patientId: ID!

  "Date of the appointment (YYYY-MM-DD format)"
  date: Date!

  "Time of the appointment (HH:MM format)"
  time: Time!

  "Reason for the appointment"
  reason: String!

  "Additional notes (optional)"
  notes: String
}
```

### **REST Documentation**

```typescript
/**
 * @swagger
 * /api/patients/{id}:
 *   get:
 *     summary: Get patient by ID
 *     description: |
 *       Retrieves detailed information about a specific patient.
 *       Requires authentication and appropriate permissions.
 *
 *       **Access Control:**
 *       - Doctors: Can access patients they are treating
 *       - Patients: Can only access their own data
 *       - Admins: Can access all patient data
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^PAT-\d{6}-\d{3}$'
 *           example: 'PAT-202501-001'
 *         description: Patient ID in format PAT-YYYYMM-XXX
 *     responses:
 *       200:
 *         description: Patient data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PatientResponse'
 *             example:
 *               success: true
 *               data:
 *                 id: 'PAT-202501-001'
 *                 fullName: 'Nguyen Van A'
 *                 phone: '0123456789'
 *                 email: 'patient@example.com'
 *       404:
 *         $ref: '#/components/responses/PatientNotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
```

---

## 🎯 **CONCLUSION**

### **Key Takeaways**

1. **Choose the Right Tool**: Use GraphQL for complex queries, REST for simple operations
2. **Security First**: Implement proper authentication, authorization, and input validation
3. **Performance Matters**: Use caching, pagination, and optimization techniques
4. **Monitor Everything**: Track performance, errors, and usage patterns
5. **Test Thoroughly**: Write comprehensive tests for both GraphQL and REST APIs
6. **Document Well**: Maintain clear, up-to-date documentation

### **Next Steps**

1. Review current implementation against these best practices
2. Identify areas for improvement
3. Create action plan for optimization
4. Implement monitoring and alerting
5. Train team on best practices

---

_Tài liệu này được cập nhật thường xuyên dựa trên kinh nghiệm thực tế và industry best practices._
