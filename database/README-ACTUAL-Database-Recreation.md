# Hospital Management System - ACTUAL Database Recreation Guide

## Overview
Script này được tạo dựa trên **cấu trúc database thực tế** từ Supabase hiện tại (kiểm tra ngày 29/06/2025). Đây là script chính xác 100% để tái tạo database hospital management system của bạn.

## ⚠️ Khác biệt so với script cũ

### 🆕 Bảng mới được phát hiện:
1. **`specialties`** - Quản lý chuyên khoa y tế (không có trong script cũ)
2. **`rooms`** - Quản lý phòng khám/phòng bệnh (không có trong script cũ)

### 🔄 Cấu trúc bảng đã được cập nhật:
1. **`doctors`** - Thêm `specialty_id`, cấu trúc `specialty` khác
2. **`appointments`** - Thêm `prescription`, `follow_up_required`, `room_id`, `department_id`
3. **`doctor_reviews`** - Sử dụng `review_id` thay vì `id`
4. **`patients`** - `allergies` và `chronic_conditions` là arrays
5. **`departments`** - Nhiều cột legacy để tương thích

## 📊 Cấu trúc Database Thực Tế

### 🏗️ Core Tables (9 bảng chính)
1. **profiles** (86 records) - Base user profiles cho tất cả users
2. **departments** (13 records) - Các khoa bệnh viện
3. **specialties** (27 records) - Chuyên khoa y tế với fee ranges
4. **doctors** (42 records) - Hồ sơ bác sĩ với thông tin chuyên môn
5. **patients** (38 records) - Hồ sơ bệnh nhân với thông tin y tế
6. **appointments** (10 records) - Lịch hẹn khám bệnh
7. **medical_records** (0 records) - Hồ sơ bệnh án (trống)
8. **doctor_reviews** (3 records) - Đánh giá bác sĩ
9. **rooms** (5 records) - Phòng khám/phòng bệnh

### 🔑 ID Patterns (Dựa trên data thực tế)
- **Doctor**: `EMER-DOC-202506-001` (Department-based)
- **Patient**: `PAT-202506-550`
- **Appointment**: `APT-202506-335001` (6-digit sequence)
- **Review**: `REV-202506-001`
- **Room**: `CARD-ROOM-001`
- **Specialty**: `SPEC028`

## 🚀 Cách sử dụng

### Bước 1: Chạy script
```sql
-- Chạy file hospital-database-recreation-ACTUAL.sql trong Supabase SQL editor
-- Script an toàn, có thể chạy nhiều lần (idempotent)
```

### Bước 2: Kiểm tra cài đặt
```sql
-- Kiểm tra tất cả bảng đã được tạo
SELECT * FROM verify_hospital_database_actual();

-- Kiểm tra tất cả functions đã được tạo
SELECT * FROM verify_hospital_functions_actual();
```

### Bước 3: Kiểm tra seed data
```sql
-- Kiểm tra departments
SELECT department_id, department_name, department_code FROM departments ORDER BY department_id;

-- Kiểm tra specialties
SELECT specialty_id, specialty_name, department_id FROM specialties ORDER BY specialty_id;
```

## 🎯 Tính năng chính

### 🔐 Bảo mật
- **Row Level Security (RLS)** cho tất cả bảng nhạy cảm
- **Role-based access control**:
  - `service_role`: Full access cho backend services
  - `authenticated`: Limited access cho users đã đăng nhập
  - `anon`: Read-only access cho public data

### 📈 Performance
- **Comprehensive indexing** trên tất cả foreign keys
- **Optimized queries** cho các operations thường dùng
- **Efficient joins** giữa các bảng liên quan

### 🔄 Automation
- **Timestamp triggers**: `updated_at` tự động cập nhật
- **Foreign key constraints**: Đảm bảo data integrity
- **Check constraints**: Validation cho enums và ranges

## 🌟 Điểm nổi bật

### 🇻🇳 Vietnamese Hospital Context
- Tên khoa bằng tiếng Việt
- Chuyên khoa phù hợp với y tế Việt Nam
- Fee ranges theo thị trường Việt Nam
- Timezone Asia/Ho_Chi_Minh

### 🏥 Medical Workflow Complete
- Quy trình từ đăng ký bệnh nhân đến khám bệnh
- Quản lý lịch hẹn với phòng khám
- Hệ thống đánh giá bác sĩ
- Quản lý chuyên khoa và departments

### 🔧 Developer Friendly
- ID generation functions cho tất cả entities
- Verification functions để troubleshooting
- Comprehensive error handling
- Compatible với microservices architecture

## 📋 Seed Data

### Departments (13 khoa)
- Khoa Tim Mạch (CARD)
- Khoa Chấn Thương Chỉnh Hình (ORTH)
- Khoa Nhi (PEDI)
- Khoa Thần Kinh (NEUR)
- Khoa Da Liễu (DERM)
- Khoa Phụ Sản (GYNE)
- Khoa Cấp Cứu (EMER)
- Khoa Nội Tổng Hợp (GENE)
- Khoa Ngoại Tổng Hợp (SURG)
- Khoa Mắt (OPHT)
- Khoa Tai Mũi Họng (ENT)
- Khoa Tâm Thần (PSYC)
- Khoa Sản phụ khoa (OBGY)

### Specialties (13 chuyên khoa)
Mỗi chuyên khoa có:
- Fee range (min/max)
- Average consultation time
- Department mapping

## 🔧 Maintenance

### Kiểm tra định kỳ
```sql
-- Kiểm tra data integrity
SELECT COUNT(*) as total_doctors FROM doctors WHERE is_active = true;
SELECT COUNT(*) as total_patients FROM patients WHERE status = 'active';
SELECT COUNT(*) as pending_appointments FROM appointments WHERE status = 'scheduled';
```

### Backup recommendations
```sql
-- Backup critical tables
pg_dump --table=profiles --table=doctors --table=patients --table=appointments your_database > backup.sql
```

## 🆘 Troubleshooting

### Lỗi thường gặp
1. **Permission Errors**: Đảm bảo chạy với service_role
2. **Foreign Key Violations**: Kiểm tra seed data dependencies
3. **RLS Blocking**: Sử dụng service_role cho admin operations

### Reset hoàn toàn (NGUY HIỂM!)
```sql
-- Chỉ dùng khi cần reset hoàn toàn
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- Sau đó chạy lại script recreation
```

---
**Tạo**: 29/06/2025  
**Phiên bản**: ACTUAL-1.0  
**Tương thích**: Supabase PostgreSQL 14+  
**Dựa trên**: Cấu trúc database thực tế từ Supabase
