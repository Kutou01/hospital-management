const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '../../frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixForeignKeys() {
  try {
    console.log('🔧 Fixing foreign key constraints...\n');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync('./fix-foreign-keys.sql', 'utf8');
    
    console.log('📋 Executing foreign key fix...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlContent
    });
    
    if (error) {
      console.error('❌ Error fixing foreign keys:', error.message);
      console.error('Error details:', error);
      return;
    }
    
    console.log('✅ Foreign key constraints fixed successfully!');
    
    if (data && data.length > 0) {
      console.log('📋 Verification results:');
      console.table(data);
    }
    
    // Test the query again
    console.log('\n🧪 Testing the appointments query...');
    
    const { data: testData, error: testError } = await supabase
      .from('appointments')
      .select(`
        appointment_id,
        patient_id,
        doctor_id,
        appointment_datetime,
        status,
        doctors!appointments_doctor_id_fkey (
          doctor_id,
          full_name,
          specialization
        ),
        patients!appointments_patient_id_fkey (
          patient_id,
          full_name
        )
      `)
      .limit(1);
    
    if (testError) {
      console.log('❌ Test query still failed:', testError.message);
    } else {
      console.log('✅ Test query succeeded!');
      console.log('Result:', testData);
    }
    
  } catch (error) {
    console.error('❌ Exception:', error.message);
  }
}

fixForeignKeys();
