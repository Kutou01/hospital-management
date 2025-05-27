/**
 * Test script để kiểm tra việc đăng ký user patient và doctor
 * Chạy script này để test registration process
 */

import { SupabaseAuthService } from '../lib/auth/supabase-auth.ts';

// Tạo instance của auth service
const authService = new SupabaseAuthService();

// Test data cho doctor
const testDoctorData = {
  email: 'test.doctor@hospital.com',
  password: 'TestPassword123!',
  full_name: 'Bác sĩ Nguyễn Văn Test',
  phone_number: '0901234567',
  role: 'doctor',
  specialty: 'Nội khoa',
  license_number: 'BS123456',
  qualification: 'Thạc sĩ Y khoa'
};

// Test data cho patient
const testPatientData = {
  email: 'test.patient@hospital.com',
  password: 'TestPassword123!',
  full_name: 'Bệnh nhân Trần Thị Test',
  phone_number: '0907654321',
  role: 'patient',
  date_of_birth: '1990-01-15',
  gender: 'female',
  address: '123 Đường Test, Quận 1, TP.HCM'
};

// Hàm test đăng ký doctor
async function testDoctorRegistration() {
  console.log('\n🧪 === TESTING DOCTOR REGISTRATION ===');
  console.log('📝 Doctor data:', {
    email: testDoctorData.email,
    full_name: testDoctorData.full_name,
    role: testDoctorData.role,
    specialty: testDoctorData.specialty,
    license_number: testDoctorData.license_number,
    qualification: testDoctorData.qualification
  });

  try {
    const result = await authService.signUp(testDoctorData);
    
    if (result.error) {
      console.error('❌ Doctor registration failed:', result.error);
      return false;
    }

    console.log('✅ Doctor registration successful!');
    console.log('👨‍⚕️ Doctor user created:', {
      id: result.user?.id,
      email: result.user?.email,
      role: result.user?.role,
      full_name: result.user?.full_name
    });
    
    return true;
  } catch (error) {
    console.error('❌ Doctor registration exception:', error);
    return false;
  }
}

// Hàm test đăng ký patient
async function testPatientRegistration() {
  console.log('\n🧪 === TESTING PATIENT REGISTRATION ===');
  console.log('📝 Patient data:', {
    email: testPatientData.email,
    full_name: testPatientData.full_name,
    role: testPatientData.role,
    date_of_birth: testPatientData.date_of_birth,
    gender: testPatientData.gender,
    address: testPatientData.address
  });

  try {
    const result = await authService.signUp(testPatientData);
    
    if (result.error) {
      console.error('❌ Patient registration failed:', result.error);
      return false;
    }

    console.log('✅ Patient registration successful!');
    console.log('🏥 Patient user created:', {
      id: result.user?.id,
      email: result.user?.email,
      role: result.user?.role,
      full_name: result.user?.full_name
    });
    
    return true;
  } catch (error) {
    console.error('❌ Patient registration exception:', error);
    return false;
  }
}

// Hàm test đăng nhập
async function testLogin(email, password, userType) {
  console.log(`\n🔐 === TESTING ${userType.toUpperCase()} LOGIN ===`);
  console.log('📝 Login credentials:', { email });

  try {
    const result = await authService.signIn({ email, password });
    
    if (result.error) {
      console.error(`❌ ${userType} login failed:`, result.error);
      return false;
    }

    console.log(`✅ ${userType} login successful!`);
    console.log(`🔑 ${userType} session:`, {
      id: result.user?.id,
      email: result.user?.email,
      role: result.user?.role,
      full_name: result.user?.full_name,
      hasSession: !!result.session
    });
    
    return true;
  } catch (error) {
    console.error(`❌ ${userType} login exception:`, error);
    return false;
  }
}

// Hàm cleanup - xóa test users
async function cleanupTestUsers() {
  console.log('\n🧹 === CLEANUP TEST USERS ===');
  
  // Note: Trong production, bạn sẽ cần implement hàm xóa user
  // Hiện tại chỉ log thông báo
  console.log('⚠️  Manual cleanup required:');
  console.log('   - Delete test doctor:', testDoctorData.email);
  console.log('   - Delete test patient:', testPatientData.email);
  console.log('   - Check Supabase dashboard for cleanup');
}

// Hàm chính chạy tất cả tests
async function runAllTests() {
  console.log('🚀 === HOSPITAL MANAGEMENT REGISTRATION TESTS ===');
  console.log('⏰ Started at:', new Date().toLocaleString());
  
  const results = {
    doctorRegistration: false,
    patientRegistration: false,
    doctorLogin: false,
    patientLogin: false
  };

  try {
    // Test 1: Doctor Registration
    results.doctorRegistration = await testDoctorRegistration();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s between tests

    // Test 2: Patient Registration  
    results.patientRegistration = await testPatientRegistration();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s between tests

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
    console.log('\n📊 === TEST RESULTS SUMMARY ===');
    console.log('Doctor Registration:', results.doctorRegistration ? '✅ PASS' : '❌ FAIL');
    console.log('Patient Registration:', results.patientRegistration ? '✅ PASS' : '❌ FAIL');
    console.log('Doctor Login:', results.doctorLogin ? '✅ PASS' : '❌ FAIL');
    console.log('Patient Login:', results.patientLogin ? '✅ PASS' : '❌ FAIL');
    
    const passCount = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 Overall: ${passCount}/${totalTests} tests passed`);
    
    if (passCount === totalTests) {
      console.log('🎉 All tests passed! Registration system is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please check the errors above.');
    }

    // Cleanup reminder
    await cleanupTestUsers();
    
  } catch (error) {
    console.error('💥 Test suite failed with exception:', error);
  }
  
  console.log('⏰ Completed at:', new Date().toLocaleString());
}

// Export functions for individual testing
export {
  testDoctorRegistration,
  testPatientRegistration,
  testLogin,
  runAllTests,
  cleanupTestUsers
};

// Run all tests if this script is executed directly
if (typeof window !== 'undefined') {
  // Browser environment - add to window for manual testing
  window.hospitalTests = {
    runAllTests,
    testDoctorRegistration,
    testPatientRegistration,
    testLogin,
    cleanupTestUsers
  };
  
  console.log('🧪 Hospital Registration Tests loaded!');
  console.log('Run tests with: window.hospitalTests.runAllTests()');
} else {
  // Node environment - run tests immediately
  runAllTests().catch(console.error);
}
