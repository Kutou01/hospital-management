-- ============================================================================
-- PHASE 2.3: HIPAA COMPLIANCE FEATURES
-- Hospital Management System - Security & Compliance
-- ============================================================================
-- This script implements comprehensive HIPAA compliance features
-- Execute AFTER Phase 2.2 (PHI Access Logging) completion
-- CRITICAL: This provides full HIPAA compliance infrastructure

-- ============================================================================
-- 1. PRE-IMPLEMENTATION VALIDATION
-- ============================================================================

-- Verify PHI access logging is operational
DO $$
BEGIN
    -- Check if PHI access logging tables exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'phi_access_log' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'PHI access logging not implemented! Execute Phase 2.2 first.';
    END IF;
    
    -- Check if security audit events table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_audit_events' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'Security audit events not implemented! Execute Phase 2.2 first.';
    END IF;
    
    -- Check if logging functions exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'log_phi_access' AND routine_schema = 'public') THEN
        RAISE EXCEPTION 'PHI access logging functions not found! Execute Phase 2.2 first.';
    END IF;
    
    RAISE NOTICE 'PHI access logging validation passed. Proceeding with HIPAA compliance implementation...';
END $$;

-- ============================================================================
-- 2. HIPAA CONSENT MANAGEMENT SYSTEM
-- ============================================================================

-- Patient consent management table
CREATE TABLE hipaa_consents (
    consent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient_profiles(user_id) ON DELETE CASCADE,
    
    -- Consent Details
    consent_type TEXT NOT NULL CHECK (consent_type IN (
        'treatment', 'payment', 'operations', 'marketing', 'research', 
        'directory_listing', 'emergency_contact', 'family_notification',
        'data_sharing', 'telemedicine', 'photography', 'recording'
    )),
    consent_status TEXT NOT NULL CHECK (consent_status IN ('granted', 'denied', 'withdrawn', 'expired', 'pending')),
    
    -- Consent Scope and Limitations
    authorized_users UUID[], -- Specific users authorized to access
    authorized_departments UUID[], -- Specific departments authorized
    authorized_purposes TEXT[], -- Specific purposes for data use
    data_categories TEXT[], -- Categories of data covered by consent
    
    -- Geographic and Time Limitations
    geographic_restrictions JSONB, -- Geographic limitations on data use
    time_restrictions JSONB, -- Time-based limitations
    
    -- Consent Documentation
    consent_form_version VARCHAR(20) NOT NULL,
    consent_method TEXT NOT NULL CHECK (consent_method IN ('written', 'electronic', 'verbal', 'implied')),
    consent_language VARCHAR(5) DEFAULT 'vi' CHECK (consent_language IN ('vi', 'en')),
    
    -- Legal Requirements
    witness_id UUID REFERENCES profiles(id),
    witness_signature TEXT,
    legal_guardian_id UUID REFERENCES profiles(id), -- For minors or incapacitated patients
    
    -- Consent Lifecycle
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    withdrawn_at TIMESTAMPTZ,
    withdrawal_reason TEXT,
    
    -- Audit Trail
    created_by UUID NOT NULL REFERENCES profiles(id),
    last_modified_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Business Logic Constraints
    CONSTRAINT chk_consent_lifecycle CHECK (
        (consent_status = 'granted' AND granted_at IS NOT NULL) OR
        (consent_status = 'withdrawn' AND withdrawn_at IS NOT NULL) OR
        (consent_status = 'expired' AND expires_at IS NOT NULL AND expires_at < NOW()) OR
        (consent_status IN ('denied', 'pending'))
    )
);

-- ============================================================================
-- 3. DATA BREACH INCIDENT MANAGEMENT
-- ============================================================================

-- Data breach incidents tracking table
CREATE TABLE data_breach_incidents (
    incident_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Incident Classification
    incident_type TEXT NOT NULL CHECK (incident_type IN (
        'unauthorized_access', 'data_theft', 'system_breach', 'human_error', 
        'malware', 'phishing', 'insider_threat', 'physical_breach',
        'vendor_breach', 'ransomware', 'data_loss', 'improper_disposal'
    )),
    severity_level TEXT NOT NULL CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Affected Data and Patients
    affected_patients UUID[], -- Array of affected patient IDs
    affected_data_types TEXT[] NOT NULL, -- Types of PHI affected
    estimated_records_count INTEGER NOT NULL CHECK (estimated_records_count > 0),
    
    -- Incident Details
    incident_description TEXT NOT NULL,
    discovery_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    incident_date TIMESTAMPTZ, -- When incident actually occurred (if known)
    incident_location TEXT, -- Physical or system location
    
    -- Root Cause Analysis
    root_cause TEXT,
    contributing_factors TEXT[],
    system_vulnerabilities TEXT[],
    
    -- Impact Assessment
    potential_harm_assessment TEXT NOT NULL,
    likelihood_of_harm TEXT CHECK (likelihood_of_harm IN ('low', 'medium', 'high')),
    financial_impact_estimate DECIMAL(15,2),
    
    -- Response and Containment
    containment_actions TEXT[],
    containment_date TIMESTAMPTZ,
    is_contained BOOLEAN DEFAULT false,
    
    -- Notification Requirements
    requires_hhs_notification BOOLEAN DEFAULT false, -- Health and Human Services
    requires_media_notification BOOLEAN DEFAULT false,
    requires_patient_notification BOOLEAN DEFAULT false,
    
    -- Notification Tracking
    hhs_notified_date TIMESTAMPTZ,
    media_notified_date TIMESTAMPTZ,
    patients_notified_date TIMESTAMPTZ,
    notification_method TEXT CHECK (notification_method IN ('mail', 'email', 'phone', 'website', 'media')),
    
    -- Investigation and Resolution
    investigated_by UUID REFERENCES profiles(id),
    investigation_status TEXT DEFAULT 'open' CHECK (investigation_status IN ('open', 'investigating', 'resolved', 'closed')),
    investigation_findings TEXT,
    
    -- Corrective Actions
    corrective_actions TEXT[],
    preventive_measures TEXT[],
    policy_changes_required TEXT[],
    
    -- Resolution
    resolved_at TIMESTAMPTZ,
    resolution_summary TEXT,
    lessons_learned TEXT,
    
    -- Compliance and Legal
    legal_counsel_involved BOOLEAN DEFAULT false,
    insurance_claim_filed BOOLEAN DEFAULT false,
    regulatory_fines DECIMAL(15,2),
    
    -- Audit Trail
    reported_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. ENCRYPTION KEY MANAGEMENT
-- ============================================================================

-- Encryption keys management table
CREATE TABLE encryption_keys (
    key_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_name VARCHAR(100) UNIQUE NOT NULL,
    key_purpose TEXT NOT NULL CHECK (key_purpose IN ('PHI', 'PII', 'FINANCIAL', 'AUDIT', 'COMMUNICATION', 'BACKUP')),
    
    -- Key Properties
    key_algorithm VARCHAR(50) NOT NULL CHECK (key_algorithm IN ('AES-256', 'RSA-2048', 'RSA-4096', 'ChaCha20-Poly1305')),
    key_size INTEGER NOT NULL CHECK (key_size IN (128, 192, 256, 2048, 4096)),
    key_version INTEGER NOT NULL DEFAULT 1,
    
    -- Key Lifecycle Management
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'rotating', 'retired', 'compromised', 'revoked')),
    created_date TIMESTAMPTZ DEFAULT NOW(),
    activation_date TIMESTAMPTZ DEFAULT NOW(),
    expiration_date TIMESTAMPTZ NOT NULL,
    retirement_date TIMESTAMPTZ,
    
    -- External Key Management System Integration
    external_key_id TEXT, -- Reference to external KMS (AWS KMS, Azure Key Vault, etc.)
    key_vault_reference TEXT,
    hsm_reference TEXT, -- Hardware Security Module reference
    
    -- Key Usage Tracking
    usage_count BIGINT DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    max_usage_count BIGINT, -- Optional usage limit
    
    -- Access Control
    authorized_users UUID[], -- Users authorized to use this key
    authorized_applications TEXT[], -- Applications authorized to use this key
    
    -- Compliance and Audit
    compliance_requirements TEXT[], -- HIPAA, FIPS, Common Criteria, etc.
    audit_log_retention_days INTEGER DEFAULT 2555, -- 7 years for HIPAA
    
    -- Key Rotation
    rotation_frequency_days INTEGER DEFAULT 365, -- Annual rotation by default
    next_rotation_date TIMESTAMPTZ,
    auto_rotation_enabled BOOLEAN DEFAULT true,
    
    -- Backup and Recovery
    backup_key_id UUID REFERENCES encryption_keys(key_id),
    recovery_key_id UUID REFERENCES encryption_keys(key_id),
    
    -- Audit Trail
    created_by UUID NOT NULL REFERENCES profiles(id),
    last_modified_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Business Logic Constraints
    CONSTRAINT chk_key_lifecycle CHECK (
        (status = 'active' AND activation_date IS NOT NULL AND expiration_date > NOW()) OR
        (status = 'retired' AND retirement_date IS NOT NULL) OR
        (status IN ('rotating', 'compromised', 'revoked'))
    ),
    CONSTRAINT chk_expiration_after_activation CHECK (expiration_date > activation_date)
);

-- ============================================================================
-- 5. PATIENT RIGHTS MANAGEMENT (GDPR/HIPAA)
-- ============================================================================

-- Patient data subject rights requests
CREATE TABLE patient_rights_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient_profiles(user_id) ON DELETE CASCADE,
    
    -- Request Details
    request_type TEXT NOT NULL CHECK (request_type IN (
        'access', 'rectification', 'erasure', 'portability', 'restriction',
        'objection', 'accounting_of_disclosures', 'amendment', 'copy_of_records'
    )),
    request_description TEXT NOT NULL,
    
    -- Legal Basis
    legal_basis TEXT NOT NULL CHECK (legal_basis IN ('HIPAA', 'GDPR', 'CCPA', 'state_law', 'other')),
    specific_regulation_reference TEXT,
    
    -- Request Scope
    data_categories_requested TEXT[], -- Categories of data requested
    date_range_from DATE,
    date_range_to DATE,
    specific_records_requested TEXT[],
    
    -- Verification and Authentication
    identity_verified BOOLEAN DEFAULT false,
    verification_method TEXT CHECK (verification_method IN ('in_person', 'government_id', 'medical_record_verification', 'other')),
    verification_documents TEXT[],
    
    -- Processing Status
    status TEXT DEFAULT 'received' CHECK (status IN (
        'received', 'under_review', 'identity_verification_pending', 
        'processing', 'completed', 'partially_completed', 'denied', 'withdrawn'
    )),
    
    -- Response Timeline
    received_date TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ NOT NULL, -- Legal deadline for response
    completed_date TIMESTAMPTZ,
    
    -- Processing Details
    assigned_to UUID REFERENCES profiles(id),
    processing_notes TEXT,
    denial_reason TEXT,
    
    -- Response Delivery
    delivery_method TEXT CHECK (delivery_method IN ('secure_email', 'encrypted_portal', 'mail', 'in_person_pickup')),
    delivery_address JSONB,
    delivered_at TIMESTAMPTZ,
    
    -- Compliance Tracking
    response_time_days INTEGER,
    fee_charged DECIMAL(10,2) DEFAULT 0,
    fee_justification TEXT,
    
    -- Audit Trail
    created_by UUID REFERENCES profiles(id),
    last_modified_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. HIPAA COMPLIANCE FUNCTIONS
-- ============================================================================

-- Function to check patient consent for specific access
CREATE OR REPLACE FUNCTION check_patient_consent(
    p_patient_id UUID,
    p_consent_type TEXT,
    p_user_id UUID DEFAULT auth.uid(),
    p_purpose TEXT DEFAULT 'treatment'
)
RETURNS BOOLEAN AS $$
DECLARE
    consent_valid BOOLEAN := false;
    user_authorized BOOLEAN := false;
BEGIN
    -- Check if there's a valid consent
    SELECT EXISTS (
        SELECT 1 FROM hipaa_consents
        WHERE patient_id = p_patient_id
        AND consent_type = p_consent_type
        AND consent_status = 'granted'
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (
            authorized_users IS NULL OR 
            p_user_id = ANY(authorized_users) OR
            array_length(authorized_users, 1) IS NULL
        )
        AND (
            authorized_purposes IS NULL OR
            p_purpose = ANY(authorized_purposes) OR
            array_length(authorized_purposes, 1) IS NULL
        )
    ) INTO consent_valid;
    
    -- Log the consent check
    PERFORM log_security_event(
        'consent_check',
        'authorization',
        CASE WHEN consent_valid THEN 'success' ELSE 'failure' END,
        'Patient consent verification for ' || p_consent_type,
        jsonb_build_object(
            'patient_id', p_patient_id,
            'consent_type', p_consent_type,
            'purpose', p_purpose,
            'consent_valid', consent_valid
        ),
        CASE WHEN consent_valid THEN 'low' ELSE 'medium' END
    );
    
    RETURN consent_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to report data breach incident
CREATE OR REPLACE FUNCTION report_data_breach(
    p_incident_type TEXT,
    p_severity_level TEXT,
    p_incident_description TEXT,
    p_affected_patients UUID[],
    p_affected_data_types TEXT[],
    p_estimated_records_count INTEGER
)
RETURNS UUID AS $$
DECLARE
    incident_id UUID;
    requires_hhs BOOLEAN := false;
    requires_media BOOLEAN := false;
    requires_patients BOOLEAN := false;
BEGIN
    -- Determine notification requirements based on severity and scope
    IF p_severity_level IN ('high', 'critical') OR p_estimated_records_count >= 500 THEN
        requires_hhs := true;
        requires_patients := true;
        
        IF p_estimated_records_count >= 500 THEN
            requires_media := true;
        END IF;
    END IF;
    
    -- Insert breach incident
    INSERT INTO data_breach_incidents (
        incident_type, severity_level, incident_description,
        affected_patients, affected_data_types, estimated_records_count,
        potential_harm_assessment, likelihood_of_harm,
        requires_hhs_notification, requires_media_notification, requires_patient_notification,
        reported_by
    ) VALUES (
        p_incident_type, p_severity_level, p_incident_description,
        p_affected_patients, p_affected_data_types, p_estimated_records_count,
        'Assessment pending - incident reported automatically',
        CASE p_severity_level
            WHEN 'critical' THEN 'high'
            WHEN 'high' THEN 'medium'
            ELSE 'low'
        END,
        requires_hhs, requires_media, requires_patients,
        auth.uid()
    ) RETURNING data_breach_incidents.incident_id INTO incident_id;
    
    -- Log security event
    PERFORM log_security_event(
        'data_breach_reported',
        'security',
        'success',
        'Data breach incident reported: ' || p_incident_type,
        jsonb_build_object(
            'incident_id', incident_id,
            'severity', p_severity_level,
            'affected_count', p_estimated_records_count,
            'requires_hhs_notification', requires_hhs
        ),
        'critical'
    );
    
    -- Send immediate alert for high-severity incidents
    IF p_severity_level IN ('high', 'critical') THEN
        PERFORM pg_notify('data_breach_alert', json_build_object(
            'incident_id', incident_id,
            'severity', p_severity_level,
            'affected_count', p_estimated_records_count,
            'timestamp', NOW()
        )::text);
    END IF;
    
    RETURN incident_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process patient rights request
CREATE OR REPLACE FUNCTION process_patient_rights_request(
    p_patient_id UUID,
    p_request_type TEXT,
    p_request_description TEXT,
    p_legal_basis TEXT DEFAULT 'HIPAA'
)
RETURNS UUID AS $$
DECLARE
    request_id UUID;
    due_date TIMESTAMPTZ;
BEGIN
    -- Calculate due date based on legal requirements
    CASE p_legal_basis
        WHEN 'HIPAA' THEN
            due_date := NOW() + INTERVAL '30 days'; -- HIPAA allows 30 days
        WHEN 'GDPR' THEN
            due_date := NOW() + INTERVAL '30 days'; -- GDPR requires 1 month
        WHEN 'CCPA' THEN
            due_date := NOW() + INTERVAL '45 days'; -- CCPA allows 45 days
        ELSE
            due_date := NOW() + INTERVAL '30 days'; -- Default to 30 days
    END CASE;
    
    -- Insert rights request
    INSERT INTO patient_rights_requests (
        patient_id, request_type, request_description, legal_basis, due_date
    ) VALUES (
        p_patient_id, p_request_type, p_request_description, p_legal_basis, due_date
    ) RETURNING patient_rights_requests.request_id INTO request_id;
    
    -- Log the request
    PERFORM log_security_event(
        'patient_rights_request',
        'data_access',
        'success',
        'Patient rights request submitted: ' || p_request_type,
        jsonb_build_object(
            'request_id', request_id,
            'patient_id', p_patient_id,
            'request_type', p_request_type,
            'legal_basis', p_legal_basis
        ),
        'medium'
    );
    
    RETURN request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. PERFORMANCE INDEXES FOR HIPAA TABLES
-- ============================================================================

-- HIPAA consents indexes
CREATE INDEX idx_hipaa_consents_patient_type ON hipaa_consents(patient_id, consent_type);
CREATE INDEX idx_hipaa_consents_status_expires ON hipaa_consents(consent_status, expires_at) 
    WHERE consent_status = 'granted';
CREATE INDEX idx_hipaa_consents_authorized_users ON hipaa_consents USING gin(authorized_users);
CREATE INDEX idx_hipaa_consents_authorized_departments ON hipaa_consents USING gin(authorized_departments);

-- Data breach incidents indexes
CREATE INDEX idx_data_breach_incidents_severity_date ON data_breach_incidents(severity_level, discovery_date DESC);
CREATE INDEX idx_data_breach_incidents_status ON data_breach_incidents(investigation_status) 
    WHERE investigation_status IN ('open', 'investigating');
CREATE INDEX idx_data_breach_incidents_notification_required ON data_breach_incidents(requires_hhs_notification, requires_patient_notification);
CREATE INDEX idx_data_breach_incidents_affected_patients ON data_breach_incidents USING gin(affected_patients);

-- Encryption keys indexes
CREATE INDEX idx_encryption_keys_purpose_status ON encryption_keys(key_purpose, status) WHERE status = 'active';
CREATE INDEX idx_encryption_keys_expiration ON encryption_keys(expiration_date) WHERE status = 'active';
CREATE INDEX idx_encryption_keys_rotation ON encryption_keys(next_rotation_date) WHERE auto_rotation_enabled = true;

-- Patient rights requests indexes
CREATE INDEX idx_patient_rights_requests_patient_status ON patient_rights_requests(patient_id, status);
CREATE INDEX idx_patient_rights_requests_due_date ON patient_rights_requests(due_date) 
    WHERE status NOT IN ('completed', 'denied', 'withdrawn');
CREATE INDEX idx_patient_rights_requests_type_date ON patient_rights_requests(request_type, received_date DESC);

-- ============================================================================
-- 8. VALIDATION AND TESTING
-- ============================================================================

-- Validate HIPAA compliance implementation
CREATE OR REPLACE FUNCTION validate_hipaa_compliance()
RETURNS TABLE(
    component TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check consent management
    RETURN QUERY SELECT 
        'Consent Management'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hipaa_consents') 
             THEN 'SUCCESS' ELSE 'FAILED' END,
        'Patient consent tracking and management'::TEXT;
    
    -- Check breach incident tracking
    RETURN QUERY SELECT 
        'Breach Incident Tracking'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'data_breach_incidents') 
             THEN 'SUCCESS' ELSE 'FAILED' END,
        'Data breach incident management system'::TEXT;
    
    -- Check encryption key management
    RETURN QUERY SELECT 
        'Encryption Key Management'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'encryption_keys') 
             THEN 'SUCCESS' ELSE 'FAILED' END,
        'Encryption key lifecycle management'::TEXT;
    
    -- Check patient rights management
    RETURN QUERY SELECT 
        'Patient Rights Management'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patient_rights_requests') 
             THEN 'SUCCESS' ELSE 'FAILED' END,
        'Patient data subject rights processing'::TEXT;
    
    -- Check HIPAA functions
    RETURN QUERY SELECT 
        'HIPAA Functions'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'check_patient_consent')
             THEN 'SUCCESS' ELSE 'FAILED' END,
        'HIPAA compliance utility functions'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Display validation results
SELECT * FROM validate_hipaa_compliance();

-- ============================================================================
-- 9. FINAL VALIDATION AND COMPLETION
-- ============================================================================

DO $$
DECLARE
    validation_results RECORD;
    failed_components INTEGER := 0;
BEGIN
    -- Check validation results
    FOR validation_results IN SELECT * FROM validate_hipaa_compliance()
    LOOP
        IF validation_results.status = 'FAILED' THEN
            failed_components := failed_components + 1;
            RAISE WARNING 'Component failed: %', validation_results.component;
        END IF;
    END LOOP;
    
    IF failed_components > 0 THEN
        RAISE EXCEPTION 'HIPAA COMPLIANCE IMPLEMENTATION FAILED! % components failed validation.', failed_components;
    END IF;
    
    RAISE NOTICE '=== HIPAA COMPLIANCE FEATURES COMPLETED SUCCESSFULLY ===';
    RAISE NOTICE 'Patient consent management system operational.';
    RAISE NOTICE 'Data breach incident tracking system ready.';
    RAISE NOTICE 'Encryption key management system configured.';
    RAISE NOTICE 'Patient rights management system active.';
    RAISE NOTICE 'Ready for Phase 2.4: Security Monitoring & Alerting.';
END $$;
