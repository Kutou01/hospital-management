# 📖 Hướng Dẫn Chi Tiết - Hospital Management System

## 📋 Tổng Quan Dự Án

Hệ thống quản lý bệnh viện được xây dựng theo kiến trúc microservice với Docker containerization, sử dụng Supabase làm database chính và Next.js cho frontend.

### 🏗️ Kiến Trúc Hệ Thống

```
hospital-management/
├── backend/                 # Backend services
│   ├── api-gateway/        # API Gateway (Port 3100)
│   ├── services/           # Microservices
│   │   ├── auth-service/   # Authentication (Port 3001)
│   │   ├── doctor-service/ # Doctor management (Port 3002)
│   │   ├── patient-service/# Patient management (Port 3003)
│   │   └── appointment-service/ # Appointments (Port 3004)
│   ├── monitoring/         # Prometheus & Grafana
│   └── docker-compose.yml  # Container orchestration
├── frontend/               # Next.js frontend (Port 3000)
├── docs/                   # Documentation
└── scripts/               # Database & testing scripts
```

## 🚀 Cách Chạy Dự Án

### Yêu Cầu Hệ Thống

- **Docker Desktop** (đã cài đặt và chạy)
- **Node.js** v18+ 
- **Git**
- **Tài khoản Supabase** với project đã setup

### 1. Chuẩn Bị Environment

#### Tạo file .env cho API Gateway (backend/api-gateway/.env)
```env
NODE_ENV=development
PORT=3100
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
REDIS_URL=redis://redis:6379
RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672
```

#### Tạo file .env cho Auth Service (backend/services/auth-service/.env)
```env
NODE_ENV=development
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
REDIS_URL=redis://redis:6379
RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672
```

#### Tạo file .env cho Frontend (frontend/.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3100
```

### 2. Cài Đặt Dependencies

```bash
# Backend
cd backend
npm install

# Frontend  
cd frontend
npm install
```

### 3. Chạy Hệ Thống

#### 🐳 Phương Pháp 1: Docker (Khuyến Nghị)

**Chạy Core Services:**
```bash
cd backend
docker-compose --profile core up -d
```

**Chạy Full System với Monitoring:**
```bash
cd backend
docker-compose --profile full up -d
```

**Chạy Frontend riêng biệt:**
```bash
cd frontend
npm run dev
```

#### 💻 Phương Pháp 2: Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 4. Truy Cập Hệ Thống

| Service | URL | Mô Tả |
|---------|-----|-------|
| **Frontend** | http://localhost:3000 | Giao diện người dùng chính |
| **API Gateway** | http://localhost:3100 | Cổng API chính |
| **Auth Service** | http://localhost:3001 | Dịch vụ xác thực |
| **Doctor Service** | http://localhost:3002 | Quản lý bác sĩ |
| **Patient Service** | http://localhost:3003 | Quản lý bệnh nhân |
| **Appointment Service** | http://localhost:3004 | Quản lý lịch hẹn |
| **Grafana** | http://localhost:3010 | Monitoring (admin/admin123) |
| **Prometheus** | http://localhost:9090 | Metrics collection |
| **RabbitMQ** | http://localhost:15672 | Message queue (admin/admin) |

## 🔧 Chi Tiết Từng Thành Phần

### 1. API Gateway (Port 3100)
**Công dụng:** Điểm truy cập trung tâm cho tất cả API requests
**Chức năng:**
- Route requests đến các microservices
- Authentication middleware
- Rate limiting
- Request/Response logging
- Load balancing

**Cách chạy riêng:**
```bash
cd backend/api-gateway
npm install
npm run dev
```

### 2. Auth Service (Port 3001)
**Công dụng:** Quản lý xác thực và phân quyền
**Chức năng:**
- User registration/login
- JWT token management
- Role-based access control
- Password reset
- Session management

**Cách test:**
```bash
cd backend/services/auth-service
node test-auth-service.js
```

### 3. Doctor Service (Port 3002)
**Công dụng:** Quản lý thông tin bác sĩ
**Chức năng:**
- Doctor profile management
- Work schedule management
- Specialization handling
- Performance metrics

**Cách test:**
```bash
node test-doctor-service.js
```

### 4. Patient Service (Port 3003)
**Công dụng:** Quản lý thông tin bệnh nhân
**Chức năng:**
- Patient registration
- Medical history
- Profile management
- Insurance information

**Cách test:**
```bash
node test-patient-service.js
```

### 5. Appointment Service (Port 3004)
**Công dụng:** Quản lý lịch hẹn khám
**Chức năng:**
- Appointment booking
- Schedule management
- Notification system
- Conflict resolution

### 6. Frontend (Port 3000)
**Công dụng:** Giao diện người dùng
**Tính năng:**
- Responsive design
- Role-based UI
- Real-time updates
- Vietnamese interface

**Cách chạy:**
```bash
cd frontend
npm run dev
```

## 🗄️ Database Management

### Supabase Setup
Hệ thống sử dụng Supabase với Department-Based ID system:

**Cấu trúc ID:**
- Doctors: `DOC-{DEPT}-{YYYY}-{NNNN}`
- Patients: `PAT-{DEPT}-{YYYY}-{NNNN}`
- Appointments: `APT-{DEPT}-{YYYY}-{NNNN}`

### Database Scripts

**Deploy database:**
```bash
node backend/scripts/deploy-complete-database.js
```

**Verify database:**
```bash
node backend/scripts/verify-complete-database.js
```

**Check database status:**
```bash
node backend/scripts/check-database-status.js
```

## 🧪 Testing System

### Test Scripts Chính

**Test tất cả roles:**
```bash
node test-all-roles.js
```

**Test patient service:**
```bash
node test-patient-service.js
```

**Test authentication:**
```bash
cd backend/services/auth-service
node test-unified-auth.js
```

### Test Database

**Check patient profile link:**
```bash
node check-patient-profile-link.js
```

**Test patient ID format:**
```bash
node test-patient-id.js
```

## 📊 Monitoring & Logging

### Grafana Dashboard
- **URL:** http://localhost:3010
- **Login:** admin/admin123
- **Chức năng:** Visualize metrics, alerts, performance monitoring

### Prometheus
- **URL:** http://localhost:9090
- **Chức năng:** Metrics collection, alerting rules

### RabbitMQ Management
- **URL:** http://localhost:15672
- **Login:** admin/admin
- **Chức năng:** Message queue monitoring, queue management

## 🔍 Troubleshooting

### Lỗi Thường Gặp

**1. Docker containers không start:**
```bash
# Check ports đã được sử dụng
netstat -tulpn | grep :3100

# Stop conflicting services
docker-compose down
```

**2. Database connection errors:**
```bash
# Verify Supabase credentials
node check-database-direct.js
```

**3. Frontend build errors:**
```bash
cd frontend
npm run clean
npm install
npm run dev
```

### Xem Logs

**Docker logs:**
```bash
docker-compose logs -f [service-name]
```

**Service-specific logs:**
```bash
# Auth service logs
tail -f backend/services/auth-service/logs/app.log

# API Gateway logs  
tail -f backend/api-gateway/logs/app.log
```

## 🚀 Development Workflow

### Quy Trình Phát Triển

1. **Kiểm tra progress:** `node check-progress.js`
2. **Chọn task tiếp theo** từ docs/tasks/
3. **Implement feature** với Augment Agent
4. **Test thoroughly** với các test scripts
5. **Update documentation**
6. **Commit changes** với descriptive message

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and test
npm test

# Commit changes
git add .
git commit -m "feat: implement new feature"

# Push to remote
git push origin feature/new-feature
```

## 📚 Documentation Structure

- **DETAILED_GUIDE.md** - Hướng dẫn này
- **GETTING_STARTED.md** - Quick start guide
- **API_DOCUMENTATION.md** - API endpoints
- **ARCHITECTURE.md** - System architecture
- **PROGRESS_DASHBOARD.md** - Progress tracking
- **PROJECT_REQUIREMENTS.md** - Full requirements

## 🛠️ Utility Scripts

### Root Level Scripts

**check-progress.js**
```bash
node check-progress.js
```
- Kiểm tra tiến độ phát triển tổng thể
- Hiển thị tasks đã hoàn thành và còn lại
- Đưa ra recommendations cho bước tiếp theo

**test-all-roles.js**
```bash
node test-all-roles.js
```
- Test authentication cho tất cả user roles
- Verify role-based access control
- Check permissions và authorization

**create-admin-account.js**
```bash
node create-admin-account.js
```
- Tạo admin account mặc định
- Setup initial system administrator
- Configure admin permissions

**check-database-direct.js**
```bash
node check-database-direct.js
```
- Kiểm tra kết nối database trực tiếp
- Verify Supabase configuration
- Test database accessibility

### Backend Scripts (backend/scripts/)

**deploy-complete-database.js**
```bash
node backend/scripts/deploy-complete-database.js
```
- Deploy complete database schema
- Create all tables với Department-Based ID system
- Setup triggers và functions

**verify-complete-database.js**
```bash
node backend/scripts/verify-complete-database.js
```
- Verify database deployment
- Check table structures
- Validate constraints và relationships

**check-database-status.js**
```bash
node backend/scripts/check-database-status.js
```
- Monitor database health
- Check table counts
- Verify data integrity

**check-sample-data.js**
```bash
node backend/scripts/check-sample-data.js
```
- Verify sample data insertion
- Check Department-Based ID format
- Validate data relationships

### Auth Service Scripts

**test-unified-auth.js**
```bash
cd backend/services/auth-service
node test-unified-auth.js
```
- Test unified authentication system
- Verify all auth methods
- Check token generation

**debug-auth.js**
```bash
cd backend/services/auth-service
node debug-auth.js
```
- Debug authentication issues
- Detailed error logging
- Step-by-step auth process

**test-doctor-registration.js**
```bash
cd backend/services/auth-service
node test-doctor-registration.js
```
- Test doctor registration flow
- Verify doctor-specific validation
- Check license number format

**populate-enum-tables.js**
```bash
cd backend/services/auth-service
node populate-enum-tables.js
```
- Populate enum tables với initial data
- Setup specialties, departments, status values
- Initialize system constants

## 🔧 Docker Management

### Docker Profiles

**Core Profile** - Essential services only:
```bash
docker-compose --profile core up -d
```
Services: api-gateway, auth-service, doctor-service, patient-service, appointment-service, redis, rabbitmq

**Full Profile** - All services including monitoring:
```bash
docker-compose --profile full up -d
```
Services: Core + prometheus, grafana, node-exporter

**Monitoring Profile** - Only monitoring stack:
```bash
docker-compose --profile monitoring up -d
```
Services: prometheus, grafana, node-exporter

### Docker Commands

**Start services:**
```bash
cd backend
docker-compose up -d
```

**Stop services:**
```bash
docker-compose down
```

**View logs:**
```bash
docker-compose logs -f [service-name]
```

**Rebuild services:**
```bash
docker-compose build --no-cache
docker-compose up -d
```

**Clean up:**
```bash
docker-compose down -v
docker system prune -a
```

## 📱 Frontend Development

### Available Scripts

**Development server:**
```bash
cd frontend
npm run dev
```

**Production build:**
```bash
npm run build
npm run start
```

**Linting:**
```bash
npm run lint
```

**Clean cache:**
```bash
npm run clean
```

### Frontend Structure

```
frontend/
├── app/                    # Next.js 13+ app directory
├── components/            # Reusable components
│   ├── ui/               # UI components (shadcn/ui)
│   ├── forms/            # Form components
│   └── layout/           # Layout components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── pages/                # Pages (if using pages router)
├── public/               # Static assets
└── styles/               # Global styles
```

### Key Components

**Universal Sidebar** - Shared across all user roles
**Auth Guards** - Protect routes based on user roles
**Toast System** - Unified notification system
**Form Components** - Reusable form elements

## 🔐 Authentication System

### User Roles

1. **Admin** - Full system access
2. **Doctor** - Medical staff access
3. **Patient** - Patient portal access

### Authentication Flow

1. **Registration** → Create account với role-specific validation
2. **Login** → JWT token generation
3. **Authorization** → Role-based access control
4. **Session Management** → Token refresh và logout

### Department-Based ID System

**Format:** `{TYPE}-{DEPT}-{YEAR}-{NUMBER}`

**Examples:**
- Doctor: `DOC-CARD-2024-0001`
- Patient: `PAT-ORTH-2024-0001`
- Appointment: `APT-NEUR-2024-0001`

**Departments:**
- CARD (Cardiology)
- ORTH (Orthopedics)
- NEUR (Neurology)
- PEDI (Pediatrics)
- GYNE (Gynecology)

## 🎯 Next Steps

1. **Setup Supabase database** với complete schema
2. **Configure authentication** providers
3. **Test core functionality** với tất cả roles
4. **Implement remaining services** theo roadmap
5. **Deploy to production** environment

## 📞 Support & Help

Nếu gặp vấn đề, hãy:

1. **Check logs** của service liên quan
2. **Run diagnostic scripts** để identify issues
3. **Consult documentation** trong docs/
4. **Ask Augment Agent** for specific implementation help
5. **Check GitHub issues** for known problems

---

*Document này được cập nhật thường xuyên. Vui lòng check version mới nhất trong docs/ folder.*
