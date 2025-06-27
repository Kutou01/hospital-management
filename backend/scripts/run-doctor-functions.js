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

async function runDoctorFunctions() {
  console.log('🔧 CREATING DOCTOR DATABASE FUNCTIONS');
  console.log('='.repeat(50));

  try {
    // Read SQL file
    const sqlFile = path.join(__dirname, 'create-doctor-functions.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    console.log('📄 Running SQL script...');
    
    // Execute SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlContent
    });

    if (error) {
      console.log('❌ Error executing SQL:', error.message);
      
      // Try alternative method - split and execute each function separately
      console.log('🔄 Trying alternative method...');
      
      const functions = sqlContent.split('-- Function to').filter(f => f.trim());
      
      for (let i = 0; i < functions.length; i++) {
        if (i === 0) continue; // Skip first empty part
        
        const functionSQL = '-- Function to' + functions[i];
        console.log(`   Creating function ${i}...`);
        
        try {
          const { error: funcError } = await supabase.rpc('exec_sql', {
            sql_query: functionSQL
          });
          
          if (funcError) {
            console.log(`   ❌ Error in function ${i}:`, funcError.message);
          } else {
            console.log(`   ✅ Function ${i} created successfully`);
          }
        } catch (err) {
          console.log(`   ❌ Exception in function ${i}:`, err.message);
        }
      }
    } else {
      console.log('✅ All functions created successfully');
    }

    // Test the functions
    console.log('\n🧪 Testing functions...');
    
    // Test get_doctor_by_profile_id
    console.log('   Testing get_doctor_by_profile_id...');
    const { data: testData, error: testError } = await supabase
      .rpc('get_doctor_by_profile_id', { 
        input_profile_id: '5bdcbd80-f344-40b7-a46b-3760ca487693' 
      });

    if (testError) {
      console.log('   ❌ Test failed:', testError.message);
    } else {
      console.log('   ✅ Test successful, found doctor:', testData?.[0]?.full_name || 'No data');
    }

    // Test count_doctors
    console.log('   Testing count_doctors...');
    const { data: countData, error: countError } = await supabase
      .rpc('count_doctors');

    if (countError) {
      console.log('   ❌ Count test failed:', countError.message);
    } else {
      console.log('   ✅ Count test successful, total doctors:', countData);
    }

    console.log('\n🎉 Doctor functions setup completed!');

  } catch (error) {
    console.error('❌ Error setting up doctor functions:', error.message);
  }
}

async function main() {
  await runDoctorFunctions();
}

main().catch(console.error);
