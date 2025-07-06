import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

/**
 * Database Test API
 * Tests all database connections and data integrity
 */

interface TestResult {
  test: string;
  status: 'success' | 'error';
  message: string;
  data?: any;
  error?: string;
}

interface DatabaseTestResponse {
  success: boolean;
  results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
}

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DatabaseTestResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      results: [],
      summary: { total: 0, passed: 0, failed: 0 }
    });
  }

  const results: TestResult[] = [];

  try {
    // Test 1: Supabase Connection
    try {
      const { data, error } = await supabase.from('specialties').select('count').limit(1);
      if (error) throw error;
      
      results.push({
        test: 'Supabase Connection',
        status: 'success',
        message: 'Successfully connected to Supabase',
        data: { connected: true }
      });
    } catch (error: any) {
      results.push({
        test: 'Supabase Connection',
        status: 'error',
        message: 'Failed to connect to Supabase',
        error: error.message
      });
    }

    // Test 2: Specialties Table
    try {
      const { data: specialties, error } = await supabase
        .from('specialties')
        .select('specialty_id, specialty_name, name, code, description, is_active')
        .eq('is_active', true)
        .limit(10);

      if (error) throw error;

      results.push({
        test: 'Specialties Table',
        status: 'success',
        message: `Found ${specialties.length} active specialties`,
        data: { count: specialties.length, specialties: specialties.slice(0, 5) }
      });
    } catch (error: any) {
      results.push({
        test: 'Specialties Table',
        status: 'error',
        message: 'Failed to query specialties table',
        error: error.message
      });
    }

    // Test 3: Doctors Table
    try {
      const { data: doctors, error } = await supabase
        .from('doctors')
        .select(`
          doctor_id,
          doctor_name,
          specialty_id,
          is_active,
          specialties (
            specialty_name,
            name,
            code
          )
        `)
        .eq('is_active', true)
        .limit(10);

      if (error) throw error;

      results.push({
        test: 'Doctors Table',
        status: 'success',
        message: `Found ${doctors.length} active doctors`,
        data: { count: doctors.length, doctors: doctors.slice(0, 3) }
      });
    } catch (error: any) {
      results.push({
        test: 'Doctors Table',
        status: 'error',
        message: 'Failed to query doctors table',
        error: error.message
      });
    }

    // Test 4: Appointments Table
    try {
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('appointment_id, patient_id, doctor_id, appointment_date, appointment_time, status')
        .limit(5);

      if (error) throw error;

      results.push({
        test: 'Appointments Table',
        status: 'success',
        message: `Found ${appointments.length} appointments`,
        data: { count: appointments.length, appointments: appointments.slice(0, 3) }
      });
    } catch (error: any) {
      results.push({
        test: 'Appointments Table',
        status: 'error',
        message: 'Failed to query appointments table',
        error: error.message
      });
    }

    // Test 5: Symptom to Specialty Mapping
    try {
      const testCodes = ['SPEC042', 'SPEC043', 'SPEC032', 'SPEC045'];
      const { data: mappedSpecialties, error } = await supabase
        .from('specialties')
        .select('specialty_id, specialty_name, name, code')
        .in('code', testCodes)
        .eq('is_active', true);

      if (error) throw error;

      results.push({
        test: 'Symptom Mapping',
        status: 'success',
        message: `Found ${mappedSpecialties.length} mapped specialties`,
        data: { 
          expectedCodes: testCodes,
          foundCodes: mappedSpecialties.map(s => s.code),
          specialties: mappedSpecialties
        }
      });
    } catch (error: any) {
      results.push({
        test: 'Symptom Mapping',
        status: 'error',
        message: 'Failed to test symptom mapping',
        error: error.message
      });
    }

    // Test 6: Test Appointment Creation
    try {
      const testAppointment = {
        appointment_id: `TEST-${Date.now()}`,
        patient_id: 'test-patient',
        doctor_id: 'test-doctor',
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '09:00-10:00',
        status: 'pending',
        type: 'consultation',
        notes: 'Test appointment from API',
        symptoms: 'Test symptoms'
      };

      const { data: createdAppointment, error: createError } = await supabase
        .from('appointments')
        .insert(testAppointment)
        .select()
        .single();

      if (createError) throw createError;

      // Clean up test appointment
      await supabase
        .from('appointments')
        .delete()
        .eq('appointment_id', testAppointment.appointment_id);

      results.push({
        test: 'Appointment Creation',
        status: 'success',
        message: 'Successfully created and deleted test appointment',
        data: { appointmentId: createdAppointment.appointment_id }
      });
    } catch (error: any) {
      results.push({
        test: 'Appointment Creation',
        status: 'error',
        message: 'Failed to create test appointment',
        error: error.message
      });
    }

    // Calculate summary
    const passed = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;

    return res.json({
      success: failed === 0,
      results,
      summary: {
        total: results.length,
        passed,
        failed
      }
    });

  } catch (error: any) {
    console.error('Database test error:', error);
    return res.status(500).json({
      success: false,
      results: [{
        test: 'General Error',
        status: 'error',
        message: 'Unexpected error during database testing',
        error: error.message
      }],
      summary: { total: 1, passed: 0, failed: 1 }
    });
  }
}
