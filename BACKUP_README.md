# 🛡️ BACKUP HOSPITAL DEV SCHEMA

## 📅 **Backup Date:** 2025-06-27

## ✅ **Backup Status:** HOÀN THÀNH

---

## 📋 **Nội dung Backup:**

### **1. Database Schema:**
- **Schema:** `hospital_dev`
- **Tables:** 8 bảng
  - `profiles` (copy từ public)
  - `doctors` (copy từ public)
  - `patients` (copy từ public)
  - `appointments` (copy từ public)
  - `specialties` (copy từ public + data)
  - `departments` (copy từ public + data)
  - `doctor_available_slots` (mới tạo)
  - `chatbot_appointment_sessions` (mới tạo)

### **2. Functions:**
- `get_available_slots(doctor_id, date)` - Lấy time slots available
- `create_appointment_simple(doctor_id, patient_id, date, time, notes)` - Tạo appointment
- `create_booking_session(patient_id)` - Tạo session chatbot

### **3. Test Data:**
- **1 Doctor:** DOC-TEST-001 (BS. Nguyễn Văn Test)
- **1 Patient:** PAT-TEST-001 (Trần Thị Test)
- **32 Time Slots:** 16 slots/ngày × 2 ngày (ngày mai + ngày kia)
- **Indexes:** 3 indexes cho performance

### **4. Appointments Created:**
- APPT-DEV-202506-742: 28/06/2025, 09:00-09:30
- APPT-DEV-202506-541: 28/06/2025, 10:00-10:30

---

## 🔄 **Cách Restore:**

### **Option 1: Restore toàn bộ**
```sql
-- Chạy file backup-hospital-dev-schema.sql
\i backup-hospital-dev-schema.sql
```

### **Option 2: Restore từng phần**
```sql
-- Chỉ restore cấu trúc
-- Copy phần CREATE TABLE từ backup file

-- Chỉ restore functions
-- Copy phần CREATE OR REPLACE FUNCTION từ backup file

-- Chỉ restore data
-- Copy phần INSERT INTO từ backup file
```

---

## ⚠️ **Lưu ý quan trọng:**

1. **Schema `hospital_dev` là development environment**
   - An toàn để test
   - Không ảnh hưởng production data
   - Có thể xóa và tạo lại bất cứ lúc nào

2. **Functions đã được test:**
   - ✅ `get_available_slots()` - Hoạt động tốt
   - ✅ `create_appointment_simple()` - Tạo appointment thành công
   - ✅ `create_booking_session()` - Tạo session thành công

3. **Time Slots:**
   - Chỉ tạo cho ngày làm việc (thứ 2-6)
   - Bỏ qua giờ nghỉ trưa (12:00-13:00)
   - Mỗi slot 30 phút
   - Có thể book 1 patient/slot

---

## 🚀 **Sẵn sàng cho bước tiếp theo:**

Với backup này, bạn có thể:
- ✅ Phát triển chatbot booking APIs
- ✅ Tạo frontend chat widget
- ✅ Test booking flow
- ✅ Rollback nếu có lỗi

---

## 📞 **Support:**

Nếu cần restore hoặc có vấn đề:
1. Chạy `backup-hospital-dev-schema.sql`
2. Kiểm tra bằng: `SELECT * FROM hospital_dev.get_available_slots('DOC-TEST-001', CURRENT_DATE + 1);`
3. Test appointment: `SELECT * FROM hospital_dev.create_appointment_simple('DOC-TEST-001', 'PAT-TEST-001', CURRENT_DATE + 1, TIME '14:00', 'Test restore');`

**Backup hoàn tất! Sẵn sàng phát triển tính năng mới! 🎉**
