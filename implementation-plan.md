Kiê# 🚀 HOSPITAL MANAGEMENT SYSTEM - IMPLEMENTATION PLAN
## 4-Role System: Admin, Doctor, Patient, Receptionist

**Timeline**: 6-8 tuần  
**Target**: 10/10 graduation thesis  
**Focus**: Web-native features, business automation  

---

## 📋 **PHASE 1: FOUNDATION & CLEANUP (Tuần 1)**

### **1.1 Database Cleanup**
```bash
# Run database cleanup script
cd backend
node -e "
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const sql = fs.readFileSync('../database-cleanup.sql', 'utf8');
supabase.rpc('exec_sql', { sql_query: sql });
"
```

### **1.2 Role System Enhancement**
```typescript
// lib/types/roles.ts
export type UserRole = 'admin' | 'doctor' | 'patient' | 'receptionist';

export interface RolePermissions {
  admin: string[];
  doctor: string[];
  patient: string[];
  receptionist: string[];
}

export const ROLE_PERMISSIONS: RolePermissions = {
  admin: [
    'system_management', 'user_management', 'reports',
    'department_management', 'payment_oversight', 'analytics'
  ],
  doctor: [
    'medical_records', 'prescriptions', 'consultations',
    'schedule_management', 'patient_care', 'appointments_view'
  ],
  patient: [
    'appointment_booking', 'medical_records_view', 'payments',
    'profile_management', 'health_tracking', 'notifications'
  ],
  receptionist: [
    'patient_checkin', 'queue_management', 'appointment_scheduling',
    'insurance_verification', 'front_desk_operations', 'basic_reports'
  ]
};
```

### **1.3 API Routes Structure**
```
frontend/pages/api/
├── auth/
│   ├── login.ts
│   ├── register.ts
│   └── logout.ts
├── admin/
│   ├── dashboard.ts
│   ├── users.ts
│   └── reports.ts
├── doctor/
│   ├── dashboard.ts
│   ├── appointments.ts
│   └── medical-records.ts
├── patient/
│   ├── dashboard.ts
│   ├── book-appointment.ts
│   └── payments.ts
└── receptionist/
    ├── dashboard.ts
    ├── check-in.ts
    └── queue.ts
```

---

## 📋 **PHASE 2: CORE FEATURES (Tuần 2-3)**

### **2.1 Enhanced Authentication System**
```typescript
// lib/auth/enhanced-auth.ts
export class EnhancedAuth {
  static async loginWithRole(email: string, password: string, role: UserRole) {
    // Multi-method authentication
    // Role-based redirect
    // Session management
  }
  
  static async registerByRole(userData: any, role: UserRole) {
    // Role-specific registration
    // Profile creation
    // Department assignment (for doctors)
  }
}
```

### **2.2 Queue Management System**
```typescript
// components/receptionist/QueueManagement.tsx
export function QueueManagement() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Real-time Queue Display */}
      <QueueDisplay />
      
      {/* Patient Check-in */}
      <PatientCheckIn />
      
      {/* Queue Controls */}
      <QueueControls />
      
      {/* Daily Statistics */}
      <DailyStats />
    </div>
  );
}
```

### **2.3 Appointment Management Enhancement**
```typescript
// lib/services/appointment-service.ts
export class AppointmentService {
  static async bookAppointment(data: AppointmentData) {
    // Patient booking
    // Doctor availability check
    // Queue position assignment
    // Notification sending
  }
  
  static async checkInPatient(appointmentId: string, receptionistId: string) {
    // Patient check-in process
    // Queue update
    // Doctor notification
  }
}
```

---

## 📋 **PHASE 3: ROLE-SPECIFIC DASHBOARDS (Tuần 4-5)**

### **3.1 Admin Dashboard**
```typescript
// app/admin/dashboard/page.tsx
export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* System Overview */}
      <SystemOverview />
      
      {/* Revenue Analytics */}
      <RevenueChart />
      
      {/* User Management */}
      <UserManagement />
      
      {/* Department Statistics */}
      <DepartmentStats />
      
      {/* System Health */}
      <SystemHealth />
    </div>
  );
}
```

### **3.2 Doctor Dashboard**
```typescript
// app/doctors/dashboard/page.tsx
export default function DoctorDashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Today's Schedule */}
      <TodaySchedule />
      
      {/* Patient Queue */}
      <PatientQueue />
      
      {/* Quick Actions */}
      <QuickActions />
      
      {/* Recent Medical Records */}
      <RecentRecords />
      
      {/* Performance Metrics */}
      <PerformanceMetrics />
    </div>
  );
}
```

### **3.3 Patient Dashboard**
```typescript
// app/patient/dashboard/page.tsx
export default function PatientDashboard() {
  return (
    <div className="space-y-6">
      {/* Upcoming Appointments */}
      <UpcomingAppointments />
      
      {/* Health Summary */}
      <HealthSummary />
      
      {/* Quick Book Appointment */}
      <QuickBooking />
      
      {/* Payment History */}
      <PaymentHistory />
      
      {/* Medical Records Access */}
      <MedicalRecordsAccess />
    </div>
  );
}
```

### **3.4 Receptionist Dashboard**
```typescript
// app/receptionist/dashboard/page.tsx
export default function ReceptionistDashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Today's Queue */}
      <TodayQueue />
      
      {/* Check-in System */}
      <CheckInSystem />
      
      {/* Appointment Management */}
      <AppointmentManagement />
      
      {/* Daily Operations */}
      <DailyOperations />
    </div>
  );
}
```

---

## 📋 **PHASE 4: ADVANCED FEATURES (Tuần 6-7)**

### **4.1 Real-time Features**
```typescript
// lib/websocket/real-time-updates.ts
export class RealTimeUpdates {
  static setupQueueUpdates() {
    // Real-time queue position updates
    // Wait time estimation
    // Doctor availability changes
  }
  
  static setupNotifications() {
    // Appointment reminders
    // Payment notifications
    // System alerts
  }
}
```

### **4.2 Report Generation**
```typescript
// lib/reports/report-generator.ts
export class ReportGenerator {
  static async generateDailyReport(date: string) {
    // Daily operations summary
    // Revenue report
    // Appointment statistics
  }
  
  static async generateDoctorPerformance(doctorId: string, period: string) {
    // Patient count
    // Revenue generated
    // Average consultation time
  }
}
```

### **4.3 Payment Integration Enhancement**
```typescript
// lib/payment/payos-integration.ts
export class PayOSIntegration {
  static async createPaymentLink(appointmentId: string, amount: number) {
    // Generate PayOS payment link
    // QR code generation
    // Payment tracking
  }
  
  static async handlePaymentCallback(data: any) {
    // Payment verification
    // Appointment status update
    // Receipt generation
  }
}
```

---

## 📋 **PHASE 5: TESTING & OPTIMIZATION (Tuần 8)**

### **5.1 Comprehensive Testing**
```bash
# API Testing
npm run test:api

# Frontend Testing  
npm run test:frontend

# Integration Testing
npm run test:integration

# Performance Testing
npm run test:performance
```

### **5.2 Documentation & Deployment**
```markdown
# Final Documentation
- API Documentation (Swagger)
- User Manuals for each role
- System Architecture Diagram
- Database Schema Documentation
- Deployment Guide
```

---

## 🎯 **SUCCESS METRICS**

| Feature | Target | Current | Status |
|---------|--------|---------|--------|
| **4-Role Authentication** | 100% | 90% | 🟡 |
| **Queue Management** | 100% | 0% | 🔴 |
| **Real-time Updates** | 100% | 70% | 🟡 |
| **Payment Integration** | 100% | 95% | 🟢 |
| **Dashboard Analytics** | 100% | 60% | 🟡 |
| **Mobile Responsive** | 100% | 80% | 🟡 |

---

## 🚀 **NEXT STEPS**

1. **Week 1**: Run database cleanup script
2. **Week 2**: Implement queue management
3. **Week 3**: Enhance role-based dashboards
4. **Week 4**: Add real-time features
5. **Week 5**: Complete testing & documentation

**Target Completion**: 6-8 tuần  
**Expected Score**: 10/10 graduation thesis
