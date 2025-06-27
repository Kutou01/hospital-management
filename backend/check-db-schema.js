const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseSchema() {
  console.log('🔍 CHECKING DATABASE SCHEMA');
  console.log('='.repeat(50));

  try {
    // Test different foreign key relationship syntaxes
    console.log('🧪 Testing different relationship syntaxes...');
    
    const testQueries = [
      {
        name: 'Current syntax (doctor_id)',
        query: `
          *,
          doctors!doctor_id (
            doctor_id,
            full_name,
            specialty
          )
        `
      },
      {
        name: 'Foreign key syntax (appointments_doctor_id_fkey)',
        query: `
          *,
          doctors!appointments_doctor_id_fkey (
            doctor_id,
            full_name,
            specialty
          )
        `
      },
      {
        name: 'Simple join syntax',
        query: `
          *,
          doctors (
            doctor_id,
            full_name,
            specialty
          )
        `
      }
    ];

    for (const test of testQueries) {
      console.log(`\n📋 Testing: ${test.name}`);
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select(test.query)
          .limit(1);

        if (error) {
          console.log(`   ❌ Error: ${error.message}`);
        } else {
          console.log(`   ✅ Success! Found ${data.length} records`);
          if (data.length > 0) {
            console.log(`   📄 Sample data:`, JSON.stringify(data[0], null, 2));
          }
        }
      } catch (err) {
        console.log(`   ❌ Exception: ${err.message}`);
      }
    }

    // Check table structure
    console.log('\n🏗️ Checking table structures...');
    
    // Check appointments table
    console.log('\n📅 Appointments table sample:');
    const { data: appointments, error: appointmentError } = await supabase
      .from('appointments')
      .select('*')
      .limit(1);
    
    if (appointmentError) {
      console.log('   ❌ Error:', appointmentError.message);
    } else if (appointments.length > 0) {
      console.log('   ✅ Sample appointment:');
      console.log('   ', JSON.stringify(appointments[0], null, 2));
    } else {
      console.log('   📋 No appointments found');
    }

    // Check doctors table
    console.log('\n👨‍⚕️ Doctors table sample:');
    const { data: doctors, error: doctorError } = await supabase
      .from('doctors')
      .select('*')
      .limit(1);
    
    if (doctorError) {
      console.log('   ❌ Error:', doctorError.message);
    } else if (doctors.length > 0) {
      console.log('   ✅ Sample doctor:');
      console.log('   ', JSON.stringify(doctors[0], null, 2));
    } else {
      console.log('   📋 No doctors found');
    }

  } catch (error) {
    console.error('❌ Error during schema check:', error.message);
  }
}

checkDatabaseSchema().catch(console.error);
