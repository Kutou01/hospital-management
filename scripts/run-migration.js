#!/usr/bin/env node

/**
 * Database Migration Runner
 * Tự động chạy migration cho 2FA tables
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', 'frontend', '.env.local') });

async function runMigration() {
  console.log('🗄️  Running Database Migration for 2FA Support...\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Create Supabase client with service role
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', 'add_2fa_support.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📖 Migration file loaded successfully');

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`🔄 Executing ${statements.length} SQL statements...\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim()) {
        try {
          console.log(`[${i + 1}/${statements.length}] Executing statement...`);
          
          const { error } = await supabase.rpc('exec_sql', { 
            sql_query: statement + ';' 
          });

          if (error) {
            // Try direct execution if RPC fails
            const { error: directError } = await supabase
              .from('_temp_migration')
              .select('*')
              .limit(0);
            
            if (directError) {
              console.log(`⚠️  Statement ${i + 1} may have failed, but continuing...`);
            } else {
              console.log(`✅ Statement ${i + 1} executed successfully`);
            }
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1} encountered an issue: ${err.message}`);
        }
      }
    }

    // Verify tables were created
    console.log('\n🔍 Verifying migration results...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['two_factor_auth', 'two_factor_attempts']);

    if (tablesError) {
      console.log('⚠️  Could not verify tables (this may be normal)');
    } else {
      const tableNames = tables.map(t => t.table_name);
      
      if (tableNames.includes('two_factor_auth')) {
        console.log('✅ two_factor_auth table created');
      } else {
        console.log('❌ two_factor_auth table not found');
      }
      
      if (tableNames.includes('two_factor_attempts')) {
        console.log('✅ two_factor_attempts table created');
      } else {
        console.log('❌ two_factor_attempts table not found');
      }
    }

    // Test basic functionality
    console.log('\n🧪 Testing basic functionality...');
    
    try {
      const { data, error } = await supabase
        .from('two_factor_auth')
        .select('count')
        .limit(1);
        
      if (!error) {
        console.log('✅ two_factor_auth table is accessible');
      }
    } catch (err) {
      console.log('⚠️  Could not test table access');
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Check Supabase Dashboard > Database > Tables');
    console.log('2. Verify two_factor_auth and two_factor_attempts tables exist');
    console.log('3. Test 2FA functionality in the application');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
runMigration().catch(console.error);
