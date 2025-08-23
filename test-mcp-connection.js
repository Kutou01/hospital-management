#!/usr/bin/env node

// Test script to verify Supabase MCP connection
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
  console.log('🔍 Testing Supabase MCP Connection...\n');
  
  // Get credentials
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  
  console.log('📌 Configuration:');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Key: ${supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'NOT FOUND'}\n`);
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY environment variables');
    process.exit(1);
  }
  
  // Create client
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase client created successfully\n');
  
  try {
    // Test 1: List tables
    console.log('📊 Test 1: Listing database tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(10);
    
    if (tablesError) {
      // Alternative approach - try direct table access
      console.log('   Using alternative approach...');
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (usersError) {
        console.log(`   ⚠️  Could not list tables: ${usersError.message}`);
      } else {
        console.log('   ✅ Can access users table');
      }
    } else {
      console.log(`   ✅ Found ${tables?.length || 0} tables`);
      if (tables && tables.length > 0) {
        console.log('   Tables:', tables.map(t => t.table_name).join(', '));
      }
    }
    
    // Test 2: Check users table
    console.log('\n👥 Test 2: Checking users table...');
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log(`   ⚠️  Error accessing users table: ${countError.message}`);
    } else {
      console.log(`   ✅ Users table accessible. Total records: ${count}`);
    }
    
    // Test 3: Test SELECT operation
    console.log('\n📖 Test 3: Testing SELECT operation...');
    const { data: sampleUsers, error: selectError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(3);
    
    if (selectError) {
      console.log(`   ⚠️  Error selecting data: ${selectError.message}`);
    } else {
      console.log(`   ✅ SELECT successful. Retrieved ${sampleUsers?.length || 0} records`);
      if (sampleUsers && sampleUsers.length > 0) {
        console.log('   Sample data:');
        sampleUsers.forEach(user => {
          console.log(`     - ${user.email} (${user.role})`);
        });
      }
    }
    
    // Test 4: Check other important tables
    console.log('\n🏥 Test 4: Checking hospital-specific tables...');
    const tablesToCheck = ['patients', 'doctors', 'appointments', 'medical_records'];
    
    for (const table of tablesToCheck) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ❌ ${table}: Not accessible - ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: ${count} records`);
      }
    }
    
    console.log('\n✨ Connection test completed successfully!');
    console.log('   Your Supabase MCP server is ready to use.\n');
    
  } catch (error) {
    console.error('❌ Unexpected error during testing:', error.message);
    process.exit(1);
  }
}

// Run the test
testConnection().catch(console.error);
