#!/usr/bin/env node

/**
 * 🧪 DIRECT TABLE INSERT TEST
 * 
 * Test direct insertion into doctors and patients tables
 * to identify the exact schema mismatch
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

async function testTableStructure() {
  log('🔍 Testing Table Structures...', 'blue');
  
  // Test doctors table structure
  try {
    log('\n📋 Testing doctors table...', 'cyan');
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .limit(1);
    
    if (error) {
      log(`❌ Doctors table error: ${error.message}`, 'red');
    } else {
      log(`✅ Doctors table accessible`, 'green');
      if (data && data.length > 0) {
        log(`📊 Sample columns: ${Object.keys(data[0]).join(', ')}`, 'cyan');
      }
    }
  } catch (err) {
    log(`❌ Doctors table exception: ${err.message}`, 'red');
  }
  
  // Test patients table structure
  try {
    log('\n🏥 Testing patients table...', 'cyan');
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .limit(1);
    
    if (error) {
      log(`❌ Patients table error: ${error.message}`, 'red');
    } else {
      log(`✅ Patients table accessible`, 'green');
      if (data && data.length > 0) {
        log(`📊 Sample columns: ${Object.keys(data[0]).join(', ')}`, 'cyan');
      }
    }
  } catch (err) {
    log(`❌ Patients table exception: ${err.message}`, 'red');
  }
}

async function testDoctorInsert() {
  log('\n👨‍⚕️ Testing Doctor Insert...', 'blue');
  
  const doctorData = {
    doctor_id: 'TEST-DOC-001',
    profile_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
    specialty: 'Cardiology',
    license_number: 'VN-CD-1234',
    qualification: 'MD',
    department_id: 'DEPT001',
    gender: 'male',
    bio: null,
    experience_years: 0,
    consultation_fee: null,
    address: {},
    languages_spoken: ['Vietnamese'],
    availability_status: 'available',
    rating: 0.00,
    total_reviews: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null
  };
  
  log(`📝 Attempting to insert: ${JSON.stringify(doctorData, null, 2)}`, 'cyan');
  
  try {
    const { data, error } = await supabase
      .from('doctors')
      .insert(doctorData)
      .select();
    
    if (error) {
      log(`❌ Doctor insert error: ${error.message}`, 'red');
      log(`📋 Error details: ${JSON.stringify(error, null, 2)}`, 'red');
    } else {
      log(`✅ Doctor insert successful!`, 'green');
      log(`📊 Inserted data: ${JSON.stringify(data, null, 2)}`, 'green');
      
      // Clean up - delete the test record
      await supabase.from('doctors').delete().eq('doctor_id', 'TEST-DOC-001');
      log(`🧹 Test record cleaned up`, 'yellow');
    }
  } catch (err) {
    log(`❌ Doctor insert exception: ${err.message}`, 'red');
  }
}

async function testPatientInsert() {
  log('\n🏥 Testing Patient Insert...', 'blue');
  
  const patientData = {
    patient_id: 'TEST-PAT-001',
    profile_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
    gender: 'female',
    blood_type: null,
    address: {},
    emergency_contact: {},
    insurance_info: {},
    medical_history: 'No medical history recorded',
    allergies: [],
    chronic_conditions: [],
    current_medications: {},
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null
  };
  
  log(`📝 Attempting to insert: ${JSON.stringify(patientData, null, 2)}`, 'cyan');
  
  try {
    const { data, error } = await supabase
      .from('patients')
      .insert(patientData)
      .select();
    
    if (error) {
      log(`❌ Patient insert error: ${error.message}`, 'red');
      log(`📋 Error details: ${JSON.stringify(error, null, 2)}`, 'red');
    } else {
      log(`✅ Patient insert successful!`, 'green');
      log(`📊 Inserted data: ${JSON.stringify(data, null, 2)}`, 'green');
      
      // Clean up - delete the test record
      await supabase.from('patients').delete().eq('patient_id', 'TEST-PAT-001');
      log(`🧹 Test record cleaned up`, 'yellow');
    }
  } catch (err) {
    log(`❌ Patient insert exception: ${err.message}`, 'red');
  }
}

async function runTests() {
  log('🚀 Starting Direct Table Insert Tests', 'yellow');
  log('=' .repeat(50), 'yellow');
  
  try {
    await testTableStructure();
    await testDoctorInsert();
    await testPatientInsert();
    
    log('\n✅ All tests completed!', 'green');
  } catch (error) {
    log(`💥 Fatal error: ${error.message}`, 'red');
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
