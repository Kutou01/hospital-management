# 🔗 Foreign Key Integrity Guide

## 📋 Overview

This guide ensures proper foreign key relationships and referential integrity when seeding test data. All data insertions must respect database constraints to avoid foreign key violations.

## 🔗 Foreign Key Relationships

### **Core Relationships:**

```
profiles (id) ←── doctors (profile_id)
profiles (id) ←── patients (profile_id)

departments (dept_id) ←── doctors (department_id)

doctors (doctor_id) ←── appointments (doctor_id)
patients (patient_id) ←── appointments (patient_id)

doctors (doctor_id) ←── medical_records (doctor_id)
patients (patient_id) ←── medical_records (patient_id)
appointments (appointment_id) ←── medical_records (appointment_id)

doctors (doctor_id) ←── doctor_schedules (doctor_id)

doctors (doctor_id) ←── doctor_reviews (doctor_id)
patients (patient_id) ←── doctor_reviews (patient_id)
```

### **Dependency Chain:**
```
1. departments (no dependencies)
2. profiles (no dependencies)
3. doctors (requires: profiles, departments)
4. patients (requires: profiles)
5. doctor_schedules (requires: doctors)
6. appointments (requires: doctors, patients)
7. medical_records (requires: doctors, patients, appointments)
8. doctor_reviews (requires: doctors, patients)
```

## 🚀 Seeding Process

### **Step 1: Verify Constraints**
```bash
# Check foreign key constraints
cd backend && npm run db:check-fk

# Verify schema is ready
npm run db:verify-schema
```

### **Step 2: Seed Data in Correct Order**
```bash
# Seed all data with proper foreign key handling
npm run db:seed
```

### **Step 3: Verify Data Integrity**
```bash
# Verify all data was created correctly
npm run db:verify
```

## 🔧 Constraint Validation

### **Before Seeding:**
- ✅ All required tables exist
- ✅ All foreign key columns exist
- ✅ Referenced tables have data (departments)
- ✅ Proper column data types

### **During Seeding:**
- ✅ Create auth users before profiles
- ✅ Create profiles before doctors/patients
- ✅ Create departments before doctors
- ✅ Create doctors/patients before appointments
- ✅ Create appointments before medical records
- ✅ Validate foreign key values exist

### **After Seeding:**
- ✅ All foreign key relationships intact
- ✅ No orphaned records
- ✅ Referential integrity maintained

## 📊 Data Validation Rules

### **Profiles → Doctors/Patients:**
```sql
-- Every doctor must have a valid profile
SELECT d.doctor_id, d.profile_id 
FROM doctors d 
LEFT JOIN profiles p ON d.profile_id = p.id 
WHERE p.id IS NULL;
-- Should return 0 rows

-- Every patient must have a valid profile
SELECT pt.patient_id, pt.profile_id 
FROM patients pt 
LEFT JOIN profiles p ON pt.profile_id = p.id 
WHERE p.id IS NULL;
-- Should return 0 rows
```

### **Departments → Doctors:**
```sql
-- Every doctor must have a valid department
SELECT d.doctor_id, d.department_id 
FROM doctors d 
LEFT JOIN departments dept ON d.department_id = dept.dept_id 
WHERE dept.dept_id IS NULL;
-- Should return 0 rows
```

### **Doctors/Patients → Appointments:**
```sql
-- Every appointment must have valid doctor and patient
SELECT a.appointment_id, a.doctor_id, a.patient_id
FROM appointments a 
LEFT JOIN doctors d ON a.doctor_id = d.doctor_id 
LEFT JOIN patients p ON a.patient_id = p.patient_id 
WHERE d.doctor_id IS NULL OR p.patient_id IS NULL;
-- Should return 0 rows
```

### **Appointments → Medical Records:**
```sql
-- Every medical record must have valid appointment (if specified)
SELECT mr.record_id, mr.appointment_id
FROM medical_records mr 
LEFT JOIN appointments a ON mr.appointment_id = a.appointment_id 
WHERE mr.appointment_id IS NOT NULL AND a.appointment_id IS NULL;
-- Should return 0 rows
```

## 🐛 Common Issues & Solutions

### **Issue: "Foreign key constraint violation"**
```
ERROR: insert or update on table "doctors" violates foreign key constraint
```

**Solutions:**
1. **Check if referenced data exists:**
   ```bash
   # Check if departments exist
   npm run db:verify
   ```

2. **Verify seeding order:**
   ```bash
   # Departments must be seeded first
   # Then profiles, then doctors
   ```

3. **Check data values:**
   ```sql
   -- Verify department_id exists
   SELECT dept_id FROM departments WHERE dept_id = 'CARD';
   ```

### **Issue: "Profile not found"**
```
ERROR: insert or update on table "doctors" violates foreign key constraint "doctors_profile_id_fkey"
```

**Solutions:**
1. **Ensure auth user created first:**
   ```javascript
   // Create auth user
   const { data: authData } = await supabase.auth.admin.createUser({...});
   
   // Create profile with same ID
   await supabase.from('profiles').insert({
     id: authData.user.id,
     ...
   });
   
   // Create doctor with profile_id
   await supabase.from('doctors').insert({
     profile_id: authData.user.id,
     ...
   });
   ```

### **Issue: "Appointment not found for medical record"**
```
ERROR: insert or update on table "medical_records" violates foreign key constraint
```

**Solutions:**
1. **Create appointments first:**
   ```javascript
   // Create appointments
   await seedAppointments();
   
   // Then create medical records
   await seedMedicalRecords();
   ```

2. **Use existing appointment IDs:**
   ```javascript
   // Get existing appointments
   const { data: appointments } = await supabase
     .from('appointments')
     .select('appointment_id, doctor_id, patient_id');
   
   // Create medical records for these appointments
   for (const apt of appointments) {
     await supabase.from('medical_records').insert({
       appointment_id: apt.appointment_id,
       doctor_id: apt.doctor_id,
       patient_id: apt.patient_id,
       ...
     });
   }
   ```

## 🧪 Testing Foreign Key Integrity

### **Manual Validation:**
```sql
-- Check all foreign key relationships
SELECT 
  'doctors' as table_name,
  COUNT(*) as total_records,
  COUNT(p.id) as valid_profiles,
  COUNT(d.dept_id) as valid_departments
FROM doctors doc
LEFT JOIN profiles p ON doc.profile_id = p.id
LEFT JOIN departments d ON doc.department_id = d.dept_id;

-- Check appointments
SELECT 
  'appointments' as table_name,
  COUNT(*) as total_records,
  COUNT(doc.doctor_id) as valid_doctors,
  COUNT(pat.patient_id) as valid_patients
FROM appointments apt
LEFT JOIN doctors doc ON apt.doctor_id = doc.doctor_id
LEFT JOIN patients pat ON apt.patient_id = pat.patient_id;
```

### **Automated Validation:**
```bash
# Run foreign key constraint checker
npm run db:check-fk

# Run complete data verification
npm run db:verify
```

## 📋 Seeding Checklist

### **Pre-Seeding:**
- [ ] Database connection working
- [ ] All required tables exist
- [ ] Foreign key constraints defined
- [ ] Schema matches seeding requirements

### **During Seeding:**
- [ ] Departments seeded first
- [ ] Auth users created before profiles
- [ ] Profiles created before doctors/patients
- [ ] Doctors/patients created before appointments
- [ ] Appointments created before medical records
- [ ] All foreign key values validated

### **Post-Seeding:**
- [ ] All records created successfully
- [ ] No foreign key violations
- [ ] Data counts match expectations
- [ ] Referential integrity maintained
- [ ] Test queries return expected results

## 🎯 Best Practices

### **1. Always Use Transactions:**
```javascript
const { data, error } = await supabase.rpc('begin_transaction');
try {
  // Seed data in correct order
  await seedDepartments();
  await seedDoctors();
  await seedPatients();
  // ...
  await supabase.rpc('commit_transaction');
} catch (error) {
  await supabase.rpc('rollback_transaction');
  throw error;
}
```

### **2. Validate Before Insert:**
```javascript
// Check if department exists before creating doctor
const { data: dept } = await supabase
  .from('departments')
  .select('dept_id')
  .eq('dept_id', doctorData.department_id)
  .single();

if (!dept) {
  throw new Error(`Department ${doctorData.department_id} not found`);
}
```

### **3. Handle Errors Gracefully:**
```javascript
try {
  await supabase.from('doctors').insert(doctorData);
} catch (error) {
  if (error.code === '23503') { // Foreign key violation
    console.log('Foreign key constraint violated:', error.message);
    // Handle specific constraint violations
  }
  throw error;
}
```

### **4. Use Batch Operations:**
```javascript
// Insert multiple records in batches to maintain consistency
const batchSize = 10;
for (let i = 0; i < doctors.length; i += batchSize) {
  const batch = doctors.slice(i, i + batchSize);
  await supabase.from('doctors').insert(batch);
}
```

**🎉 Following this guide ensures reliable data seeding with proper foreign key integrity!**
