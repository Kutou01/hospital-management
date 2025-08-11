# 🏥 **HOSPITAL MANAGEMENT SYSTEM - USER GUIDE**

## 👥 **USER ACCOUNTS & ACCESS**

### 👤 **Patient Account**
```
Email: patient@hospital.com
Password: Patient123.
Name: Trần Thị Hương
Patient ID: PAT-202506-544
Status: Active
```

### 👨‍⚕️ **Doctor Account**
```
Email: doctor@hospital.com
Password: Doctor123.
Name: BS. Nguyễn Văn Đức
Doctor ID: CARD-DOC-202506-001
Department: Cardiology
Status: Active
```

### 🏥 **Receptionist Accounts**
```
Email: receptionist1@hospital.com
Name: Nguyễn Thị Lan
ID: REC-202508-001
Status: Active

Email: receptionist2@hospital.com
Name: Trần Văn Nam
ID: REC-202508-002
Status: Active
```

### 👨‍💼 **Admin Account**
```
Email: admin@hospital.com
Password: [To be configured]
Role: System Administrator
Status: Active
```

---

## ✅ **WORKING FEATURES**

### **Authentication & Navigation**
- ✅ **Login/Logout** - All user roles working
- ✅ **Dashboard Access** - Role-based dashboards
- ✅ **Navigation** - Sidebar and page routing
- ✅ **Session Management** - JWT tokens working

### **Data Display**
- ✅ **Patient Dashboard** - Health metrics and overview
- ✅ **Doctor Dashboard** - Analytics and patient stats
- ✅ **Medical Records** - View patient records
- ✅ **Appointments** - View appointment history

### **Backend Integration**
- ✅ **API Calls** - All 11 microservices connected
- ✅ **Real-time Data** - Live updates from database
- ✅ **Payment Service** - PayOS integration ready
- ✅ **Notification Service** - Email/SMS capabilities

---

## ❌ **LIMITATIONS & KNOWN ISSUES**

### **Interactive Features**
- ❌ **Book Appointment** - Buttons are UI placeholders
- ❌ **Download Files** - Download buttons not functional
- ❌ **Upload Documents** - File upload not implemented
- ❌ **Chat/Messaging** - Communication features pending

### **Booking System**
- ❌ **Appointment Booking Flow** - Core functionality missing
- ❌ **Doctor Selection** - Search and booking not working
- ❌ **Calendar Integration** - Calendar is display-only
- ❌ **Payment Flow** - Frontend payment UI incomplete

### **Advanced Features**
- ❌ **Video Consultation** - Telemedicine not implemented
- ❌ **Real-time Chat** - Messaging system pending
- ❌ **File Management** - Upload/download not working
- ❌ **Advanced Search** - Search functionality basic

---

## 🔧 **SYSTEM SERVICES**

### **Backend Services**
| Service | Port | Purpose |
|---------|------|---------|
| API Gateway | 3100 | Request routing and load balancing |
| Auth Service | 3001 | User authentication and authorization |
| Patient Service | 3003 | Patient data management |
| Doctor Service | 3002 | Doctor profiles and schedules |
| Appointment Service | 3004 | Appointment booking and management |
| Department Service | 3005 | Hospital department information |
| Receptionist Service | 3006 | Front desk operations |
| Medical Records Service | 3007 | Patient medical history |
| Payment Service | 3009 | Payment processing (PayOS) |
| Notification Service | 3011 | Email/SMS notifications |
| GraphQL Gateway | 3200 | GraphQL API endpoint |

### **Infrastructure**
| Service | Port | Purpose |
|---------|------|---------|
| Redis | 6379 | Caching and session storage |
| RabbitMQ | 5672/15672 | Message queue for real-time features |
| Supabase | - | PostgreSQL database with real-time |

### **Frontend**
| Service | Port | Purpose |
|---------|------|---------|
| Next.js App | 3000 | Main web application |

---

## 🚀 **QUICK START**

### **Start Backend Services**
```bash
cd backend
docker-compose up -d
```

### **Start Frontend**
```bash
cd frontend
npm install
npm run dev
```

### **Access Application**
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:3100
- **GraphQL**: http://localhost:3200

---

## 📊 **CURRENT SYSTEM STATUS**

### **Overall Completion: 77%**
| Component | Status | Completion |
|-----------|--------|------------|
| **Backend Services** | ✅ Working | 100% |
| **Authentication** | ✅ Working | 100% |
| **UI/UX Design** | ✅ Working | 95% |
| **Data Integration** | ✅ Working | 90% |
| **Interactive Features** | ❌ Limited | 30% |
| **Booking System** | ❌ Incomplete | 25% |
| **Payment Flow** | ❌ Backend Only | 40% |

### **Suitable For:**
- ✅ **Graduation Thesis** - Strong technical architecture
- ✅ **Portfolio Project** - Demonstrates modern skills
- ✅ **Learning Platform** - Study microservices
- ❌ **Production Use** - Missing core functionality
- ❌ **End-user Testing** - Interactive features incomplete

### **Next Development Phase:**
1. **Implement booking flow** - Make appointment booking work
2. **Complete payment integration** - Frontend payment UI
3. **Add file operations** - Upload/download functionality
4. **Real-time communication** - Chat and messaging features
