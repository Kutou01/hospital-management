# 🏥 Hospital Management System - Sample Data Setup

Hướng dẫn chi tiết để tạo dữ liệu mẫu và tài khoản test cho hệ thống quản lý bệnh viện.

## 📋 Tổng quan

Script này sẽ tạo:
- **7 khoa** (Nội, Ngoại, Sản, Nhi, Tim mạch, Thần kinh, Chấn thương)
- **8 phòng** với các thiết bị y tế
- **1 tài khoản admin**
- **5 tài khoản bác sĩ** 
- **5 tài khoản bệnh nhân**
- **12 lịch hẹn** (quá khứ, hôm nay, tương lai)
- **5 hồ sơ bệnh án** chi tiết
- **6 đơn thuốc** (đã cấp phát và đang chờ)

## 🚀 Cách thực hiện

### Bước 1: Tạo tài khoản test

```bash
# Chạy script tạo tài khoản
cd backend
node scripts/create-test-accounts.js
```

### Bước 2: Chèn dữ liệu mẫu

1. Mở **Supabase Dashboard** → **SQL Editor**
2. Copy toàn bộ nội dung file `backend/scripts/insert-sample-data.sql`
3. Paste vào SQL Editor và chạy

### Bước 3: Kiểm tra dữ liệu

Chạy query kiểm tra trong Supabase SQL Editor:

```sql
SELECT 'Profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'Departments', COUNT(*) FROM departments
UNION ALL
SELECT 'Doctors', COUNT(*) FROM doctors
UNION ALL
SELECT 'Patients', COUNT(*) FROM patients
UNION ALL
SELECT 'Appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'Medical Records', COUNT(*) FROM medical_records
UNION ALL
SELECT 'Prescriptions', COUNT(*) FROM prescriptions
UNION ALL
SELECT 'Rooms', COUNT(*) FROM rooms;
```

## 🔐 Tài khoản test

### 👨‍💼 Admin Account
- **Email**: `admin@hospital.com`
- **Password**: `Admin123!@#`
- **Dashboard**: `/admin/dashboard`

### 👨‍⚕️ Doctor Accounts
- **Email**: `doctor1@hospital.com` | **Password**: `Doctor123!@#`
- **Email**: `doctor2@hospital.com` | **Password**: `Doctor123!@#`
- **Dashboard**: `/doctor/dashboard`

### 🏥 Patient Accounts  
- **Email**: `patient1@gmail.com` | **Password**: `Patient123!@#`
- **Email**: `patient2@gmail.com` | **Password**: `Patient123!@#`
- **Dashboard**: `/patient/dashboard`

## 📊 Dữ liệu mẫu chi tiết

### 🏢 Departments (7 khoa)
- Khoa Nội - Tầng 2, Tòa A
- Khoa Ngoại - Tầng 3, Tòa A  
- Khoa Sản - Tầng 4, Tòa B
- Khoa Nhi - Tầng 1, Tòa B
- Khoa Tim mạch - Tầng 5, Tòa A
- Khoa Thần kinh - Tầng 6, Tòa A
- Khoa Chấn thương chỉnh hình - Tầng 2, Tòa B

### 🏠 Rooms (8 phòng)
- Phòng khám: 101, 102, 201, 301, 401, 501
- Phòng phẫu thuật: 202
- Phòng thủ thuật: 502

### 👨‍⚕️ Doctors (5 bác sĩ)
- **BS. Nguyễn Văn A** - Nội khoa (10 năm kinh nghiệm)
- **BS. Trần Thị B** - Phẫu thuật (15 năm kinh nghiệm)
- **BS. Lê Văn C** - Sản phụ khoa (8 năm kinh nghiệm)
- **BS. Phạm Thị D** - Nhi khoa (12 năm kinh nghiệm)
- **BS. Hoàng Văn E** - Tim mạch (20 năm kinh nghiệm)

### 🏥 Patients (5 bệnh nhân)
- **Nguyễn Thị Hoa** (1990) - Cao huyết áp
- **Trần Văn Nam** (1985) - Tiểu đường type 2
- **Lê Thị Mai** (1995) - Khỏe mạnh
- **Phạm Văn Đức** (1978) - Bệnh tim mạch
- **Hoàng Thị Lan** (2010) - Trẻ em khỏe mạnh

### 📅 Appointments (12 lịch hẹn)
- **5 lịch hẹn** đã hoàn thành (tháng 1/2024)
- **4 lịch hẹn** hôm nay (confirmed/pending)
- **3 lịch hẹn** tương lai

### 📋 Medical Records (5 hồ sơ)
- Hồ sơ cao huyết áp với đơn thuốc Amlodipine
- Hồ sơ tiểu đường với đơn thuốc Metformin
- Hồ sơ viêm ruột thừa cần phẫu thuật
- Hồ sơ bệnh tim mạch với đơn thuốc tim
- Hồ sơ khám sức khỏe trẻ em

### 💊 Prescriptions (6 đơn thuốc)
- **4 đơn đã cấp phát**: Amlodipine, Metformin, Ceftriaxone, thuốc tim
- **2 đơn đang chờ**: Tái cấp thuốc cho bệnh nhân cũ

## 🧪 Test các tính năng

### Admin Dashboard
- Xem tổng quan hệ thống
- Quản lý bác sĩ/bệnh nhân
- Thống kê lịch hẹn
- Theo dõi doanh thu

### Doctor Dashboard  
- Xem lịch hẹn hôm nay
- Quản lý bệnh nhân
- Tạo hồ sơ bệnh án
- Kê đơn thuốc

### Patient Dashboard
- Xem lịch hẹn sắp tới
- Theo dõi sức khỏe
- Xem đơn thuốc
- Lịch sử khám bệnh

## 🔧 Troubleshooting

### Lỗi tạo tài khoản
```bash
# Kiểm tra biến môi trường
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Chạy lại script
node scripts/create-test-accounts.js
```

### Lỗi chèn dữ liệu
- Đảm bảo đã tạo tài khoản trước
- Kiểm tra UUID trong profiles table
- Chạy từng phần của SQL script

### Lỗi đăng nhập
- Kiểm tra email/password chính xác
- Xác nhận tài khoản đã được tạo trong Supabase Auth
- Kiểm tra role trong profiles table

## 📱 URLs để test

- **Login**: http://localhost:3000/auth/login
- **Register**: http://localhost:3000/auth/register
- **Admin**: http://localhost:3000/admin/dashboard
- **Doctor**: http://localhost:3000/doctor/dashboard  
- **Patient**: http://localhost:3000/patient/dashboard

## 🎯 Kết quả mong đợi

Sau khi setup thành công:
- ✅ 11 tài khoản trong Supabase Auth
- ✅ Dữ liệu đầy đủ trong tất cả bảng
- ✅ Có thể đăng nhập với 3 role khác nhau
- ✅ Dashboard hiển thị dữ liệu thực tế
- ✅ Các tính năng CRUD hoạt động bình thường

## 🔄 Reset dữ liệu

Để xóa và tạo lại dữ liệu:

```sql
-- Xóa dữ liệu (chạy trong Supabase SQL Editor)
DELETE FROM medical_records;
DELETE FROM prescriptions;
DELETE FROM appointments;
DELETE FROM patients;
DELETE FROM doctors;
DELETE FROM admins;
DELETE FROM departments;
DELETE FROM rooms;
DELETE FROM profiles;
```

Sau đó chạy lại script tạo tài khoản và chèn dữ liệu.
