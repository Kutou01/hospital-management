const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🔍 HOSPITAL MANAGEMENT SYSTEM - DOCTORS TABLE VERIFICATION');
console.log('=========================================================\n');

async function verifyDoctorsTableStructure() {
  try {
    // 1. Check if doctors table exists and get basic info
    console.log('📋 1. CHECKING TABLE EXISTENCE AND BASIC INFO');
    console.log('----------------------------------------------');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('doctors')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Error accessing doctors table:', tableError.message);
      return;
    }
    
    console.log('✅ Doctors table exists and is accessible');
    
    // 2. Get table schema information
    console.log('\n📊 2. TABLE SCHEMA ANALYSIS');
    console.log('---------------------------');
    
    // Get sample record to understand structure
    const { data: sampleRecord, error: sampleError } = await supabase
      .from('doctors')
      .select('*')
      .limit(1)
      .single();

    let columns = [];
    if (!sampleError && sampleRecord) {
      // Extract column information from sample record
      columns = Object.keys(sampleRecord).map(key => ({
        column_name: key,
        data_type: typeof sampleRecord[key],
        sample_value: sampleRecord[key]
      }));
    }

    // Try to get more detailed schema info using raw SQL
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('exec_sql', {
        sql: `SELECT column_name, data_type, is_nullable, column_default
              FROM information_schema.columns
              WHERE table_name = 'doctors' AND table_schema = 'public'
              ORDER BY ordinal_position`
      })
      .catch(() => ({ data: null, error: 'RPC not available' }));
    
    console.log('📋 Table Columns (from sample data):');
    if (columns && columns.length > 0) {
      columns.forEach(col => {
        console.log(`   • ${col.column_name}: ${col.data_type}`);
        if (col.sample_value !== null && col.sample_value !== undefined) {
          const displayValue = typeof col.sample_value === 'object'
            ? JSON.stringify(col.sample_value).substring(0, 50) + '...'
            : String(col.sample_value).substring(0, 50);
          console.log(`     Sample: ${displayValue}`);
        }
      });
    } else {
      console.log('   ⚠️  No column information available');
    }

    // If we got detailed schema info, show it too
    if (schemaData && schemaData.length > 0) {
      console.log('\n📋 Detailed Schema Information:');
      schemaData.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        console.log(`   • ${col.column_name}: ${col.data_type} ${nullable}`);
        if (col.column_default) {
          console.log(`     Default: ${col.column_default}`);
        }
      });
    }
    
    // 3. Check constraints and indexes
    console.log('\n🔒 3. CONSTRAINTS AND INDEXES');
    console.log('-----------------------------');
    
    // Get constraints
    const { data: constraints, error: constraintError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('table_name', 'doctors')
      .eq('table_schema', 'public');
    
    if (!constraintError && constraints) {
      console.log('🔐 Table Constraints:');
      constraints.forEach(constraint => {
        console.log(`   • ${constraint.constraint_name}: ${constraint.constraint_type}`);
      });
    }
    
    // 4. Check required fields for Vietnamese hospital system
    console.log('\n🏥 4. VIETNAMESE HOSPITAL SYSTEM COMPLIANCE CHECK');
    console.log('------------------------------------------------');
    
    const requiredFields = [
      'doctor_id',
      'profile_id', 
      'department_id',
      'license_number',
      'qualification',
      'gender',
      'experience_years',
      'consultation_fee',
      'specialty',
      'availability_status',
      'rating',
      'total_reviews'
    ];
    
    const optionalFields = [
      'bio',
      'address',
      'languages_spoken',
      'specialty_id'
    ];
    
    console.log('✅ Required Fields Check:');
    if (columns) {
      const columnNames = columns.map(col => col.column_name);
      requiredFields.forEach(field => {
        const exists = columnNames.includes(field);
        console.log(`   ${exists ? '✅' : '❌'} ${field}`);
      });
      
      console.log('\n📋 Optional Fields Check:');
      optionalFields.forEach(field => {
        const exists = columnNames.includes(field);
        console.log(`   ${exists ? '✅' : '⚪'} ${field}`);
      });
    }
    
    // 5. Check data samples and test accounts
    console.log('\n👥 5. TEST DATA VERIFICATION');
    console.log('----------------------------');
    
    // Get total count
    const { count, error: countError } = await supabase
      .from('doctors')
      .select('*', { count: 'exact', head: true });
    
    if (!countError) {
      console.log(`📊 Total doctors in database: ${count}`);
    }
    
    // Check for test doctor accounts
    const testEmails = [
      'doctor@hospital.com',
      'doctor1@hospital.com',
      'doctor2@hospital.com',
      'doctor3@hospital.com',
      'doctor4@hospital.com',
      'doctor5@hospital.com'
    ];
    
    console.log('\n🧪 Test Doctor Accounts:');
    for (const email of testEmails) {
      // First get profile_id from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();
      
      if (!profileError && profile) {
        // Then check if doctor record exists
        const { data: doctor, error: doctorError } = await supabase
          .from('doctors')
          .select('doctor_id, license_number, specialty')
          .eq('profile_id', profile.id)
          .single();
        
        if (!doctorError && doctor) {
          console.log(`   ✅ ${email}: ${doctor.doctor_id} (${doctor.specialty})`);
        } else {
          console.log(`   ❌ ${email}: Profile exists but no doctor record`);
        }
      } else {
        console.log(`   ❌ ${email}: No profile found`);
      }
    }
    
    // 6. Sample data analysis
    console.log('\n📋 6. SAMPLE DATA ANALYSIS');
    console.log('-------------------------');
    
    const { data: sampleDoctors, error: sampleError } = await supabase
      .from('doctors')
      .select('doctor_id, license_number, specialty, department_id, experience_years, rating')
      .limit(5);
    
    if (!sampleError && sampleDoctors && sampleDoctors.length > 0) {
      console.log('📊 Sample Doctor Records:');
      sampleDoctors.forEach(doctor => {
        console.log(`   • ID: ${doctor.doctor_id}`);
        console.log(`     License: ${doctor.license_number}`);
        console.log(`     Specialty: ${doctor.specialty}`);
        console.log(`     Department: ${doctor.department_id}`);
        console.log(`     Experience: ${doctor.experience_years} years`);
        console.log(`     Rating: ${doctor.rating}/5`);
        console.log('');
      });
      
      // Validate ID formats
      console.log('🔍 ID Format Validation:');
      sampleDoctors.forEach(doctor => {
        // Check doctor_id format (should be DEPT-DOC-YYYYMM-XXX)
        const doctorIdPattern = /^[A-Z]{3,4}-DOC-\d{6}-\d{3}$/;
        const doctorIdValid = doctorIdPattern.test(doctor.doctor_id);
        
        // Check license format (should be VN-{2 letters}-{4 digits})
        const licensePattern = /^VN-[A-Z]{2}-\d{4}$/;
        const licenseValid = licensePattern.test(doctor.license_number);
        
        console.log(`   ${doctor.doctor_id}: ${doctorIdValid ? '✅' : '❌'} Doctor ID format`);
        console.log(`   ${doctor.license_number}: ${licenseValid ? '✅' : '❌'} License format`);
      });
    } else {
      console.log('⚠️  No sample data found in doctors table');
    }
    
    // 7. Integration readiness assessment
    console.log('\n🔧 7. INTEGRATION READINESS ASSESSMENT');
    console.log('-------------------------------------');
    
    const integrationFeatures = [
      {
        feature: 'Doctor Profiles',
        tables: ['doctors', 'profiles'],
        status: 'checking...'
      },
      {
        feature: 'Work Schedules', 
        tables: ['doctor_schedules'],
        status: 'checking...'
      },
      {
        feature: 'Patient Reviews/Ratings',
        tables: ['doctor_reviews'],
        status: 'checking...'
      },
      {
        feature: 'Shift Management',
        tables: ['doctor_shifts'],
        status: 'checking...'
      }
    ];
    
    for (const feature of integrationFeatures) {
      console.log(`\n📋 ${feature.feature}:`);
      for (const table of feature.tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          if (error) {
            console.log(`   ❌ ${table}: Table not accessible (${error.message})`);
          } else {
            console.log(`   ✅ ${table}: Table exists and accessible`);
          }
        } catch (err) {
          console.log(`   ❌ ${table}: Table check failed`);
        }
      }
    }
    
    console.log('\n✅ VERIFICATION COMPLETE');
    console.log('========================');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

// Run the verification
verifyDoctorsTableStructure()
  .then(() => {
    console.log('\n🎉 Doctors table verification completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Verification script failed:', error);
    process.exit(1);
  });
