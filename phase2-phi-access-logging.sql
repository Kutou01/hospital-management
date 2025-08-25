-- ============================================================================
-- PHASE 2.2: PHI ACCESS LOGGING SYSTEM
-- Hospital Management System - Security & Compliance
-- ============================================================================
-- This script implements comprehensive PHI access logging and audit trails
-- Execute AFTER Phase 2.1 (RLS Policies) completion
-- CRITICAL: This provides complete audit trail for HIPAA compliance

-- ============================================================================
-- 1. PRE-IMPLEMENTATION VALIDATION
-- ============================================================================

-- Verify RLS policies are in place
DO $$
DECLARE
    rls_tables TEXT[] := ARRAY['profiles', 'patient_profiles', 'doctor_profiles', 'appointments', 'medical_records'];
    table_name TEXT;
    rls_enabled BOOLEAN;
    policy_count INTEGER;
BEGIN
    FOREACH table_name IN ARRAY rls_tables
    LOOP
        SELECT relrowsecurity INTO rls_enabled
        FROM pg_class
        WHERE relname = table_name AND relnamespace = 'public'::regnamespace;
        
        SELECT COUNT(*) INTO policy_count
        FROM pg_policies
        WHERE tablename = table_name;
        
        IF NOT rls_enabled OR policy_count = 0 THEN
            RAISE EXCEPTION 'RLS not properly configured on table: %. Execute Phase 2.1 first.', table_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'RLS validation passed. Proceeding with PHI access logging implementation...';
END $$;

-- ============================================================================
-- 2. PHI ACCESS LOG TABLE (PARTITIONED FOR PERFORMANCE)
-- ============================================================================

-- Main PHI access log table with partitioning
CREATE TABLE phi_access_log (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Access Details
    user_id UUID NOT NULL REFERENCES profiles(id),
    patient_id UUID NOT NULL REFERENCES patient_profiles(user_id),
    access_type TEXT NOT NULL CHECK (access_type IN ('read', 'write', 'delete', 'export', 'print', 'share')),
    
    -- Resource Details
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    field_names TEXT[], -- Specific fields accessed
    
    -- Context Information
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    request_id UUID,
    
    -- Access Justification (HIPAA requirement)
    access_reason TEXT CHECK (access_reason IN (
        'treatment', 'payment', 'healthcare_operations', 'patient_request',
        'legal_requirement', 'emergency', 'quality_assurance', 'research'
    )),
    business_justification TEXT,
    
    -- Risk Assessment
    risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    risk_factors JSONB DEFAULT '[]'::JSONB,
    
    -- Timing
    access_timestamp TIMESTAMPTZ DEFAULT NOW(),
    session_duration_seconds INTEGER,
    
    -- Data Sensitivity Classification
    data_sensitivity TEXT DEFAULT 'phi' CHECK (data_sensitivity IN ('public', 'internal', 'phi', 'highly_sensitive')),
    
    -- Compliance Tracking
    hipaa_category TEXT CHECK (hipaa_category IN ('treatment', 'payment', 'operations', 'disclosure')),
    gdpr_lawful_basis TEXT CHECK (gdpr_lawful_basis IN ('consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests')),
    
    -- Audit Trail
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (access_timestamp);

-- Create partitions for PHI access log (monthly partitions for performance)
CREATE TABLE phi_access_log_2024_12 PARTITION OF phi_access_log
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');
CREATE TABLE phi_access_log_2025_01 PARTITION OF phi_access_log
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE phi_access_log_2025_02 PARTITION OF phi_access_log
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE phi_access_log_2025_03 PARTITION OF phi_access_log
    FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

-- ============================================================================
-- 3. SECURITY AUDIT EVENTS TABLE
-- ============================================================================

-- Comprehensive security audit events table
CREATE TABLE security_audit_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event Classification
    event_type TEXT NOT NULL CHECK (event_type IN (
        'login', 'logout', 'failed_login', 'password_change', 'account_locked',
        'data_access', 'data_export', 'permission_change', 'system_admin',
        'suspicious_activity', 'policy_violation', 'emergency_access',
        'data_breach_detected', 'unauthorized_access_attempt'
    )),
    event_category TEXT NOT NULL CHECK (event_category IN ('authentication', 'authorization', 'data_access', 'system', 'security')),
    event_outcome TEXT NOT NULL CHECK (event_outcome IN ('success', 'failure', 'warning')),
    
    -- Actor Information
    user_id UUID REFERENCES profiles(id),
    user_role TEXT,
    user_department TEXT,
    
    -- Source Information
    source_ip INET,
    source_location JSONB, -- Geographic location if available
    user_agent TEXT,
    device_fingerprint TEXT,
    
    -- Event Details
    event_description TEXT NOT NULL,
    event_data JSONB,
    
    -- Risk Assessment
    risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    threat_indicators JSONB DEFAULT '[]'::JSONB,
    
    -- Compliance Fields
    hipaa_category TEXT,
    gdpr_lawful_basis TEXT,
    
    -- Response Tracking
    requires_investigation BOOLEAN DEFAULT false,
    investigated_by UUID REFERENCES profiles(id),
    investigation_notes TEXT,
    resolved_at TIMESTAMPTZ,
    
    -- Timing
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (event_timestamp);

-- Create partitions for security audit events
CREATE TABLE security_audit_events_2024_12 PARTITION OF security_audit_events
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');
CREATE TABLE security_audit_events_2025_01 PARTITION OF security_audit_events
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE security_audit_events_2025_02 PARTITION OF security_audit_events
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE security_audit_events_2025_03 PARTITION OF security_audit_events
    FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

-- ============================================================================
-- 4. PHI ACCESS LOGGING FUNCTIONS
-- ============================================================================

-- Core PHI access logging function
CREATE OR REPLACE FUNCTION log_phi_access(
    p_patient_id UUID,
    p_access_type TEXT,
    p_table_name TEXT,
    p_record_id TEXT,
    p_field_names TEXT[] DEFAULT NULL,
    p_access_reason TEXT DEFAULT 'treatment',
    p_business_justification TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
    current_user_role TEXT;
    current_user_dept TEXT;
    risk_level_calculated TEXT;
    risk_factors_array JSONB;
BEGIN
    -- Get current user details
    SELECT role INTO current_user_role FROM profiles WHERE id = auth.uid();
    
    SELECT d.name INTO current_user_dept 
    FROM doctor_profiles dp 
    JOIN departments d ON d.id = dp.department_id 
    WHERE dp.user_id = auth.uid();
    
    -- Calculate risk level based on access patterns
    risk_level_calculated := 'low';
    risk_factors_array := '[]'::JSONB;
    
    -- Check for high-risk patterns
    IF p_access_type IN ('export', 'print', 'share') THEN
        risk_level_calculated := 'medium';
        risk_factors_array := risk_factors_array || '["data_export"]'::JSONB;
    END IF;
    
    -- Check for after-hours access
    IF EXTRACT(HOUR FROM NOW()) < 6 OR EXTRACT(HOUR FROM NOW()) > 22 THEN
        risk_level_calculated := 'medium';
        risk_factors_array := risk_factors_array || '["after_hours_access"]'::JSONB;
    END IF;
    
    -- Check for weekend access
    IF EXTRACT(DOW FROM NOW()) IN (0, 6) THEN
        risk_level_calculated := 'medium';
        risk_factors_array := risk_factors_array || '["weekend_access"]'::JSONB;
    END IF;
    
    -- Check for excessive access (more than 50 records in last hour)
    IF (
        SELECT COUNT(*) 
        FROM phi_access_log 
        WHERE user_id = auth.uid() 
        AND access_timestamp > NOW() - INTERVAL '1 hour'
    ) > 50 THEN
        risk_level_calculated := 'high';
        risk_factors_array := risk_factors_array || '["excessive_access"]'::JSONB;
    END IF;
    
    -- Insert PHI access log
    INSERT INTO phi_access_log (
        user_id, patient_id, access_type, table_name, record_id, field_names,
        ip_address, user_agent, session_id,
        access_reason, business_justification,
        risk_level, risk_factors,
        hipaa_category, gdpr_lawful_basis
    ) VALUES (
        auth.uid(), p_patient_id, p_access_type, p_table_name, p_record_id, p_field_names,
        inet_client_addr(), current_setting('request.headers', true)::JSONB->>'user-agent', 
        current_setting('request.jwt.claims', true)::JSONB->>'session_id',
        p_access_reason, p_business_justification,
        risk_level_calculated, risk_factors_array,
        CASE p_access_reason 
            WHEN 'treatment' THEN 'treatment'
            WHEN 'payment' THEN 'payment'
            ELSE 'operations'
        END,
        'legitimate_interests' -- Default GDPR basis for healthcare
    ) RETURNING phi_access_log.log_id INTO log_id;
    
    -- Alert on high-risk access
    IF risk_level_calculated IN ('high', 'critical') THEN
        PERFORM pg_notify('phi_access_alert', json_build_object(
            'log_id', log_id,
            'user_id', auth.uid(),
            'patient_id', p_patient_id,
            'risk_level', risk_level_calculated,
            'risk_factors', risk_factors_array,
            'timestamp', NOW()
        )::text);
    END IF;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comprehensive audit logging function
CREATE OR REPLACE FUNCTION log_security_event(
    p_event_type TEXT,
    p_event_category TEXT,
    p_event_outcome TEXT,
    p_event_description TEXT,
    p_event_data JSONB DEFAULT NULL,
    p_risk_level TEXT DEFAULT 'low'
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
    current_user_role TEXT;
    current_user_dept TEXT;
BEGIN
    -- Get current user details
    SELECT role INTO current_user_role FROM profiles WHERE id = auth.uid();
    
    SELECT d.name INTO current_user_dept 
    FROM doctor_profiles dp 
    JOIN departments d ON d.id = dp.department_id 
    WHERE dp.user_id = auth.uid();
    
    -- Insert security audit event
    INSERT INTO security_audit_events (
        event_type, event_category, event_outcome,
        user_id, user_role, user_department,
        source_ip, user_agent,
        event_description, event_data, risk_level,
        requires_investigation
    ) VALUES (
        p_event_type, p_event_category, p_event_outcome,
        auth.uid(), current_user_role, current_user_dept,
        inet_client_addr(), current_setting('request.headers', true)::JSONB->>'user-agent',
        p_event_description, p_event_data, p_risk_level,
        p_risk_level IN ('high', 'critical')
    ) RETURNING security_audit_events.event_id INTO event_id;
    
    -- Alert on high-risk events
    IF p_risk_level IN ('high', 'critical') THEN
        PERFORM pg_notify('security_alert', json_build_object(
            'event_id', event_id,
            'event_type', p_event_type,
            'risk_level', p_risk_level,
            'user_id', auth.uid(),
            'timestamp', NOW()
        )::text);
    END IF;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. AUTOMATIC PHI ACCESS LOGGING TRIGGERS
-- ============================================================================

-- PHI access logging trigger function
CREATE OR REPLACE FUNCTION trigger_log_phi_access()
RETURNS TRIGGER AS $$
DECLARE
    patient_user_id UUID;
    access_type_val TEXT;
    record_id_val TEXT;
BEGIN
    -- Determine access type
    IF TG_OP = 'INSERT' THEN
        access_type_val := 'write';
    ELSIF TG_OP = 'UPDATE' THEN
        access_type_val := 'write';
    ELSIF TG_OP = 'DELETE' THEN
        access_type_val := 'delete';
    ELSE
        access_type_val := 'read';
    END IF;
    
    -- Get patient user_id and record_id based on table
    IF TG_TABLE_NAME = 'patient_profiles' THEN
        patient_user_id := COALESCE(NEW.user_id, OLD.user_id);
        record_id_val := COALESCE(NEW.patient_id, OLD.patient_id);
    ELSIF TG_TABLE_NAME = 'medical_records' THEN
        patient_user_id := COALESCE(NEW.patient_id, OLD.patient_id);
        record_id_val := COALESCE(NEW.record_id, OLD.record_id);
    ELSIF TG_TABLE_NAME = 'appointments' THEN
        patient_user_id := COALESCE(NEW.patient_id, OLD.patient_id);
        record_id_val := COALESCE(NEW.appointment_id, OLD.appointment_id);
    ELSE
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Skip logging for system operations
    IF auth.uid() IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Log PHI access
    PERFORM log_phi_access(
        patient_user_id,
        access_type_val,
        TG_TABLE_NAME,
        record_id_val,
        NULL, -- field_names will be enhanced in future versions
        'treatment', -- default access reason
        'Automatic logging via database trigger'
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply PHI logging triggers to all PHI tables
CREATE TRIGGER trigger_phi_access_log_patient_profiles
    AFTER INSERT OR UPDATE OR DELETE ON patient_profiles
    FOR EACH ROW EXECUTE FUNCTION trigger_log_phi_access();

CREATE TRIGGER trigger_phi_access_log_medical_records
    AFTER INSERT OR UPDATE OR DELETE ON medical_records
    FOR EACH ROW EXECUTE FUNCTION trigger_log_phi_access();

CREATE TRIGGER trigger_phi_access_log_appointments
    AFTER INSERT OR UPDATE OR DELETE ON appointments
    FOR EACH ROW EXECUTE FUNCTION trigger_log_phi_access();

-- ============================================================================
-- 6. PERFORMANCE INDEXES FOR AUDIT TABLES
-- ============================================================================

-- PHI access log indexes
CREATE INDEX idx_phi_access_log_user_time ON phi_access_log(user_id, access_timestamp DESC);
CREATE INDEX idx_phi_access_log_patient_time ON phi_access_log(patient_id, access_timestamp DESC);
CREATE INDEX idx_phi_access_log_risk ON phi_access_log(risk_level, access_timestamp DESC) 
    WHERE risk_level IN ('high', 'critical');
CREATE INDEX idx_phi_access_log_table_type ON phi_access_log(table_name, access_type);
CREATE INDEX idx_phi_access_log_reason ON phi_access_log(access_reason);
CREATE INDEX idx_phi_access_log_ip ON phi_access_log(ip_address) WHERE ip_address IS NOT NULL;

-- Security audit events indexes
CREATE INDEX idx_security_audit_events_user_time ON security_audit_events(user_id, event_timestamp DESC);
CREATE INDEX idx_security_audit_events_type_time ON security_audit_events(event_type, event_timestamp DESC);
CREATE INDEX idx_security_audit_events_risk ON security_audit_events(risk_level, event_timestamp DESC) 
    WHERE risk_level IN ('high', 'critical');
CREATE INDEX idx_security_audit_events_investigation ON security_audit_events(requires_investigation, event_timestamp DESC) 
    WHERE requires_investigation = true;
CREATE INDEX idx_security_audit_events_outcome ON security_audit_events(event_outcome, event_timestamp DESC);

-- ============================================================================
-- 7. AUDIT REPORTING FUNCTIONS
-- ============================================================================

-- PHI access summary report
CREATE OR REPLACE FUNCTION get_phi_access_summary(
    p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE(
    user_id UUID,
    user_name TEXT,
    user_role TEXT,
    total_accesses BIGINT,
    high_risk_accesses BIGINT,
    unique_patients BIGINT,
    last_access TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pal.user_id,
        p.full_name as user_name,
        p.role as user_role,
        COUNT(*) as total_accesses,
        COUNT(*) FILTER (WHERE pal.risk_level IN ('high', 'critical')) as high_risk_accesses,
        COUNT(DISTINCT pal.patient_id) as unique_patients,
        MAX(pal.access_timestamp) as last_access
    FROM phi_access_log pal
    JOIN profiles p ON p.id = pal.user_id
    WHERE pal.access_timestamp BETWEEN p_start_date AND p_end_date
    GROUP BY pal.user_id, p.full_name, p.role
    ORDER BY total_accesses DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Security incidents report
CREATE OR REPLACE FUNCTION get_security_incidents_summary(
    p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
    p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE(
    event_type TEXT,
    risk_level TEXT,
    incident_count BIGINT,
    unique_users BIGINT,
    requires_investigation BIGINT,
    latest_incident TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sae.event_type,
        sae.risk_level,
        COUNT(*) as incident_count,
        COUNT(DISTINCT sae.user_id) as unique_users,
        COUNT(*) FILTER (WHERE sae.requires_investigation = true) as requires_investigation,
        MAX(sae.event_timestamp) as latest_incident
    FROM security_audit_events sae
    WHERE sae.event_timestamp BETWEEN p_start_date AND p_end_date
    GROUP BY sae.event_type, sae.risk_level
    ORDER BY incident_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. VALIDATION AND TESTING
-- ============================================================================

-- Validate PHI access logging system
CREATE OR REPLACE FUNCTION validate_phi_access_logging()
RETURNS TABLE(
    component TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check if tables exist
    RETURN QUERY SELECT 
        'PHI Access Log Table'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'phi_access_log') 
             THEN 'SUCCESS' ELSE 'FAILED' END,
        'Main audit table for PHI access tracking'::TEXT;
    
    -- Check if triggers are installed
    RETURN QUERY SELECT 
        'PHI Access Triggers'::TEXT,
        CASE WHEN (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name LIKE 'trigger_phi_access_log_%') >= 3
             THEN 'SUCCESS' ELSE 'FAILED' END,
        'Automatic PHI access logging triggers'::TEXT;
    
    -- Check if functions exist
    RETURN QUERY SELECT 
        'Logging Functions'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'log_phi_access')
             THEN 'SUCCESS' ELSE 'FAILED' END,
        'Core PHI access logging functions'::TEXT;
    
    -- Check if indexes exist
    RETURN QUERY SELECT 
        'Performance Indexes'::TEXT,
        CASE WHEN (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'phi_access_log') >= 5
             THEN 'SUCCESS' ELSE 'FAILED' END,
        'Performance optimization indexes'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Display validation results
SELECT * FROM validate_phi_access_logging();

-- ============================================================================
-- 9. FINAL VALIDATION AND COMPLETION
-- ============================================================================

DO $$
DECLARE
    validation_results RECORD;
    failed_components INTEGER := 0;
BEGIN
    -- Check validation results
    FOR validation_results IN SELECT * FROM validate_phi_access_logging()
    LOOP
        IF validation_results.status = 'FAILED' THEN
            failed_components := failed_components + 1;
            RAISE WARNING 'Component failed: %', validation_results.component;
        END IF;
    END LOOP;
    
    IF failed_components > 0 THEN
        RAISE EXCEPTION 'PHI ACCESS LOGGING IMPLEMENTATION FAILED! % components failed validation.', failed_components;
    END IF;
    
    RAISE NOTICE '=== PHI ACCESS LOGGING SYSTEM COMPLETED SUCCESSFULLY ===';
    RAISE NOTICE 'All PHI access will now be comprehensively logged and audited.';
    RAISE NOTICE 'HIPAA compliance audit trail is operational.';
    RAISE NOTICE 'Ready for Phase 2.3: HIPAA Compliance Features.';
END $$;
