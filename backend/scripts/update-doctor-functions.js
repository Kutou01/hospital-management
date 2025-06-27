const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateDoctorFunctions() {
  console.log('🔧 UPDATING DOCTOR DATABASE FUNCTIONS');
  console.log('='.repeat(50));

  try {
    // Read SQL file
    const sqlFile = path.join(__dirname, 'create-doctor-functions.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    console.log('📄 Updating SQL functions...');
    
    // Split functions and execute one by one
    const functionBlocks = sqlContent.split('CREATE OR REPLACE FUNCTION').filter(f => f.trim());
    
    for (let i = 1; i < functionBlocks.length; i++) {
      const functionSQL = 'CREATE OR REPLACE FUNCTION' + functionBlocks[i];
      const functionName = functionSQL.match(/FUNCTION\s+(\w+)/)?.[1] || `function_${i}`;
      
      console.log(`   Updating ${functionName}...`);
      
      try {
        // Execute directly with SQL query
        const { data, error } = await supabase
          .from('_temp_sql_execution')
          .select('1')
          .limit(0);
        
        // Use raw SQL execution
        const { error: sqlError } = await supabase.rpc('exec_sql', {
          sql: functionSQL
        });
        
        if (sqlError) {
          console.log(`   ❌ Error in ${functionName}:`, sqlError.message);
        } else {
          console.log(`   ✅ ${functionName} updated successfully`);
        }
      } catch (err) {
        console.log(`   ❌ Exception in ${functionName}:`, err.message);
      }
    }

    // Test the main function
    console.log('\n🧪 Testing updated function...');
    
    const { data: testData, error: testError } = await supabase
      .rpc('get_doctor_by_profile_id', { 
        input_profile_id: '5bdcbd80-f344-40b7-a46b-3760ca487693' 
      });

    if (testError) {
      console.log('   ❌ Test failed:', testError.message);
    } else {
      console.log('   ✅ Test successful!');
      console.log('   Doctor found:', testData?.[0]?.full_name || 'No data');
      console.log('   Doctor ID:', testData?.[0]?.doctor_id || 'No ID');
    }

    console.log('\n🎉 Doctor functions update completed!');

  } catch (error) {
    console.error('❌ Error updating doctor functions:', error.message);
  }
}

async function main() {
  await updateDoctorFunctions();
}

main().catch(console.error);
