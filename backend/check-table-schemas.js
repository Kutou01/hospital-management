const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableSchemas() {
  console.log('🔍 CHECKING TABLE SCHEMAS FROM INFORMATION SCHEMA');
  console.log('='.repeat(60));

  const tablesToCheck = [
    'appointments',
    'doctors', 
    'medical_records',
    'doctor_reviews',
    'lab_results'
  ];

  for (const tableName of tablesToCheck) {
    console.log(`\n📋 ${tableName.toUpperCase()} TABLE SCHEMA:`);
    console.log('-'.repeat(40));
    
    try {
      // Query information_schema to get column information
      const { data, error } = await supabase
        .rpc('get_table_columns', { table_name: tableName });

      if (error) {
        console.log(`❌ RPC Error: ${error.message}`);
        
        // Try alternative approach with raw SQL if RPC fails
        console.log('Trying alternative method...');
        
        // Try inserting an empty record to see the required columns
        try {
          const { error: insertError } = await supabase
            .from(tableName)
            .insert({})
            .select();
            
          if (insertError) {
            console.log(`Insert test error: ${insertError.message}`);
            if (insertError.message.includes('null value')) {
              // Parse the error message to extract required columns
              const match = insertError.message.match(/column "([^"]+)"/);
              if (match) {
                console.log(`Required column found: ${match[1]}`);
              }
            }
          }
        } catch (insertErr) {
          console.log(`Insert attempt: ${insertErr.message}`);
        }
        
        continue;
      }

      if (data && data.length > 0) {
        console.log('Columns found:');
        data.forEach(col => {
          console.log(`  ${col.column_name} (${col.data_type})`);
        });
        
        // Check for specific columns
        const columnNames = data.map(col => col.column_name);
        const columnsToCheck = ['department_id', 'specialty_id', 'doctor_id', 'patient_id'];
        console.log('\nColumn check:');
        columnsToCheck.forEach(col => {
          if (columnNames.includes(col)) {
            console.log(`✅ ${col}: EXISTS`);
          } else {
            console.log(`❌ ${col}: MISSING`);
          }
        });
      } else {
        console.log('No column information found');
      }
    } catch (err) {
      console.log(`❌ Exception: ${err.message}`);
    }
  }
  
  // Try a direct approach - attempt to select specific columns
  console.log('\n🔍 DIRECT COLUMN CHECK:');
  console.log('='.repeat(40));
  
  for (const tableName of tablesToCheck) {
    console.log(`\n${tableName}:`);
    
    const columnsToTest = ['department_id', 'specialty_id', 'doctor_id', 'patient_id'];
    
    for (const column of columnsToTest) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select(column)
          .limit(1);
          
        if (error) {
          if (error.message.includes('does not exist')) {
            console.log(`❌ ${column}: MISSING`);
          } else {
            console.log(`❓ ${column}: ${error.message}`);
          }
        } else {
          console.log(`✅ ${column}: EXISTS`);
        }
      } catch (err) {
        console.log(`❓ ${column}: ${err.message}`);
      }
    }
  }
}

checkTableSchemas().catch(console.error);
