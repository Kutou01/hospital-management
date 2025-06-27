-- Simple function to get doctor by profile ID
CREATE OR REPLACE FUNCTION get_doctor_by_profile_id(input_profile_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'doctor_id', d.doctor_id,
        'profile_id', d.profile_id,
        'specialty', d.specialty,
        'department_id', d.department_id,
        'license_number', d.license_number,
        'qualification', d.qualification,
        'experience_years', d.experience_years,
        'consultation_fee', d.consultation_fee,
        'gender', d.gender,
        'address', d.address,
        'bio', d.bio,
        'languages_spoken', d.languages_spoken,
        'availability_status', d.availability_status,
        'rating', d.rating,
        'total_reviews', d.total_reviews,
        'status', d.status,
        'full_name', d.full_name,
        'date_of_birth', p.date_of_birth,
        'is_active', d.is_active,
        'created_at', d.created_at,
        'updated_at', d.updated_at,
        'created_by', d.created_by,
        'email', p.email,
        'phone_number', p.phone_number
    ) INTO result
    FROM doctors d
    INNER JOIN profiles p ON d.profile_id = p.id
    WHERE d.profile_id = input_profile_id
    AND d.is_active = true
    AND p.is_active = true;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_doctor_by_profile_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_doctor_by_profile_id(UUID) TO service_role;
