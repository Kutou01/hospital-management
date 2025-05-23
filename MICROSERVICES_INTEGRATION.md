# Microservices Integration Guide

## Tổng quan

Dự án Hospital Management đã được tích hợp với kiến trúc microservices. Bạn có thể chọn sử dụng Supabase (hiện tại) hoặc microservices (mới) thông qua feature flags.

## Cấu trúc dự án

```
hospital-management/
├── app/                          # Next.js frontend
├── lib/
│   ├── api-client.ts            # API client cho microservices
│   ├── migration-helper.ts      # Helper để chuyển đổi giữa Supabase và microservices
│   └── supabase.ts             # Supabase client (legacy)
├── hooks/
│   ├── useAuth.ts              # Auth hook hiện tại (cookie-based)
│   └── useAuthProvider.ts      # Auth provider mới (microservices)
├── hospital-microservices/      # Microservices backend
│   ├── api-gateway/            # API Gateway
│   ├── services/               # Các microservices
│   └── shared/                 # Shared utilities
└── scripts/
    └── start-dev.js            # Script khởi động toàn bộ hệ thống
```

## Cách khởi động

### 1. Khởi động toàn bộ hệ thống (Recommended)

```bash
npm run dev:full
```

Lệnh này sẽ khởi động:
- API Gateway trên port 3000
- Frontend trên port 3001
- Tất cả microservices

### 2. Khởi động riêng lẻ

#### Khởi động microservices:
```bash
npm run dev:microservices
```

#### Khởi động frontend:
```bash
npm run dev
```

## Feature Flags

Trong file `.env.local`, bạn có thể bật/tắt từng microservice:

```env
# Microservices Configuration
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3000

# Feature flags for gradual migration to microservices
NEXT_PUBLIC_USE_MICROSERVICES_AUTH=false
NEXT_PUBLIC_USE_MICROSERVICES_DOCTORS=false
NEXT_PUBLIC_USE_MICROSERVICES_PATIENTS=false
NEXT_PUBLIC_USE_MICROSERVICES_APPOINTMENTS=false
NEXT_PUBLIC_USE_MICROSERVICES_DEPARTMENTS=false
NEXT_PUBLIC_USE_MICROSERVICES_ROOMS=false
```

## Cách chuyển đổi từ Supabase sang Microservices

### Bước 1: Thay thế import trong components

**Cũ:**
```typescript
import { doctorsApi } from '@/lib/supabase';

const doctors = await doctorsApi.getAllDoctors();
```

**Mới:**
```typescript
import { unifiedApi } from '@/lib/migration-helper';

const doctors = await unifiedApi.doctors.getAll();
```

### Bước 2: Bật feature flag

Trong `.env.local`, thay đổi:
```env
NEXT_PUBLIC_USE_MICROSERVICES_DOCTORS=true
```

### Bước 3: Test và verify

1. Khởi động hệ thống: `npm run dev:full`
2. Kiểm tra API Gateway: http://localhost:3000/docs
3. Test frontend: http://localhost:3001

## API Endpoints

### API Gateway (Port 3000)

- **Health Check**: `GET /health`
- **API Documentation**: `GET /docs`
- **Authentication**: `POST /api/auth/login`, `POST /api/auth/register`
- **Doctors**: `GET|POST|PUT|DELETE /api/doctors`
- **Patients**: `GET|POST|PUT|DELETE /api/patients`
- **Appointments**: `GET|POST|PUT|DELETE /api/appointments`
- **Departments**: `GET|POST|PUT|DELETE /api/departments`

### Frontend (Port 3001)

- **Admin Dashboard**: http://localhost:3001/admin
- **Doctor Dashboard**: http://localhost:3001/doctor
- **Patient Dashboard**: http://localhost:3001/patient

## Authentication

### Hiện tại (Cookie-based)
```typescript
import { useAuth } from '@/hooks/useAuth';

const { user, isAuthenticated, logout } = useAuth();
```

### Microservices (Token-based)
```typescript
import { useAuthProvider } from '@/hooks/useAuthProvider';

const { user, login, logout, register } = useAuthProvider();
```

## Troubleshooting

### 1. Port conflicts
- API Gateway: 3000
- Frontend: 3001
- Auth Service: 3001 (internal)
- Doctor Service: 3002 (internal)

### 2. Microservices không khởi động
```bash
cd hospital-microservices
npm install
npm run dev
```

### 3. Database connection issues
Kiểm tra file `.env` trong `hospital-microservices/`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
```

### 4. CORS issues
API Gateway đã được cấu hình CORS cho frontend. Nếu vẫn gặp lỗi, kiểm tra:
- URL trong `NEXT_PUBLIC_API_GATEWAY_URL`
- Port numbers

## Migration Checklist

- [ ] Khởi động được toàn bộ hệ thống với `npm run dev:full`
- [ ] API Gateway hoạt động: http://localhost:3000/health
- [ ] Frontend hoạt động: http://localhost:3001
- [ ] Swagger docs: http://localhost:3000/docs
- [ ] Test login/logout
- [ ] Test CRUD operations cho từng module
- [ ] Bật từng feature flag và test

## Next Steps

1. **Hoàn thiện các microservices chưa có**: Patient, Appointment, Department, Room services
2. **Implement authentication microservice**: Thay thế auth logic hiện tại
3. **Add monitoring và logging**: Prometheus, Grafana
4. **Containerization**: Docker cho production deployment
5. **CI/CD pipeline**: GitHub Actions cho automated testing và deployment
