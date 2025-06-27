-- COMPLETE FOREIGN KEY SCRIPT FOR HOSPITAL MANAGEMENT SYSTEM
-- Execute this after adding missing columns with missing-columns.sql

-- COLUMN EXISTENCE STATUS:
-- ✅ appointments.doctor_id - EXISTS (FK ready)
-- ✅ appointments.patient_id - EXISTS (FK ready)
-- ❌ appointments.department_id - MISSING (add column first)
-- ✅ doctors.department_id - EXISTS (FK ready)
-- ❌ doctors.specialty_id - MISSING (add column first)
-- ✅ medical_records.doctor_id - EXISTS (FK ready)
-- ✅ medical_records.patient_id - EXISTS (FK ready)
-- ✅ doctor_reviews.doctor_id - EXISTS (FK ready)
-- ✅ doctor_reviews.patient_id - EXISTS (FK ready)
-- ❌ lab_results.doctor_id - MISSING (add column first)
-- ❌ lab_results.patient_id - MISSING (add column first)

-- ========================================
-- FOREIGN KEYS READY TO CREATE NOW
-- ========================================

-- medical_records → doctors (column exists)
ALTER TABLE medical_records
ADD CONSTRAINT medical_records_doctor_id_fkey
FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id);

-- doctor_reviews → doctors (column exists)
ALTER TABLE doctor_reviews
ADD CONSTRAINT doctor_reviews_doctor_id_fkey
FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id);

-- doctor_reviews → patients (column exists)
ALTER TABLE doctor_reviews
ADD CONSTRAINT doctor_reviews_patient_id_fkey
FOREIGN KEY (patient_id) REFERENCES patients(patient_id);

-- ========================================
-- FOREIGN KEYS TO CREATE AFTER ADDING MISSING COLUMNS
-- ========================================

-- appointments → departments (add column first)
ALTER TABLE appointments
ADD CONSTRAINT appointments_department_id_fkey
FOREIGN KEY (department_id) REFERENCES departments(department_id);

-- doctors → specialties (add column first)
ALTER TABLE doctors
ADD CONSTRAINT doctors_specialty_id_fkey
FOREIGN KEY (specialty_id) REFERENCES specialties(specialty_id);

-- lab_results → doctors (add column first)
ALTER TABLE lab_results
ADD CONSTRAINT lab_results_doctor_id_fkey
FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id);

-- lab_results → patients (add column first)
ALTER TABLE lab_results
ADD CONSTRAINT lab_results_patient_id_fkey
FOREIGN KEY (patient_id) REFERENCES patients(patient_id);

-- ========================================
-- ADDITIONAL FOREIGN KEYS FOR WHEN TABLES ARE CREATED
-- ========================================

-- doctor_work_schedules → doctors (when column exists)
-- ALTER TABLE doctor_work_schedules
-- ADD CONSTRAINT doctor_work_schedules_doctor_id_fkey
-- FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id);

-- doctor_work_experiences → doctors (when column exists)
-- ALTER TABLE doctor_work_experiences
-- ADD CONSTRAINT doctor_work_experiences_doctor_id_fkey
-- FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id);

-- doctor_emergency_contacts → doctors (when column exists)
-- ALTER TABLE doctor_emergency_contacts
-- ADD CONSTRAINT doctor_emergency_contacts_doctor_id_fkey
-- FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id);

-- doctor_settings → doctors (when column exists)
-- ALTER TABLE doctor_settings
-- ADD CONSTRAINT doctor_settings_doctor_id_fkey
-- FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id);

-- prescriptions → patients (when table exists)
-- ALTER TABLE prescriptions
-- ADD CONSTRAINT prescriptions_patient_id_fkey
-- FOREIGN KEY (patient_id) REFERENCES patients(patient_id);

-- prescriptions → doctors (when table exists)
-- ALTER TABLE prescriptions
-- ADD CONSTRAINT prescriptions_doctor_id_fkey
-- FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id);

-- prescriptions → medications (when table exists)
-- ALTER TABLE prescriptions
-- ADD CONSTRAINT prescriptions_medication_id_fkey
-- FOREIGN KEY (medication_id) REFERENCES medications(medication_id);

-- lab_results → doctors (when column exists)
-- ALTER TABLE lab_results
-- ADD CONSTRAINT lab_results_doctor_id_fkey
-- FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id);

-- vital_signs_history → patients (when column exists)
-- ALTER TABLE vital_signs_history
-- ADD CONSTRAINT vital_signs_history_patient_id_fkey
-- FOREIGN KEY (patient_id) REFERENCES patients(patient_id);

-- billing → patients (when table exists)
-- ALTER TABLE billing
-- ADD CONSTRAINT billing_patient_id_fkey
-- FOREIGN KEY (patient_id) REFERENCES patients(patient_id);

-- billing → appointments (when table exists)
-- ALTER TABLE billing
-- ADD CONSTRAINT billing_appointment_id_fkey
-- FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id);

-- insurance → patients (when column exists)
-- ALTER TABLE insurance
-- ADD CONSTRAINT insurance_patient_id_fkey
-- FOREIGN KEY (patient_id) REFERENCES patients(patient_id);

-- notifications → profiles (when column exists)
-- ALTER TABLE notifications
-- ADD CONSTRAINT notifications_user_id_fkey
-- FOREIGN KEY (user_id) REFERENCES profiles(id);
