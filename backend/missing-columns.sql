-- MISSING COLUMNS ANALYSIS (based on actual table structure check)
-- ✅ appointments.doctor_id - EXISTS
-- ✅ appointments.patient_id - EXISTS  
-- ❌ appointments.department_id - MISSING
-- ✅ doctors.department_id - EXISTS
-- ❌ doctors.specialty_id - MISSING
-- ✅ medical_records.doctor_id - EXISTS
-- ✅ medical_records.patient_id - EXISTS
-- ✅ doctor_reviews.doctor_id - EXISTS
-- ✅ doctor_reviews.patient_id - EXISTS
-- ❌ lab_results.doctor_id - MISSING
-- ❌ lab_results.patient_id - MISSING

-- Add missing column for appointments → departments
-- Pattern: DEPT001, DEPT002, etc.
ALTER TABLE appointments
ADD COLUMN department_id VARCHAR(10) CHECK (department_id ~ '^DEPT\d{3}$');

-- Add missing column for doctors → specialties  
-- Pattern: SPEC028, SPEC029, etc.
ALTER TABLE doctors
ADD COLUMN specialty_id VARCHAR(10) CHECK (specialty_id ~ '^SPEC\d{3}$');

-- Add missing column for lab_results → doctors
-- Pattern: CARD-DOC-202506-001, GENE-DOC-202506-001, etc.
ALTER TABLE lab_results
ADD COLUMN doctor_id VARCHAR(50) CHECK (doctor_id ~ '^[A-Z]{4}-DOC-\d{6}-\d{3}$');

-- Add missing column for lab_results → patients
-- Pattern: PAT-202506-550, PAT-202506-810, etc.
ALTER TABLE lab_results
ADD COLUMN patient_id VARCHAR(30) CHECK (patient_id ~ '^PAT-\d{6}-\d{3}$');
