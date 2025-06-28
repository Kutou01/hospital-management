-- Create missing database functions for Doctor Service

-- Function to get doctor by profile ID
CREATE OR REPLACE FUNCTION get_doctor_by_profile_id(input_profile_id UUID)
RETURNS TABLE (
    doctor_id VARCHAR(20),
    profile_id UUID,
    specialty VARCHAR(100),
    department_id VARCHAR(20),
    license_number VARCHAR(50),
    qualification TEXT,
    experience_years INTEGER,
    consultation_fee DECIMAL,
    gender TEXT,
    address JSONB,
    bio TEXT,
    languages_spoken JSONB,
    availability_status TEXT,
    rating DECIMAL,
    total_reviews INTEGER,
    status TEXT,
    full_name TEXT,
    date_of_birth DATE,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    -- Profile fields
    email TEXT,
    phone_number TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.doctor_id,
        d.profile_id,
        d.specialty,
        d.department_id,
        d.license_number,
        d.qualification,
        d.experience_years,
        d.consultation_fee,
        d.gender,
        d.address,
        d.bio,
        d.languages_spoken,
        d.availability_status,
        d.rating,
        d.total_reviews,
        d.status,
        d.full_name,
        p.date_of_birth,
        d.is_active,
        d.created_at,
        d.updated_at,
        d.created_by,
        p.email,
        p.phone_number
    FROM doctors d
    INNER JOIN profiles p ON d.profile_id = p.id
    WHERE d.profile_id = input_profile_id
    AND d.is_active = true
    AND p.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_doctor_by_profile_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_doctor_by_profile_id(UUID) TO service_role;

-- Function to get doctor by email
CREATE OR REPLACE FUNCTION get_doctor_by_email(doctor_email TEXT)
RETURNS TABLE (
    doctor_id TEXT,
    profile_id UUID,
    specialty TEXT,
    department_id TEXT,
    license_number TEXT,
    qualification TEXT,
    experience_years INTEGER,
    consultation_fee DECIMAL,
    gender TEXT,
    address JSONB,
    bio TEXT,
    languages_spoken JSONB,
    availability_status TEXT,
    rating DECIMAL,
    total_reviews INTEGER,
    status TEXT,
    full_name TEXT,
    date_of_birth DATE,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    -- Profile fields
    email TEXT,
    phone_number TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.doctor_id,
        d.profile_id,
        d.specialty,
        d.department_id,
        d.license_number,
        d.qualification,
        d.experience_years,
        d.consultation_fee,
        d.gender,
        d.address,
        d.bio,
        d.languages_spoken,
        d.availability_status,
        d.rating,
        d.total_reviews,
        d.status,
        d.full_name,
        p.date_of_birth,
        d.is_active,
        d.created_at,
        d.updated_at,
        d.created_by,
        p.email,
        p.phone_number
    FROM doctors d
    INNER JOIN profiles p ON d.profile_id = p.id
    WHERE p.email = doctor_email
    AND d.is_active = true
    AND p.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_doctor_by_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_doctor_by_email(TEXT) TO service_role;

-- Function to get doctors by specialty
CREATE OR REPLACE FUNCTION get_doctors_by_specialty(
    doctor_specialty TEXT,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    doctor_id TEXT,
    profile_id UUID,
    specialty TEXT,
    department_id TEXT,
    license_number TEXT,
    qualification TEXT,
    experience_years INTEGER,
    consultation_fee DECIMAL,
    gender TEXT,
    address JSONB,
    bio TEXT,
    languages_spoken JSONB,
    availability_status TEXT,
    rating DECIMAL,
    total_reviews INTEGER,
    status TEXT,
    full_name TEXT,
    date_of_birth DATE,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    -- Profile fields
    email TEXT,
    phone_number TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.doctor_id,
        d.profile_id,
        d.specialty,
        d.department_id,
        d.license_number,
        d.qualification,
        d.experience_years,
        d.consultation_fee,
        d.gender,
        d.address,
        d.bio,
        d.languages_spoken,
        d.availability_status,
        d.rating,
        d.total_reviews,
        d.status,
        d.full_name,
        p.date_of_birth,
        d.is_active,
        d.created_at,
        d.updated_at,
        d.created_by,
        p.email,
        p.phone_number
    FROM doctors d
    INNER JOIN profiles p ON d.profile_id = p.id
    WHERE d.specialty ILIKE '%' || doctor_specialty || '%'
    AND d.is_active = true
    AND p.is_active = true
    ORDER BY d.rating DESC, d.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_doctors_by_specialty(TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_doctors_by_specialty(TEXT, INTEGER, INTEGER) TO service_role;

-- Function to count doctors
CREATE OR REPLACE FUNCTION count_doctors()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM doctors d
        INNER JOIN profiles p ON d.profile_id = p.id
        WHERE d.is_active = true
        AND p.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION count_doctors() TO authenticated;
GRANT EXECUTE ON FUNCTION count_doctors() TO service_role;
