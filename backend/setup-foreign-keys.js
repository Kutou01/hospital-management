const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupForeignKeys() {
  console.log('🔗 SETTING UP FOREIGN KEY CONSTRAINTS');
  console.log('='.repeat(50));

  try {
    // SQL commands to add foreign key constraints
    const foreignKeyQueries = [
      {
        name: 'appointments -> doctors',
        sql: `
          ALTER TABLE appointments 
          ADD CONSTRAINT appointments_doctor_id_fkey 
          FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id);
        `
      },
      {
        name: 'appointments -> patients',
        sql: `
          ALTER TABLE appointments 
          ADD CONSTRAINT appointments_patient_id_fkey 
          FOREIGN KEY (patient_id) REFERENCES patients(patient_id);
        `
      },
      {
        name: 'doctors -> profiles',
        sql: `
          ALTER TABLE doctors 
          ADD CONSTRAINT doctors_profile_id_fkey 
          FOREIGN KEY (profile_id) REFERENCES profiles(id);
        `
      },
      {
        name: 'patients -> profiles',
        sql: `
          ALTER TABLE patients 
          ADD CONSTRAINT patients_profile_id_fkey 
          FOREIGN KEY (profile_id) REFERENCES profiles(id);
        `
      }
    ];

    for (const query of foreignKeyQueries) {
      console.log(`\n🔧 Adding foreign key: ${query.name}`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: query.sql
        });

        if (error) {
          // Check if constraint already exists
          if (error.message.includes('already exists')) {
            console.log(`   ✅ Foreign key already exists: ${query.name}`);
          } else {
            console.log(`   ❌ Error: ${error.message}`);
          }
        } else {
          console.log(`   ✅ Successfully added: ${query.name}`);
        }
      } catch (err) {
        console.log(`   ❌ Exception: ${err.message}`);
      }
    }

    // Test the relationships after setting up foreign keys
    console.log('\n🧪 Testing relationships after setup...');
    
    const { data: testData, error: testError } = await supabase
      .from('appointments')
      .select(`
        *,
        doctors!appointments_doctor_id_fkey (
          doctor_id,
          full_name,
          specialty
        ),
        patients!appointments_patient_id_fkey (
          patient_id,
          profile:profiles!patients_profile_id_fkey (
            full_name
          )
        )
      `)
      .limit(1);

    if (testError) {
      console.log('❌ Relationship test failed:', testError.message);
    } else {
      console.log('✅ Relationship test successful!');
      if (testData && testData.length > 0) {
        console.log('   Sample data:', JSON.stringify(testData[0], null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Error setting up foreign keys:', error.message);
  }
}

// Alternative approach using direct SQL execution
async function setupForeignKeysDirectSQL() {
  console.log('\n🔧 ALTERNATIVE: Direct SQL execution');
  console.log('='.repeat(50));

  const sqlCommands = `
    -- Add foreign key constraints if they don't exist
    DO $$ 
    BEGIN
        -- appointments -> doctors
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'appointments_doctor_id_fkey'
        ) THEN
            ALTER TABLE appointments 
            ADD CONSTRAINT appointments_doctor_id_fkey 
            FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id);
        END IF;

        -- appointments -> patients  
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'appointments_patient_id_fkey'
        ) THEN
            ALTER TABLE appointments 
            ADD CONSTRAINT appointments_patient_id_fkey 
            FOREIGN KEY (patient_id) REFERENCES patients(patient_id);
        END IF;

        -- doctors -> profiles
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'doctors_profile_id_fkey'
        ) THEN
            ALTER TABLE doctors 
            ADD CONSTRAINT doctors_profile_id_fkey 
            FOREIGN KEY (profile_id) REFERENCES profiles(id);
        END IF;

        -- patients -> profiles
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'patients_profile_id_fkey'
        ) THEN
            ALTER TABLE patients 
            ADD CONSTRAINT patients_profile_id_fkey 
            FOREIGN KEY (profile_id) REFERENCES profiles(id);
        END IF;
    END $$;
  `;

  console.log('📝 SQL Commands to execute:');
  console.log(sqlCommands);
  console.log('\n💡 Please execute these SQL commands in Supabase SQL Editor');
}

async function main() {
  await setupForeignKeys();
  await setupForeignKeysDirectSQL();
}

main().catch(console.error);
