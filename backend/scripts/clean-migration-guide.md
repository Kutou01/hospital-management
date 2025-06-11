# 🧹 CLEAN DATABASE MIGRATION GUIDE
## Giải quyết lỗi cache và rebuild database từ đầu

### 🎯 **MỤC TIÊU**
Giải quyết lỗi: `Could not find the 'date_of_birth' column of 'patients' in the schema cache`

### ❌ **VẤN ĐỀ HIỆN TẠI**
1. `date_of_birth` bị đặt nhầm vào bảng `profiles` thay vì `patients`
2. Supabase cache vẫn lưu cấu trúc cũ
3. Database structure không đúng theo clean design
4. Auth Service không thể tạo patient record

### ✅ **GIẢI PHÁP**
Clean database hoàn toàn và rebuild với cấu trúc đúng

---

## 🚀 **CÁCH THỰC HIỆN**

### **Option 1: Automatic Migration (Recommended)**

```bash
# Chạy trong backend directory
cd backend
node scripts/run-clean-migration.js
```

### **Option 2: Manual Migration (Nếu automatic fails)**

1. **Mở Supabase SQL Editor**
   - Vào Supabase Dashboard
   - Chọn SQL Editor
   - Tạo new query

2. **Copy và execute script**
   ```sql
   -- Copy toàn bộ nội dung từ file:
   backend/scripts/clean-database-migration.sql
   ```

3. **Execute từng phần**
   - Execute từng section một cách cẩn thận
   - Kiểm tra kết quả sau mỗi section

---

## 📋 **CLEAN DESIGN STRUCTURE**

### **🔄 TRƯỚC (Sai)**
```sql
-- profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    email VARCHAR(255),
    full_name VARCHAR(255),
    phone_number VARCHAR(20),
    date_of_birth DATE,  -- ❌ SAI: Nên ở patients
    role VARCHAR(20)
);

-- patients table  
CREATE TABLE patients (
    patient_id VARCHAR(20) PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id),
    medical_history TEXT
    -- ❌ THIẾU: date_of_birth
);
```

### **✅ SAU (Đúng)**
```sql
-- profiles table (SHARED DATA)
CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    email VARCHAR(255),
    full_name VARCHAR(255),
    phone_number VARCHAR(20),
    role VARCHAR(20)
    -- ✅ KHÔNG có date_of_birth
);

-- patients table (PATIENT-SPECIFIC DATA)
CREATE TABLE patients (
    patient_id VARCHAR(20) PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id),
    date_of_birth DATE,  -- ✅ ĐÚNG: Ở patients
    medical_history TEXT,
    gender VARCHAR(20),
    blood_type VARCHAR(5)
);
```

---

## 🔍 **VERIFICATION STEPS**

### **1. Kiểm tra table structure**
```sql
-- Check profiles table (should NOT have date_of_birth)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public';

-- Check patients table (should HAVE date_of_birth)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'patients' AND table_schema = 'public';
```

### **2. Test Auth Service**
```bash
# Start Auth Service
npm run dev:auth

# Test patient registration
node scripts/test-phase3-auth-service.js
```

### **3. Expected Results**
```
✅ profiles table: email, full_name, phone_number, role
✅ patients table: patient_id, profile_id, date_of_birth, medical_history
✅ doctors table: doctor_id, profile_id, specialization, license_number
✅ Patient registration: SUCCESS (no cache errors)
```

---

## 📊 **MIGRATION IMPACT**

### **Data Loss**
- ⚠️ **Tất cả data hiện tại sẽ bị xóa**
- ✅ **Backup được tạo tự động** (profiles_backup_clean, etc.)
- 🔄 **Fresh start với clean design**

### **Benefits**
- ✅ Giải quyết cache issues
- ✅ Cấu trúc database đúng theo clean design
- ✅ No data duplication
- ✅ Proper foreign key relationships
- ✅ Auth Service hoạt động bình thường

---

## 🛠️ **TROUBLESHOOTING**

### **Nếu automatic migration fails:**
```bash
# Check Supabase connection
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Manual execution
# Copy content of clean-database-migration.sql to Supabase SQL Editor
```

### **Nếu vẫn có cache errors:**
1. Clear browser cache
2. Restart Auth Service
3. Check Supabase logs
4. Verify table structure manually

---

## 📝 **NEXT STEPS AFTER MIGRATION**

1. **Start Auth Service**
   ```bash
   npm run dev:auth
   ```

2. **Test Registration**
   ```bash
   node scripts/test-phase3-auth-service.js
   ```

3. **Test Frontend**
   ```bash
   npm run dev
   # Test patient registration form
   ```

4. **Verify Clean Design**
   - Patient registration should work
   - No cache errors
   - Proper data separation

---

## 🎯 **SUCCESS CRITERIA**

✅ Patient registration works without cache errors  
✅ `date_of_birth` correctly stored in patients table  
✅ No data duplication between tables  
✅ Auth Service creates records successfully  
✅ Frontend integration works  

---

## 📞 **SUPPORT**

Nếu gặp vấn đề:
1. Check migration logs
2. Verify Supabase connection
3. Manual execute SQL in Supabase Editor
4. Test each component individually
