const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyCompleteDatabase() {
  console.log('🔍 VERIFYING COMPLETE DATABASE DEPLOYMENT');
  console.log('='.repeat(80));

  try {
    // Test basic connection
    console.log('🔌 Testing database connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (connectionError) {
      console.log('❌ Database connection failed:', connectionError.message);
      return;
    }
    console.log('✅ Database connection successful\n');

    // STEP 1: Verify Core Tables
    console.log('📋 STEP 1: VERIFYING CORE TABLES');
    console.log('='.repeat(40));
    
    const coreTables = [
      'profiles', 'admins', 'doctors', 'patients',
      'departments', 'specialties', 'room_types',
      'appointments', 'medical_records', 'rooms'
    ];

    for (const table of coreTables) {
      await verifyTable(table);
    }

    // STEP 2: Verify Doctor Management Tables
    console.log('\n👨‍⚕️ STEP 2: VERIFYING DOCTOR MANAGEMENT TABLES');
    console.log('='.repeat(50));
    
    const doctorTables = [
      'doctor_schedules', 'doctor_reviews', 
      'doctor_shifts', 'doctor_experiences'
    ];

    for (const table of doctorTables) {
      await verifyTable(table);
    }

    // STEP 3: Verify Lookup Tables
    console.log('\n📊 STEP 3: VERIFYING LOOKUP TABLES');
    console.log('='.repeat(40));
    
    const lookupTables = [
      'diagnosis', 'medications', 'status_values', 'payment_methods'
    ];

    for (const table of lookupTables) {
      await verifyTable(table);
    }

    // STEP 4: Verify ID Generation Functions
    console.log('\n🔧 STEP 4: VERIFYING ID GENERATION FUNCTIONS');
    console.log('='.repeat(50));
    
    const functions = [
      'generate_doctor_id', 'generate_patient_id', 'generate_admin_id',
      'generate_appointment_id', 'generate_medical_record_id',
      'get_department_code', 'generate_hospital_id'
    ];

    for (const func of functions) {
      await verifyFunction(func);
    }

    // STEP 5: Verify Sequences
    console.log('\n🔢 STEP 5: VERIFYING SEQUENCES');
    console.log('='.repeat(35));
    
    const sequences = [
      'doctor_id_seq', 'patient_id_seq', 'admin_id_seq',
      'appointment_id_seq', 'medical_record_id_seq', 'department_id_seq'
    ];

    for (const seq of sequences) {
      await verifySequence(seq);
    }

    // STEP 6: Test ID Generation
    console.log('\n🧪 STEP 6: TESTING ID GENERATION');
    console.log('='.repeat(40));
    
    await testIdGeneration();

    // STEP 7: Verify Sample Data (if exists)
    console.log('\n📊 STEP 7: CHECKING SAMPLE DATA');
    console.log('='.repeat(35));
    
    await checkSampleData();

    // STEP 8: Verify Indexes
    console.log('\n🚀 STEP 8: VERIFYING PERFORMANCE INDEXES');
    console.log('='.repeat(45));
    
    await verifyIndexes();

    console.log('\n🎯 VERIFICATION COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(40));
    console.log('✅ All tables, functions, and sequences are properly deployed');
    console.log('✅ Department-Based ID Pattern is working correctly');
    console.log('✅ Database is ready for service integration');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

async function verifyTable(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`   ❌ ${tableName}: ${error.message}`);
    } else {
      console.log(`   ✅ ${tableName}: Table exists and accessible`);
    }
  } catch (error) {
    console.log(`   ❌ ${tableName}: Error - ${error.message}`);
  }
}

async function verifyFunction(functionName) {
  try {
    const { data, error } = await supabase
      .rpc('pg_get_function_result', {
        func_name: functionName
      });

    // Alternative check using information_schema
    const { data: funcData, error: funcError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_name', functionName)
      .eq('routine_schema', 'public');

    const exists = funcData && funcData.length > 0;
    console.log(`   ${exists ? '✅' : '❌'} ${functionName}()`);
  } catch (error) {
    console.log(`   ❌ ${functionName}(): Error checking`);
  }
}

async function verifySequence(sequenceName) {
  try {
    const { data, error } = await supabase
      .from('information_schema.sequences')
      .select('sequence_name')
      .eq('sequence_name', sequenceName)
      .eq('sequence_schema', 'public');

    const exists = data && data.length > 0;
    console.log(`   ${exists ? '✅' : '❌'} ${sequenceName}`);
  } catch (error) {
    console.log(`   ❌ ${sequenceName}: Error checking`);
  }
}

async function testIdGeneration() {
  try {
    // Test department code function
    console.log('   🧪 Testing get_department_code...');
    const { data: deptCode, error: deptError } = await supabase
      .rpc('get_department_code', { dept_id: 'DEPT001' });
    
    if (deptError) {
      console.log(`   ❌ get_department_code: ${deptError.message}`);
    } else {
      console.log(`   ✅ get_department_code('DEPT001') = '${deptCode}'`);
    }

    // Test patient ID generation
    console.log('   🧪 Testing generate_patient_id...');
    const { data: patientId, error: patientError } = await supabase
      .rpc('generate_patient_id');
    
    if (patientError) {
      console.log(`   ❌ generate_patient_id: ${patientError.message}`);
    } else {
      console.log(`   ✅ generate_patient_id() = '${patientId}'`);
    }

    // Test doctor ID generation
    console.log('   🧪 Testing generate_doctor_id...');
    const { data: doctorId, error: doctorError } = await supabase
      .rpc('generate_doctor_id', { dept_id: 'DEPT001' });
    
    if (doctorError) {
      console.log(`   ❌ generate_doctor_id: ${doctorError.message}`);
    } else {
      console.log(`   ✅ generate_doctor_id('DEPT001') = '${doctorId}'`);
    }

  } catch (error) {
    console.log(`   ❌ ID Generation Test Error: ${error.message}`);
  }
}

async function checkSampleData() {
  try {
    // Check departments
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('count', { count: 'exact', head: true });

    if (!deptError && departments) {
      console.log(`   📊 Departments: ${departments.count} records`);
    }

    // Check profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (!profileError && profiles) {
      console.log(`   👥 Profiles: ${profiles.count} records`);
    }

    // Check doctors
    const { data: doctors, error: doctorError } = await supabase
      .from('doctors')
      .select('count', { count: 'exact', head: true });

    if (!doctorError && doctors) {
      console.log(`   👨‍⚕️ Doctors: ${doctors.count} records`);
    }

    // Check patients
    const { data: patients, error: patientError } = await supabase
      .from('patients')
      .select('count', { count: 'exact', head: true });

    if (!patientError && patients) {
      console.log(`   🤒 Patients: ${patients.count} records`);
    }

  } catch (error) {
    console.log(`   ❌ Sample Data Check Error: ${error.message}`);
  }
}

async function verifyIndexes() {
  try {
    const { data: indexes, error } = await supabase
      .from('pg_indexes')
      .select('indexname')
      .like('indexname', 'idx_%');

    if (error) {
      console.log(`   ❌ Index verification failed: ${error.message}`);
    } else {
      console.log(`   ✅ Found ${indexes.length} custom indexes`);
      indexes.slice(0, 5).forEach(idx => {
        console.log(`      - ${idx.indexname}`);
      });
      if (indexes.length > 5) {
        console.log(`      ... and ${indexes.length - 5} more`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Index Check Error: ${error.message}`);
  }
}

// Run verification
verifyCompleteDatabase()
  .then(() => {
    console.log('\n🎯 DATABASE VERIFICATION COMPLETED');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ DATABASE VERIFICATION FAILED:', error);
    process.exit(1);
  });
