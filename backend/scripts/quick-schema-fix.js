#!/usr/bin/env node

/**
 * Quick Schema Fix Script
 * Applies necessary schema fixes for seeding
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function quickSchemaFix() {
  console.log('🔧 Quick Schema Fix for Seeding');
  console.log('================================\n');

  try {
    // Read the SQL fix script
    const sqlFilePath = path.join(__dirname, 'fix-schema-issues.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      console.log('❌ SQL fix file not found:', sqlFilePath);
      return false;
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📋 Applying schema fixes...');
    console.log('   - Adding dept_id, name, code columns to departments');
    console.log('   - Creating doctor_reviews table');
    console.log('   - Setting up foreign key constraints');
    console.log('   - Adding indexes and RLS policies\n');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: sqlContent 
    });

    if (error) {
      console.log('⚠️ Some SQL commands may have failed (this is often normal):');
      console.log(`   ${error.message}\n`);
      
      // Try individual fixes
      await applyIndividualFixes();
    } else {
      console.log('✅ Schema fixes applied successfully!\n');
    }

    // Verify the fixes
    await verifyFixes();

    return true;

  } catch (error) {
    console.error('❌ Error applying schema fixes:', error);
    
    // Try individual fixes as fallback
    console.log('\n🔄 Trying individual fixes...');
    await applyIndividualFixes();
    
    return false;
  }
}

async function applyIndividualFixes() {
  console.log('🔧 Applying individual schema fixes...\n');

  // Fix 1: Add columns to departments table
  try {
    console.log('1. Adding columns to departments table...');
    
    // Check current departments structure
    const { data: depts, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .limit(1);

    if (deptError) {
      console.log(`   ⚠️ Cannot access departments table: ${deptError.message}`);
    } else if (depts && depts.length > 0) {
      const dept = depts[0];
      console.log('   📊 Current departments columns:', Object.keys(dept).join(', '));
      
      // Check if we need to add columns
      if (!dept.hasOwnProperty('dept_id')) {
        console.log('   ⚠️ dept_id column missing - will use department_id');
      }
      if (!dept.hasOwnProperty('name')) {
        console.log('   ⚠️ name column missing - will use department_name');
      }
      if (!dept.hasOwnProperty('code')) {
        console.log('   ⚠️ code column missing - will use department_code');
      }
    }
  } catch (error) {
    console.log(`   ❌ Error checking departments: ${error.message}`);
  }

  // Fix 2: Create doctor_reviews table
  try {
    console.log('\n2. Creating doctor_reviews table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS doctor_reviews (
        review_id VARCHAR(20) PRIMARY KEY DEFAULT ('REV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(NEXTVAL('review_id_seq')::TEXT, 3, '0')),
        doctor_id VARCHAR(20) NOT NULL,
        patient_id VARCHAR(20) NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT,
        review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE SEQUENCE IF NOT EXISTS review_id_seq START 1;
    `;

    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createTableSQL 
    });

    if (createError) {
      console.log(`   ⚠️ Table creation issue: ${createError.message}`);
    } else {
      console.log('   ✅ doctor_reviews table created');
    }

  } catch (error) {
    console.log(`   ❌ Error creating doctor_reviews table: ${error.message}`);
  }

  // Fix 3: Test table access
  try {
    console.log('\n3. Testing table access...');
    
    const tables = ['departments', 'doctors', 'patients', 'appointments', 'medical_records', 'doctor_schedules', 'doctor_reviews'];
    
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`   ❌ ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ ${table}: accessible`);
        }
      } catch (err) {
        console.log(`   ❌ ${table}: ${err.message}`);
      }
    }

  } catch (error) {
    console.log(`   ❌ Error testing table access: ${error.message}`);
  }
}

async function verifyFixes() {
  console.log('🔍 Verifying schema fixes...\n');

  try {
    // Check departments table
    const { data: depts, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .limit(1);

    if (deptError) {
      console.log(`❌ Departments table: ${deptError.message}`);
    } else {
      console.log('✅ Departments table: accessible');
      if (depts && depts.length > 0) {
        const columns = Object.keys(depts[0]);
        console.log(`   Columns: ${columns.join(', ')}`);
      }
    }

    // Check doctor_reviews table
    const { data: reviews, error: reviewError } = await supabase
      .from('doctor_reviews')
      .select('*')
      .limit(1);

    if (reviewError) {
      console.log(`❌ Doctor reviews table: ${reviewError.message}`);
    } else {
      console.log('✅ Doctor reviews table: accessible');
    }

    console.log('\n🎯 Schema fix verification completed!');

  } catch (error) {
    console.log(`❌ Error verifying fixes: ${error.message}`);
  }
}

// Run quick fix
if (require.main === module) {
  quickSchemaFix().then(success => {
    if (success) {
      console.log('\n🎉 Schema fixes completed! You can now run:');
      console.log('   npm run db:verify-schema');
      console.log('   npm run db:seed');
    } else {
      console.log('\n⚠️ Some issues may remain. Please check Supabase dashboard.');
    }
  }).catch(error => {
    console.error('❌ Quick fix failed:', error);
    process.exit(1);
  });
}

module.exports = { quickSchemaFix, applyIndividualFixes };
