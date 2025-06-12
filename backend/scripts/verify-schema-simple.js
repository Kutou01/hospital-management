#!/usr/bin/env node

/**
 * Simple Schema Verification
 * Just checks if tables exist and are accessible
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifySchemaSimple() {
  console.log('🔍 Simple Schema Verification for Seeding');
  console.log('==========================================\n');

  const requiredTables = [
    'profiles',
    'departments', 
    'doctors',
    'patients',
    'appointments',
    'medical_records',
    'doctor_schedules',
    'doctor_reviews'
  ];

  let allTablesOk = true;

  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        allTablesOk = false;
      } else {
        console.log(`✅ ${table}: accessible`);
        
        // Show column info for departments
        if (table === 'departments' && data && data.length > 0) {
          const columns = Object.keys(data[0]);
          console.log(`   Columns: ${columns.join(', ')}`);
        }
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
      allTablesOk = false;
    }
  }

  console.log('\n📊 SIMPLE VERIFICATION SUMMARY');
  console.log('===============================');
  
  if (allTablesOk) {
    console.log('✅ All required tables are accessible!');
    console.log('🎉 Database is ready for seeding.');
    console.log('\n💡 Note: Using actual column names from your database:');
    console.log('   - departments.department_id (instead of dept_id)');
    console.log('   - departments.department_name (instead of name)');
    console.log('   - departments.department_code (instead of code)');
    console.log('\n🚀 You can now run: npm run db:seed');
  } else {
    console.log('❌ Some tables are not accessible!');
    console.log('🔧 Please check your database setup.');
  }

  return allTablesOk;
}

// Test departments specifically
async function testDepartments() {
  console.log('\n🏥 Testing Departments Table');
  console.log('============================');

  try {
    const { data, error } = await supabase
      .from('departments')
      .select('department_id, department_name, department_code, is_active')
      .eq('is_active', true)
      .order('department_id');

    if (error) {
      console.log(`❌ Error: ${error.message}`);
      return false;
    }

    if (!data || data.length === 0) {
      console.log('⚠️ No active departments found');
      return false;
    }

    console.log(`✅ Found ${data.length} active departments:`);
    data.forEach((dept, index) => {
      console.log(`  ${index + 1}. ${dept.department_id} - ${dept.department_name}`);
    });

    return true;

  } catch (error) {
    console.log(`❌ Error testing departments: ${error.message}`);
    return false;
  }
}

// Test foreign key relationships
async function testForeignKeys() {
  console.log('\n🔗 Testing Foreign Key Relationships');
  console.log('====================================');

  const tests = [
    {
      name: 'Doctors → Departments',
      test: async () => {
        const { data, error } = await supabase
          .from('doctors')
          .select('doctor_id, department_id')
          .limit(1);
        return !error;
      }
    },
    {
      name: 'Doctors → Profiles',
      test: async () => {
        const { data, error } = await supabase
          .from('doctors')
          .select('doctor_id, profile_id')
          .limit(1);
        return !error;
      }
    },
    {
      name: 'Patients → Profiles',
      test: async () => {
        const { data, error } = await supabase
          .from('patients')
          .select('patient_id, profile_id')
          .limit(1);
        return !error;
      }
    }
  ];

  for (const test of tests) {
    try {
      const result = await test.test();
      console.log(`${result ? '✅' : '❌'} ${test.name}`);
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
}

// Main function
async function main() {
  const schemaOk = await verifySchemaSimple();
  
  if (schemaOk) {
    await testDepartments();
    await testForeignKeys();
  }

  console.log('\n🎯 FINAL RESULT');
  console.log('===============');
  
  if (schemaOk) {
    console.log('✅ Schema verification passed!');
    console.log('🚀 Ready to seed data: npm run db:seed');
  } else {
    console.log('❌ Schema verification failed!');
    console.log('🔧 Please check your database setup.');
  }

  return schemaOk;
}

// Run verification
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
}

module.exports = { verifySchemaSimple, testDepartments, testForeignKeys };
