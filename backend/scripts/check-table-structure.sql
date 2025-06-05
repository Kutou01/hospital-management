-- =====================================================
-- CHECK TABLE STRUCTURE SCRIPT
-- Hospital Management System - Verify Database Schema
-- =====================================================

-- 1. CHECK PROFILES TABLE STRUCTURE
SELECT 
    'PROFILES TABLE' as table_info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. CHECK DOCTORS TABLE STRUCTURE
SELECT 
    'DOCTORS TABLE' as table_info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'doctors' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. CHECK PATIENTS TABLE STRUCTURE
SELECT 
    'PATIENTS TABLE' as table_info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'patients' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. CHECK ADMINS TABLE STRUCTURE (if exists)
SELECT 
    'ADMINS TABLE' as table_info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'admins' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. CHECK ALL TABLES IN PUBLIC SCHEMA
SELECT 
    'ALL PUBLIC TABLES' as info,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 6. CHECK FOREIGN KEY RELATIONSHIPS
SELECT 
    'FOREIGN KEYS' as info,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND (tc.table_name IN ('doctors', 'patients', 'profiles', 'admins'))
ORDER BY tc.table_name;

-- 7. CHECK SEQUENCES
SELECT 
    'SEQUENCES' as info,
    sequence_name,
    data_type,
    start_value,
    minimum_value,
    maximum_value,
    increment
FROM information_schema.sequences 
WHERE sequence_schema = 'public'
ORDER BY sequence_name;

-- 8. SAMPLE DATA FROM EACH TABLE (if exists)

-- Sample from profiles
SELECT 
    'PROFILES SAMPLE' as info,
    id,
    email,
    full_name,
    role,
    created_at
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 3;

-- Sample from doctors (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctors' AND table_schema = 'public') THEN
        PERFORM 1; -- Table exists, we'll query it separately
    END IF;
END $$;

-- Sample from patients (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patients' AND table_schema = 'public') THEN
        PERFORM 1; -- Table exists, we'll query it separately
    END IF;
END $$;

-- 9. CHECK INDEXES
SELECT 
    'INDEXES' as info,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'doctors', 'patients', 'admins')
ORDER BY tablename, indexname;
