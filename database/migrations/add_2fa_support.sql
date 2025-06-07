-- Add 2FA support to the hospital management system
-- This migration adds two-factor authentication capabilities

-- Create 2FA settings table
CREATE TABLE IF NOT EXISTS two_factor_auth (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT FALSE,
    method VARCHAR(20) DEFAULT 'app' CHECK (method IN ('app', 'sms', 'email')),
    secret_key TEXT, -- For TOTP (Time-based One-Time Password)
    backup_codes TEXT[], -- Array of backup codes
    phone_number VARCHAR(20), -- For SMS 2FA
    email VARCHAR(255), -- For email 2FA (can be different from main email)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure one 2FA setting per user
    UNIQUE(user_id)
);

-- Create 2FA verification attempts table (for rate limiting and security)
CREATE TABLE IF NOT EXISTS two_factor_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    attempt_type VARCHAR(20) NOT NULL CHECK (attempt_type IN ('login', 'setup', 'disable')),
    method VARCHAR(20) NOT NULL CHECK (method IN ('app', 'sms', 'email', 'backup')),
    code_used TEXT,
    is_successful BOOLEAN DEFAULT FALSE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index for rate limiting queries
    INDEX idx_2fa_attempts_user_time (user_id, created_at),
    INDEX idx_2fa_attempts_ip_time (ip_address, created_at)
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for two_factor_auth table
CREATE TRIGGER update_two_factor_auth_updated_at 
    BEFORE UPDATE ON two_factor_auth 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add 2FA columns to profiles table if they don't exist
DO $$ 
BEGIN
    -- Add 2FA enabled flag to profiles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'two_factor_enabled'
    ) THEN
        ALTER TABLE profiles ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add last 2FA verification timestamp
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'last_2fa_verification'
    ) THEN
        ALTER TABLE profiles ADD COLUMN last_2fa_verification TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create RLS policies for two_factor_auth table
ALTER TABLE two_factor_auth ENABLE ROW LEVEL SECURITY;

-- Users can only access their own 2FA settings
CREATE POLICY "Users can view own 2FA settings" ON two_factor_auth
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own 2FA settings" ON two_factor_auth
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own 2FA settings" ON two_factor_auth
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own 2FA settings" ON two_factor_auth
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for two_factor_attempts table
ALTER TABLE two_factor_attempts ENABLE ROW LEVEL SECURITY;

-- Users can only view their own attempts
CREATE POLICY "Users can view own 2FA attempts" ON two_factor_attempts
    FOR SELECT USING (auth.uid() = user_id);

-- Allow inserting attempts (needed for logging)
CREATE POLICY "Allow inserting 2FA attempts" ON two_factor_attempts
    FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_two_factor_auth_user_id ON two_factor_auth(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_auth_enabled ON two_factor_auth(user_id, is_enabled);

-- Create function to generate backup codes
CREATE OR REPLACE FUNCTION generate_backup_codes()
RETURNS TEXT[] AS $$
DECLARE
    codes TEXT[] := '{}';
    i INTEGER;
    code TEXT;
BEGIN
    -- Generate 10 backup codes
    FOR i IN 1..10 LOOP
        -- Generate 8-character alphanumeric code
        code := upper(substring(md5(random()::text) from 1 for 8));
        codes := array_append(codes, code);
    END LOOP;
    
    RETURN codes;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate backup code
CREATE OR REPLACE FUNCTION validate_backup_code(user_uuid UUID, input_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    stored_codes TEXT[];
    updated_codes TEXT[];
    code TEXT;
BEGIN
    -- Get current backup codes
    SELECT backup_codes INTO stored_codes
    FROM two_factor_auth
    WHERE user_id = user_uuid AND is_enabled = true;
    
    IF stored_codes IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if code exists in backup codes
    IF input_code = ANY(stored_codes) THEN
        -- Remove used code from backup codes
        updated_codes := array_remove(stored_codes, input_code);
        
        -- Update backup codes
        UPDATE two_factor_auth
        SET backup_codes = updated_codes,
            last_used_at = NOW()
        WHERE user_id = user_uuid;
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create function to check rate limiting
CREATE OR REPLACE FUNCTION check_2fa_rate_limit(user_uuid UUID, attempt_type_param VARCHAR(20))
RETURNS BOOLEAN AS $$
DECLARE
    attempt_count INTEGER;
BEGIN
    -- Count failed attempts in the last 15 minutes
    SELECT COUNT(*)
    INTO attempt_count
    FROM two_factor_attempts
    WHERE user_id = user_uuid
        AND attempt_type = attempt_type_param
        AND is_successful = FALSE
        AND created_at > NOW() - INTERVAL '15 minutes';
    
    -- Allow up to 5 failed attempts per 15 minutes
    RETURN attempt_count < 5;
END;
$$ LANGUAGE plpgsql;

-- Insert default 2FA settings for existing users (disabled by default)
INSERT INTO two_factor_auth (user_id, is_enabled, method)
SELECT id, FALSE, 'app'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM two_factor_auth)
ON CONFLICT (user_id) DO NOTHING;

-- Update profiles table to sync 2FA status
UPDATE profiles 
SET two_factor_enabled = (
    SELECT COALESCE(tfa.is_enabled, FALSE)
    FROM two_factor_auth tfa
    WHERE tfa.user_id = profiles.id
);

COMMENT ON TABLE two_factor_auth IS 'Stores two-factor authentication settings for users';
COMMENT ON TABLE two_factor_attempts IS 'Logs two-factor authentication attempts for security monitoring';
COMMENT ON FUNCTION generate_backup_codes() IS 'Generates 10 random backup codes for 2FA';
COMMENT ON FUNCTION validate_backup_code(UUID, TEXT) IS 'Validates and consumes a backup code';
COMMENT ON FUNCTION check_2fa_rate_limit(UUID, VARCHAR) IS 'Checks if user has exceeded 2FA attempt rate limit';
