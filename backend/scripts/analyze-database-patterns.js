#!/usr/bin/env node

/**
 * Analyze Database Patterns Script
 * Examines existing data to understand ID patterns and constraints
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeDatabasePatterns() {
  console.log('🔍 Analyzing Database Patterns and Constraints');
  console.log('==============================================\n');

  try {
    await analyzeDepartments();
    await analyzeDoctors();
    await analyzePatients();
    await analyzeAppointments();
    await analyzeMedicalRecords();
    await analyzeDoctorSchedules();
    await analyzeDoctorReviews();
    await analyzeColumnConstraints();

  } catch (error) {
    console.error('❌ Error analyzing database patterns:', error);
  }
}

async function analyzeDepartments() {
  console.log('🏥 DEPARTMENTS ANALYSIS');
  console.log('=======================');
  
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('department_id')
    .limit(5);

  if (error) {
    console.log(`❌ Error: ${error.message}`);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️ No departments found');
    return;
  }

  console.log('📋 Sample Department Records:');
  data.forEach((dept, index) => {
    console.log(`  ${index + 1}. ID: ${dept.department_id}`);
    console.log(`     Name: ${dept.department_name}`);
    console.log(`     Code: ${dept.department_code}`);
    console.log(`     Active: ${dept.is_active}`);
    console.log('');
  });

  console.log('🔍 Department ID Pattern Analysis:');
  const idPattern = data[0]?.department_id;
  console.log(`   Sample ID: ${idPattern}`);
  console.log(`   Length: ${idPattern?.length} characters`);
  console.log(`   Pattern: ${getPattern(idPattern)}`);
}

async function analyzeDoctors() {
  console.log('\n👨‍⚕️ DOCTORS ANALYSIS');
  console.log('======================');
  
  const { data, error } = await supabase
    .from('doctors')
    .select('doctor_id, department_id, license_number')
    .order('doctor_id')
    .limit(5);

  if (error) {
    console.log(`❌ Error: ${error.message}`);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️ No doctors found');
    return;
  }

  console.log('📋 Sample Doctor Records:');
  data.forEach((doctor, index) => {
    console.log(`  ${index + 1}. Doctor ID: ${doctor.doctor_id}`);
    console.log(`     Department: ${doctor.department_id}`);
    console.log(`     License: ${doctor.license_number}`);
    console.log('');
  });

  console.log('🔍 Doctor ID Pattern Analysis:');
  const idPattern = data[0]?.doctor_id;
  console.log(`   Sample ID: ${idPattern}`);
  console.log(`   Length: ${idPattern?.length} characters`);
  console.log(`   Pattern: ${getPattern(idPattern)}`);
  
  console.log('🔍 License Number Pattern Analysis:');
  const licensePattern = data[0]?.license_number;
  console.log(`   Sample License: ${licensePattern}`);
  console.log(`   Length: ${licensePattern?.length} characters`);
  console.log(`   Pattern: ${getPattern(licensePattern)}`);
}

async function analyzePatients() {
  console.log('\n👤 PATIENTS ANALYSIS');
  console.log('====================');
  
  const { data, error } = await supabase
    .from('patients')
    .select('patient_id')
    .order('patient_id')
    .limit(5);

  if (error) {
    console.log(`❌ Error: ${error.message}`);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️ No patients found');
    return;
  }

  console.log('📋 Sample Patient Records:');
  data.forEach((patient, index) => {
    console.log(`  ${index + 1}. Patient ID: ${patient.patient_id}`);
  });

  console.log('🔍 Patient ID Pattern Analysis:');
  const idPattern = data[0]?.patient_id;
  console.log(`   Sample ID: ${idPattern}`);
  console.log(`   Length: ${idPattern?.length} characters`);
  console.log(`   Pattern: ${getPattern(idPattern)}`);
}

async function analyzeAppointments() {
  console.log('\n📅 APPOINTMENTS ANALYSIS');
  console.log('========================');
  
  const { data, error } = await supabase
    .from('appointments')
    .select('appointment_id')
    .order('appointment_id')
    .limit(5);

  if (error) {
    console.log(`❌ Error: ${error.message}`);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️ No appointments found');
    return;
  }

  console.log('📋 Sample Appointment Records:');
  data.forEach((appointment, index) => {
    console.log(`  ${index + 1}. Appointment ID: ${appointment.appointment_id}`);
  });

  console.log('🔍 Appointment ID Pattern Analysis:');
  const idPattern = data[0]?.appointment_id;
  console.log(`   Sample ID: ${idPattern}`);
  console.log(`   Length: ${idPattern?.length} characters`);
  console.log(`   Pattern: ${getPattern(idPattern)}`);
}

async function analyzeMedicalRecords() {
  console.log('\n📋 MEDICAL RECORDS ANALYSIS');
  console.log('============================');
  
  const { data, error } = await supabase
    .from('medical_records')
    .select('record_id')
    .order('record_id')
    .limit(5);

  if (error) {
    console.log(`❌ Error: ${error.message}`);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️ No medical records found');
    return;
  }

  console.log('📋 Sample Medical Record Records:');
  data.forEach((record, index) => {
    console.log(`  ${index + 1}. Record ID: ${record.record_id}`);
  });

  console.log('🔍 Medical Record ID Pattern Analysis:');
  const idPattern = data[0]?.record_id;
  console.log(`   Sample ID: ${idPattern}`);
  console.log(`   Length: ${idPattern?.length} characters`);
  console.log(`   Pattern: ${getPattern(idPattern)}`);
}

async function analyzeDoctorSchedules() {
  console.log('\n📅 DOCTOR SCHEDULES ANALYSIS');
  console.log('=============================');
  
  const { data, error } = await supabase
    .from('doctor_schedules')
    .select('schedule_id')
    .order('schedule_id')
    .limit(5);

  if (error) {
    console.log(`❌ Error: ${error.message}`);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️ No doctor schedules found');
    return;
  }

  console.log('📋 Sample Doctor Schedule Records:');
  data.forEach((schedule, index) => {
    console.log(`  ${index + 1}. Schedule ID: ${schedule.schedule_id}`);
  });

  console.log('🔍 Schedule ID Pattern Analysis:');
  const idPattern = data[0]?.schedule_id;
  console.log(`   Sample ID: ${idPattern}`);
  console.log(`   Length: ${idPattern?.length} characters`);
  console.log(`   Pattern: ${getPattern(idPattern)}`);
}

async function analyzeDoctorReviews() {
  console.log('\n⭐ DOCTOR REVIEWS ANALYSIS');
  console.log('==========================');
  
  const { data, error } = await supabase
    .from('doctor_reviews')
    .select('review_id')
    .order('review_id')
    .limit(5);

  if (error) {
    console.log(`❌ Error: ${error.message}`);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️ No doctor reviews found');
    return;
  }

  console.log('📋 Sample Doctor Review Records:');
  data.forEach((review, index) => {
    console.log(`  ${index + 1}. Review ID: ${review.review_id}`);
  });

  console.log('🔍 Review ID Pattern Analysis:');
  const idPattern = data[0]?.review_id;
  console.log(`   Sample ID: ${idPattern}`);
  console.log(`   Length: ${idPattern?.length} characters`);
  console.log(`   Pattern: ${getPattern(idPattern)}`);
}

async function analyzeColumnConstraints() {
  console.log('\n🔧 COLUMN CONSTRAINTS ANALYSIS');
  console.log('===============================');

  const tables = [
    { name: 'doctors', idColumn: 'doctor_id' },
    { name: 'patients', idColumn: 'patient_id' },
    { name: 'appointments', idColumn: 'appointment_id' },
    { name: 'medical_records', idColumn: 'record_id' },
    { name: 'doctor_schedules', idColumn: 'schedule_id' },
    { name: 'doctor_reviews', idColumn: 'review_id' }
  ];

  for (const table of tables) {
    try {
      // Test with a long ID to see constraint
      const longId = 'TEST-VERY-LONG-ID-THAT-MIGHT-EXCEED-LIMITS-123456789';
      
      const { error } = await supabase
        .from(table.name)
        .insert({ [table.idColumn]: longId })
        .select();

      if (error) {
        if (error.message.includes('value too long')) {
          const match = error.message.match(/character varying\((\d+)\)/);
          const maxLength = match ? match[1] : 'unknown';
          console.log(`📏 ${table.name}.${table.idColumn}: max ${maxLength} characters`);
        } else if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
          console.log(`🔑 ${table.name}.${table.idColumn}: unique constraint exists`);
        } else {
          console.log(`⚠️ ${table.name}.${table.idColumn}: ${error.message}`);
        }
      } else {
        console.log(`✅ ${table.name}.${table.idColumn}: test insert successful`);
        // Clean up test data
        await supabase.from(table.name).delete().eq(table.idColumn, longId);
      }
    } catch (err) {
      console.log(`❌ ${table.name}.${table.idColumn}: ${err.message}`);
    }
  }
}

function getPattern(str) {
  if (!str) return 'N/A';
  
  // Analyze pattern
  const patterns = [];
  
  if (/^[A-Z]+\d+/.test(str)) {
    patterns.push('LETTERS+NUMBERS');
  }
  
  if (str.includes('-')) {
    patterns.push('HYPHEN_SEPARATED');
    const parts = str.split('-');
    patterns.push(`${parts.length}_PARTS`);
  }
  
  if (/\d{4}/.test(str)) {
    patterns.push('CONTAINS_YEAR');
  }
  
  if (/\d{2}/.test(str)) {
    patterns.push('CONTAINS_MONTH');
  }
  
  return patterns.length > 0 ? patterns.join(', ') : 'CUSTOM';
}

// Run analysis
if (require.main === module) {
  analyzeDatabasePatterns().catch(error => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });
}

module.exports = { analyzeDatabasePatterns };
