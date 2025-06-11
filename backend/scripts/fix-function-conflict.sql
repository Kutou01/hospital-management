-- =====================================================
-- FIX FUNCTION CONFLICT - Quick Fix
-- =====================================================
-- Purpose: Drop existing functions that cause conflicts
-- Date: 2025-01-10
-- Fix: Resolve 42P13 error for function return types
-- =====================================================

-- STEP 1: DROP ALL EXISTING FUNCTIONS
-- =====================================================
DROP FUNCTION IF EXISTS generate_doctor_id();
DROP FUNCTION IF EXISTS generate_patient_id();
DROP FUNCTION IF EXISTS generate_admin_id();
DROP FUNCTION IF EXISTS get_doctor_review_stats();
DROP FUNCTION IF EXISTS get_doctor_availability();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- STEP 2: DROP ALL EXISTING SEQUENCES
-- =====================================================
DROP SEQUENCE IF EXISTS doctor_id_seq CASCADE;
DROP SEQUENCE IF EXISTS patient_id_seq CASCADE;
DROP SEQUENCE IF EXISTS admin_id_seq CASCADE;

-- STEP 3: DROP ALL EXISTING TRIGGERS
-- =====================================================
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_doctors_updated_at ON doctors;
DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;

SELECT 'Function conflicts resolved - ready for clean migration' as status;
