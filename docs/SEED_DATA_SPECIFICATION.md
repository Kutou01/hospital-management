# 📊 Seed Data Specification & Analysis

## 🎯 Overview

This document describes the comprehensive seed data structure, patterns, and relationships created for the Hospital Management System. The data follows Vietnamese hospital standards with realistic medical scenarios.

## 📋 Data Structure Summary

### **🏥 Departments (5 departments)**
```
CARD - Tim mạch (Cardiology)
NEUR - Thần kinh (Neurology)  
PEDI - Nhi khoa (Pediatrics)
ORTH - Chấn thương chỉnh hình (Orthopedics)
DERM - Da liễu (Dermatology)
```

### **👨‍⚕️ Doctors (100 doctors - 20 per department)**
```
Distribution:
- Cardiology: 20 doctors
- Neurology: 20 doctors
- Pediatrics: 20 doctors
- Orthopedics: 20 doctors
- Dermatology: 20 doctors

Demographics:
- Gender: 60% male, 40% female
- Age: 30-55 years old
- Experience: 1-30 years
- Consultation Fee: 300,000-800,000 VND
```

### **👤 Patients (30 patients)**
```
Demographics:
- Age Range: 18-80 years old
- Gender: 50% male, 50% female
- Blood Types: A+, A-, B+, B-, AB+, AB-, O+, O-
- Locations: Ho Chi Minh City districts
- Medical Histories: Diverse conditions
```

### **📅 Appointments (50 appointments)**
```
Time Range: Past 30 days to future 30 days
Status Distribution:
- scheduled: ~40%
- completed: ~40% 
- cancelled: ~20%

Types:
- consultation: ~40%
- follow_up: ~30%
- emergency: ~15%
- routine_checkup: ~15%
```

### **📋 Medical Records (30 records)**
```
Linked to completed appointments
Vietnamese medical terminology
Realistic diagnoses and treatments
Complete treatment plans
```

### **⭐ Doctor Reviews (150 reviews)**
```
Rating Distribution (weighted positive):
- 5 stars: 35% (52 reviews)
- 4 stars: 35% (52 reviews)
- 3 stars: 15% (23 reviews)
- 2 stars: 10% (15 reviews)
- 1 star: 5% (8 reviews)

Average Rating: ~4.0/5
Verification Rate: 80%
```

## 🔗 Data Relationships & Foreign Keys

### **Primary Relationships:**
```
profiles (id) ←── doctors (profile_id)
profiles (id) ←── patients (profile_id)
departments (dept_id) ←── doctors (department_id)
doctors (doctor_id) ←── appointments (doctor_id)
patients (patient_id) ←── appointments (patient_id)
appointments (appointment_id) ←── medical_records (appointment_id)
doctors (doctor_id) ←── doctor_schedules (doctor_id)
doctors (doctor_id) ←── doctor_reviews (doctor_id)
patients (patient_id) ←── doctor_reviews (patient_id)
```

### **Referential Integrity:**
- ✅ All doctors have valid profiles and departments
- ✅ All patients have valid profiles
- ✅ All appointments have valid doctors and patients
- ✅ All medical records have valid appointments
- ✅ All schedules have valid doctors
- ✅ All reviews have valid doctors and patients

## 📝 ID Patterns & Validation

### **Doctor IDs:**
```
Pattern: DEPT-DOC-YYYYMM-XXX
Examples:
- CARD-DOC-202412-001 (Cardiology doctor #1)
- NEUR-DOC-202412-015 (Neurology doctor #15)
- PEDI-DOC-202412-020 (Pediatrics doctor #20)

Validation: /^[A-Z]{3,4}-DOC-\d{6}-\d{3}$/
```

### **Patient IDs:**
```
Pattern: PAT-YYYYMM-XXX
Examples:
- PAT-202412-001 (Patient #1)
- PAT-202412-030 (Patient #30)

Validation: /^PAT-\d{6}-\d{3}$/
```

### **Appointment IDs:**
```
Pattern: APT-YYYYMM-XXX
Examples:
- APT-202412-001 (Appointment #1)
- APT-202412-050 (Appointment #50)

Validation: /^APT-\d{6}-\d{3}$/
```

### **Medical Record IDs:**
```
Pattern: MR-YYYYMM-XXX
Examples:
- MR-202412-001 (Medical Record #1)
- MR-202412-030 (Medical Record #30)

Validation: /^MR-\d{6}-\d{3}$/
```

### **License Numbers:**
```
Pattern: VN-DEPT-YYYY-XXX
Examples:
- VN-CARD-1980-001 (Cardiology license)
- VN-NEUR-1985-015 (Neurology license)

Validation: /^VN-[A-Z]{3,4}-\d{4}-\d{3}$/
```

## 👥 Profile Data Patterns

### **Doctor Profiles:**
```
Email Pattern: bs.firstname.lastname@hospital.com
Examples:
- bs.nguyen.tam@hospital.com
- bs.tran.thuy@hospital.com

Phone Pattern: 090XXXXXXX
Names: Vietnamese doctor names with "BS." prefix
Roles: All set to "doctor"
```

### **Patient Profiles:**
```
Email Pattern: firstname.lastname@gmail.com
Examples:
- nguyen.van.a@gmail.com
- tran.thi.c@gmail.com

Phone Pattern: 098XXXXXXX
Names: Vietnamese patient names (no prefix)
Roles: All set to "patient"
```

## 🏥 Medical Data Patterns

### **Specialties by Department:**
```
Cardiology (CARD):
- Tim mạch
- Tim mạch can thiệp
- Siêu âm tim

Neurology (NEUR):
- Thần kinh
- Thần kinh cột sống
- Đột quỵ

Pediatrics (PEDI):
- Nhi khoa
- Nhi tim mạch
- Nhi hô hấp

Orthopedics (ORTH):
- Chấn thương chỉnh hình
- Cột sống
- Khớp

Dermatology (DERM):
- Da liễu
- Thẩm mỹ da
- Dị ứng da
```

### **Medical Terminology (Vietnamese):**
```
Chief Complaints:
- Đau đầu, chóng mặt
- Ho, sốt nhẹ
- Đau bụng, buồn nôn
- Khó thở, đau ngực
- Đau lưng, tê chân

Diagnoses:
- Tăng huyết áp nhẹ
- Viêm đường hô hấp trên
- Viêm dạ dày cấp
- Rối loạn nhịp tim
- Thoát vị đĩa đệm

Treatment Plans:
- Thuốc hạ huyết áp, theo dõi huyết áp hàng ngày
- Kháng sinh, thuốc ho, nghỉ ngơi
- Thuốc kháng acid, chế độ ăn nhẹ
```

## 📍 Address Data Patterns

### **Patient Addresses (JSON):**
```json
{
  "street": "123 Nguyễn Huệ",
  "district": "Quận 1", 
  "city": "TP. Hồ Chí Minh"
}
```

### **Districts Used:**
```
Quận 1, Quận 2, Quận 3, Quận 4, Quận 5, Quận 6, Quận 7, Quận 8, 
Quận 9, Quận 10, Quận 11, Quận 12, Quận Bình Thạnh, Quận Gò Vấp, 
Quận Phú Nhuận, Quận Tân Bình, Quận Tân Phú
```

### **Streets Used:**
```
Nguyễn Huệ, Lê Lợi, Võ Văn Tần, Hai Bà Trưng, Nguyễn Thị Minh Khai,
Cách Mạng Tháng 8, Lý Tự Trọng, Pasteur, Điện Biên Phủ, Nguyễn Du
```

## 🩸 Medical Data Patterns

### **Blood Types Distribution:**
```
A+, A-, B+, B-, AB+, AB-, O+, O-
Realistic distribution matching Vietnamese population
```

### **Allergies (Array):**
```
Common: []
Single: ["penicillin"], ["seafood"], ["peanuts"]
Multiple: ["penicillin", "sulfa"]
```

### **Emergency Contacts (JSON):**
```json
{
  "name": "Nguyễn Thị B",
  "phone": "0987654322", 
  "relationship": "spouse"
}
```

### **Relationships Used:**
```
spouse, parent, child, sibling, friend
```

## 📅 Schedule Patterns

### **Doctor Schedules:**
```
Working Days: Monday-Friday (1-5)
Working Hours: 08:00-17:00
Break Time: 12:00-13:00
Slot Duration: 30 minutes
Max Appointments: 16 per day
Total Schedule Entries: 500 (100 doctors × 5 days)
```

### **Appointment Times:**
```
Time Slots: 08:00, 08:30, 09:00, 09:30, ..., 16:30
Lunch Break: 12:00-13:00 (no appointments)
Format: HH:MM (24-hour format)
```

## 🔍 Data Quality Validation

### **Completeness:**
- ✅ All required fields populated
- ✅ All foreign keys valid
- ✅ No orphaned records
- ✅ Proper data types

### **Consistency:**
- ✅ ID patterns followed
- ✅ Email formats correct
- ✅ Phone number formats consistent
- ✅ Date formats standardized

### **Realism:**
- ✅ Vietnamese names and terminology
- ✅ Realistic medical scenarios
- ✅ Appropriate age distributions
- ✅ Logical appointment scheduling

### **Relationships:**
- ✅ All foreign key constraints satisfied
- ✅ Proper dependency order maintained
- ✅ No circular references
- ✅ Referential integrity preserved

## 🧪 Testing Scenarios Enabled

### **Doctor Management:**
- Search by specialty, department, name
- Filter by availability, rating, experience
- View complete profiles with schedules
- Manage appointments and reviews

### **Patient Management:**
- Search by name, phone, patient ID
- View medical history and allergies
- Manage emergency contacts
- Track appointments and records

### **Appointment System:**
- Book appointments with available doctors
- View schedules and time slots
- Handle different appointment types
- Track appointment status changes

### **Medical Records:**
- Create records for completed appointments
- Search by diagnosis, treatment
- Link to specific appointments
- Track patient medical history

### **Analytics & Reporting:**
- Doctor performance metrics
- Patient demographics
- Appointment statistics
- Review analysis

**🎉 This seed data provides a comprehensive, realistic foundation for testing all Hospital Management System features!**
