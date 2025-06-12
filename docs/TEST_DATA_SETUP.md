# 🗃️ Test Data Setup Guide

## 📋 Overview

This guide helps you set up comprehensive test data for testing Doctor and Patient services. The test data includes realistic Vietnamese hospital data with proper relationships between doctors, patients, appointments, and medical records.

## 🎯 What Test Data Includes

### **👨‍⚕️ Doctors (3 doctors):**
- **BS. Nguyễn Văn Tâm** - Tim mạch (Cardiology) - 15 years experience
- **BS. Trần Thị Thủy** - Nhi khoa (Pediatrics) - 12 years experience  
- **BS. Lê Văn Đức** - Thần kinh (Neurology) - 18 years experience

### **👤 Patients (3 patients):**
- **Nguyễn Văn A** - Male, O+ blood type, Hypertension history
- **Trần Thị C** - Female, A+ blood type, Mother of 2
- **Lê Văn E** - Male, B+ blood type, Young healthy patient

### **🏥 Departments:**
- CARD - Tim mạch (Cardiology)
- NEUR - Thần kinh (Neurology)
- PEDI - Nhi khoa (Pediatrics)
- ORTH - Chấn thương chỉnh hình (Orthopedics)
- DERM - Da liễu (Dermatology)

### **📅 Sample Data:**
- Doctor schedules (Monday-Friday, 8AM-5PM)
- Appointments (scheduled and completed)
- Medical records with Vietnamese diagnoses
- Doctor reviews and ratings
- Complete profile information

## 🚀 Quick Setup

### **Method 1: One-Command Setup**

```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not already done)
npm install

# Seed all test data
npm run db:seed
```

### **Method 2: Step-by-Step Setup**

```bash
# 1. Navigate to backend
cd backend

# 2. Check current database status
npm run db:verify

# 3. Seed test data
npm run db:seed

# 4. Verify data was created
npm run db:verify
```

## 🔍 Verification

### **Check if data was created successfully:**

```bash
# Run verification script
cd backend && npm run db:verify
```

**Expected output:**
```
🔍 Verifying test data...

🏥 DEPARTMENTS:
===============
✅ Found 5 departments:
  1. CARD - Tim mạch
  2. NEUR - Thần kinh
  3. PEDI - Nhi khoa
  4. ORTH - Chấn thương chỉnh hình
  5. DERM - Da liễu

👨‍⚕️ DOCTORS:
==============
✅ Found 3 doctors:
  1. CARD-DOC-202412-001
     Name: BS. Nguyễn Văn Tâm
     Email: bs.nguyen.tim@hospital.com
     Specialty: Tim mạch
     Department: CARD
     Rating: 4.8/5 (25 reviews)

👤 PATIENTS:
============
✅ Found 3 patients:
  1. PAT-202412-001
     Name: Nguyễn Văn A
     Email: nguyen.van.a@gmail.com
     DOB: 1990-03-15
     Gender: male
     Blood Type: O+
     Status: active

📅 APPOINTMENTS:
================
✅ Found 2 appointments:
  1. APT-202412-001
     Doctor: BS. Nguyễn Văn Tâm
     Patient: Nguyễn Văn A
     Date: 2024-12-12
     Time: 09:00
     Status: scheduled
     Type: consultation

🎉 Test data verification completed!
```

## 🔑 Test Accounts

### **Doctor Accounts:**
```
Email: bs.nguyen.tim@hospital.com
Password: doctor123456
Role: Doctor (Cardiology)

Email: bs.tran.thuy@hospital.com  
Password: doctor123456
Role: Doctor (Pediatrics)

Email: bs.le.duc@hospital.com
Password: doctor123456
Role: Doctor (Neurology)
```

### **Patient Accounts:**
```
Email: nguyen.van.a@gmail.com
Password: patient123456
Role: Patient

Email: tran.thi.c@gmail.com
Password: patient123456
Role: Patient

Email: le.van.e@gmail.com
Password: patient123456
Role: Patient
```

## 🧪 Testing with Data

### **1. Test Patient APIs:**
```bash
# Frontend UI test
http://localhost:3000/test/patient-api

# Node.js script test
cd frontend && npm run test:patient-api
```

### **2. Test Doctor APIs:**
```bash
# Frontend UI test
http://localhost:3000/test/doctor-api

# Node.js script test
cd frontend && npm run test:doctor-api
```

### **3. Login and Test Manually:**
```bash
# Start frontend
cd frontend && npm run dev

# Login with any test account
http://localhost:3000/auth/login

# Navigate to different sections
http://localhost:3000/dashboard
http://localhost:3000/patients
http://localhost:3000/doctors
http://localhost:3000/appointments
```

## 🔧 Data Management

### **Cleanup Test Data:**
```bash
# Interactive cleanup (with confirmation)
cd backend && npm run db:cleanup

# Force cleanup (no confirmation)
cd backend && node scripts/cleanup-test-data.js --force
```

### **Re-seed Data:**
```bash
# Clean and re-seed
cd backend
npm run db:cleanup
npm run db:seed
npm run db:verify
```

### **Check Data Status:**
```bash
# Quick verification
cd backend && npm run db:verify

# Database status
cd backend && npm run db:check
```

## 📊 Data Relationships

### **Doctor → Patient Relationships:**
- Each doctor has scheduled appointments with patients
- Medical records link doctors and patients
- Reviews connect patients to doctors they've seen

### **Appointment Flow:**
```
Patient → Books Appointment → Doctor
Doctor → Sees Patient → Creates Medical Record
Patient → Leaves Review → Doctor Rating Updated
```

### **Department Structure:**
```
Department → Has Multiple Doctors
Doctor → Has Schedule (Mon-Fri)
Doctor → Has Specialties and Qualifications
Doctor → Has Reviews and Ratings
```

## 🐛 Troubleshooting

### **Issue: "No departments found"**
```bash
# Check if departments table exists
cd backend && npm run db:check

# Re-run database setup if needed
cd backend && npm run db:deploy-complete
```

### **Issue: "Authentication failed"**
```bash
# Check Supabase connection
# Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
```

### **Issue: "Foreign key constraint"**
```bash
# Clean up in correct order
cd backend && npm run db:cleanup

# Re-seed data
cd backend && npm run db:seed
```

### **Issue: "User already exists"**
```bash
# Clean up existing users first
cd backend && npm run db:cleanup

# Or use force cleanup
cd backend && node scripts/cleanup-test-data.js --force
```

## 📈 Performance Testing

### **Load Testing with Data:**
```bash
# Test with multiple concurrent requests
cd frontend
for i in {1..10}; do npm run test:patient-api & done
wait

# Test doctor search performance
curl "http://localhost:3100/api/doctors/search?q=tim"
```

### **Database Performance:**
```bash
# Check query performance in Supabase dashboard
# Monitor response times during API tests
# Verify indexes are working correctly
```

## 🎯 Next Steps

After setting up test data:

1. **Test Patient Service APIs** - Verify CRUD operations
2. **Test Doctor Service APIs** - Verify profile management
3. **Test Appointment Booking** - End-to-end workflow
4. **Test Search Functionality** - Doctor and patient search
5. **Test Authentication** - Login with different roles
6. **Performance Testing** - Load testing with realistic data

## 📝 Data Schema

### **Key Tables Populated:**
- `profiles` - User profiles for doctors and patients
- `doctors` - Doctor-specific information
- `patients` - Patient-specific information  
- `departments` - Hospital departments
- `doctor_schedules` - Doctor availability
- `appointments` - Scheduled appointments
- `medical_records` - Patient medical history
- `doctor_reviews` - Patient reviews of doctors

### **ID Formats:**
- **Doctors**: `DEPT-DOC-YYYYMM-XXX` (e.g., `CARD-DOC-202412-001`)
- **Patients**: `PAT-YYYYMM-XXX` (e.g., `PAT-202412-001`)
- **Appointments**: `APT-YYYYMM-XXX` (e.g., `APT-202412-001`)

**🎉 Your test data is now ready for comprehensive testing!**
