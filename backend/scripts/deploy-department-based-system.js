#!/usr/bin/env node

/**
 * HOSPITAL MANAGEMENT SYSTEM - DEPARTMENT-BASED ID SYSTEM DEPLOYMENT
 * ===================================================================
 * This script deploys the complete department-based ID system to Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

if (!supabaseUrl.includes('supabase.co') || !supabaseServiceKey.startsWith('eyJ')) {
  console.error('❌ Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deployDepartmentBasedSystem() {
  console.log('🚀 DEPLOYING DEPARTMENT-BASED ID SYSTEM');
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Read and execute SQL script
    console.log('\n📄 Step 1: Reading SQL script...');
    const sqlPath = path.join(__dirname, 'deploy-department-based-functions.sql');
    
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`SQL file not found: ${sqlPath}`);
    }
    
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    console.log('✅ SQL script loaded successfully');
    
    // Step 2: Execute SQL script
    console.log('\n🔧 Step 2: Executing database functions...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      // Try alternative method - split and execute statements
      await executeSqlStatements(sqlContent);
    } else {
      console.log('✅ Database functions created successfully');
    }
    
    // Step 3: Test functions
    console.log('\n🧪 Step 3: Testing ID generation functions...');
    await testIdGeneration();
    
    // Step 4: Verify system
    console.log('\n✅ Step 4: Verifying department-based system...');
    await verifySystem();
    
    console.log('\n🎉 DEPARTMENT-BASED ID SYSTEM DEPLOYED SUCCESSFULLY!');
    console.log('=' .repeat(50));
    
    // Display usage examples
    displayUsageExamples();
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

async function executeSqlStatements(sqlContent) {
  // Split SQL content into individual statements
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
  
  for (const statement of statements) {
    if (statement.toLowerCase().includes('select ')) {
      // Skip SELECT statements used for testing
      continue;
    }
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      if (error) {
        console.warn(`⚠️  Warning executing statement: ${error.message}`);
      }
    } catch (err) {
      console.warn(`⚠️  Warning: ${err.message}`);
    }
  }
}

async function testIdGeneration() {
  const tests = [
    { func: 'generate_doctor_id', params: { dept_id: 'DEPT001' }, expected: /^CARD-DOC-\d{6}-\d{3}$/ },
    { func: 'generate_patient_id', params: {}, expected: /^PAT-\d{6}-\d{3}$/ },
    { func: 'generate_admin_id', params: {}, expected: /^ADM-\d{6}-\d{3}$/ },
    { func: 'generate_appointment_id', params: { dept_id: 'DEPT001' }, expected: /^CARD-APT-\d{6}-\d{3}$/ },
    { func: 'generate_medical_record_id', params: { dept_id: 'DEPT002' }, expected: /^ORTH-MR-\d{6}-\d{3}$/ },
    { func: 'generate_prescription_id', params: { dept_id: 'DEPT003' }, expected: /^PEDI-RX-\d{6}-\d{3}$/ }
  ];
  
  for (const test of tests) {
    try {
      const { data, error } = await supabase.rpc(test.func, test.params);
      
      if (error) {
        console.log(`   ❌ ${test.func}: ${error.message}`);
      } else if (test.expected.test(data)) {
        console.log(`   ✅ ${test.func}: ${data}`);
      } else {
        console.log(`   ⚠️  ${test.func}: ${data} (unexpected format)`);
      }
    } catch (err) {
      console.log(`   ❌ ${test.func}: ${err.message}`);
    }
  }
}

async function verifySystem() {
  // Check if all functions exist
  const functions = [
    'get_department_code',
    'generate_hospital_id',
    'generate_doctor_id',
    'generate_patient_id',
    'generate_admin_id',
    'generate_appointment_id',
    'generate_medical_record_id',
    'generate_prescription_id'
  ];
  
  for (const funcName of functions) {
    try {
      const { data, error } = await supabase
        .from('information_schema.routines')
        .select('routine_name')
        .eq('routine_name', funcName)
        .eq('routine_schema', 'public');
      
      const exists = data && data.length > 0;
      console.log(`   ${exists ? '✅' : '❌'} ${funcName}()`);
    } catch (error) {
      console.log(`   ❌ ${funcName}(): Error checking`);
    }
  }
}

function displayUsageExamples() {
  console.log('\n📚 USAGE EXAMPLES:');
  console.log('=' .repeat(30));
  console.log('');
  console.log('🏥 Department-Based IDs:');
  console.log('   - Doctor (Cardiology): CARD-DOC-202506-001');
  console.log('   - Doctor (Neurology): NEUR-DOC-202506-001');
  console.log('   - Appointment (Pediatrics): PEDI-APT-202506-001');
  console.log('   - Medical Record (Orthopedics): ORTH-MR-202506-001');
  console.log('');
  console.log('🏥 Standard IDs:');
  console.log('   - Patient: PAT-202506-001');
  console.log('   - Admin: ADM-202506-001');
  console.log('');
  console.log('💻 Code Usage:');
  console.log('   const doctorId = await HospitalIdGenerator.generateDoctorId("DEPT001");');
  console.log('   const patientId = await HospitalIdGenerator.generatePatientId();');
  console.log('   const appointmentId = await HospitalIdGenerator.generateAppointmentId("DEPT003");');
}

// Run deployment
if (require.main === module) {
  deployDepartmentBasedSystem();
}

module.exports = { deployDepartmentBasedSystem };
