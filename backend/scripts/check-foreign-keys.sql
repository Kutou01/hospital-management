-- =====================================================
-- CHECK FOREIGN KEY CONSTRAINTS
-- Hospital Management System - Diagnose relationship issues
-- =====================================================

-- Step 1: Check if tables exist
SELECT 
    'TABLE EXISTENCE CHECK' as info,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('appointments', 'doctors', 'patients', 'profiles')
ORDER BY table_name;

-- Step 2: Check table columns
SELECT 
    'COLUMN CHECK' as info,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('appointments', 'doctors', 'patients')
    AND column_name IN ('appointment_id', 'doctor_id', 'patient_id', 'profile_id')
ORDER BY table_name, column_name;

-- Step 3: Check ALL foreign key constraints
SELECT 
    'ALL FOREIGN KEYS' as info,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_type
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- Step 4: Check specifically for appointments table foreign keys
SELECT 
    'APPOINTMENTS FOREIGN KEYS' as info,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name = 'appointments';

-- Step 5: Check if appointments table has data
SELECT 
    'APPOINTMENTS DATA CHECK' as info,
    COUNT(*) as total_appointments
FROM public.appointments;

-- Step 6: Check if doctors table has data
SELECT 
    'DOCTORS DATA CHECK' as info,
    COUNT(*) as total_doctors
FROM public.doctors;

-- Step 7: Check if patients table has data
SELECT 
    'PATIENTS DATA CHECK' as info,
    COUNT(*) as total_patients
FROM public.patients;

-- Step 8: Test a simple join to see what happens
SELECT 
    'JOIN TEST' as info,
    a.appointment_id,
    a.doctor_id,
    a.patient_id,
    d.doctor_id as doctor_exists,
    p.patient_id as patient_exists
FROM public.appointments a
LEFT JOIN public.doctors d ON a.doctor_id = d.doctor_id
LEFT JOIN public.patients p ON a.patient_id = p.patient_id
LIMIT 5;
