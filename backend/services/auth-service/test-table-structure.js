#!/usr/bin/env node

/**
 * Test exact table structure by trying minimal inserts
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testTableStructure() {
  console.log('🔍 Testing exact table structure...\n');

  // Test medications table
  console.log('💊 Testing medications table...');
  try {
    const { error } = await supabase
      .from('medications')
      .insert({
        medication_name: 'Test Med',
        // Try without other fields first
      });
    
    if (error) {
      console.log(`❌ Medications error: ${error.message}`);
    } else {
      console.log(`✅ Medications: basic insert works`);
      // Clean up
      await supabase.from('medications').delete().eq('medication_name', 'Test Med');
    }
  } catch (err) {
    console.log(`❌ Medications exception: ${err.message}`);
  }

  // Test status_values table
  console.log('\n📊 Testing status_values table...');
  try {
    const { error } = await supabase
      .from('status_values')
      .insert({
        status_type: 'test',
        // Try without other fields first
      });
    
    if (error) {
      console.log(`❌ Status values error: ${error.message}`);
    } else {
      console.log(`✅ Status values: basic insert works`);
      // Clean up
      await supabase.from('status_values').delete().eq('status_type', 'test');
    }
  } catch (err) {
    console.log(`❌ Status values exception: ${err.message}`);
  }

  // Test diagnosis table
  console.log('\n📋 Testing diagnosis table...');
  try {
    const { error } = await supabase
      .from('diagnosis')
      .insert({
        diagnosis_code: 'TEST001',
        // Try without other fields first
      });
    
    if (error) {
      console.log(`❌ Diagnosis error: ${error.message}`);
    } else {
      console.log(`✅ Diagnosis: basic insert works`);
      // Clean up
      await supabase.from('diagnosis').delete().eq('diagnosis_code', 'TEST001');
    }
  } catch (err) {
    console.log(`❌ Diagnosis exception: ${err.message}`);
  }

  // Check existing data
  console.log('\n📊 Checking existing data...');
  
  const tables = ['diagnosis', 'medications', 'status_values'];
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(3);
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${data.length} records found`);
        if (data.length > 0) {
          console.log(`   Sample columns: ${Object.keys(data[0]).join(', ')}`);
        }
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
}

testTableStructure().catch(console.error);
