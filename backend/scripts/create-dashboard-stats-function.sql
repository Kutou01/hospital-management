-- =====================================================
-- CREATE DASHBOARD STATS FUNCTION
-- Hospital Management System - Dashboard Statistics
-- =====================================================

-- Create the get_dashboard_stats function
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE (
    total_patients BIGINT,
    total_doctors BIGINT,
    total_departments BIGINT,
    total_rooms BIGINT,
    available_rooms BIGINT,
    occupied_rooms BIGINT,
    appointments_today BIGINT,
    appointments_pending BIGINT,
    appointments_confirmed BIGINT,
    appointments_completed BIGINT
) AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
BEGIN
    RETURN QUERY
    SELECT 
        -- Count patients
        (SELECT COUNT(*) FROM public.patients)::BIGINT as total_patients,
        
        -- Count doctors
        (SELECT COUNT(*) FROM public.doctors)::BIGINT as total_doctors,
        
        -- Count departments
        (SELECT COUNT(*) FROM public.departments)::BIGINT as total_departments,
        
        -- Count total rooms
        (SELECT COUNT(*) FROM public.rooms)::BIGINT as total_rooms,
        
        -- Count available rooms
        (SELECT COUNT(*) FROM public.rooms WHERE status = 'available')::BIGINT as available_rooms,
        
        -- Count occupied rooms
        (SELECT COUNT(*) FROM public.rooms WHERE status = 'occupied')::BIGINT as occupied_rooms,
        
        -- Count appointments today
        (SELECT COUNT(*) FROM public.appointments 
         WHERE DATE(appointment_datetime) = today_date)::BIGINT as appointments_today,
        
        -- Count pending appointments
        (SELECT COUNT(*) FROM public.appointments 
         WHERE status = 'pending')::BIGINT as appointments_pending,
        
        -- Count confirmed appointments
        (SELECT COUNT(*) FROM public.appointments 
         WHERE status = 'confirmed')::BIGINT as appointments_confirmed,
        
        -- Count completed appointments
        (SELECT COUNT(*) FROM public.appointments 
         WHERE status = 'completed')::BIGINT as appointments_completed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated, anon;

-- Create additional helper functions for doctor and patient dashboards

-- Function for doctor dashboard stats
CREATE OR REPLACE FUNCTION public.get_doctor_dashboard_stats(doctor_id UUID)
RETURNS TABLE (
    total_appointments BIGINT,
    appointments_today BIGINT,
    appointments_this_week BIGINT,
    appointments_pending BIGINT,
    appointments_confirmed BIGINT,
    appointments_completed BIGINT,
    total_patients BIGINT
) AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    week_start DATE := DATE_TRUNC('week', CURRENT_DATE)::DATE;
    week_end DATE := (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::DATE;
BEGIN
    RETURN QUERY
    SELECT 
        -- Total appointments for this doctor
        (SELECT COUNT(*) FROM public.appointments a
         JOIN public.doctors d ON a.doctor_id = d.doctor_id
         WHERE d.profile_id = doctor_id)::BIGINT as total_appointments,
        
        -- Appointments today
        (SELECT COUNT(*) FROM public.appointments a
         JOIN public.doctors d ON a.doctor_id = d.doctor_id
         WHERE d.profile_id = doctor_id 
         AND DATE(a.appointment_datetime) = today_date)::BIGINT as appointments_today,
        
        -- Appointments this week
        (SELECT COUNT(*) FROM public.appointments a
         JOIN public.doctors d ON a.doctor_id = d.doctor_id
         WHERE d.profile_id = doctor_id 
         AND DATE(a.appointment_datetime) BETWEEN week_start AND week_end)::BIGINT as appointments_this_week,
        
        -- Pending appointments
        (SELECT COUNT(*) FROM public.appointments a
         JOIN public.doctors d ON a.doctor_id = d.doctor_id
         WHERE d.profile_id = doctor_id 
         AND a.status = 'pending')::BIGINT as appointments_pending,
        
        -- Confirmed appointments
        (SELECT COUNT(*) FROM public.appointments a
         JOIN public.doctors d ON a.doctor_id = d.doctor_id
         WHERE d.profile_id = doctor_id 
         AND a.status = 'confirmed')::BIGINT as appointments_confirmed,
        
        -- Completed appointments
        (SELECT COUNT(*) FROM public.appointments a
         JOIN public.doctors d ON a.doctor_id = d.doctor_id
         WHERE d.profile_id = doctor_id 
         AND a.status = 'completed')::BIGINT as appointments_completed,
        
        -- Total unique patients
        (SELECT COUNT(DISTINCT a.patient_id) FROM public.appointments a
         JOIN public.doctors d ON a.doctor_id = d.doctor_id
         WHERE d.profile_id = doctor_id)::BIGINT as total_patients;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions for doctor function
GRANT EXECUTE ON FUNCTION public.get_doctor_dashboard_stats(UUID) TO authenticated;

-- Function for patient dashboard stats
CREATE OR REPLACE FUNCTION public.get_patient_dashboard_stats(patient_id UUID)
RETURNS TABLE (
    total_appointments BIGINT,
    upcoming_appointments BIGINT,
    completed_appointments BIGINT,
    cancelled_appointments BIGINT,
    total_medical_records BIGINT,
    total_prescriptions BIGINT
) AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
BEGIN
    RETURN QUERY
    SELECT 
        -- Total appointments for this patient
        (SELECT COUNT(*) FROM public.appointments a
         JOIN public.patients p ON a.patient_id = p.patient_id
         WHERE p.profile_id = patient_id)::BIGINT as total_appointments,
        
        -- Upcoming appointments
        (SELECT COUNT(*) FROM public.appointments a
         JOIN public.patients p ON a.patient_id = p.patient_id
         WHERE p.profile_id = patient_id 
         AND DATE(a.appointment_datetime) >= today_date
         AND a.status IN ('pending', 'confirmed'))::BIGINT as upcoming_appointments,
        
        -- Completed appointments
        (SELECT COUNT(*) FROM public.appointments a
         JOIN public.patients p ON a.patient_id = p.patient_id
         WHERE p.profile_id = patient_id 
         AND a.status = 'completed')::BIGINT as completed_appointments,
        
        -- Cancelled appointments
        (SELECT COUNT(*) FROM public.appointments a
         JOIN public.patients p ON a.patient_id = p.patient_id
         WHERE p.profile_id = patient_id 
         AND a.status = 'cancelled')::BIGINT as cancelled_appointments,
        
        -- Total medical records (if table exists)
        COALESCE((SELECT COUNT(*) FROM public.medical_records mr
                  JOIN public.patients p ON mr.patient_id = p.patient_id
                  WHERE p.profile_id = patient_id), 0)::BIGINT as total_medical_records,
        
        -- Total prescriptions (if table exists)
        COALESCE((SELECT COUNT(*) FROM public.prescriptions pr
                  JOIN public.patients p ON pr.patient_id = p.patient_id
                  WHERE p.profile_id = patient_id), 0)::BIGINT as total_prescriptions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions for patient function
GRANT EXECUTE ON FUNCTION public.get_patient_dashboard_stats(UUID) TO authenticated;

-- Test the functions
-- SELECT * FROM public.get_dashboard_stats();
-- SELECT * FROM public.get_doctor_dashboard_stats('your-doctor-uuid-here');
-- SELECT * FROM public.get_patient_dashboard_stats('your-patient-uuid-here');

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if functions were created successfully
SELECT 
    'DASHBOARD FUNCTIONS CREATED' as status,
    json_build_object(
        'get_dashboard_stats', EXISTS(
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'get_dashboard_stats'
        ),
        'get_doctor_dashboard_stats', EXISTS(
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'get_doctor_dashboard_stats'
        ),
        'get_patient_dashboard_stats', EXISTS(
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'get_patient_dashboard_stats'
        )
    ) as functions_status;
