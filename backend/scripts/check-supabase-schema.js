const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableSchema(tableName) {
  console.log(`\n📋 CHECKING TABLE: ${tableName.toUpperCase()}`);
  console.log('='.repeat(50));

  try {
    // Try to get a sample record to see columns
    const { data: sampleData, error: sampleError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (sampleError) {
      console.log(`❌ Table ${tableName} not accessible:`, sampleError.message);
      return;
    }

    // Get row count
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    const rowCount = countError ? 'unknown' : count;
    console.log(`📈 Row count: ${rowCount}`);

    if (sampleData && sampleData.length > 0) {
      console.log(`📊 Columns found in ${tableName}:`);
      Object.keys(sampleData[0]).forEach((col, index) => {
        const value = sampleData[0][col];
        const type = value === null ? 'null' : typeof value;
        console.log(`   ${index + 1}. ${col} (${type})`);
      });

      console.log(`\n📄 Sample data:`);
      console.log(JSON.stringify(sampleData[0], null, 2));
    } else {
      console.log(`📊 Table ${tableName} exists but is empty`);

      // Try to get table structure by attempting an insert with minimal data
      console.log('   Attempting to determine required columns...');
      try {
        const { error: insertError } = await supabase
          .from(tableName)
          .insert({})
          .select();

        if (insertError) {
          console.log(`   Required columns info: ${insertError.message}`);
        }
      } catch (e) {
        console.log(`   Could not determine structure: ${e.message}`);
      }
    }

  } catch (error) {
    console.log(`❌ Error checking ${tableName}:`, error.message);
  }
}

async function checkAllTables() {
  console.log('🔍 SUPABASE DATABASE SCHEMA CHECKER');
  console.log('='.repeat(60));

  const tables = [
    'profiles',
    'departments', 
    'specialties',
    'doctors',
    'patients',
    'appointments',
    'doctor_reviews',
    'medical_records',
    'rooms'
  ];

  for (const table of tables) {
    await checkTableSchema(table);
  }

  console.log('\n✅ SCHEMA CHECK COMPLETED');
  console.log('='.repeat(50));
}

async function main() {
  await checkAllTables();
}

main().catch(console.error);
