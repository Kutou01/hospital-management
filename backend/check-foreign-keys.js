const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkExistingForeignKeys() {
  console.log('🔍 CHECKING FOREIGN KEY CONSTRAINTS BY TESTING RELATIONSHIPS');
  console.log('='.repeat(60));

  try {
    // Instead of querying information_schema, test relationships directly
    console.log('🧪 Testing relationship queries to check if foreign keys exist...');

    // Test different relationship queries to see which ones work
    const relationshipTests = [
      {
        name: 'appointments → doctors (appointments_doctor_id_fkey)',
        query: `
          appointment_id,
          doctors!appointments_doctor_id_fkey (
            doctor_id,
            full_name
          )
        `
      },
      {
        name: 'appointments → patients (appointments_patient_id_fkey)',
        query: `
          appointment_id,
          patients!appointments_patient_id_fkey (
            patient_id
          )
        `
      },
      {
        name: 'doctors → profiles (doctors_profile_id_fkey)',
        query: `
          doctor_id,
          profile:profiles!doctors_profile_id_fkey (
            full_name
          )
        `
      },
      {
        name: 'patients → profiles (patients_profile_id_fkey)',
        query: `
          patient_id,
          profile:profiles!patients_profile_id_fkey (
            full_name
          )
        `
      }
    ];

    console.log('\n🔗 Testing Relationship Queries:');
    const workingRelationships = [];
    const failingRelationships = [];

    for (const test of relationshipTests) {
      console.log(`\n📋 Testing: ${test.name}`);
      try {
        let result;
        if (test.name.includes('appointments')) {
          result = await supabase
            .from('appointments')
            .select(test.query)
            .limit(1);
        } else if (test.name.includes('doctors')) {
          result = await supabase
            .from('doctors')
            .select(test.query)
            .limit(1);
        } else if (test.name.includes('patients')) {
          result = await supabase
            .from('patients')
            .select(test.query)
            .limit(1);
        }

        if (result.error) {
          console.log(`   ❌ Failed: ${result.error.message}`);
          failingRelationships.push(test.name);
        } else {
          console.log('   ✅ Success!');
          workingRelationships.push(test.name);
        }
      } catch (err) {
        console.log(`   ❌ Exception: ${err.message}`);
        failingRelationships.push(test.name);
      }
    }

    console.log('\n📊 SUMMARY:');
    console.log('='.repeat(30));
    console.log(`✅ Working relationships: ${workingRelationships.length}`);
    console.log(`❌ Failing relationships: ${failingRelationships.length}`);

    if (failingRelationships.length > 0) {
      console.log('\n🔧 FOREIGN KEYS NEEDED:');
      console.log('='.repeat(40));

      const sqlCommands = [];

      if (failingRelationships.some(r => r.includes('appointments_doctor_id_fkey'))) {
        sqlCommands.push(`
-- Add appointments → doctors foreign key
ALTER TABLE appointments
ADD CONSTRAINT appointments_doctor_id_fkey
FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id);`);
      }

      if (failingRelationships.some(r => r.includes('appointments_patient_id_fkey'))) {
        sqlCommands.push(`
-- Add appointments → patients foreign key
ALTER TABLE appointments
ADD CONSTRAINT appointments_patient_id_fkey
FOREIGN KEY (patient_id) REFERENCES patients(patient_id);`);
      }

      if (failingRelationships.some(r => r.includes('doctors_profile_id_fkey'))) {
        sqlCommands.push(`
-- Add doctors → profiles foreign key
ALTER TABLE doctors
ADD CONSTRAINT doctors_profile_id_fkey
FOREIGN KEY (profile_id) REFERENCES profiles(id);`);
      }

      if (failingRelationships.some(r => r.includes('patients_profile_id_fkey'))) {
        sqlCommands.push(`
-- Add patients → profiles foreign key
ALTER TABLE patients
ADD CONSTRAINT patients_profile_id_fkey
FOREIGN KEY (profile_id) REFERENCES profiles(id);`);
      }

      if (sqlCommands.length > 0) {
        console.log('📝 Execute these SQL commands in Supabase SQL Editor:');
        console.log(sqlCommands.join('\n'));
      }
    } else {
      console.log('\n🎉 All foreign key relationships are working!');
    }

    // Test relationship queries
    console.log('\n🧪 TESTING RELATIONSHIP QUERIES:');
    console.log('='.repeat(40));

    // Test appointments with doctors relationship
    console.log('📅 Testing appointments → doctors relationship...');
    try {
      const { data: testData1, error: testError1 } = await supabase
        .from('appointments')
        .select(`
          appointment_id,
          doctors!appointments_doctor_id_fkey (
            doctor_id,
            full_name
          )
        `)
        .limit(1);

      if (testError1) {
        console.log(`   ❌ Failed: ${testError1.message}`);
      } else {
        console.log('   ✅ Success!');
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
    }

    // Test appointments with patients relationship
    console.log('🤒 Testing appointments → patients relationship...');
    try {
      const { data: testData2, error: testError2 } = await supabase
        .from('appointments')
        .select(`
          appointment_id,
          patients!appointments_patient_id_fkey (
            patient_id
          )
        `)
        .limit(1);

      if (testError2) {
        console.log(`   ❌ Failed: ${testError2.message}`);
      } else {
        console.log('   ✅ Success!');
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
    }

  } catch (error) {
    console.error('❌ Error during check:', error.message);
  }
}

checkExistingForeignKeys().catch(console.error);
