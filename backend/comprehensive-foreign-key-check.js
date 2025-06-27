const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function comprehensiveForeignKeyCheck() {
  console.log('🔍 COMPREHENSIVE FOREIGN KEY AND RELATIONSHIP CHECK');
  console.log('='.repeat(60));

  // Define comprehensive foreign key relationships
  const foreignKeyTests = [
    // Core relationships
    {
      name: 'appointments → doctors',
      table: 'appointments',
      query: `
        appointment_id,
        doctors!appointments_doctor_id_fkey (
          doctor_id,
          full_name
        )
      `,
      priority: 'HIGH'
    },
    {
      name: 'appointments → patients',
      table: 'appointments',
      query: `
        appointment_id,
        patients!appointments_patient_id_fkey (
          patient_id,
          full_name
        )
      `,
      priority: 'HIGH'
    },
    {
      name: 'appointments → departments',
      table: 'appointments',
      query: `
        appointment_id,
        departments!appointments_department_id_fkey (
          department_id,
          name
        )
      `,
      priority: 'HIGH'
    },
    {
      name: 'appointments → rooms',
      table: 'appointments',
      query: `
        appointment_id,
        rooms!appointments_room_id_fkey (
          room_id,
          room_number
        )
      `,
      priority: 'MEDIUM'
    },

    // Doctor relationships
    {
      name: 'doctors → profiles',
      table: 'doctors',
      query: `
        doctor_id,
        profiles!doctors_profile_id_fkey (
          id,
          full_name
        )
      `,
      priority: 'HIGH'
    },
    {
      name: 'doctors → departments',
      table: 'doctors',
      query: `
        doctor_id,
        departments!doctors_department_id_fkey (
          department_id,
          name
        )
      `,
      priority: 'HIGH'
    },
    {
      name: 'doctors → specialties',
      table: 'doctors',
      query: `
        doctor_id,
        specialties!doctors_specialty_id_fkey (
          specialty_id,
          name
        )
      `,
      priority: 'MEDIUM'
    },

    // Doctor sub-tables
    {
      name: 'doctor_reviews → doctors',
      table: 'doctor_reviews',
      query: `
        review_id,
        doctors!doctor_reviews_doctor_id_fkey (
          doctor_id,
          full_name
        )
      `,
      priority: 'MEDIUM'
    },
    {
      name: 'doctor_reviews → patients',
      table: 'doctor_reviews',
      query: `
        review_id,
        patients!doctor_reviews_patient_id_fkey (
          patient_id,
          full_name
        )
      `,
      priority: 'MEDIUM'
    },
    {
      name: 'doctor_work_schedules → doctors',
      table: 'doctor_work_schedules',
      query: `
        schedule_id,
        doctors!doctor_work_schedules_doctor_id_fkey (
          doctor_id,
          full_name
        )
      `,
      priority: 'MEDIUM'
    },
    {
      name: 'doctor_work_experiences → doctors',
      table: 'doctor_work_experiences',
      query: `
        experience_id,
        doctors!doctor_work_experiences_doctor_id_fkey (
          doctor_id,
          full_name
        )
      `,
      priority: 'LOW'
    },
    {
      name: 'doctor_emergency_contacts → doctors',
      table: 'doctor_emergency_contacts',
      query: `
        contact_id,
        doctors!doctor_emergency_contacts_doctor_id_fkey (
          doctor_id,
          full_name
        )
      `,
      priority: 'LOW'
    },
    {
      name: 'doctor_settings → doctors',
      table: 'doctor_settings',
      query: `
        setting_id,
        doctors!doctor_settings_doctor_id_fkey (
          doctor_id,
          full_name
        )
      `,
      priority: 'LOW'
    },

    // Patient relationships
    {
      name: 'patients → profiles',
      table: 'patients',
      query: `
        patient_id,
        profiles!patients_profile_id_fkey (
          id,
          full_name
        )
      `,
      priority: 'HIGH'
    },

    // Medical records
    {
      name: 'medical_records → patients',
      table: 'medical_records',
      query: `
        record_id,
        patients!medical_records_patient_id_fkey (
          patient_id,
          full_name
        )
      `,
      priority: 'HIGH'
    },
    {
      name: 'medical_records → doctors',
      table: 'medical_records',
      query: `
        record_id,
        doctors!medical_records_doctor_id_fkey (
          doctor_id,
          full_name
        )
      `,
      priority: 'HIGH'
    },
    {
      name: 'medical_records → appointments',
      table: 'medical_records',
      query: `
        record_id,
        appointments!medical_records_appointment_id_fkey (
          appointment_id
        )
      `,
      priority: 'MEDIUM'
    },

    // Prescriptions
    {
      name: 'prescriptions → patients',
      table: 'prescriptions',
      query: `
        prescription_id,
        patients!prescriptions_patient_id_fkey (
          patient_id,
          full_name
        )
      `,
      priority: 'MEDIUM'
    },
    {
      name: 'prescriptions → doctors',
      table: 'prescriptions',
      query: `
        prescription_id,
        doctors!prescriptions_doctor_id_fkey (
          doctor_id,
          full_name
        )
      `,
      priority: 'MEDIUM'
    },
    {
      name: 'prescriptions → medications',
      table: 'prescriptions',
      query: `
        prescription_id,
        medications!prescriptions_medication_id_fkey (
          medication_id,
          name
        )
      `,
      priority: 'MEDIUM'
    },

    // Lab results
    {
      name: 'lab_results → patients',
      table: 'lab_results',
      query: `
        result_id,
        patients!lab_results_patient_id_fkey (
          patient_id,
          full_name
        )
      `,
      priority: 'MEDIUM'
    },
    {
      name: 'lab_results → doctors',
      table: 'lab_results',
      query: `
        result_id,
        doctors!lab_results_doctor_id_fkey (
          doctor_id,
          full_name
        )
      `,
      priority: 'MEDIUM'
    },

    // Vital signs
    {
      name: 'vital_signs_history → patients',
      table: 'vital_signs_history',
      query: `
        vital_sign_id,
        patients!vital_signs_history_patient_id_fkey (
          patient_id,
          full_name
        )
      `,
      priority: 'MEDIUM'
    },

    // Billing
    {
      name: 'billing → patients',
      table: 'billing',
      query: `
        billing_id,
        patients!billing_patient_id_fkey (
          patient_id,
          full_name
        )
      `,
      priority: 'MEDIUM'
    },
    {
      name: 'billing → appointments',
      table: 'billing',
      query: `
        billing_id,
        appointments!billing_appointment_id_fkey (
          appointment_id
        )
      `,
      priority: 'MEDIUM'
    },

    // Rooms and departments
    {
      name: 'rooms → departments',
      table: 'rooms',
      query: `
        room_id,
        departments!rooms_department_id_fkey (
          department_id,
          name
        )
      `,
      priority: 'MEDIUM'
    },

    // Insurance
    {
      name: 'insurance → patients',
      table: 'insurance',
      query: `
        insurance_id,
        patients!insurance_patient_id_fkey (
          patient_id,
          full_name
        )
      `,
      priority: 'LOW'
    },

    // Notifications
    {
      name: 'notifications → profiles',
      table: 'notifications',
      query: `
        notification_id,
        profiles!notifications_user_id_fkey (
          id,
          full_name
        )
      `,
      priority: 'LOW'
    }
  ];

  console.log('\n🔗 TESTING FOREIGN KEY RELATIONSHIPS:');
  console.log('-'.repeat(50));

  const results = {
    working: [],
    missing: {
      HIGH: [],
      MEDIUM: [],
      LOW: []
    }
  };

  for (const test of foreignKeyTests) {
    console.log(`\n📋 Testing: ${test.name} (${test.priority})`);
    
    try {
      const result = await supabase
        .from(test.table)
        .select(test.query)
        .limit(1);

      if (result.error) {
        console.log(`   ❌ Failed: ${result.error.message}`);
        results.missing[test.priority].push({
          name: test.name,
          table: test.table,
          error: result.error.message
        });
      } else {
        console.log('   ✅ Success!');
        results.working.push(test.name);
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
      results.missing[test.priority].push({
        name: test.name,
        table: test.table,
        error: err.message
      });
    }
  }

  // Summary
  console.log('\n📊 RELATIONSHIP CHECK SUMMARY:');
  console.log('='.repeat(40));
  console.log(`✅ Working relationships: ${results.working.length}`);
  console.log(`❌ Missing relationships: ${results.missing.HIGH.length + results.missing.MEDIUM.length + results.missing.LOW.length}`);

  console.log(`\n🔴 Missing HIGH priority relationships: ${results.missing.HIGH.length}`);
  results.missing.HIGH.forEach(rel => {
    console.log(`   - ${rel.name}`);
  });

  console.log(`\n🟡 Missing MEDIUM priority relationships: ${results.missing.MEDIUM.length}`);
  results.missing.MEDIUM.forEach(rel => {
    console.log(`   - ${rel.name}`);
  });

  console.log(`\n🟢 Missing LOW priority relationships: ${results.missing.LOW.length}`);
  results.missing.LOW.forEach(rel => {
    console.log(`   - ${rel.name}`);
  });

  // Generate SQL for missing foreign keys
  if (results.missing.HIGH.length > 0 || results.missing.MEDIUM.length > 0) {
    console.log('\n🔧 RECOMMENDED SQL COMMANDS:');
    console.log('='.repeat(40));
    console.log('-- Execute these commands in Supabase SQL Editor:');

    const allMissing = [...results.missing.HIGH, ...results.missing.MEDIUM, ...results.missing.LOW];
    const sqlCommands = [];

    allMissing.forEach(rel => {
      // Generate foreign key SQL based on relationship name
      const relName = rel.name;
      if (relName.includes('appointments → doctors') && !relName.includes('department') && !relName.includes('room')) {
        sqlCommands.push(`
-- ${relName}
ALTER TABLE appointments
ADD CONSTRAINT appointments_doctor_id_fkey
FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id);`);
      } else if (relName.includes('appointments → patients')) {
        sqlCommands.push(`
-- ${relName}
ALTER TABLE appointments
ADD CONSTRAINT appointments_patient_id_fkey
FOREIGN KEY (patient_id) REFERENCES patients(patient_id);`);
      } else if (relName.includes('appointments → departments')) {
        sqlCommands.push(`
-- ${relName}
ALTER TABLE appointments
ADD CONSTRAINT appointments_department_id_fkey
FOREIGN KEY (department_id) REFERENCES departments(department_id);`);
      } else if (relName.includes('appointments → rooms')) {
        sqlCommands.push(`
-- ${relName}
ALTER TABLE appointments
ADD CONSTRAINT appointments_room_id_fkey
FOREIGN KEY (room_id) REFERENCES rooms(room_id);`);
      } else if (relName.includes('doctors → profiles')) {
        sqlCommands.push(`
-- ${relName}
ALTER TABLE doctors
ADD CONSTRAINT doctors_profile_id_fkey
FOREIGN KEY (profile_id) REFERENCES profiles(id);`);
      } else if (relName.includes('doctors → departments')) {
        sqlCommands.push(`
-- ${relName}
ALTER TABLE doctors
ADD CONSTRAINT doctors_department_id_fkey
FOREIGN KEY (department_id) REFERENCES departments(department_id);`);
      } else if (relName.includes('doctors → specialties')) {
        sqlCommands.push(`
-- ${relName}
ALTER TABLE doctors
ADD CONSTRAINT doctors_specialty_id_fkey
FOREIGN KEY (specialty_id) REFERENCES specialties(specialty_id);`);
      } else if (relName.includes('doctor_reviews → doctors')) {
        sqlCommands.push(`
-- ${relName}
ALTER TABLE doctor_reviews
ADD CONSTRAINT doctor_reviews_doctor_id_fkey
FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id);`);
      } else if (relName.includes('doctor_reviews → patients')) {
        sqlCommands.push(`
-- ${relName}
ALTER TABLE doctor_reviews
ADD CONSTRAINT doctor_reviews_patient_id_fkey
FOREIGN KEY (patient_id) REFERENCES patients(patient_id);`);
      } else if (relName.includes('medical_records → patients')) {
        sqlCommands.push(`
-- ${relName}
ALTER TABLE medical_records
ADD CONSTRAINT medical_records_patient_id_fkey
FOREIGN KEY (patient_id) REFERENCES patients(patient_id);`);
      } else if (relName.includes('medical_records → doctors')) {
        sqlCommands.push(`
-- ${relName}
ALTER TABLE medical_records
ADD CONSTRAINT medical_records_doctor_id_fkey
FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id);`);
      } else if (relName.includes('prescriptions → patients')) {
        sqlCommands.push(`
-- ${relName}
ALTER TABLE prescriptions
ADD CONSTRAINT prescriptions_patient_id_fkey
FOREIGN KEY (patient_id) REFERENCES patients(patient_id);`);
      } else if (relName.includes('prescriptions → doctors')) {
        sqlCommands.push(`
-- ${relName}
ALTER TABLE prescriptions
ADD CONSTRAINT prescriptions_doctor_id_fkey
FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id);`);
      } else if (relName.includes('rooms → departments')) {
        sqlCommands.push(`
-- ${relName}
ALTER TABLE rooms
ADD CONSTRAINT rooms_department_id_fkey
FOREIGN KEY (department_id) REFERENCES departments(department_id);`);
      }
      // Add more as needed...
    });

    // Remove duplicates
    const uniqueCommands = [...new Set(sqlCommands)];
    
    if (uniqueCommands.length > 0) {
      console.log(uniqueCommands.join('\n'));
      
      // Save to file
      const fs = require('fs');
      const filePath = './missing-foreign-keys.sql';
      fs.writeFileSync(filePath, uniqueCommands.join('\n'));
      console.log(`\n💾 SQL commands saved to: ${filePath}`);
    }
  }

  // Overall assessment
  console.log('\n🎯 OVERALL ASSESSMENT:');
  console.log('='.repeat(30));
  
  const totalTests = foreignKeyTests.length;
  const workingCount = results.working.length;
  const completionRate = Math.round((workingCount / totalTests) * 100);
  
  console.log(`📊 Foreign key completion: ${completionRate}% (${workingCount}/${totalTests})`);
  
  if (results.missing.HIGH.length === 0) {
    console.log('✅ All critical foreign keys are in place');
  } else {
    console.log(`❌ Missing ${results.missing.HIGH.length} critical foreign keys`);
  }
  
  if (completionRate >= 90) {
    console.log('🎉 Excellent! Your database relationships are well-structured');
  } else if (completionRate >= 70) {
    console.log('👍 Good progress, but some foreign keys need attention');
  } else {
    console.log('⚠️  Many foreign key relationships need to be established');
  }
}

comprehensiveForeignKeyCheck().catch(console.error);
