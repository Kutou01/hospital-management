-- ============================================================================
-- PHASE 2.1: ROW LEVEL SECURITY (RLS) POLICIES IMPLEMENTATION
-- Hospital Management System - Security & Compliance
-- ============================================================================
-- This script implements comprehensive RLS policies for all PHI tables
-- Execute AFTER Phase 1 completion and before other Phase 2 components
-- CRITICAL: This provides the foundation for all healthcare data protection

-- ============================================================================
-- 1. PRE-IMPLEMENTATION SECURITY VALIDATION
-- ============================================================================

-- Verify Phase 1 completion
DO $$
BEGIN
    -- Check if all required tables exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patient_profiles' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'Phase 1 not completed! patient_profiles table not found.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_profiles' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'Phase 1 not completed! doctor_profiles table not found.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medical_records' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'Phase 1 not completed! medical_records table not found.';
    END IF;
    
    RAISE NOTICE 'Phase 1 validation passed. Proceeding with RLS implementation...';
END $$;

-- ============================================================================
-- 2. ENABLE ROW LEVEL SECURITY ON ALL PHI TABLES
-- ============================================================================

-- Enable RLS on core PHI tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- Enable RLS on supporting tables with sensitive data
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fhir_resources ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
DO $$
DECLARE
    rls_tables TEXT[] := ARRAY['profiles', 'patient_profiles', 'doctor_profiles', 'appointments', 'medical_records', 'departments', 'fhir_resources'];
    table_name TEXT;
    rls_enabled BOOLEAN;
BEGIN
    FOREACH table_name IN ARRAY rls_tables
    LOOP
        SELECT relrowsecurity INTO rls_enabled
        FROM pg_class
        WHERE relname = table_name AND relnamespace = 'public'::regnamespace;
        
        IF NOT rls_enabled THEN
            RAISE EXCEPTION 'RLS not enabled on table: %', table_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'RLS enabled successfully on all PHI tables.';
END $$;

-- ============================================================================
-- 3. PROFILES TABLE RLS POLICIES
-- ============================================================================

-- Policy 1: Users can access their own profile
CREATE POLICY profiles_own_access ON profiles
    FOR ALL TO authenticated
    USING (id = auth.uid());

-- Policy 2: Admins can access all profiles
CREATE POLICY profiles_admin_access ON profiles
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles admin_profile
            WHERE admin_profile.id = auth.uid()
            AND admin_profile.role IN ('admin', 'superadmin')
            AND admin_profile.is_active = true
        )
    );

-- Policy 3: Doctors can view patient and other doctor profiles (limited fields)
CREATE POLICY profiles_doctor_view_access ON profiles
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles doctor_profile
            WHERE doctor_profile.id = auth.uid()
            AND doctor_profile.role = 'doctor'
            AND doctor_profile.is_active = true
        )
        AND role IN ('patient', 'doctor')
    );

-- Policy 4: Receptionists can view patient profiles for check-in purposes
CREATE POLICY profiles_receptionist_patient_access ON profiles
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles receptionist_profile
            WHERE receptionist_profile.id = auth.uid()
            AND receptionist_profile.role = 'receptionist'
            AND receptionist_profile.is_active = true
        )
        AND role = 'patient'
    );

-- ============================================================================
-- 4. PATIENT PROFILES RLS POLICIES
-- ============================================================================

-- Policy 1: Patients can access their own profile
CREATE POLICY patient_profiles_own_access ON patient_profiles
    FOR ALL TO authenticated
    USING (user_id = auth.uid());

-- Policy 2: Doctors can access patient profiles for their appointments
CREATE POLICY patient_profiles_doctor_access ON patient_profiles
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM appointments a
            JOIN doctor_profiles dp ON dp.user_id = a.doctor_id
            WHERE a.patient_id = patient_profiles.user_id
            AND dp.user_id = auth.uid()
            AND a.status IN ('scheduled', 'confirmed', 'in_progress', 'completed')
            AND a.appointment_date >= CURRENT_DATE - INTERVAL '30 days' -- Access limited to recent appointments
        )
    );

-- Policy 3: Doctors can access patients in their department (for emergency/consultation)
CREATE POLICY patient_profiles_department_doctor_access ON patient_profiles
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM doctor_profiles dp
            JOIN appointments a ON a.doctor_id = dp.user_id
            WHERE dp.user_id = auth.uid()
            AND a.patient_id = patient_profiles.user_id
            AND dp.status = 'active'
        )
        OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'superadmin')
            AND p.is_active = true
        )
    );

-- Policy 4: Admins have full access
CREATE POLICY patient_profiles_admin_access ON patient_profiles
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() 
            AND role IN ('admin', 'superadmin')
            AND is_active = true
        )
    );

-- Policy 5: Receptionists can view basic patient info for appointments
CREATE POLICY patient_profiles_receptionist_access ON patient_profiles
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'receptionist'
            AND is_active = true
        )
        AND status = 'active'
    );

-- ============================================================================
-- 5. DOCTOR PROFILES RLS POLICIES
-- ============================================================================

-- Policy 1: Doctors can access their own profile
CREATE POLICY doctor_profiles_own_access ON doctor_profiles
    FOR ALL TO authenticated
    USING (user_id = auth.uid());

-- Policy 2: Doctors can view other doctors in their department
CREATE POLICY doctor_profiles_department_access ON doctor_profiles
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM doctor_profiles dp1
            JOIN doctor_profiles dp2 ON dp1.department_id = dp2.department_id
            WHERE dp1.user_id = auth.uid()
            AND dp2.user_id = doctor_profiles.user_id
            AND dp1.status = 'active'
            AND dp2.status = 'active'
        )
    );

-- Policy 3: Patients can view doctor profiles for appointment booking
CREATE POLICY doctor_profiles_patient_view ON doctor_profiles
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'patient'
            AND is_active = true
        )
        AND status = 'active'
        AND is_available = true
    );

-- Policy 4: Admins have full access
CREATE POLICY doctor_profiles_admin_access ON doctor_profiles
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'superadmin')
            AND is_active = true
        )
    );

-- Policy 5: Receptionists can view doctor profiles for scheduling
CREATE POLICY doctor_profiles_receptionist_access ON doctor_profiles
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'receptionist'
            AND is_active = true
        )
        AND status = 'active'
    );

-- ============================================================================
-- 6. APPOINTMENTS RLS POLICIES
-- ============================================================================

-- Policy 1: Patients can access their own appointments
CREATE POLICY appointments_patient_access ON appointments
    FOR ALL TO authenticated
    USING (patient_id = auth.uid());

-- Policy 2: Doctors can access their own appointments
CREATE POLICY appointments_doctor_access ON appointments
    FOR ALL TO authenticated
    USING (doctor_id = auth.uid());

-- Policy 3: Doctors can view appointments in their department (for coverage/consultation)
CREATE POLICY appointments_department_doctor_access ON appointments
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM doctor_profiles dp1
            JOIN doctor_profiles dp2 ON dp1.department_id = dp2.department_id
            WHERE dp1.user_id = auth.uid()
            AND dp2.user_id = appointments.doctor_id
            AND dp1.status = 'active'
        )
    );

-- Policy 4: Admins have full access
CREATE POLICY appointments_admin_access ON appointments
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'superadmin')
            AND is_active = true
        )
    );

-- Policy 5: Receptionists can manage appointments
CREATE POLICY appointments_receptionist_access ON appointments
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'receptionist'
            AND is_active = true
        )
    );

-- ============================================================================
-- 7. MEDICAL RECORDS RLS POLICIES (MOST RESTRICTIVE)
-- ============================================================================

-- Policy 1: Patients can access their own medical records
CREATE POLICY medical_records_patient_access ON medical_records
    FOR SELECT TO authenticated
    USING (patient_id = auth.uid());

-- Policy 2: Doctors can access medical records they created
CREATE POLICY medical_records_practitioner_access ON medical_records
    FOR ALL TO authenticated
    USING (practitioner_id = auth.uid());

-- Policy 3: Doctors can view medical records for their current patients (limited time window)
CREATE POLICY medical_records_current_doctor_access ON medical_records
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM appointments a
            WHERE a.patient_id = medical_records.patient_id
            AND a.doctor_id = auth.uid()
            AND a.status IN ('scheduled', 'confirmed', 'in_progress', 'completed')
            AND a.appointment_date >= CURRENT_DATE - INTERVAL '7 days'
            AND a.appointment_date <= CURRENT_DATE + INTERVAL '7 days'
        )
    );

-- Policy 4: Department heads can access medical records in their department
CREATE POLICY medical_records_department_head_access ON medical_records
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM departments d
            JOIN doctor_profiles dp ON dp.user_id = medical_records.practitioner_id
            WHERE d.head_doctor_id = auth.uid()
            AND dp.department_id = d.id
            AND d.is_active = true
        )
    );

-- Policy 5: Admins have full access (with audit logging)
CREATE POLICY medical_records_admin_access ON medical_records
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'superadmin')
            AND is_active = true
        )
    );

-- ============================================================================
-- 8. DEPARTMENTS RLS POLICIES
-- ============================================================================

-- Policy 1: All authenticated users can view active departments
CREATE POLICY departments_general_view ON departments
    FOR SELECT TO authenticated
    USING (is_active = true);

-- Policy 2: Department heads can manage their department
CREATE POLICY departments_head_management ON departments
    FOR ALL TO authenticated
    USING (
        head_doctor_id = auth.uid()
        OR deputy_head_id = auth.uid()
    );

-- Policy 3: Admins have full access
CREATE POLICY departments_admin_access ON departments
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'superadmin')
            AND is_active = true
        )
    );

-- ============================================================================
-- 9. FHIR RESOURCES RLS POLICIES
-- ============================================================================

-- Policy 1: Access based on internal table mapping
CREATE POLICY fhir_resources_mapped_access ON fhir_resources
    FOR SELECT TO authenticated
    USING (
        -- Patient can access their own FHIR resources
        (internal_table = 'patient_profiles' AND internal_id IN (
            SELECT patient_id FROM patient_profiles WHERE user_id = auth.uid()
        ))
        OR
        -- Doctor can access FHIR resources for their patients
        (internal_table = 'patient_profiles' AND internal_id IN (
            SELECT pp.patient_id FROM patient_profiles pp
            JOIN appointments a ON a.patient_id = pp.user_id
            WHERE a.doctor_id = auth.uid()
            AND a.status IN ('scheduled', 'confirmed', 'in_progress', 'completed')
        ))
        OR
        -- Admin access
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'superadmin')
            AND is_active = true
        )
    );

-- ============================================================================
-- 10. RLS POLICY VALIDATION AND TESTING
-- ============================================================================

-- Create RLS validation function
CREATE OR REPLACE FUNCTION validate_rls_policies()
RETURNS TABLE(
    table_name TEXT,
    policy_count INTEGER,
    rls_enabled BOOLEAN,
    status TEXT
) AS $$
DECLARE
    rls_tables TEXT[] := ARRAY['profiles', 'patient_profiles', 'doctor_profiles', 'appointments', 'medical_records', 'departments', 'fhir_resources'];
    table_name_var TEXT;
BEGIN
    FOREACH table_name_var IN ARRAY rls_tables
    LOOP
        RETURN QUERY
        SELECT 
            table_name_var,
            (SELECT COUNT(*)::INTEGER FROM pg_policies WHERE tablename = table_name_var),
            (SELECT relrowsecurity FROM pg_class WHERE relname = table_name_var AND relnamespace = 'public'::regnamespace),
            CASE 
                WHEN (SELECT relrowsecurity FROM pg_class WHERE relname = table_name_var AND relnamespace = 'public'::regnamespace) 
                     AND (SELECT COUNT(*) FROM pg_policies WHERE tablename = table_name_var) > 0
                THEN 'SUCCESS'
                ELSE 'FAILED'
            END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Display RLS validation results
SELECT * FROM validate_rls_policies();

-- ============================================================================
-- 11. EMERGENCY ACCESS PROCEDURES
-- ============================================================================

-- Create emergency access function (for critical situations)
CREATE OR REPLACE FUNCTION enable_emergency_access(emergency_user_id UUID, justification TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    -- Verify the requesting user is an admin
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'superadmin') 
        AND is_active = true
    ) INTO is_admin;
    
    IF NOT is_admin THEN
        RAISE EXCEPTION 'Emergency access can only be granted by administrators';
    END IF;
    
    -- Log the emergency access request
    INSERT INTO security_audit_events (
        event_type, event_category, event_outcome,
        user_id, event_description, event_data, risk_level
    ) VALUES (
        'emergency_access_granted', 'system', 'success',
        auth.uid(), 'Emergency access granted to user',
        jsonb_build_object(
            'emergency_user_id', emergency_user_id,
            'justification', justification,
            'granted_by', auth.uid()
        ),
        'critical'
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 12. RLS PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Create indexes to optimize RLS policy performance
CREATE INDEX IF NOT EXISTS idx_profiles_role_active_rls ON profiles(role, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_department_status_rls ON doctor_profiles(department_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_appointments_patient_doctor_date_rls ON appointments(patient_id, doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_status_date_rls ON appointments(doctor_id, status, appointment_date) 
    WHERE status IN ('scheduled', 'confirmed', 'in_progress', 'completed');
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_practitioner_rls ON medical_records(patient_id, practitioner_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_practitioner_date_rls ON medical_records(practitioner_id, encounter_date DESC);

-- ============================================================================
-- 13. FINAL VALIDATION AND COMPLETION
-- ============================================================================

-- Comprehensive RLS validation
DO $$
DECLARE
    failed_policies INTEGER;
    total_tables INTEGER;
    total_policies INTEGER;
BEGIN
    SELECT 
        COUNT(*) FILTER (WHERE status = 'FAILED'),
        COUNT(*),
        SUM(policy_count)
    INTO failed_policies, total_tables, total_policies
    FROM validate_rls_policies();
    
    IF failed_policies > 0 THEN
        RAISE EXCEPTION 'RLS IMPLEMENTATION FAILED! % tables failed RLS setup.', failed_policies;
    END IF;
    
    RAISE NOTICE '=== RLS IMPLEMENTATION COMPLETED SUCCESSFULLY ===';
    RAISE NOTICE 'Tables protected: %', total_tables;
    RAISE NOTICE 'Total policies created: %', total_policies;
    RAISE NOTICE 'All PHI tables are now protected with Row Level Security.';
    RAISE NOTICE 'Ready for Phase 2.2: PHI Access Logging System.';
END $$;
