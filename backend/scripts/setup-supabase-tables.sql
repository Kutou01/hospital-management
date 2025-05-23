-- Hospital Management System - Supabase Tables Setup
-- This script creates additional tables needed for the microservices

-- =====================================================
-- MEDICAL RECORDS SERVICE TABLES
-- =====================================================

-- Extend existing medical_records table
DO $$ 
BEGIN
    -- Add columns to existing medical_records table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'medical_records' AND column_name = 'chief_complaint') THEN
        ALTER TABLE medical_records ADD COLUMN chief_complaint TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'medical_records' AND column_name = 'present_illness') THEN
        ALTER TABLE medical_records ADD COLUMN present_illness TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'medical_records' AND column_name = 'past_medical_history') THEN
        ALTER TABLE medical_records ADD COLUMN past_medical_history TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'medical_records' AND column_name = 'physical_examination') THEN
        ALTER TABLE medical_records ADD COLUMN physical_examination TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'medical_records' AND column_name = 'vital_signs') THEN
        ALTER TABLE medical_records ADD COLUMN vital_signs JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'medical_records' AND column_name = 'treatment_plan') THEN
        ALTER TABLE medical_records ADD COLUMN treatment_plan TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'medical_records' AND column_name = 'follow_up_instructions') THEN
        ALTER TABLE medical_records ADD COLUMN follow_up_instructions TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'medical_records' AND column_name = 'status') THEN
        ALTER TABLE medical_records ADD COLUMN status VARCHAR(20) DEFAULT 'active' 
        CHECK (status IN ('active', 'archived', 'deleted'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'medical_records' AND column_name = 'created_by') THEN
        ALTER TABLE medical_records ADD COLUMN created_by VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'medical_records' AND column_name = 'updated_by') THEN
        ALTER TABLE medical_records ADD COLUMN updated_by VARCHAR(20);
    END IF;
END $$;

-- Medical Record Attachments table
CREATE TABLE IF NOT EXISTS medical_record_attachments (
    attachment_id VARCHAR(20) PRIMARY KEY,
    record_id VARCHAR(20) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    description TEXT,
    uploaded_by VARCHAR(20) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lab Results table
CREATE TABLE IF NOT EXISTS lab_results (
    result_id VARCHAR(20) PRIMARY KEY,
    record_id VARCHAR(20) NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    test_type VARCHAR(100) NOT NULL,
    result_value VARCHAR(255),
    reference_range VARCHAR(255),
    unit VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    test_date TIMESTAMP NOT NULL,
    result_date TIMESTAMP,
    lab_technician VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vital Signs History table
CREATE TABLE IF NOT EXISTS vital_signs_history (
    vital_id VARCHAR(20) PRIMARY KEY,
    record_id VARCHAR(20) NOT NULL,
    temperature DECIMAL(4,1),
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    heart_rate INTEGER,
    respiratory_rate INTEGER,
    oxygen_saturation DECIMAL(5,2),
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    bmi DECIMAL(4,1),
    recorded_at TIMESTAMP NOT NULL,
    recorded_by VARCHAR(20) NOT NULL,
    notes TEXT
);

-- =====================================================
-- PRESCRIPTION SERVICE TABLES
-- =====================================================

-- Extend existing prescriptions table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'prescriptions' AND column_name = 'medical_record_id') THEN
        ALTER TABLE prescriptions ADD COLUMN medical_record_id VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'prescriptions' AND column_name = 'prescription_date') THEN
        ALTER TABLE prescriptions ADD COLUMN prescription_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'prescriptions' AND column_name = 'status') THEN
        ALTER TABLE prescriptions ADD COLUMN status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'dispensed', 'cancelled', 'expired'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'prescriptions' AND column_name = 'total_cost') THEN
        ALTER TABLE prescriptions ADD COLUMN total_cost DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'prescriptions' AND column_name = 'pharmacy_notes') THEN
        ALTER TABLE prescriptions ADD COLUMN pharmacy_notes TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'prescriptions' AND column_name = 'dispensed_by') THEN
        ALTER TABLE prescriptions ADD COLUMN dispensed_by VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'prescriptions' AND column_name = 'dispensed_at') THEN
        ALTER TABLE prescriptions ADD COLUMN dispensed_at TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'prescriptions' AND column_name = 'created_by') THEN
        ALTER TABLE prescriptions ADD COLUMN created_by VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'prescriptions' AND column_name = 'updated_by') THEN
        ALTER TABLE prescriptions ADD COLUMN updated_by VARCHAR(20);
    END IF;
END $$;

-- Prescription Items table
CREATE TABLE IF NOT EXISTS prescription_items (
    item_id VARCHAR(20) PRIMARY KEY,
    prescription_id VARCHAR(20) NOT NULL,
    medication_id VARCHAR(20) NOT NULL,
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    unit VARCHAR(50) DEFAULT 'pieces',
    instructions TEXT NOT NULL,
    cost_per_unit DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    substitution_allowed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medications table
CREATE TABLE IF NOT EXISTS medications (
    medication_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    brand_name VARCHAR(255),
    category VARCHAR(100) NOT NULL,
    form VARCHAR(50) NOT NULL, -- tablet, capsule, syrup, injection, etc.
    strength VARCHAR(50) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    manufacturer VARCHAR(255),
    description TEXT,
    contraindications TEXT,
    side_effects TEXT,
    storage_conditions TEXT,
    price_per_unit DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    expiry_date DATE,
    requires_prescription BOOLEAN DEFAULT true,
    is_controlled_substance BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drug Interactions table
CREATE TABLE IF NOT EXISTS drug_interactions (
    interaction_id VARCHAR(20) PRIMARY KEY,
    medication1_id VARCHAR(20) NOT NULL,
    medication2_id VARCHAR(20) NOT NULL,
    interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('major', 'moderate', 'minor')),
    description TEXT NOT NULL,
    severity_level INTEGER CHECK (severity_level BETWEEN 1 AND 10),
    recommendation TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- BILLING SERVICE TABLES
-- =====================================================

-- Extend existing billing table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'billing' AND column_name = 'invoice_number') THEN
        ALTER TABLE billing ADD COLUMN invoice_number VARCHAR(50) UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'billing' AND column_name = 'bill_date') THEN
        ALTER TABLE billing ADD COLUMN bill_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'billing' AND column_name = 'due_date') THEN
        ALTER TABLE billing ADD COLUMN due_date TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'billing' AND column_name = 'status') THEN
        ALTER TABLE billing ADD COLUMN status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'refunded'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'billing' AND column_name = 'subtotal') THEN
        ALTER TABLE billing ADD COLUMN subtotal DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'billing' AND column_name = 'tax_amount') THEN
        ALTER TABLE billing ADD COLUMN tax_amount DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'billing' AND column_name = 'discount_amount') THEN
        ALTER TABLE billing ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'billing' AND column_name = 'insurance_coverage') THEN
        ALTER TABLE billing ADD COLUMN insurance_coverage DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'billing' AND column_name = 'created_by') THEN
        ALTER TABLE billing ADD COLUMN created_by VARCHAR(20);
    END IF;
END $$;

-- Billing Items table
CREATE TABLE IF NOT EXISTS billing_items (
    item_id VARCHAR(20) PRIMARY KEY,
    bill_id VARCHAR(20) NOT NULL,
    service_type VARCHAR(50) NOT NULL, -- consultation, procedure, medication, lab_test, etc.
    service_id VARCHAR(20), -- reference to specific service
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- NOTIFICATION SERVICE TABLES
-- =====================================================

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id VARCHAR(20) PRIMARY KEY,
    recipient_id VARCHAR(20) NOT NULL,
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('patient', 'doctor', 'admin', 'staff')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- appointment_reminder, prescription_ready, payment_due, etc.
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'sms', 'push', 'in_app')),
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification Templates table
CREATE TABLE IF NOT EXISTS notification_templates (
    template_id VARCHAR(20) PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    subject_template TEXT,
    body_template TEXT NOT NULL,
    variables JSONB, -- Available template variables
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- FILE STORAGE SERVICE TABLES
-- =====================================================

-- Files table
CREATE TABLE IF NOT EXISTS files (
    file_id VARCHAR(20) PRIMARY KEY,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- image, document, medical_image, etc.
    entity_type VARCHAR(50), -- medical_record, prescription, patient, etc.
    entity_id VARCHAR(20), -- ID of the related entity
    uploaded_by VARCHAR(20) NOT NULL,
    is_public BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- AUDIT SERVICE TABLES
-- =====================================================

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(20),
    user_type VARCHAR(20), -- admin, doctor, patient, system
    action VARCHAR(100) NOT NULL, -- create, update, delete, view, login, logout
    entity_type VARCHAR(50) NOT NULL, -- patient, doctor, prescription, etc.
    entity_id VARCHAR(20),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- =====================================================
-- CHATBOT SERVICE TABLES
-- =====================================================

-- Chat Sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
    session_id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(20),
    user_type VARCHAR(20) CHECK (user_type IN ('patient', 'doctor', 'admin', 'anonymous')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'ended', 'transferred')),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    metadata JSONB
);

-- Chat Messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    message_id VARCHAR(20) PRIMARY KEY,
    session_id VARCHAR(20) NOT NULL,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'bot', 'human_agent')),
    message_text TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'quick_reply', 'card')),
    intent VARCHAR(100), -- detected intent from NLP
    confidence_score DECIMAL(3,2), -- confidence in intent detection
    response_time_ms INTEGER, -- time taken to generate response
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Medical Records indexes
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_id ON medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_status ON medical_records(status);
CREATE INDEX IF NOT EXISTS idx_medical_record_attachments_record_id ON medical_record_attachments(record_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_record_id ON lab_results(record_id);
CREATE INDEX IF NOT EXISTS idx_vital_signs_record_id ON vital_signs_history(record_id);

-- Prescription indexes
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription_id ON prescription_items(prescription_id);
CREATE INDEX IF NOT EXISTS idx_medications_name ON medications(name);
CREATE INDEX IF NOT EXISTS idx_medications_category ON medications(category);

-- Billing indexes
CREATE INDEX IF NOT EXISTS idx_billing_patient_id ON billing(patient_id);
CREATE INDEX IF NOT EXISTS idx_billing_status ON billing(status);
CREATE INDEX IF NOT EXISTS idx_billing_items_bill_id ON billing_items(bill_id);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_at ON notifications(scheduled_at);

-- File indexes
CREATE INDEX IF NOT EXISTS idx_files_entity_type_id ON files(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by);

-- Audit indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type_id ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Chat indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
