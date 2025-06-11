#!/usr/bin/env node

/**
 * =====================================================
 * TABLE STRUCTURE CHECKER
 * =====================================================
 * Script để kiểm tra cấu trúc chi tiết của các bảng
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkTableStructure() {
  console.log('🔍 CHECKING TABLE STRUCTURES...\n');

  const coreTables = ['profiles', 'doctors', 'patients', 'admins', 'departments'];

  for (const tableName of coreTables) {
    await checkTable(tableName);
    console.log(''); // Add spacing
  }
}

async function checkTable(tableName) {
  console.log(`📋 ${tableName.toUpperCase()} TABLE:`);
  console.log('='.repeat(tableName.length + 8));

  try {
    // Get table columns using a direct query
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length
          FROM information_schema.columns 
          WHERE table_name = '${tableName}' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });

    if (error) {
      console.log(`❌ Error getting structure: ${error.message}`);
      return;
    }

    if (!data || data.length === 0) {
      console.log('❌ No columns found or table does not exist');
      return;
    }

    console.log('Columns:');
    data.forEach((col, index) => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const maxLength = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
      const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      
      console.log(`  ${index + 1}. ${col.column_name}: ${col.data_type}${maxLength} ${nullable}${defaultVal}`);
    });

    // Check for specific important columns based on table
    console.log('\nKey Column Analysis:');
    const columnNames = data.map(col => col.column_name);

    if (tableName === 'profiles') {
      checkProfilesColumns(columnNames);
    } else if (tableName === 'doctors') {
      checkDoctorsColumns(columnNames);
    } else if (tableName === 'patients') {
      checkPatientsColumns(columnNames);
    } else if (tableName === 'admins') {
      checkAdminsColumns(columnNames);
    } else if (tableName === 'departments') {
      checkDepartmentsColumns(columnNames);
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

function checkProfilesColumns(columns) {
  const required = ['id', 'email', 'full_name', 'role'];
  const optional = ['phone_number', 'date_of_birth', 'is_active', 'email_verified', 'phone_verified'];
  
  console.log('  Required fields:');
  required.forEach(col => {
    const exists = columns.includes(col);
    console.log(`    ${exists ? '✅' : '❌'} ${col}`);
  });
  
  console.log('  Optional fields:');
  optional.forEach(col => {
    const exists = columns.includes(col);
    console.log(`    ${exists ? '✅' : '⚪'} ${col}`);
  });
}

function checkDoctorsColumns(columns) {
  const required = ['doctor_id', 'profile_id', 'specialization', 'license_number', 'department_id'];
  const optional = ['gender', 'bio', 'experience_years', 'consultation_fee', 'working_hours', 'status'];
  
  console.log('  Required fields:');
  required.forEach(col => {
    const exists = columns.includes(col);
    console.log(`    ${exists ? '✅' : '❌'} ${col}`);
  });
  
  console.log('  Optional fields:');
  optional.forEach(col => {
    const exists = columns.includes(col);
    console.log(`    ${exists ? '✅' : '⚪'} ${col}`);
  });
}

function checkPatientsColumns(columns) {
  const required = ['patient_id', 'profile_id'];
  const optional = ['date_of_birth', 'gender', 'blood_type', 'address', 'emergency_contact', 'insurance_info', 'medical_history', 'allergies', 'status'];
  
  console.log('  Required fields:');
  required.forEach(col => {
    const exists = columns.includes(col);
    console.log(`    ${exists ? '✅' : '❌'} ${col}`);
  });
  
  console.log('  Optional fields:');
  optional.forEach(col => {
    const exists = columns.includes(col);
    console.log(`    ${exists ? '✅' : '⚪'} ${col}`);
  });
}

function checkAdminsColumns(columns) {
  const required = ['admin_id', 'profile_id'];
  const optional = ['department_id', 'access_level', 'permissions', 'status'];
  
  console.log('  Required fields:');
  required.forEach(col => {
    const exists = columns.includes(col);
    console.log(`    ${exists ? '✅' : '❌'} ${col}`);
  });
  
  console.log('  Optional fields:');
  optional.forEach(col => {
    const exists = columns.includes(col);
    console.log(`    ${exists ? '✅' : '⚪'} ${col}`);
  });
}

function checkDepartmentsColumns(columns) {
  const required = ['department_id', 'name'];
  const optional = ['code', 'description', 'head_doctor_id', 'location', 'phone_number', 'email', 'operating_hours', 'is_active'];
  
  console.log('  Required fields:');
  required.forEach(col => {
    const exists = columns.includes(col);
    console.log(`    ${exists ? '✅' : '❌'} ${col}`);
  });
  
  console.log('  Optional fields:');
  optional.forEach(col => {
    const exists = columns.includes(col);
    console.log(`    ${exists ? '✅' : '⚪'} ${col}`);
  });
}

// Run the check
checkTableStructure()
  .then(() => {
    console.log('🎯 TABLE STRUCTURE CHECK COMPLETED');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ TABLE STRUCTURE CHECK FAILED:', error);
    process.exit(1);
  });
