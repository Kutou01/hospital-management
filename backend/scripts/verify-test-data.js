#!/usr/bin/env node

/**
 * Verify Test Data Script
 * Checks if test data is properly seeded and displays summary
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyTestData() {
  console.log('🔍 Verifying test data...\n');

  try {
    // Check departments
    await checkDepartments();
    
    // Check doctors
    await checkDoctors();
    
    // Check patients
    await checkPatients();
    
    // Check appointments
    await checkAppointments();
    
    // Check medical records
    await checkMedicalRecords();
    
    // Check doctor schedules
    await checkDoctorSchedules();
    
    // Check doctor reviews
    await checkDoctorReviews();
    
    // Display test accounts
    await displayTestAccounts();
    
    console.log('\n🎉 Test data verification completed!');

  } catch (error) {
    console.error('❌ Error verifying test data:', error);
  }
}

async function checkDepartments() {
  console.log('🏥 DEPARTMENTS:');
  console.log('===============');
  
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('dept_id');

  if (error) {
    console.log(`❌ Error: ${error.message}`);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚪ No departments found');
    return;
  }

  console.log(`✅ Found ${data.length} departments:`);
  data.forEach((dept, index) => {
    console.log(`  ${index + 1}. ${dept.dept_id} - ${dept.name}`);
  });
}

async function checkDoctors() {
  console.log('\n👨‍⚕️ DOCTORS:');
  console.log('==============');
  
  const { data, error } = await supabase
    .from('doctors')
    .select(`
      *,
      profile:profiles!doctors_profile_id_fkey (
        full_name,
        email,
        phone_number
      )
    `)
    .order('created_at');

  if (error) {
    console.log(`❌ Error: ${error.message}`);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚪ No doctors found');
    return;
  }

  console.log(`✅ Found ${data.length} doctors:`);
  data.forEach((doctor, index) => {
    console.log(`  ${index + 1}. ${doctor.doctor_id}`);
    console.log(`     Name: ${doctor.profile?.full_name || 'N/A'}`);
    console.log(`     Email: ${doctor.profile?.email || 'N/A'}`);
    console.log(`     Specialty: ${doctor.specialty}`);
    console.log(`     Department: ${doctor.department_id}`);
    console.log(`     Rating: ${doctor.rating}/5 (${doctor.total_reviews} reviews)`);
    console.log('');
  });
}

async function checkPatients() {
  console.log('👤 PATIENTS:');
  console.log('============');
  
  const { data, error } = await supabase
    .from('patients')
    .select(`
      *,
      profile:profiles!patients_profile_id_fkey (
        full_name,
        email,
        phone_number,
        date_of_birth
      )
    `)
    .order('created_at');

  if (error) {
    console.log(`❌ Error: ${error.message}`);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚪ No patients found');
    return;
  }

  console.log(`✅ Found ${data.length} patients:`);
  data.forEach((patient, index) => {
    console.log(`  ${index + 1}. ${patient.patient_id}`);
    console.log(`     Name: ${patient.profile?.full_name || 'N/A'}`);
    console.log(`     Email: ${patient.profile?.email || 'N/A'}`);
    console.log(`     DOB: ${patient.profile?.date_of_birth || 'N/A'}`);
    console.log(`     Gender: ${patient.gender}`);
    console.log(`     Blood Type: ${patient.blood_type || 'N/A'}`);
    console.log(`     Status: ${patient.status}`);
    console.log('');
  });
}

async function checkAppointments() {
  console.log('📅 APPOINTMENTS:');
  console.log('================');
  
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      doctor:doctors!appointments_doctor_id_fkey (
        doctor_id,
        profile:profiles!doctors_profile_id_fkey (full_name)
      ),
      patient:patients!appointments_patient_id_fkey (
        patient_id,
        profile:profiles!patients_profile_id_fkey (full_name)
      )
    `)
    .order('appointment_date');

  if (error) {
    console.log(`❌ Error: ${error.message}`);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚪ No appointments found');
    return;
  }

  console.log(`✅ Found ${data.length} appointments:`);
  data.forEach((appointment, index) => {
    console.log(`  ${index + 1}. ${appointment.appointment_id}`);
    console.log(`     Doctor: ${appointment.doctor?.profile?.full_name || 'N/A'}`);
    console.log(`     Patient: ${appointment.patient?.profile?.full_name || 'N/A'}`);
    console.log(`     Date: ${appointment.appointment_date}`);
    console.log(`     Time: ${appointment.appointment_time}`);
    console.log(`     Status: ${appointment.status}`);
    console.log(`     Type: ${appointment.appointment_type}`);
    console.log('');
  });
}

async function checkMedicalRecords() {
  console.log('📋 MEDICAL RECORDS:');
  console.log('===================');
  
  const { data, error } = await supabase
    .from('medical_records')
    .select(`
      *,
      doctor:doctors!medical_records_doctor_id_fkey (
        doctor_id,
        profile:profiles!doctors_profile_id_fkey (full_name)
      ),
      patient:patients!medical_records_patient_id_fkey (
        patient_id,
        profile:profiles!patients_profile_id_fkey (full_name)
      )
    `)
    .order('visit_date');

  if (error) {
    console.log(`❌ Error: ${error.message}`);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚪ No medical records found');
    return;
  }

  console.log(`✅ Found ${data.length} medical records:`);
  data.forEach((record, index) => {
    console.log(`  ${index + 1}. ${record.record_id}`);
    console.log(`     Doctor: ${record.doctor?.profile?.full_name || 'N/A'}`);
    console.log(`     Patient: ${record.patient?.profile?.full_name || 'N/A'}`);
    console.log(`     Visit Date: ${record.visit_date}`);
    console.log(`     Diagnosis: ${record.diagnosis || 'N/A'}`);
    console.log(`     Status: ${record.status}`);
    console.log('');
  });
}

async function checkDoctorSchedules() {
  console.log('📅 DOCTOR SCHEDULES:');
  console.log('====================');
  
  const { data, error } = await supabase
    .from('doctor_schedules')
    .select(`
      *,
      doctor:doctors!doctor_schedules_doctor_id_fkey (
        doctor_id,
        profile:profiles!doctors_profile_id_fkey (full_name)
      )
    `)
    .order('doctor_id, day_of_week');

  if (error) {
    console.log(`❌ Error: ${error.message}`);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚪ No doctor schedules found');
    return;
  }

  console.log(`✅ Found ${data.length} schedule entries:`);
  
  // Group by doctor
  const schedulesByDoctor = data.reduce((acc, schedule) => {
    const doctorId = schedule.doctor_id;
    if (!acc[doctorId]) {
      acc[doctorId] = {
        doctor_name: schedule.doctor?.profile?.full_name || 'N/A',
        schedules: []
      };
    }
    acc[doctorId].schedules.push(schedule);
    return acc;
  }, {});

  Object.entries(schedulesByDoctor).forEach(([doctorId, info], index) => {
    console.log(`  ${index + 1}. ${info.doctor_name} (${doctorId})`);
    info.schedules.forEach(schedule => {
      const dayNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      console.log(`     ${dayNames[schedule.day_of_week]}: ${schedule.start_time}-${schedule.end_time} (${schedule.max_appointments} slots)`);
    });
    console.log('');
  });
}

async function checkDoctorReviews() {
  console.log('⭐ DOCTOR REVIEWS:');
  console.log('==================');
  
  const { data, error } = await supabase
    .from('doctor_reviews')
    .select(`
      *,
      doctor:doctors!doctor_reviews_doctor_id_fkey (
        doctor_id,
        profile:profiles!doctors_profile_id_fkey (full_name)
      ),
      patient:patients!doctor_reviews_patient_id_fkey (
        patient_id,
        profile:profiles!patients_profile_id_fkey (full_name)
      )
    `)
    .order('review_date');

  if (error) {
    console.log(`❌ Error: ${error.message}`);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚪ No doctor reviews found');
    return;
  }

  console.log(`✅ Found ${data.length} reviews:`);
  data.forEach((review, index) => {
    console.log(`  ${index + 1}. Review ID: ${review.review_id}`);
    console.log(`     Doctor: ${review.doctor?.profile?.full_name || 'N/A'}`);
    console.log(`     Patient: ${review.patient?.profile?.full_name || 'N/A'}`);
    console.log(`     Rating: ${review.rating}/5`);
    console.log(`     Review: ${review.review_text || 'N/A'}`);
    console.log(`     Date: ${review.review_date}`);
    console.log(`     Verified: ${review.is_verified ? 'Yes' : 'No'}`);
    console.log('');
  });
}

async function displayTestAccounts() {
  console.log('🔑 TEST ACCOUNTS:');
  console.log('=================');
  
  console.log('👨‍⚕️ Doctor Accounts:');
  console.log('   Email: bs.nguyen.tim@hospital.com');
  console.log('   Password: doctor123456');
  console.log('   Role: Doctor (Cardiology)');
  console.log('');
  console.log('   Email: bs.tran.thuy@hospital.com');
  console.log('   Password: doctor123456');
  console.log('   Role: Doctor (Pediatrics)');
  console.log('');
  console.log('   Email: bs.le.duc@hospital.com');
  console.log('   Password: doctor123456');
  console.log('   Role: Doctor (Neurology)');
  console.log('');
  
  console.log('👤 Patient Accounts:');
  console.log('   Email: nguyen.van.a@gmail.com');
  console.log('   Password: patient123456');
  console.log('   Role: Patient');
  console.log('');
  console.log('   Email: tran.thi.c@gmail.com');
  console.log('   Password: patient123456');
  console.log('   Role: Patient');
  console.log('');
  console.log('   Email: le.van.e@gmail.com');
  console.log('   Password: patient123456');
  console.log('   Role: Patient');
  console.log('');
  
  console.log('🔧 Admin Account (if exists):');
  console.log('   Email: admin@hospital.com');
  console.log('   Password: admin123456');
  console.log('   Role: Admin');
}

// Run verification
if (require.main === module) {
  verifyTestData().catch(error => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
}

module.exports = { verifyTestData };
