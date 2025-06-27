const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkExistingColumns() {
  console.log('🔍 CHECKING EXISTING TABLE COLUMNS');
  console.log('='.repeat(50));

  const tablesToCheck = [
    'appointments',
    'doctors', 
    'medical_records',
    'doctor_reviews',
    'lab_results'
  ];

  for (const tableName of tablesToCheck) {
    console.log(`\n📋 ${tableName.toUpperCase()} TABLE:`);
    console.log('-'.repeat(30));
    
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ Error: ${error.message}`);
        continue;
      }

      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log('Columns:', columns.join(', '));
        
        // Check specific columns we're interested in
        const columnsToCheck = ['department_id', 'specialty_id', 'doctor_id', 'patient_id'];
        columnsToCheck.forEach(col => {
          if (columns.includes(col)) {
            console.log(`✅ ${col}: EXISTS`);
          } else {
            console.log(`❌ ${col}: MISSING`);
          }
        });
      } else {
        console.log('⚠️  Table exists but is empty - checking with describe');
        
        // Try to get table structure even if empty
        const { data: describeData, error: describeError } = await supabase
          .from(tableName)
          .select('*')
          .limit(0);
          
        if (!describeError) {
          console.log('Table structure accessible (empty table)');
        }
      }
    } catch (err) {
      console.log(`❌ Exception: ${err.message}`);
    }
  }

  // Let's also check a sample record from each table to see actual data
  console.log('\n📊 SAMPLE DATA CHECK:');
  console.log('='.repeat(50));

  for (const tableName of tablesToCheck) {
    console.log(`\n${tableName}:`);
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${error.message}`);
      } else if (data && data.length > 0) {
        console.log('Sample record keys:', Object.keys(data[0]));
        // Show first record structure without sensitive data
        const sample = {};
        Object.keys(data[0]).forEach(key => {
          const value = data[0][key];
          if (typeof value === 'string' && value.length > 50) {
            sample[key] = `${value.substring(0, 20)}...`;
          } else {
            sample[key] = value;
          }
        });
        console.log('Sample values:', JSON.stringify(sample, null, 2));
      } else {
        console.log('Empty table');
      }
    } catch (err) {
      console.log(`❌ ${err.message}`);
    }
  }
}

checkExistingColumns().catch(console.error);
