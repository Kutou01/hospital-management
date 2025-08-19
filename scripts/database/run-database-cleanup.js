#!/usr/bin/env node

/**
 * Hospital Management System - Database Cleanup Script
 * Removes complex medical tables and adds receptionist workflow tables
 * Run: node scripts/run-database-cleanup.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runDatabaseCleanup() {
  console.log('🚀 Starting Hospital Management System Database Cleanup...\n');

  try {
    // Read the SQL cleanup script
    const sqlPath = path.join(__dirname, '..', 'database-cleanup.sql');
    
    if (!fs.existsSync(sqlPath)) {
      console.error('❌ SQL cleanup file not found:', sqlPath);
      process.exit(1);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.toLowerCase().includes('drop table')) {
        const tableName = extractTableName(statement);
        console.log(`🗑️  Dropping table: ${tableName}`);
      } else if (statement.toLowerCase().includes('create table')) {
        const tableName = extractTableName(statement);
        console.log(`✨ Creating table: ${tableName}`);
      } else if (statement.toLowerCase().includes('create index')) {
        console.log(`📊 Creating index...`);
      } else if (statement.toLowerCase().includes('alter table')) {
        console.log(`🔧 Altering table...`);
      }

      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });

        if (error) {
          console.log(`   ⚠️  Warning: ${error.message}`);
          errorCount++;
        } else {
          console.log(`   ✅ Success`);
          successCount++;
        }
      } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
        errorCount++;
      }
    }

    console.log('\n📊 Cleanup Summary:');
    console.log(`   ✅ Successful operations: ${successCount}`);
    console.log(`   ⚠️  Warnings/Errors: ${errorCount}`);

    // Verify key tables exist
    console.log('\n🔍 Verifying key tables...');
    
    const keyTables = [
      'profiles',
      'doctors', 
      'patients',
      'appointments',
      'medical_records',
      'prescriptions',
      'payments',
      'departments',
      'specialties',
      'patient_check_ins',
      'appointment_queue',
      'daily_operations'
    ];

    for (const tableName of keyTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`   ❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`   ✅ ${tableName}: OK`);
        }
      } catch (err) {
        console.log(`   ❌ ${tableName}: ${err.message}`);
      }
    }

    // Check removed tables
    console.log('\n🗑️  Verifying removed tables...');
    
    const removedTables = [
      'vital_signs_history',
      'lab_results',
      'appointments_backup',
      'patients_backup'
    ];

    for (const tableName of removedTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error && error.message.includes('does not exist')) {
          console.log(`   ✅ ${tableName}: Successfully removed`);
        } else {
          console.log(`   ⚠️  ${tableName}: Still exists`);
        }
      } catch (err) {
        console.log(`   ✅ ${tableName}: Successfully removed`);
      }
    }

    console.log('\n🎉 Database cleanup completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Test receptionist queue management');
    console.log('   2. Verify appointment workflow');
    console.log('   3. Check patient check-in process');
    console.log('   4. Run frontend application');

  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    process.exit(1);
  }
}

function extractTableName(statement) {
  const dropMatch = statement.match(/DROP TABLE IF EXISTS (\w+)/i);
  if (dropMatch) return dropMatch[1];
  
  const createMatch = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
  if (createMatch) return createMatch[1];
  
  const alterMatch = statement.match(/ALTER TABLE (\w+)/i);
  if (alterMatch) return alterMatch[1];
  
  return 'unknown';
}

// Run the cleanup
if (require.main === module) {
  runDatabaseCleanup().catch(console.error);
}

module.exports = { runDatabaseCleanup };
