'use client';

import { useState } from 'react';
import { SupabaseAuthService } from '../../../lib/auth/supabase-auth';

// Test data
const testDoctorData = {
  email: 'test.doctor@hospital.com',
  password: 'TestPassword123!',
  full_name: 'Bác sĩ Nguyễn Văn Test',
  phone_number: '0901234567',
  role: 'doctor' as const,
  specialty: 'Nội khoa',
  license_number: 'BS123456',
  qualification: 'Thạc sĩ Y khoa'
};

const testPatientData = {
  email: 'test.patient@hospital.com',
  password: 'TestPassword123!',
  full_name: 'Bệnh nhân Trần Thị Test',
  phone_number: '0907654321',
  role: 'patient' as const,
  date_of_birth: '1990-01-15',
  gender: 'female',
  address: '123 Đường Test, Quận 1, TP.HCM'
};

export default function RegistrationTestPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const authService = new SupabaseAuthService();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const testDoctorRegistration = async () => {
    addLog('🧪 === TESTING DOCTOR REGISTRATION ===');
    addLog(`📝 Doctor data: ${testDoctorData.email}, ${testDoctorData.full_name}, ${testDoctorData.specialty}`);

    try {
      const result = await authService.signUp(testDoctorData);
      
      if (result.error) {
        addLog(`❌ Doctor registration failed: ${result.error}`);
        return false;
      }

      addLog('✅ Doctor registration successful!');
      addLog(`👨‍⚕️ Doctor user created: ${result.user?.id}, ${result.user?.email}, ${result.user?.role}`);
      return true;
    } catch (error) {
      addLog(`❌ Doctor registration exception: ${error}`);
      return false;
    }
  };

  const testPatientRegistration = async () => {
    addLog('🧪 === TESTING PATIENT REGISTRATION ===');
    addLog(`📝 Patient data: ${testPatientData.email}, ${testPatientData.full_name}, ${testPatientData.date_of_birth}`);

    try {
      const result = await authService.signUp(testPatientData);
      
      if (result.error) {
        addLog(`❌ Patient registration failed: ${result.error}`);
        return false;
      }

      addLog('✅ Patient registration successful!');
      addLog(`🏥 Patient user created: ${result.user?.id}, ${result.user?.email}, ${result.user?.role}`);
      return true;
    } catch (error) {
      addLog(`❌ Patient registration exception: ${error}`);
      return false;
    }
  };

  const testLogin = async (email: string, password: string, userType: string) => {
    addLog(`🔐 === TESTING ${userType.toUpperCase()} LOGIN ===`);
    addLog(`📝 Login credentials: ${email}`);

    try {
      const result = await authService.signIn({ email, password });
      
      if (result.error) {
        addLog(`❌ ${userType} login failed: ${result.error}`);
        return false;
      }

      addLog(`✅ ${userType} login successful!`);
      addLog(`🔑 ${userType} session: ${result.user?.id}, ${result.user?.email}, ${result.user?.role}, hasSession: ${!!result.session}`);
      return true;
    } catch (error) {
      addLog(`❌ ${userType} login exception: ${error}`);
      return false;
    }
  };

  const runAllTests = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    clearLogs();
    
    addLog('🚀 === HOSPITAL MANAGEMENT REGISTRATION TESTS ===');
    addLog(`⏰ Started at: ${new Date().toLocaleString()}`);
    
    const results = {
      doctorRegistration: false,
      patientRegistration: false,
      doctorLogin: false,
      patientLogin: false
    };

    try {
      // Test 1: Doctor Registration
      results.doctorRegistration = await testDoctorRegistration();
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Test 2: Patient Registration  
      results.patientRegistration = await testPatientRegistration();
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Test 3: Doctor Login (if registration successful)
      if (results.doctorRegistration) {
        results.doctorLogin = await testLogin(testDoctorData.email, testDoctorData.password, 'doctor');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Test 4: Patient Login (if registration successful)
      if (results.patientRegistration) {
        results.patientLogin = await testLogin(testPatientData.email, testPatientData.password, 'patient');
      }

      // Summary
      addLog('📊 === TEST RESULTS SUMMARY ===');
      addLog(`Doctor Registration: ${results.doctorRegistration ? '✅ PASS' : '❌ FAIL'}`);
      addLog(`Patient Registration: ${results.patientRegistration ? '✅ PASS' : '❌ FAIL'}`);
      addLog(`Doctor Login: ${results.doctorLogin ? '✅ PASS' : '❌ FAIL'}`);
      addLog(`Patient Login: ${results.patientLogin ? '✅ PASS' : '❌ FAIL'}`);
      
      const passCount = Object.values(results).filter(Boolean).length;
      const totalTests = Object.keys(results).length;
      
      addLog(`🎯 Overall: ${passCount}/${totalTests} tests passed`);
      
      if (passCount === totalTests) {
        addLog('🎉 All tests passed! Registration system is working correctly.');
      } else {
        addLog('⚠️  Some tests failed. Please check the errors above.');
      }

      addLog('🧹 === CLEANUP REMINDER ===');
      addLog('⚠️  Manual cleanup required:');
      addLog(`   - Delete test doctor: ${testDoctorData.email}`);
      addLog(`   - Delete test patient: ${testPatientData.email}`);
      
    } catch (error) {
      addLog(`💥 Test suite failed with exception: ${error}`);
    }
    
    addLog(`⏰ Completed at: ${new Date().toLocaleString()}`);
    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🧪 Hospital Registration Test Suite
          </h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Test script để kiểm tra việc đăng ký và đăng nhập cho doctor và patient.
            </p>
            
            <div className="flex gap-4 mb-4">
              <button
                onClick={runAllTests}
                disabled={isRunning}
                className={`px-6 py-2 rounded-lg font-medium ${
                  isRunning 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                {isRunning ? '🔄 Running Tests...' : '🚀 Run All Tests'}
              </button>
              
              <button
                onClick={clearLogs}
                disabled={isRunning}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium"
              >
                🧹 Clear Logs
              </button>
            </div>
          </div>

          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            <div className="mb-2 text-gray-400">Test Console Output:</div>
            {logs.length === 0 ? (
              <div className="text-gray-500">Click "Run All Tests" to start testing...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Test Data Information:</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <div><strong>Test Doctor:</strong> {testDoctorData.email}</div>
              <div><strong>Test Patient:</strong> {testPatientData.email}</div>
              <div><strong>Password:</strong> TestPassword123!</div>
              <div className="mt-2 text-yellow-600">
                <strong>Note:</strong> Sau khi test xong, hãy xóa các test users này trong Supabase dashboard.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
