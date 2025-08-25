-- Phase 3: Reports & Data Management Database Schema
-- Enhanced Web Dashboard - Hospital Management System

-- =====================================================
-- 1. REPORTS MANAGEMENT TABLES
-- =====================================================

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'system', 'users', 'security', 'departments', 'audit', 'medical', 'financial'
    )),
    type VARCHAR(20) NOT NULL CHECK (type IN ('chart', 'table', 'summary', 'dashboard')),
    data JSONB NOT NULL DEFAULT '[]',
    parameters JSONB DEFAULT '{}',
    generated_by UUID REFERENCES profiles(id),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_scheduled BOOLEAN DEFAULT false,
    schedule_config JSONB DEFAULT '{}',
    file_path VARCHAR(500),
    file_size VARCHAR(20),
    download_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report templates table
CREATE TABLE IF NOT EXISTS report_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    query_template TEXT NOT NULL,
    parameters_schema JSONB DEFAULT '{}',
    chart_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scheduled reports table
CREATE TABLE IF NOT EXISTS scheduled_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    schedule_expression VARCHAR(100) NOT NULL, -- Cron expression
    parameters JSONB DEFAULT '{}',
    recipients JSONB NOT NULL DEFAULT '[]', -- Array of email addresses
    format VARCHAR(20) DEFAULT 'pdf' CHECK (format IN ('pdf', 'excel', 'csv')),
    is_active BOOLEAN DEFAULT true,
    last_run TIMESTAMP WITH TIME ZONE,
    next_run TIMESTAMP WITH TIME ZONE,
    run_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. DATA MANAGEMENT TABLES
-- =====================================================

-- Backups table
CREATE TABLE IF NOT EXISTS backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('full', 'incremental', 'differential')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'in_progress', 'completed', 'failed', 'cancelled'
    )),
    size VARCHAR(20),
    file_path VARCHAR(500),
    tables_included JSONB DEFAULT '[]',
    retention_days INTEGER DEFAULT 30,
    compressed BOOLEAN DEFAULT true,
    error_message TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE GENERATED ALWAYS AS (created_at + INTERVAL '1 day' * retention_days) STORED
);

-- Data exports table
CREATE TABLE IF NOT EXISTS data_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    format VARCHAR(20) NOT NULL CHECK (format IN ('csv', 'excel', 'json', 'pdf')),
    tables JSONB NOT NULL DEFAULT '[]',
    filters JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed', 'expired'
    )),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    file_size VARCHAR(20),
    file_path VARCHAR(500),
    download_url VARCHAR(500),
    download_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Data imports table
CREATE TABLE IF NOT EXISTS data_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    source_file VARCHAR(500) NOT NULL,
    target_table VARCHAR(100) NOT NULL,
    format VARCHAR(20) NOT NULL CHECK (format IN ('csv', 'excel', 'json')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'validating', 'processing', 'completed', 'failed', 'cancelled'
    )),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    total_records INTEGER DEFAULT 0,
    processed_records INTEGER DEFAULT 0,
    successful_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    validation_errors JSONB DEFAULT '[]',
    mapping_config JSONB DEFAULT '{}',
    error_message TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 3. NOTIFICATION MANAGEMENT TABLES
-- =====================================================

-- Notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    content TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'sms', 'push', 'in_app')),
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'appointment', 'security', 'system', 'medical', 'billing', 'reminder'
    )),
    variables JSONB DEFAULT '[]', -- Array of variable names
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification history table
CREATE TABLE IF NOT EXISTS notification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES notification_templates(id),
    template_name VARCHAR(255),
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('user', 'role', 'department', 'all')),
    recipients JSONB NOT NULL DEFAULT '[]',
    subject VARCHAR(500),
    content TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'sms', 'push', 'in_app')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'sent', 'delivered', 'failed', 'cancelled'
    )),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    delivery_rate DECIMAL(5,2) DEFAULT 0,
    open_rate DECIMAL(5,2),
    click_rate DECIMAL(5,2),
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification settings table
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    is_encrypted BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. SYSTEM METRICS AND MONITORING
-- =====================================================

-- System metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(20),
    category VARCHAR(50) NOT NULL,
    tags JSONB DEFAULT '{}',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Composite index for time-series queries
    INDEX idx_system_metrics_time_series (metric_name, recorded_at DESC)
);

-- Storage usage table
CREATE TABLE IF NOT EXISTS storage_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    schema_name VARCHAR(100) DEFAULT 'public',
    row_count BIGINT NOT NULL,
    size_bytes BIGINT NOT NULL,
    size_pretty VARCHAR(20) NOT NULL,
    last_vacuum TIMESTAMP WITH TIME ZONE,
    last_analyze TIMESTAMP WITH TIME ZONE,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. INDEXES FOR PERFORMANCE
-- =====================================================

-- Reports indexes
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_generated_at ON reports(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_generated_by ON reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_reports_expires_at ON reports(expires_at);

-- Report templates indexes
CREATE INDEX IF NOT EXISTS idx_report_templates_category ON report_templates(category);
CREATE INDEX IF NOT EXISTS idx_report_templates_active ON report_templates(is_active);

-- Scheduled reports indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run ON scheduled_reports(next_run);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_active ON scheduled_reports(is_active);

-- Backups indexes
CREATE INDEX IF NOT EXISTS idx_backups_status ON backups(status);
CREATE INDEX IF NOT EXISTS idx_backups_type ON backups(type);
CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backups_expires_at ON backups(expires_at);

-- Data exports indexes
CREATE INDEX IF NOT EXISTS idx_data_exports_status ON data_exports(status);
CREATE INDEX IF NOT EXISTS idx_data_exports_created_by ON data_exports(created_by);
CREATE INDEX IF NOT EXISTS idx_data_exports_expires_at ON data_exports(expires_at);

-- Data imports indexes
CREATE INDEX IF NOT EXISTS idx_data_imports_status ON data_imports(status);
CREATE INDEX IF NOT EXISTS idx_data_imports_target_table ON data_imports(target_table);
CREATE INDEX IF NOT EXISTS idx_data_imports_created_at ON data_imports(created_at DESC);

-- Notification templates indexes
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_category ON notification_templates(category);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active);

-- Notification history indexes
CREATE INDEX IF NOT EXISTS idx_notification_history_template ON notification_history(template_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_status ON notification_history(status);
CREATE INDEX IF NOT EXISTS idx_notification_history_sent_at ON notification_history(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_history_type ON notification_history(type);

-- System metrics indexes
CREATE INDEX IF NOT EXISTS idx_system_metrics_category ON system_metrics(category);
CREATE INDEX IF NOT EXISTS idx_system_metrics_recorded_at ON system_metrics(recorded_at DESC);

-- Storage usage indexes
CREATE INDEX IF NOT EXISTS idx_storage_usage_table ON storage_usage(table_name);
CREATE INDEX IF NOT EXISTS idx_storage_usage_recorded_at ON storage_usage(recorded_at DESC);

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reports
CREATE POLICY "Admins can manage reports" ON reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN user_roles ur ON p.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('admin', 'superadmin')
            AND ur.is_active = true
        )
    );

-- RLS Policies for backups
CREATE POLICY "Admins can manage backups" ON backups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN user_roles ur ON p.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('admin', 'superadmin')
            AND ur.is_active = true
        )
    );

-- RLS Policies for notification templates
CREATE POLICY "Admins can manage notification templates" ON notification_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN user_roles ur ON p.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('admin', 'superadmin')
            AND ur.is_active = true
        )
    );

-- =====================================================
-- 7. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_templates_updated_at BEFORE UPDATE ON report_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_reports_updated_at BEFORE UPDATE ON scheduled_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON notification_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
    -- Clean up expired reports
    DELETE FROM reports WHERE expires_at < NOW();
    
    -- Clean up expired data exports
    DELETE FROM data_exports WHERE expires_at < NOW();
    
    -- Clean up expired backups
    DELETE FROM backups WHERE expires_at < NOW();
    
    -- Clean up old system metrics (keep last 30 days)
    DELETE FROM system_metrics WHERE recorded_at < NOW() - INTERVAL '30 days';
    
    -- Clean up old storage usage records (keep last 7 days)
    DELETE FROM storage_usage WHERE recorded_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Function to update storage usage statistics
CREATE OR REPLACE FUNCTION update_storage_usage()
RETURNS void AS $$
DECLARE
    table_record RECORD;
BEGIN
    -- Clear existing records for today
    DELETE FROM storage_usage WHERE DATE(recorded_at) = CURRENT_DATE;
    
    -- Insert current storage usage for all tables
    FOR table_record IN
        SELECT 
            schemaname,
            tablename,
            n_tup_ins + n_tup_upd + n_tup_del as row_count,
            pg_total_relation_size(schemaname||'.'||tablename) as size_bytes,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size_pretty,
            last_vacuum,
            last_analyze
        FROM pg_stat_user_tables
    LOOP
        INSERT INTO storage_usage (
            table_name, schema_name, row_count, size_bytes, size_pretty,
            last_vacuum, last_analyze, recorded_at
        ) VALUES (
            table_record.tablename,
            table_record.schemaname,
            table_record.row_count,
            table_record.size_bytes,
            table_record.size_pretty,
            table_record.last_vacuum,
            table_record.last_analyze,
            NOW()
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. INITIAL DATA SEEDING
-- =====================================================

-- Insert default notification settings
INSERT INTO notification_settings (key, value, description, category) VALUES
('email_config', '{
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 587,
    "smtp_username": "",
    "smtp_password": "",
    "smtp_encryption": "tls",
    "from_email": "noreply@hospital.com",
    "from_name": "Hospital Management System"
}', 'Email SMTP configuration', 'email'),

('sms_config', '{
    "provider": "twilio",
    "api_key": "",
    "api_secret": "",
    "from_number": ""
}', 'SMS provider configuration', 'sms'),

('notification_limits', '{
    "email_per_hour": 1000,
    "sms_per_hour": 100,
    "push_per_hour": 5000,
    "max_recipients_per_batch": 100
}', 'Notification rate limits', 'limits')
ON CONFLICT (key) DO NOTHING;

-- Insert default notification templates
INSERT INTO notification_templates (name, subject, content, type, category, variables) VALUES
('Appointment Reminder', 'Nhắc nhở lịch hẹn - {{appointment_date}}', 
'Xin chào {{patient_name}},

Đây là lời nhắc về cuộc hẹn của bạn:
- Ngày: {{appointment_date}}
- Thời gian: {{appointment_time}}
- Bác sĩ: {{doctor_name}}
- Khoa: {{department_name}}

Vui lòng đến đúng giờ. Nếu cần thay đổi, hãy liên hệ với chúng tôi.

Trân trọng,
{{hospital_name}}', 'email', 'appointment', 
'["patient_name", "appointment_date", "appointment_time", "doctor_name", "department_name", "hospital_name"]'),

('Security Alert', 'Cảnh báo bảo mật - {{alert_type}}',
'Cảnh báo bảo mật:

Loại: {{alert_type}}
Thời gian: {{timestamp}}
Mô tả: {{description}}
IP Address: {{ip_address}}

Vui lòng kiểm tra và xử lý nếu cần thiết.', 'email', 'security',
'["alert_type", "timestamp", "description", "ip_address"]'),

('System Maintenance', 'Thông báo bảo trì hệ thống',
'Thông báo bảo trì hệ thống:

Thời gian bắt đầu: {{start_time}}
Thời gian kết thúc: {{end_time}}
Mô tả: {{description}}

Trong thời gian này, hệ thống có thể không khả dụng.

Xin lỗi vì sự bất tiện này.', 'email', 'system',
'["start_time", "end_time", "description"]')
ON CONFLICT DO NOTHING;
