-- Phase 2: Security & Compliance Database Schema
-- Enhanced Web Dashboard - Hospital Management System

-- =====================================================
-- 1. ROLES AND PERMISSIONS TABLES
-- =====================================================

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    is_system_role BOOLEAN DEFAULT false,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'user_management', 'department_management', 'system_config', 
        'security', 'reports', 'audit'
    )),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Role-Permission junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    granted_by UUID REFERENCES profiles(id),
    UNIQUE(role_id, permission_id)
);

-- User-Role junction table
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES profiles(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, role_id)
);

-- =====================================================
-- 2. SECURITY MANAGEMENT TABLES
-- =====================================================

-- Security incidents table
CREATE TABLE IF NOT EXISTS security_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'failed_login', 'suspicious_activity', 'policy_violation', 
        'unauthorized_access', 'data_breach', 'malware_detected'
    )),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    user_id UUID REFERENCES profiles(id),
    user_email VARCHAR(255),
    ip_address INET NOT NULL,
    user_agent TEXT,
    location VARCHAR(255),
    description TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN (
        'open', 'investigating', 'resolved', 'false_positive'
    )),
    assigned_to UUID REFERENCES profiles(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Active sessions table (for session management)
CREATE TABLE IF NOT EXISTS active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    ip_address INET NOT NULL,
    user_agent TEXT,
    location VARCHAR(255),
    device_type VARCHAR(20) CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
    login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_suspicious BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password history table (for password policy enforcement)
CREATE TABLE IF NOT EXISTS password_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Two-factor authentication table
CREATE TABLE IF NOT EXISTS two_factor_auth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    secret_key VARCHAR(255) NOT NULL,
    backup_codes TEXT[], -- Array of backup codes
    is_enabled BOOLEAN DEFAULT false,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. AUDIT LOGS TABLE (Enhanced)
-- =====================================================

-- Comprehensive audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(255),
    user_id UUID REFERENCES profiles(id),
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    user_role VARCHAR(50),
    ip_address INET,
    user_agent TEXT,
    location VARCHAR(255),
    session_id VARCHAR(255),
    saga_id UUID, -- For saga pattern integration
    operation_id UUID, -- For operation tracking
    details JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'warning')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_audit_logs_timestamp (timestamp DESC),
    INDEX idx_audit_logs_user_id (user_id),
    INDEX idx_audit_logs_action (action),
    INDEX idx_audit_logs_resource_type (resource_type),
    INDEX idx_audit_logs_saga_id (saga_id),
    INDEX idx_audit_logs_status (status)
);

-- =====================================================
-- 4. SYSTEM CONFIGURATION TABLE
-- =====================================================

-- System configuration for security policies
CREATE TABLE IF NOT EXISTS system_configuration (
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
-- 5. ENHANCED PROFILES TABLE (Add security fields)
-- =====================================================

-- Add security-related columns to existing profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_locked BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS locked_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_failed_login TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS security_questions JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_password_reminder TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- 6. INDEXES FOR PERFORMANCE
-- =====================================================

-- Roles and permissions indexes
CREATE INDEX IF NOT EXISTS idx_roles_status ON roles(status);
CREATE INDEX IF NOT EXISTS idx_roles_system ON roles(is_system_role);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active);

-- Security indexes
CREATE INDEX IF NOT EXISTS idx_security_incidents_type ON security_incidents(type);
CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_security_incidents_user ON security_incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_security_incidents_ip ON security_incidents(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_incidents_created ON security_incidents(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_active_sessions_user ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_session ON active_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_expires ON active_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_active_sessions_suspicious ON active_sessions(is_suspicious);

CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_history(user_id);
CREATE INDEX IF NOT EXISTS idx_password_history_created ON password_history(created_at DESC);

-- Profile security indexes
CREATE INDEX IF NOT EXISTS idx_profiles_locked ON profiles(account_locked);
CREATE INDEX IF NOT EXISTS idx_profiles_2fa ON profiles(two_factor_enabled);
CREATE INDEX IF NOT EXISTS idx_profiles_failed_logins ON profiles(failed_login_attempts);

-- System configuration indexes
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_configuration(key);
CREATE INDEX IF NOT EXISTS idx_system_config_category ON system_configuration(category);

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all security tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configuration ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roles table
CREATE POLICY "Admins can manage roles" ON roles
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

-- RLS Policies for permissions table
CREATE POLICY "Admins can view permissions" ON permissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN user_roles ur ON p.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('admin', 'superadmin')
            AND ur.is_active = true
        )
    );

-- RLS Policies for security incidents
CREATE POLICY "Admins can manage security incidents" ON security_incidents
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

-- RLS Policies for audit logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN user_roles ur ON p.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            WHERE p.id = auth.uid()
            AND r.name IN ('admin', 'superadmin')
            AND ur.is_active = true
        )
    );

CREATE POLICY "Users can create their own audit logs" ON audit_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for active sessions
CREATE POLICY "Users can view their own sessions" ON active_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all sessions" ON active_sessions
    FOR SELECT USING (
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
-- 8. FUNCTIONS AND TRIGGERS
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
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_incidents_updated_at BEFORE UPDATE ON security_incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_two_factor_auth_updated_at BEFORE UPDATE ON two_factor_auth
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_configuration_updated_at BEFORE UPDATE ON system_configuration
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM active_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to enforce password history
CREATE OR REPLACE FUNCTION check_password_history(user_id UUID, new_password_hash VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    history_count INTEGER;
    recent_passwords INTEGER;
BEGIN
    -- Get password history policy (default 5)
    SELECT COALESCE((value->>'history_count')::INTEGER, 5)
    INTO history_count
    FROM system_configuration
    WHERE key = 'password_policy';
    
    -- Check if password was used recently
    SELECT COUNT(*)
    INTO recent_passwords
    FROM (
        SELECT password_hash
        FROM password_history
        WHERE password_history.user_id = check_password_history.user_id
        ORDER BY created_at DESC
        LIMIT history_count
    ) recent
    WHERE password_hash = new_password_hash;
    
    RETURN recent_passwords = 0;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. INITIAL DATA SEEDING
-- =====================================================

-- Insert default permissions
INSERT INTO permissions (name, description, resource, action, category) VALUES
-- User Management
('Xem danh sách người dùng', 'Xem danh sách tất cả người dùng', 'users', 'read', 'user_management'),
('Tạo người dùng mới', 'Tạo tài khoản người dùng mới', 'users', 'create', 'user_management'),
('Cập nhật thông tin người dùng', 'Chỉnh sửa thông tin người dùng', 'users', 'update', 'user_management'),
('Xóa người dùng', 'Xóa tài khoản người dùng', 'users', 'delete', 'user_management'),
('Quản lý vai trò người dùng', 'Phân quyền vai trò cho người dùng', 'users', 'manage_roles', 'user_management'),

-- Department Management
('Xem danh sách khoa/phòng', 'Xem thông tin các khoa/phòng', 'departments', 'read', 'department_management'),
('Tạo khoa/phòng mới', 'Tạo khoa/phòng mới', 'departments', 'create', 'department_management'),
('Cập nhật thông tin khoa/phòng', 'Chỉnh sửa thông tin khoa/phòng', 'departments', 'update', 'department_management'),
('Xóa khoa/phòng', 'Xóa khoa/phòng', 'departments', 'delete', 'department_management'),

-- Security
('Xem nhật ký bảo mật', 'Xem các sự cố bảo mật', 'security', 'read', 'security'),
('Quản lý phiên đăng nhập', 'Quản lý phiên đăng nhập của người dùng', 'sessions', 'manage', 'security'),
('Cấu hình chính sách bảo mật', 'Thiết lập chính sách bảo mật hệ thống', 'security_policies', 'configure', 'security'),

-- System Configuration
('Xem cấu hình hệ thống', 'Xem các thiết lập hệ thống', 'system_config', 'read', 'system_config'),
('Cập nhật cấu hình hệ thống', 'Thay đổi thiết lập hệ thống', 'system_config', 'update', 'system_config'),

-- Audit
('Xem nhật ký kiểm toán', 'Xem nhật ký hoạt động hệ thống', 'audit_logs', 'read', 'audit'),
('Xuất báo cáo kiểm toán', 'Xuất báo cáo nhật ký kiểm toán', 'audit_logs', 'export', 'audit'),

-- Reports
('Xem báo cáo hệ thống', 'Xem các báo cáo tổng hợp', 'reports', 'read', 'reports'),
('Tạo báo cáo tùy chỉnh', 'Tạo báo cáo theo yêu cầu', 'reports', 'create', 'reports')
ON CONFLICT (name) DO NOTHING;

-- Insert default roles
INSERT INTO roles (name, description, is_system_role) VALUES
('superadmin', 'Quản trị viên cấp cao - Toàn quyền hệ thống', true),
('admin', 'Quản trị viên - Quản lý hệ thống', true),
('doctor', 'Bác sĩ - Quản lý bệnh nhân và điều trị', true),
('patient', 'Bệnh nhân - Xem thông tin cá nhân', true),
('staff', 'Nhân viên - Hỗ trợ vận hành', true)
ON CONFLICT (name) DO NOTHING;

-- Insert default system configuration
INSERT INTO system_configuration (key, value, description, category) VALUES
('password_policy', '{
    "min_length": 8,
    "require_uppercase": true,
    "require_lowercase": true,
    "require_numbers": true,
    "require_symbols": true,
    "max_age_days": 90,
    "history_count": 5,
    "lockout_attempts": 5,
    "lockout_duration_minutes": 30
}', 'Chính sách mật khẩu hệ thống', 'security'),

('session_policy', '{
    "timeout_minutes": 480,
    "max_concurrent_sessions": 3,
    "require_2fa_for_admin": true,
    "session_encryption": true
}', 'Chính sách phiên đăng nhập', 'security'),

('audit_policy', '{
    "retention_days": 365,
    "log_all_actions": true,
    "log_failed_attempts": true,
    "real_time_monitoring": true
}', 'Chính sách kiểm toán và nhật ký', 'audit')
ON CONFLICT (key) DO NOTHING;
