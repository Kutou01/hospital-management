#!/usr/bin/env node

/**
 * Database Schema Checker
 * Checks Supabase database structure for hospital management system
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseSchema() {
  console.log('🔍 Checking Database Schema...\n');

  try {
    // 1. Check all tables in public schema
    console.log('📋 1. CHECKING ALL TABLES:');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_public_tables');
    
    if (tablesError) {
      // Fallback: try to query information_schema directly
      const { data: tablesData, error: schemaError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      if (schemaError) {
        console.log('⚠️ Cannot access information_schema, checking known tables...');
        await checkKnownTables();
      } else {
        console.log('Tables found:', tablesData?.map(t => t.table_name) || []);
      }
    } else {
      console.log('Tables found:', tables || []);
    }

    // 2. Check profiles table
    console.log('\n📋 2. CHECKING PROFILES TABLE:');
    await checkProfilesTable();

    // 3. Check doctors table
    console.log('\n📋 3. CHECKING DOCTORS TABLE:');
    await checkDoctorsTable();

    // 4. Check patients table
    console.log('\n📋 4. CHECKING PATIENTS TABLE:');
    await checkPatientsTable();

    // 5. Check admins table
    console.log('\n📋 5. CHECKING ADMINS TABLE:');
    await checkAdminsTable();

    // 6. Check user-profile mapping
    console.log('\n📋 6. CHECKING USER-PROFILE MAPPING:');
    await checkUserProfileMapping();

    // 7. Check role distribution
    console.log('\n📋 7. CHECKING ROLE DISTRIBUTION:');
    await checkRoleDistribution();

    // 8. Check recent registrations
    console.log('\n📋 8. CHECKING RECENT REGISTRATIONS:');
    await checkRecentRegistrations();

  } catch (error) {
    console.error('❌ Error checking database schema:', error.message);
  }
}

async function checkKnownTables() {
  const knownTables = ['profiles', 'doctors', 'patients', 'admins', 'departments', 'appointments'];
  
  for (const tableName of knownTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (!error) {
        console.log(`✅ ${tableName} - EXISTS`);
      } else {
        console.log(`❌ ${tableName} - NOT FOUND`);
      }
    } catch (err) {
      console.log(`❌ ${tableName} - ERROR: ${err.message}`);
    }
  }
}

async function checkProfilesTable() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(3);

    if (error) {
      console.log('❌ Profiles table not accessible:', error.message);
      return;
    }

    console.log('✅ Profiles table exists');
    console.log('Sample data:', data);
    
    if (data && data.length > 0) {
      console.log('Columns found:', Object.keys(data[0]));
    }
  } catch (err) {
    console.log('❌ Error checking profiles table:', err.message);
  }
}

async function checkDoctorsTable() {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .limit(3);

    if (error) {
      console.log('❌ Doctors table not accessible:', error.message);
      return;
    }

    console.log('✅ Doctors table exists');
    console.log('Sample data:', data);
    
    if (data && data.length > 0) {
      console.log('Columns found:', Object.keys(data[0]));
    } else {
      console.log('📝 Doctors table is empty');
    }
  } catch (err) {
    console.log('❌ Error checking doctors table:', err.message);
  }
}

async function checkPatientsTable() {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .limit(3);

    if (error) {
      console.log('❌ Patients table not accessible:', error.message);
      return;
    }

    console.log('✅ Patients table exists');
    console.log('Sample data:', data);
    
    if (data && data.length > 0) {
      console.log('Columns found:', Object.keys(data[0]));
    } else {
      console.log('📝 Patients table is empty');
    }
  } catch (err) {
    console.log('❌ Error checking patients table:', err.message);
  }
}

async function checkAdminsTable() {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .limit(3);

    if (error) {
      console.log('❌ Admins table not accessible:', error.message);
      return;
    }

    console.log('✅ Admins table exists');
    console.log('Sample data:', data);
    
    if (data && data.length > 0) {
      console.log('Columns found:', Object.keys(data[0]));
    } else {
      console.log('📝 Admins table is empty');
    }
  } catch (err) {
    console.log('❌ Error checking admins table:', err.message);
  }
}

async function checkUserProfileMapping() {
  try {
    // Get auth users count (might not be accessible)
    console.log('⚠️ Auth users table is typically not accessible via client');
    
    // Check profiles count
    const { count: profilesCount, error: profilesError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (!profilesError) {
      console.log(`📊 Total profiles: ${profilesCount}`);
    }

  } catch (err) {
    console.log('❌ Error checking user-profile mapping:', err.message);
  }
}

async function checkRoleDistribution() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role');

    if (error) {
      console.log('❌ Cannot check role distribution:', error.message);
      return;
    }

    const roleCount = {};
    data.forEach(profile => {
      roleCount[profile.role] = (roleCount[profile.role] || 0) + 1;
    });

    console.log('📊 Role distribution:', roleCount);

  } catch (err) {
    console.log('❌ Error checking role distribution:', err.message);
  }
}

async function checkRecentRegistrations() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.log('❌ Cannot check recent registrations:', error.message);
      return;
    }

    console.log('📊 Recent registrations:');
    data.forEach(profile => {
      console.log(`- ${profile.email} (${profile.role}) - ${profile.created_at}`);
    });

  } catch (err) {
    console.log('❌ Error checking recent registrations:', err.message);
  }
}

// Run the check
if (require.main === module) {
  checkDatabaseSchema()
    .then(() => {
      console.log('\n✅ Database schema check completed');
    })
    .catch((error) => {
      console.error('\n❌ Database schema check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkDatabaseSchema };
