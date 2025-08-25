-- ============================================================================
-- PHASE 1: CREATE MEDICAL RECORDS AND TERMINOLOGY TABLES
-- Hospital Management System - Database Redesign
-- ============================================================================
-- This script creates medical records and medical terminology tables
-- Execute AFTER phase1-create-new-tables.sql

-- ============================================================================
-- 1. CREATE FHIR MEDICAL RECORDS TABLE (Encounter + Condition + Observation)
-- ============================================================================

CREATE TABLE medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id TEXT UNIQUE NOT NULL CHECK (record_id ~ '^[A-Z]{4}-MR-\d{6}-\d{3}$'),
    
    -- FHIR References
    patient_id UUID NOT NULL REFERENCES patient_profiles(user_id) ON DELETE RESTRICT,
    practitioner_id UUID NOT NULL REFERENCES doctor_profiles(user_id) ON DELETE RESTRICT,
    encounter_id UUID REFERENCES appointments(id),
    
    -- Encounter Information
    encounter_date DATE NOT NULL DEFAULT CURRENT_DATE,
    encounter_type TEXT DEFAULT 'ambulatory' CHECK (encounter_type IN ('inpatient', 'outpatient', 'ambulatory', 'emergency', 'home_health')),
    encounter_class TEXT DEFAULT 'outpatient' CHECK (encounter_class IN ('inpatient', 'outpatient', 'emergency', 'day_case')),
    
    -- SOAP Notes Structure
    subjective_data TEXT, -- Chief complaint, History of Present Illness
    objective_data TEXT, -- Physical examination, vital signs
    assessment TEXT, -- Clinical assessment and impression
    plan_data TEXT, -- Treatment plan and recommendations
    
    -- Vital Signs (FHIR Observation)
    vital_signs JSONB CHECK (
        vital_signs IS NULL OR jsonb_typeof(vital_signs) = 'object'
    ),
    
    -- ICD-10 Diagnosis (FHIR Condition)
    primary_diagnosis JSONB CHECK (
        primary_diagnosis IS NULL OR (
            primary_diagnosis ? 'code' AND 
            primary_diagnosis ? 'display' AND
            primary_diagnosis ? 'system' AND
            (primary_diagnosis->>'code') ~ '^[A-Z]\d{2}(\.\d{1,2})?$'
        )
    ),
    secondary_diagnoses JSONB DEFAULT '[]'::JSONB CHECK (jsonb_typeof(secondary_diagnoses) = 'array'),
    
    -- Procedures Performed
    procedures JSONB DEFAULT '[]'::JSONB CHECK (jsonb_typeof(procedures) = 'array'),
    
    -- Medications (FHIR MedicationRequest)
    medications JSONB DEFAULT '[]'::JSONB CHECK (jsonb_typeof(medications) = 'array'),
    
    -- Clinical Notes & Instructions
    clinical_notes TEXT,
    follow_up_instructions TEXT,
    patient_education_provided TEXT,
    next_appointment_recommended BOOLEAN DEFAULT false,
    referrals_made JSONB DEFAULT '[]'::JSONB,
    
    -- Document Status (FHIR DocumentReference)
    status TEXT DEFAULT 'preliminary' CHECK (status IN ('preliminary', 'final', 'amended', 'entered-in-error')),
    
    -- Quality & Completeness
    completeness_score DECIMAL(3,2) CHECK (completeness_score BETWEEN 0 AND 1),
    quality_flags JSONB DEFAULT '[]'::JSONB,
    
    -- Digital Signature & Security
    digital_signature TEXT,
    signature_timestamp TIMESTAMPTZ,
    signature_method VARCHAR(50),
    last_modified_by UUID REFERENCES profiles(id),
    
    -- Billing & Coding
    billing_codes JSONB DEFAULT '[]'::JSONB,
    total_charges DECIMAL(10,2) DEFAULT 0,
    
    -- Audit Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Business Logic Constraints
    CONSTRAINT chk_signed_record CHECK (
        (status IN ('preliminary', 'amended') AND digital_signature IS NULL) OR
        (status = 'final' AND digital_signature IS NOT NULL AND signature_timestamp IS NOT NULL)
    ),
    CONSTRAINT chk_encounter_date_logic CHECK (
        encounter_date <= CURRENT_DATE
    )
) PARTITION BY RANGE (encounter_date);

-- Create partitions for medical records
CREATE TABLE medical_records_2024 PARTITION OF medical_records
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE medical_records_2025 PARTITION OF medical_records
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE medical_records_2026 PARTITION OF medical_records
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- ============================================================================
-- 2. CREATE MEDICAL TERMINOLOGY SYSTEMS TABLE
-- ============================================================================

CREATE TABLE medical_terminology_systems (
    system_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    system_code VARCHAR(50) UNIQUE NOT NULL CHECK (system_code IN ('ICD-10', 'SNOMED-CT', 'LOINC', 'RxNorm', 'CPT', 'HCPCS')),
    system_name VARCHAR(200) NOT NULL,
    system_version VARCHAR(50) NOT NULL,
    system_uri TEXT NOT NULL,
    
    -- System Details
    publisher VARCHAR(100),
    description TEXT,
    copyright_notice TEXT,
    
    -- Supported Features
    supports_hierarchy BOOLEAN DEFAULT false,
    supports_translations BOOLEAN DEFAULT false,
    supported_languages TEXT[] DEFAULT '{"en", "vi"}',
    
    -- Status & Lifecycle
    is_active BOOLEAN DEFAULT true,
    effective_date DATE,
    expiration_date DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. CREATE MEDICAL CODES TABLE WITH VIETNAMESE SUPPORT
-- ============================================================================

CREATE TABLE medical_codes (
    code_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    system_id UUID NOT NULL REFERENCES medical_terminology_systems(system_id),
    code VARCHAR(100) NOT NULL,
    display_name TEXT NOT NULL,
    definition TEXT,
    
    -- Vietnamese Translations
    display_name_vi TEXT NOT NULL,
    definition_vi TEXT,
    
    -- Hierarchy Support
    parent_code VARCHAR(100),
    code_level INTEGER DEFAULT 1,
    code_path TEXT, -- Materialized path
    
    -- Additional Properties
    additional_properties JSONB DEFAULT '{}'::JSONB,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deprecated', 'experimental')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(system_id, code)
);

-- ============================================================================
-- 4. CREATE FHIR RESOURCES STORAGE TABLE
-- ============================================================================

CREATE TABLE fhir_resources (
    resource_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fhir_version VARCHAR(10) NOT NULL DEFAULT '4.0.1',
    resource_type VARCHAR(50) NOT NULL,
    logical_id VARCHAR(100) NOT NULL,
    
    -- Resource Content
    resource_content JSONB NOT NULL,
    narrative_content TEXT,
    
    -- Metadata
    version_id VARCHAR(50) DEFAULT '1',
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    profile_urls TEXT[],
    
    -- Security & Access
    security_labels JSONB DEFAULT '[]'::JSONB,
    confidentiality_code VARCHAR(10),
    
    -- Internal Mapping
    internal_id TEXT,
    internal_table VARCHAR(50),
    
    -- Validation
    validation_status VARCHAR(20) DEFAULT 'valid' CHECK (validation_status IN ('valid', 'warning', 'error')),
    validation_issues JSONB DEFAULT '[]'::JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(resource_type, logical_id, version_id)
);

-- ============================================================================
-- 5. SEED INITIAL DATA
-- ============================================================================

-- Insert Medical Terminology Systems
INSERT INTO medical_terminology_systems (system_code, system_name, system_version, system_uri, publisher) VALUES
('ICD-10', 'International Classification of Diseases 10th Revision', '2019', 'http://hl7.org/fhir/sid/icd-10', 'WHO'),
('SNOMED-CT', 'Systematized Nomenclature of Medicine Clinical Terms', '2023-03', 'http://snomed.info/sct', 'SNOMED International'),
('LOINC', 'Logical Observation Identifiers Names and Codes', '2.73', 'http://loinc.org', 'Regenstrief Institute'),
('RxNorm', 'RxNorm Vocabulary', '2023-12', 'http://www.nlm.nih.gov/research/umls/rxnorm', 'NLM'),
('CPT', 'Current Procedural Terminology', '2024', 'http://www.ama-assn.org/go/cpt', 'AMA');

-- Insert Sample Departments
INSERT INTO departments (department_id, name, name_vi, description, description_vi) VALUES
('DEPT001', 'Cardiology', 'Khoa Tim Mạch', 'Heart and cardiovascular diseases', 'Bệnh lý tim mạch và hệ tuần hoàn'),
('DEPT002', 'Neurology', 'Khoa Thần Kinh', 'Nervous system disorders', 'Rối loạn hệ thần kinh'),
('DEPT003', 'Orthopedics', 'Khoa Chấn Thương Chỉnh Hình', 'Bone and joint disorders', 'Bệnh lý xương khớp'),
('DEPT004', 'Pediatrics', 'Khoa Nhi', 'Children healthcare', 'Chăm sóc sức khỏe trẻ em'),
('DEPT005', 'Internal Medicine', 'Khoa Nội Tổng Hợp', 'General internal medicine', 'Nội khoa tổng hợp'),
('DEPT006', 'Emergency Medicine', 'Khoa Cấp Cứu', 'Emergency and trauma care', 'Cấp cứu và chấn thương'),
('DEPT007', 'Obstetrics Gynecology', 'Khoa Sản Phụ Khoa', 'Women health and childbirth', 'Sức khỏe phụ nữ và sinh nở'),
('DEPT008', 'Psychiatry', 'Khoa Tâm Thần', 'Mental health disorders', 'Rối loạn sức khỏe tâm thần');

-- Insert Common ICD-10 Codes with Vietnamese translations
INSERT INTO medical_codes (system_id, code, display_name, display_name_vi, definition_vi) 
SELECT 
    (SELECT system_id FROM medical_terminology_systems WHERE system_code = 'ICD-10'),
    code, display_name, display_name_vi, definition_vi
FROM (VALUES
    ('I10', 'Essential hypertension', 'Tăng huyết áp nguyên phát', 'Tăng huyết áp không rõ nguyên nhân'),
    ('E11', 'Type 2 diabetes mellitus', 'Đái tháo đường type 2', 'Đái tháo đường không phụ thuộc insulin'),
    ('J44', 'Chronic obstructive pulmonary disease', 'Bệnh phổi tắc nghẽn mãn tính', 'COPD - bệnh phổi tắc nghẽn mãn tính'),
    ('M79.3', 'Panniculitis, unspecified', 'Viêm mô mỡ dưới da', 'Viêm lớp mỡ dưới da không đặc hiệu'),
    ('K59.0', 'Constipation', 'Táo bón', 'Tình trạng đại tiện khó khăn hoặc ít'),
    ('R50', 'Fever, unspecified', 'Sốt không đặc hiệu', 'Tình trạng tăng thân nhiệt không rõ nguyên nhân'),
    ('J06.9', 'Acute upper respiratory infection', 'Nhiễm trùng đường hô hấp trên cấp tính', 'Viêm nhiễm cấp tính vùng mũi họng'),
    ('K29.9', 'Gastritis, unspecified', 'Viêm dạ dày không đặc hiệu', 'Viêm niêm mạc dạ dày'),
    ('M25.50', 'Pain in unspecified joint', 'Đau khớp không đặc hiệu', 'Cảm giác đau tại vùng khớp'),
    ('Z00.00', 'General adult medical examination', 'Khám sức khỏe tổng quát người lớn', 'Khám định kỳ đánh giá tình trạng sức khỏe')
) AS t(code, display_name, display_name_vi, definition_vi);

-- ============================================================================
-- 6. VERIFICATION
-- ============================================================================

-- Verify all tables are created successfully
DO $$
DECLARE
    expected_tables TEXT[] := ARRAY['medical_records', 'medical_terminology_systems', 'medical_codes', 'fhir_resources'];
    created_tables INTEGER;
    missing_tables TEXT;
BEGIN
    SELECT COUNT(*) INTO created_tables
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
        AND table_name = ANY(expected_tables);
    
    IF created_tables != array_length(expected_tables, 1) THEN
        SELECT STRING_AGG(t, ', ') INTO missing_tables
        FROM unnest(expected_tables) AS t
        WHERE t NOT IN (
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        );
        
        RAISE EXCEPTION 'TABLE CREATION FAILED! Missing tables: %', missing_tables;
    ELSE
        RAISE NOTICE 'SUCCESS: All % medical tables created successfully.', created_tables;
    END IF;
END $$;

RAISE NOTICE 'Medical records and terminology tables created successfully!';
