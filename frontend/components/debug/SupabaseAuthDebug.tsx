'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { supabaseAuth } from '@/lib/auth/supabase-auth';

export function SupabaseAuthDebug() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const testRegistration = async () => {
    setIsRunning(true);
    clearLogs();
    
    try {
      addLog('🔍 Starting Supabase Auth debug...');
      
      // Test 1: Check connection
      addLog('1️⃣ Testing Supabase connection...');
      const { data: testData, error: testError } = await supabase
        .from('hospital_users')
        .select('count')
        .limit(1);
      
      if (testError) {
        addLog(`❌ Connection failed: ${testError.message}`);
        return;
      }
      addLog('✅ Supabase connection successful');
      
      // Test 2: Check existing users
      addLog('2️⃣ Checking existing users...');
      const { data: users, error: usersError } = await supabase
        .from('hospital_users')
        .select('*')
        .limit(5);
      
      if (usersError) {
        addLog(`❌ Error fetching users: ${usersError.message}`);
      } else {
        addLog(`✅ Found ${users.length} existing users`);
      }
      
      // Test 3: Test registration with unique email
      const timestamp = Date.now();
      const testEmail = `test.doctor.${timestamp}@example.com`;
      
      addLog('3️⃣ Testing registration...');
      addLog(`📧 Using email: ${testEmail}`);
      
      const result = await supabaseAuth.signUp({
        email: testEmail,
        password: 'Test123456',
        full_name: 'Dr. Test Doctor',
        phone_number: '0123456789',
        role: 'doctor',
        specialty: 'Cardiology',
        license_number: 'DOC123456'
      });
      
      if (result.error) {
        addLog(`❌ Registration failed: ${result.error}`);
        return;
      }
      
      addLog('✅ Registration successful!');
      addLog(`👤 User ID: ${result.user?.id}`);
      addLog(`📧 Email: ${result.user?.email}`);
      addLog(`👨‍⚕️ Role: ${result.user?.role}`);
      
      // Test 4: Check if doctor profile was created
      addLog('4️⃣ Checking doctor profile...');
      const { data: doctorProfile, error: doctorError } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', result.user?.id)
        .single();
      
      if (doctorError) {
        addLog(`❌ Doctor profile not found: ${doctorError.message}`);
      } else {
        addLog('✅ Doctor profile created successfully!');
        addLog(`🏥 Doctor ID: ${doctorProfile.doctor_id}`);
        addLog(`🩺 Specialty: ${doctorProfile.specialty}`);
      }
      
    } catch (error) {
      addLog(`❌ Unexpected error: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const testPatientRegistration = async () => {
    setIsRunning(true);
    clearLogs();
    
    try {
      addLog('🔍 Testing Patient Registration...');
      
      const timestamp = Date.now();
      const testEmail = `test.patient.${timestamp}@example.com`;
      
      addLog(`📧 Using email: ${testEmail}`);
      
      const result = await supabaseAuth.signUp({
        email: testEmail,
        password: 'Test123456',
        full_name: 'Test Patient',
        phone_number: '0987654321',
        role: 'patient',
        date_of_birth: '1990-01-01',
        gender: 'Male',
        address: '123 Test Street, Test City'
      });
      
      if (result.error) {
        addLog(`❌ Registration failed: ${result.error}`);
        return;
      }
      
      addLog('✅ Patient registration successful!');
      addLog(`👤 User ID: ${result.user?.id}`);
      addLog(`📧 Email: ${result.user?.email}`);
      addLog(`🏥 Role: ${result.user?.role}`);
      
      // Check patient profile
      addLog('🔍 Checking patient profile...');
      const { data: patientProfile, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', result.user?.id)
        .single();
      
      if (patientError) {
        addLog(`❌ Patient profile not found: ${patientError.message}`);
      } else {
        addLog('✅ Patient profile created successfully!');
        addLog(`🏥 Patient ID: ${patientProfile.patient_id}`);
        addLog(`📅 Date of Birth: ${patientProfile.dateofbirth}`);
      }
      
    } catch (error) {
      addLog(`❌ Unexpected error: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Supabase Auth Debug</h1>
      
      <div className="flex gap-4 mb-4">
        <button
          onClick={testRegistration}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isRunning ? 'Testing...' : 'Test Doctor Registration'}
        </button>
        
        <button
          onClick={testPatientRegistration}
          disabled={isRunning}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {isRunning ? 'Testing...' : 'Test Patient Registration'}
        </button>
        
        <button
          onClick={clearLogs}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear Logs
        </button>
      </div>
      
      <div className="bg-black text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
        {logs.length === 0 ? (
          <div className="text-gray-500">Click a test button to start debugging...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
