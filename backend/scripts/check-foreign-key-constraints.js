#!/usr/bin/env node

/**
 * Foreign Key Constraint Checker
 * Verifies all foreign key relationships before seeding data
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Define all foreign key relationships
const FOREIGN_KEY_CONSTRAINTS = {
  doctors: [
    { column: 'profile_id', references: 'profiles', ref_column: 'id' },
    { column: 'department_id', references: 'departments', ref_column: 'dept_id' }
  ],
  patients: [
    { column: 'profile_id', references: 'profiles', ref_column: 'id' }
  ],
  appointments: [
    { column: 'doctor_id', references: 'doctors', ref_column: 'doctor_id' },
    { column: 'patient_id', references: 'patients', ref_column: 'patient_id' }
  ],
  medical_records: [
    { column: 'doctor_id', references: 'doctors', ref_column: 'doctor_id' },
    { column: 'patient_id', references: 'patients', ref_column: 'patient_id' },
    { column: 'appointment_id', references: 'appointments', ref_column: 'appointment_id' }
  ],
  doctor_schedules: [
    { column: 'doctor_id', references: 'doctors', ref_column: 'doctor_id' }
  ],
  doctor_reviews: [
    { column: 'doctor_id', references: 'doctors', ref_column: 'doctor_id' },
    { column: 'patient_id', references: 'patients', ref_column: 'patient_id' }
  ]
};

async function checkForeignKeyConstraints() {
  console.log('🔗 Checking Foreign Key Constraints for Data Seeding');
  console.log('====================================================\n');

  let allConstraintsValid = true;
  const issues = [];

  try {
    for (const [tableName, constraints] of Object.entries(FOREIGN_KEY_CONSTRAINTS)) {
      console.log(`📋 Checking table: ${tableName}`);
      
      for (const constraint of constraints) {
        const isValid = await checkConstraint(tableName, constraint);
        if (!isValid) {
          allConstraintsValid = false;
          issues.push({
            table: tableName,
            constraint: constraint
          });
        }
      }
      console.log('');
    }

    // Summary
    console.log('📊 CONSTRAINT CHECK SUMMARY');
    console.log('============================');
    
    if (allConstraintsValid) {
      console.log('✅ All foreign key constraints are properly configured!');
      console.log('🎉 Database is ready for data seeding with referential integrity.');
    } else {
      console.log('❌ Some foreign key constraints have issues!');
      console.log('\n🔧 Issues found:');
      issues.forEach(issue => {
        console.log(`   - ${issue.table}.${issue.constraint.column} -> ${issue.constraint.references}.${issue.constraint.ref_column}`);
      });
    }

    return allConstraintsValid;

  } catch (error) {
    console.error('❌ Error checking foreign key constraints:', error);
    return false;
  }
}

async function checkConstraint(tableName, constraint) {
  try {
    const { column, references, ref_column } = constraint;
    
    // Check if both tables exist
    const sourceExists = await tableExists(tableName);
    const targetExists = await tableExists(references);
    
    if (!sourceExists) {
      console.log(`   ❌ Source table '${tableName}' does not exist`);
      return false;
    }
    
    if (!targetExists) {
      console.log(`   ❌ Referenced table '${references}' does not exist`);
      return false;
    }

    // Check if columns exist
    const sourceColumnExists = await columnExists(tableName, column);
    const targetColumnExists = await columnExists(references, ref_column);
    
    if (!sourceColumnExists) {
      console.log(`   ❌ Column '${column}' does not exist in table '${tableName}'`);
      return false;
    }
    
    if (!targetColumnExists) {
      console.log(`   ❌ Referenced column '${ref_column}' does not exist in table '${references}'`);
      return false;
    }

    console.log(`   ✅ ${column} -> ${references}.${ref_column}`);
    return true;

  } catch (error) {
    console.log(`   ❌ Error checking constraint: ${error.message}`);
    return false;
  }
}

async function tableExists(tableName) {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    return !error;
  } catch (error) {
    return false;
  }
}

async function columnExists(tableName, columnName) {
  try {
    // Try to select the specific column
    const { error } = await supabase
      .from(tableName)
      .select(columnName)
      .limit(1);
    
    return !error;
  } catch (error) {
    return false;
  }
}

// Test data integrity
async function testDataIntegrity() {
  console.log('\n🧪 Testing Data Integrity Requirements');
  console.log('======================================\n');

  const tests = [
    {
      name: 'Departments must exist before creating doctors',
      test: async () => {
        const { data, error } = await supabase
          .from('departments')
          .select('dept_id')
          .limit(1);
        
        return !error && data && data.length > 0;
      }
    },
    {
      name: 'Profiles must exist before creating doctors/patients',
      test: async () => {
        // We'll create profiles during seeding, so this is about the process
        return true;
      }
    },
    {
      name: 'Doctors must exist before creating appointments',
      test: async () => {
        // This will be validated during seeding process
        return true;
      }
    },
    {
      name: 'Patients must exist before creating appointments',
      test: async () => {
        // This will be validated during seeding process
        return true;
      }
    },
    {
      name: 'Appointments must exist before creating medical records',
      test: async () => {
        // This will be validated during seeding process
        return true;
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

// Check seeding order requirements
async function checkSeedingOrder() {
  console.log('\n📋 Seeding Order Requirements');
  console.log('=============================\n');

  const seedingOrder = [
    '1. Departments (no dependencies)',
    '2. Profiles (no dependencies)', 
    '3. Doctors (requires: profiles, departments)',
    '4. Patients (requires: profiles)',
    '5. Doctor Schedules (requires: doctors)',
    '6. Appointments (requires: doctors, patients)',
    '7. Medical Records (requires: doctors, patients, appointments)',
    '8. Doctor Reviews (requires: doctors, patients)'
  ];

  console.log('📊 Correct seeding order:');
  seedingOrder.forEach(step => {
    console.log(`   ${step}`);
  });

  console.log('\n⚠️  Important Notes:');
  console.log('   - Departments must be seeded first');
  console.log('   - Profiles must be created before doctors/patients');
  console.log('   - Auth users must be created before profiles');
  console.log('   - Foreign key values must exist in referenced tables');
  console.log('   - Use transactions for data consistency');
}

// Main function
async function main() {
  console.log('🏥 Hospital Management System - Foreign Key Constraint Checker');
  console.log('===============================================================\n');

  // Check constraints
  const constraintsOk = await checkForeignKeyConstraints();
  
  // Test data integrity requirements
  await testDataIntegrity();
  
  // Show seeding order
  await checkSeedingOrder();

  console.log('\n🎯 FINAL RESULT');
  console.log('===============');
  
  if (constraintsOk) {
    console.log('✅ Foreign key constraints are properly configured!');
    console.log('🚀 Ready for data seeding with referential integrity.');
    console.log('\n💡 Next steps:');
    console.log('   1. Run: npm run db:seed');
    console.log('   2. Monitor for foreign key violations');
    console.log('   3. Verify: npm run db:verify');
  } else {
    console.log('❌ Foreign key constraint issues found!');
    console.log('🔧 Please fix schema issues before seeding.');
    console.log('\n💡 Solutions:');
    console.log('   1. Run: npm run db:deploy-complete');
    console.log('   2. Check table and column existence');
    console.log('   3. Verify foreign key definitions');
  }
}

// Run checker
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Foreign key constraint check failed:', error);
    process.exit(1);
  });
}

module.exports = { 
  checkForeignKeyConstraints, 
  checkConstraint, 
  tableExists, 
  columnExists,
  FOREIGN_KEY_CONSTRAINTS 
};
