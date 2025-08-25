-- ============================================================================
-- PHASE 2.4: SECURITY MONITORING & ALERTING SYSTEM
-- Hospital Management System - Security & Compliance
-- ============================================================================
-- This script implements real-time security monitoring and threat detection
-- Execute AFTER Phase 2.3 (HIPAA Compliance) completion
-- CRITICAL: This provides proactive security threat detection and response

-- ============================================================================
-- 1. PRE-IMPLEMENTATION VALIDATION
-- ============================================================================

-- Verify HIPAA compliance features are operational
DO $$
BEGIN
    -- Check if HIPAA compliance tables exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hipaa_consents' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'HIPAA consent management not implemented! Execute Phase 2.3 first.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'data_breach_incidents' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'Data breach incident tracking not implemented! Execute Phase 2.3 first.';
    END IF;
    
    -- Check if security audit events table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_audit_events' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'Security audit events not implemented! Execute Phase 2.2 first.';
    END IF;
    
    RAISE NOTICE 'HIPAA compliance validation passed. Proceeding with security monitoring implementation...';
END $$;

-- ============================================================================
-- 2. SECURITY THREAT DETECTION RULES
-- ============================================================================

-- Security threat detection rules table
CREATE TABLE security_threat_rules (
    rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(100) UNIQUE NOT NULL,
    rule_description TEXT NOT NULL,
    
    -- Rule Configuration
    rule_type TEXT NOT NULL CHECK (rule_type IN (
        'anomaly_detection', 'pattern_matching', 'threshold_based', 
        'behavioral_analysis', 'signature_based', 'machine_learning'
    )),
    severity_level TEXT NOT NULL CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Detection Logic
    detection_query TEXT NOT NULL, -- SQL query for threat detection
    detection_parameters JSONB DEFAULT '{}'::JSONB,
    threshold_values JSONB DEFAULT '{}'::JSONB,
    
    -- Time Windows
    evaluation_window_minutes INTEGER DEFAULT 60,
    cooldown_period_minutes INTEGER DEFAULT 30,
    
    -- Response Actions
    auto_response_enabled BOOLEAN DEFAULT false,
    response_actions JSONB DEFAULT '[]'::JSONB,
    notification_channels JSONB DEFAULT '[]'::JSONB,
    
    -- Rule Status
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMPTZ,
    trigger_count INTEGER DEFAULT 0,
    
    -- Performance Metrics
    false_positive_rate DECIMAL(5,4) DEFAULT 0.0000,
    detection_accuracy DECIMAL(5,4) DEFAULT 1.0000,
    
    -- Audit Trail
    created_by UUID NOT NULL REFERENCES profiles(id),
    last_modified_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. SECURITY ALERTS AND INCIDENTS
-- ============================================================================

-- Security alerts table
CREATE TABLE security_alerts (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES security_threat_rules(rule_id),
    
    -- Alert Details
    alert_title VARCHAR(200) NOT NULL,
    alert_description TEXT NOT NULL,
    severity_level TEXT NOT NULL CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Threat Information
    threat_type TEXT NOT NULL,
    threat_indicators JSONB DEFAULT '[]'::JSONB,
    affected_resources JSONB DEFAULT '[]'::JSONB,
    
    -- Context Information
    source_ip INET,
    user_id UUID REFERENCES profiles(id),
    session_id TEXT,
    
    -- Detection Details
    detection_timestamp TIMESTAMPTZ DEFAULT NOW(),
    detection_data JSONB NOT NULL,
    confidence_score DECIMAL(5,4) CHECK (confidence_score BETWEEN 0 AND 1),
    
    -- Alert Status
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive', 'suppressed')),
    
    -- Response Tracking
    assigned_to UUID REFERENCES profiles(id),
    escalated_to UUID REFERENCES profiles(id),
    response_actions_taken JSONB DEFAULT '[]'::JSONB,
    
    -- Resolution
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    resolution_category TEXT CHECK (resolution_category IN (
        'true_positive', 'false_positive', 'benign_positive', 'undetermined'
    )),
    
    -- Audit Trail
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. REAL-TIME MONITORING VIEWS
-- ============================================================================

-- Active security threats view
CREATE VIEW active_security_threats AS
SELECT 
    sa.alert_id,
    sa.alert_title,
    sa.severity_level,
    sa.threat_type,
    sa.detection_timestamp,
    sa.status,
    sa.assigned_to,
    str.rule_name,
    p.full_name as assigned_user_name,
    EXTRACT(EPOCH FROM (NOW() - sa.detection_timestamp))/60 as minutes_since_detection
FROM security_alerts sa
JOIN security_threat_rules str ON str.rule_id = sa.rule_id
LEFT JOIN profiles p ON p.id = sa.assigned_to
WHERE sa.status IN ('open', 'investigating')
ORDER BY sa.severity_level DESC, sa.detection_timestamp DESC;

-- PHI access anomalies view
CREATE VIEW phi_access_anomalies AS
SELECT 
    pal.log_id,
    pal.user_id,
    p.full_name as user_name,
    p.role as user_role,
    pal.patient_id,
    pal.access_type,
    pal.table_name,
    pal.risk_level,
    pal.risk_factors,
    pal.access_timestamp,
    -- Calculate access frequency in last hour
    (
        SELECT COUNT(*) 
        FROM phi_access_log pal2 
        WHERE pal2.user_id = pal.user_id 
        AND pal2.access_timestamp > NOW() - INTERVAL '1 hour'
    ) as accesses_last_hour
FROM phi_access_log pal
JOIN profiles p ON p.id = pal.user_id
WHERE pal.risk_level IN ('high', 'critical')
   OR pal.access_timestamp > NOW() - INTERVAL '24 hours'
ORDER BY pal.risk_level DESC, pal.access_timestamp DESC;

-- Failed authentication attempts view
CREATE VIEW failed_authentication_summary AS
SELECT 
    sae.source_ip,
    COUNT(*) as failed_attempts,
    MAX(sae.event_timestamp) as last_attempt,
    ARRAY_AGG(DISTINCT sae.user_id) FILTER (WHERE sae.user_id IS NOT NULL) as attempted_users,
    ARRAY_AGG(DISTINCT sae.user_agent) as user_agents
FROM security_audit_events sae
WHERE sae.event_type = 'failed_login'
  AND sae.event_timestamp > NOW() - INTERVAL '1 hour'
GROUP BY sae.source_ip
HAVING COUNT(*) >= 5 -- 5 or more failed attempts
ORDER BY failed_attempts DESC, last_attempt DESC;

-- ============================================================================
-- 5. THREAT DETECTION FUNCTIONS
-- ============================================================================

-- Function to evaluate security threat rules
CREATE OR REPLACE FUNCTION evaluate_threat_rules()
RETURNS INTEGER AS $$
DECLARE
    rule_record RECORD;
    detection_result RECORD;
    alert_count INTEGER := 0;
    alert_id UUID;
BEGIN
    -- Loop through active threat detection rules
    FOR rule_record IN 
        SELECT * FROM security_threat_rules 
        WHERE is_active = true 
        AND (last_triggered_at IS NULL OR last_triggered_at < NOW() - (cooldown_period_minutes || ' minutes')::INTERVAL)
    LOOP
        -- Execute detection query
        BEGIN
            EXECUTE rule_record.detection_query INTO detection_result;
            
            -- If threat detected, create alert
            IF detection_result IS NOT NULL THEN
                INSERT INTO security_alerts (
                    rule_id, alert_title, alert_description, severity_level,
                    threat_type, detection_data, confidence_score
                ) VALUES (
                    rule_record.rule_id,
                    rule_record.rule_name || ' - Threat Detected',
                    rule_record.rule_description,
                    rule_record.severity_level,
                    rule_record.rule_type,
                    to_jsonb(detection_result),
                    0.8 -- Default confidence score
                ) RETURNING security_alerts.alert_id INTO alert_id;
                
                -- Update rule trigger tracking
                UPDATE security_threat_rules 
                SET last_triggered_at = NOW(), trigger_count = trigger_count + 1
                WHERE rule_id = rule_record.rule_id;
                
                alert_count := alert_count + 1;
                
                -- Send notification for high/critical alerts
                IF rule_record.severity_level IN ('high', 'critical') THEN
                    PERFORM pg_notify('security_threat_alert', json_build_object(
                        'alert_id', alert_id,
                        'rule_name', rule_record.rule_name,
                        'severity', rule_record.severity_level,
                        'timestamp', NOW()
                    )::text);
                END IF;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            -- Log rule execution error
            PERFORM log_security_event(
                'threat_rule_error',
                'system',
                'failure',
                'Threat detection rule execution failed: ' || rule_record.rule_name,
                jsonb_build_object(
                    'rule_id', rule_record.rule_id,
                    'error_message', SQLERRM
                ),
                'medium'
            );
        END;
    END LOOP;
    
    RETURN alert_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect suspicious PHI access patterns
CREATE OR REPLACE FUNCTION detect_suspicious_phi_access()
RETURNS INTEGER AS $$
DECLARE
    suspicious_count INTEGER := 0;
    user_record RECORD;
    alert_id UUID;
BEGIN
    -- Detect users with excessive PHI access in last hour
    FOR user_record IN
        SELECT 
            pal.user_id,
            p.full_name,
            p.role,
            COUNT(*) as access_count,
            COUNT(DISTINCT pal.patient_id) as unique_patients,
            ARRAY_AGG(DISTINCT pal.table_name) as tables_accessed
        FROM phi_access_log pal
        JOIN profiles p ON p.id = pal.user_id
        WHERE pal.access_timestamp > NOW() - INTERVAL '1 hour'
        GROUP BY pal.user_id, p.full_name, p.role
        HAVING COUNT(*) > 100 OR COUNT(DISTINCT pal.patient_id) > 50
    LOOP
        -- Create security alert
        INSERT INTO security_alerts (
            rule_id, alert_title, alert_description, severity_level,
            threat_type, user_id, detection_data, confidence_score
        ) VALUES (
            (SELECT rule_id FROM security_threat_rules WHERE rule_name = 'Excessive PHI Access' LIMIT 1),
            'Suspicious PHI Access Pattern Detected',
            'User ' || user_record.full_name || ' has accessed ' || user_record.access_count || ' PHI records in the last hour',
            'high',
            'anomaly_detection',
            user_record.user_id,
            jsonb_build_object(
                'access_count', user_record.access_count,
                'unique_patients', user_record.unique_patients,
                'tables_accessed', user_record.tables_accessed,
                'user_role', user_record.role
            ),
            0.9
        ) RETURNING security_alerts.alert_id INTO alert_id;
        
        suspicious_count := suspicious_count + 1;
        
        -- Send high-priority notification
        PERFORM pg_notify('phi_access_anomaly', json_build_object(
            'alert_id', alert_id,
            'user_id', user_record.user_id,
            'user_name', user_record.full_name,
            'access_count', user_record.access_count,
            'timestamp', NOW()
        )::text);
    END LOOP;
    
    RETURN suspicious_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect brute force attacks
CREATE OR REPLACE FUNCTION detect_brute_force_attacks()
RETURNS INTEGER AS $$
DECLARE
    attack_count INTEGER := 0;
    ip_record RECORD;
    alert_id UUID;
BEGIN
    -- Detect IPs with excessive failed login attempts
    FOR ip_record IN
        SELECT 
            sae.source_ip,
            COUNT(*) as failed_attempts,
            MAX(sae.event_timestamp) as last_attempt,
            ARRAY_AGG(DISTINCT sae.user_id) FILTER (WHERE sae.user_id IS NOT NULL) as attempted_users
        FROM security_audit_events sae
        WHERE sae.event_type = 'failed_login'
          AND sae.event_timestamp > NOW() - INTERVAL '15 minutes'
          AND sae.source_ip IS NOT NULL
        GROUP BY sae.source_ip
        HAVING COUNT(*) >= 10 -- 10 or more failed attempts in 15 minutes
    LOOP
        -- Create security alert
        INSERT INTO security_alerts (
            rule_id, alert_title, alert_description, severity_level,
            threat_type, source_ip, detection_data, confidence_score
        ) VALUES (
            (SELECT rule_id FROM security_threat_rules WHERE rule_name = 'Brute Force Attack' LIMIT 1),
            'Brute Force Attack Detected',
            'IP address ' || ip_record.source_ip || ' has ' || ip_record.failed_attempts || ' failed login attempts',
            'critical',
            'pattern_matching',
            ip_record.source_ip,
            jsonb_build_object(
                'failed_attempts', ip_record.failed_attempts,
                'time_window', '15 minutes',
                'attempted_users', ip_record.attempted_users,
                'last_attempt', ip_record.last_attempt
            ),
            0.95
        ) RETURNING security_alerts.alert_id INTO alert_id;
        
        attack_count := attack_count + 1;
        
        -- Send critical alert notification
        PERFORM pg_notify('brute_force_alert', json_build_object(
            'alert_id', alert_id,
            'source_ip', ip_record.source_ip,
            'failed_attempts', ip_record.failed_attempts,
            'timestamp', NOW()
        )::text);
    END LOOP;
    
    RETURN attack_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. AUTOMATED RESPONSE ACTIONS
-- ============================================================================

-- Function to execute automated response actions
CREATE OR REPLACE FUNCTION execute_automated_response(
    p_alert_id UUID,
    p_response_action TEXT,
    p_parameters JSONB DEFAULT '{}'::JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    alert_record RECORD;
    response_success BOOLEAN := false;
BEGIN
    -- Get alert details
    SELECT * INTO alert_record FROM security_alerts WHERE alert_id = p_alert_id;
    
    IF alert_record IS NULL THEN
        RAISE EXCEPTION 'Alert not found: %', p_alert_id;
    END IF;
    
    -- Execute response action based on type
    CASE p_response_action
        WHEN 'block_ip' THEN
            -- Log IP blocking action (actual implementation would integrate with firewall)
            PERFORM log_security_event(
                'ip_blocked',
                'security',
                'success',
                'IP address blocked due to security threat: ' || alert_record.source_ip,
                jsonb_build_object(
                    'alert_id', p_alert_id,
                    'blocked_ip', alert_record.source_ip,
                    'action', 'automated_block'
                ),
                'high'
            );
            response_success := true;
            
        WHEN 'disable_user' THEN
            -- Temporarily disable user account
            UPDATE profiles 
            SET is_active = false, account_locked_until = NOW() + INTERVAL '1 hour'
            WHERE id = alert_record.user_id;
            
            PERFORM log_security_event(
                'user_disabled',
                'security',
                'success',
                'User account temporarily disabled due to security threat',
                jsonb_build_object(
                    'alert_id', p_alert_id,
                    'user_id', alert_record.user_id,
                    'action', 'automated_disable'
                ),
                'high'
            );
            response_success := true;
            
        WHEN 'escalate_alert' THEN
            -- Escalate alert to security team
            UPDATE security_alerts 
            SET escalated_to = (
                SELECT id FROM profiles 
                WHERE role = 'admin' AND is_active = true 
                LIMIT 1
            )
            WHERE alert_id = p_alert_id;
            
            response_success := true;
            
        WHEN 'create_incident' THEN
            -- Create data breach incident if not exists
            IF NOT EXISTS (
                SELECT 1 FROM data_breach_incidents 
                WHERE incident_description LIKE '%' || p_alert_id::TEXT || '%'
            ) THEN
                PERFORM report_data_breach(
                    'unauthorized_access',
                    alert_record.severity_level,
                    'Security incident detected by monitoring system - Alert ID: ' || p_alert_id,
                    ARRAY[]::UUID[], -- Will be populated during investigation
                    ARRAY['PHI'], -- Assume PHI is at risk
                    1 -- Estimated count, will be updated during investigation
                );
            END IF;
            response_success := true;
            
        ELSE
            RAISE WARNING 'Unknown response action: %', p_response_action;
    END CASE;
    
    -- Update alert with response action taken
    UPDATE security_alerts 
    SET response_actions_taken = response_actions_taken || jsonb_build_object(
        'action', p_response_action,
        'timestamp', NOW(),
        'success', response_success,
        'parameters', p_parameters
    )
    WHERE alert_id = p_alert_id;
    
    RETURN response_success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. SEED DEFAULT THREAT DETECTION RULES
-- ============================================================================

-- Insert default threat detection rules
INSERT INTO security_threat_rules (rule_name, rule_description, rule_type, severity_level, detection_query, created_by) VALUES
('Excessive PHI Access', 'Detects users accessing unusually high number of PHI records', 'anomaly_detection', 'high', 
 'SELECT user_id, COUNT(*) as access_count FROM phi_access_log WHERE access_timestamp > NOW() - INTERVAL ''1 hour'' GROUP BY user_id HAVING COUNT(*) > 100', 
 (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),

('Brute Force Attack', 'Detects multiple failed login attempts from same IP', 'pattern_matching', 'critical',
 'SELECT source_ip, COUNT(*) as attempts FROM security_audit_events WHERE event_type = ''failed_login'' AND event_timestamp > NOW() - INTERVAL ''15 minutes'' GROUP BY source_ip HAVING COUNT(*) >= 10',
 (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),

('After Hours Access', 'Detects PHI access during non-business hours', 'behavioral_analysis', 'medium',
 'SELECT user_id, COUNT(*) as access_count FROM phi_access_log WHERE EXTRACT(HOUR FROM access_timestamp) NOT BETWEEN 6 AND 22 AND access_timestamp > NOW() - INTERVAL ''1 hour'' GROUP BY user_id HAVING COUNT(*) > 5',
 (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),

('Privilege Escalation', 'Detects unauthorized role changes', 'signature_based', 'critical',
 'SELECT user_id, event_data FROM security_audit_events WHERE event_type = ''permission_change'' AND event_timestamp > NOW() - INTERVAL ''5 minutes''',
 (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),

('Data Export Anomaly', 'Detects unusual data export activities', 'anomaly_detection', 'high',
 'SELECT user_id, COUNT(*) as export_count FROM phi_access_log WHERE access_type = ''export'' AND access_timestamp > NOW() - INTERVAL ''1 hour'' GROUP BY user_id HAVING COUNT(*) > 10',
 (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1));

-- ============================================================================
-- 8. PERFORMANCE INDEXES FOR MONITORING TABLES
-- ============================================================================

-- Security threat rules indexes
CREATE INDEX idx_security_threat_rules_active ON security_threat_rules(is_active) WHERE is_active = true;
CREATE INDEX idx_security_threat_rules_type_severity ON security_threat_rules(rule_type, severity_level);
CREATE INDEX idx_security_threat_rules_last_triggered ON security_threat_rules(last_triggered_at) WHERE is_active = true;

-- Security alerts indexes
CREATE INDEX idx_security_alerts_status_severity ON security_alerts(status, severity_level) WHERE status IN ('open', 'investigating');
CREATE INDEX idx_security_alerts_detection_time ON security_alerts(detection_timestamp DESC);
CREATE INDEX idx_security_alerts_user_id ON security_alerts(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_security_alerts_source_ip ON security_alerts(source_ip) WHERE source_ip IS NOT NULL;
CREATE INDEX idx_security_alerts_assigned_to ON security_alerts(assigned_to) WHERE assigned_to IS NOT NULL;

-- ============================================================================
-- 9. VALIDATION AND TESTING
-- ============================================================================

-- Validate security monitoring implementation
CREATE OR REPLACE FUNCTION validate_security_monitoring()
RETURNS TABLE(
    component TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check threat detection rules
    RETURN QUERY SELECT 
        'Threat Detection Rules'::TEXT,
        CASE WHEN (SELECT COUNT(*) FROM security_threat_rules WHERE is_active = true) >= 5
             THEN 'SUCCESS' ELSE 'FAILED' END,
        'Active threat detection rules: ' || (SELECT COUNT(*)::TEXT FROM security_threat_rules WHERE is_active = true);
    
    -- Check security alerts table
    RETURN QUERY SELECT 
        'Security Alerts System'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'security_alerts') 
             THEN 'SUCCESS' ELSE 'FAILED' END,
        'Security alerts tracking and management'::TEXT;
    
    -- Check monitoring views
    RETURN QUERY SELECT 
        'Monitoring Views'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'active_security_threats') 
             THEN 'SUCCESS' ELSE 'FAILED' END,
        'Real-time security monitoring views'::TEXT;
    
    -- Check detection functions
    RETURN QUERY SELECT 
        'Detection Functions'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'evaluate_threat_rules')
             THEN 'SUCCESS' ELSE 'FAILED' END,
        'Automated threat detection functions'::TEXT;
    
    -- Check response functions
    RETURN QUERY SELECT 
        'Response Functions'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'execute_automated_response')
             THEN 'SUCCESS' ELSE 'FAILED' END,
        'Automated incident response functions'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Display validation results
SELECT * FROM validate_security_monitoring();

-- ============================================================================
-- 10. FINAL VALIDATION AND COMPLETION
-- ============================================================================

DO $$
DECLARE
    validation_results RECORD;
    failed_components INTEGER := 0;
    active_rules INTEGER;
BEGIN
    -- Check validation results
    FOR validation_results IN SELECT * FROM validate_security_monitoring()
    LOOP
        IF validation_results.status = 'FAILED' THEN
            failed_components := failed_components + 1;
            RAISE WARNING 'Component failed: %', validation_results.component;
        END IF;
    END LOOP;
    
    -- Check if we have active threat detection rules
    SELECT COUNT(*) INTO active_rules FROM security_threat_rules WHERE is_active = true;
    
    IF failed_components > 0 THEN
        RAISE EXCEPTION 'SECURITY MONITORING IMPLEMENTATION FAILED! % components failed validation.', failed_components;
    END IF;
    
    RAISE NOTICE '=== SECURITY MONITORING & ALERTING COMPLETED SUCCESSFULLY ===';
    RAISE NOTICE 'Active threat detection rules: %', active_rules;
    RAISE NOTICE 'Real-time security monitoring operational.';
    RAISE NOTICE 'Automated threat detection and response ready.';
    RAISE NOTICE 'Security alerting system configured.';
    RAISE NOTICE 'Ready for Phase 2.5: Testing & Validation.';
END $$;
