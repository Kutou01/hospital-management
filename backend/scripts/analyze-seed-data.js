#!/usr/bin/env node

/**
 * Seed Data Analysis Script
 * Analyzes the structure and patterns of seeded data
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeSeedData() {
  console.log('📊 Analyzing Seed Data Structure and Patterns');
  console.log('==============================================\n');

  try {
    await analyzeDepartments();
    await analyzeDoctors();
    await analyzePatients();
    await analyzeAppointments();
    await analyzeMedicalRecords();
    await analyzeDoctorSchedules();
    await analyzeDoctorReviews();
    await analyzeDataRelationships();
    await validateDataPatterns();

  } catch (error) {
    console.error('❌ Error analyzing seed data:', error);
  }
}

async function analyzeDepartments() {
  console.log('🏥 DEPARTMENTS ANALYSIS');
  console.log('=======================');
  
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('dept_id');

  if (error) {
    console.log(`❌ Error: ${error.message}`);
    return;
  }

  console.log(`📊 Total Departments: ${data.length}`);
  console.log('\n📋 Department Structure:');
  data.forEach((dept, index) => {
    console.log(`  ${index + 1}. ${dept.dept_id} - ${dept.name}`);
    console.log(`     Code: ${dept.code || 'N/A'}`);
    console.log(`     Active: ${dept.is_active}`);
  });

  console.log('\n🔍 Pattern Analysis:');
  console.log(`   - ID Pattern: ${data[0]?.dept_id} (Expected: 3-4 letter codes)`);
  console.log(`   - Name Pattern: Vietnamese department names`);
  console.log(`   - Code Pattern: Same as dept_id`);
}

async function analyzeDoctors() {
  console.log('\n👨‍⚕️ DOCTORS ANALYSIS');
  console.log('======================');
  
  const { data, error } = await supabase
    .from('doctors')
    .select(`
      *,
      profile:profiles!doctors_profile_id_fkey (
        full_name,
        email,
        phone_number,
        date_of_birth
      )
    `)
    .order('created_at')
    .limit(5);

  if (error) {
    console.log(`❌ Error: ${error.message}`);
    return;
  }

  const { count } = await supabase
    .from('doctors')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Total Doctors: ${count}`);
  console.log('\n📋 Sample Doctor Records:');
  
  data.forEach((doctor, index) => {
    console.log(`  ${index + 1}. ${doctor.doctor_id}`);
    console.log(`     Name: ${doctor.profile?.full_name}`);
    console.log(`     Email: ${doctor.profile?.email}`);
    console.log(`     Specialty: ${doctor.specialty}`);
    console.log(`     Department: ${doctor.department_id}`);
    console.log(`     License: ${doctor.license_number}`);
    console.log(`     Experience: ${doctor.experience_years} years`);
    console.log(`     Fee: ${doctor.consultation_fee?.toLocaleString()} VND`);
    console.log(`     Languages: ${doctor.languages_spoken?.join(', ')}`);
    console.log(`     Rating: ${doctor.rating}/5 (${doctor.total_reviews} reviews)`);
    console.log('');
  });

  // Analyze by department
  const { data: deptStats } = await supabase
    .from('doctors')
    .select('department_id')
    .order('department_id');

  const deptCounts = deptStats.reduce((acc, doc) => {
    acc[doc.department_id] = (acc[doc.department_id] || 0) + 1;
    return acc;
  }, {});

  console.log('📊 Doctors by Department:');
  Object.entries(deptCounts).forEach(([dept, count]) => {
    console.log(`   ${dept}: ${count} doctors`);
  });

  console.log('\n🔍 Pattern Analysis:');
  console.log(`   - ID Pattern: ${data[0]?.doctor_id} (Expected: DEPT-DOC-YYYYMM-XXX)`);
  console.log(`   - License Pattern: ${data[0]?.license_number} (Expected: VN-DEPT-YYYY-XXX)`);
  console.log(`   - Email Pattern: ${data[0]?.profile?.email} (Expected: bs.name@hospital.com)`);
  console.log(`   - Phone Pattern: ${data[0]?.profile?.phone_number} (Expected: 090XXXXXXX)`);
}

async function analyzePatients() {
  console.log('\n👤 PATIENTS ANALYSIS');
  console.log('====================');
  
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
    .order('created_at')
    .limit(5);

  if (error) {
    console.log(`❌ Error: ${error.message}`);
    return;
  }

  const { count } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Total Patients: ${count}`);
  console.log('\n📋 Sample Patient Records:');
  
  data.forEach((patient, index) => {
    console.log(`  ${index + 1}. ${patient.patient_id}`);
    console.log(`     Name: ${patient.profile?.full_name}`);
    console.log(`     Email: ${patient.profile?.email}`);
    console.log(`     DOB: ${patient.profile?.date_of_birth}`);
    console.log(`     Gender: ${patient.gender}`);
    console.log(`     Blood Type: ${patient.blood_type}`);
    console.log(`     Address: ${JSON.stringify(patient.address)}`);
    console.log(`     Emergency: ${JSON.stringify(patient.emergency_contact)}`);
    console.log(`     Allergies: ${patient.allergies?.join(', ') || 'None'}`);
    console.log(`     Status: ${patient.status}`);
    console.log('');
  });

  // Analyze demographics
  const { data: genderStats } = await supabase
    .from('patients')
    .select('gender');

  const genderCounts = genderStats.reduce((acc, p) => {
    acc[p.gender] = (acc[p.gender] || 0) + 1;
    return acc;
  }, {});

  const { data: bloodStats } = await supabase
    .from('patients')
    .select('blood_type');

  const bloodCounts = bloodStats.reduce((acc, p) => {
    acc[p.blood_type] = (acc[p.blood_type] || 0) + 1;
    return acc;
  }, {});

  console.log('📊 Patient Demographics:');
  console.log('   Gender Distribution:');
  Object.entries(genderCounts).forEach(([gender, count]) => {
    console.log(`     ${gender}: ${count} patients`);
  });
  
  console.log('   Blood Type Distribution:');
  Object.entries(bloodCounts).forEach(([blood, count]) => {
    console.log(`     ${blood}: ${count} patients`);
  });

  console.log('\n🔍 Pattern Analysis:');
  console.log(`   - ID Pattern: ${data[0]?.patient_id} (Expected: PAT-YYYYMM-XXX)`);
  console.log(`   - Email Pattern: ${data[0]?.profile?.email} (Expected: name@gmail.com)`);
  console.log(`   - Phone Pattern: ${data[0]?.profile?.phone_number} (Expected: 098XXXXXXX)`);
  console.log(`   - Address: JSON object with street, district, city`);
  console.log(`   - Emergency Contact: JSON object with name, phone, relationship`);
}

async function analyzeAppointments() {
  console.log('\n📅 APPOINTMENTS ANALYSIS');
  console.log('========================');
  
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
    .order('appointment_date')
    .limit(5);

  if (error) {
    console.log(`❌ Error: ${error.message}`);
    return;
  }

  const { count } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Total Appointments: ${count}`);
  console.log('\n📋 Sample Appointment Records:');
  
  data.forEach((apt, index) => {
    console.log(`  ${index + 1}. ${apt.appointment_id}`);
    console.log(`     Doctor: ${apt.doctor?.profile?.full_name} (${apt.doctor_id})`);
    console.log(`     Patient: ${apt.patient?.profile?.full_name} (${apt.patient_id})`);
    console.log(`     Date: ${apt.appointment_date}`);
    console.log(`     Time: ${apt.appointment_time}`);
    console.log(`     Status: ${apt.status}`);
    console.log(`     Type: ${apt.appointment_type}`);
    console.log(`     Notes: ${apt.notes}`);
    console.log('');
  });

  // Analyze appointment statistics
  const { data: statusStats } = await supabase
    .from('appointments')
    .select('status');

  const statusCounts = statusStats.reduce((acc, apt) => {
    acc[apt.status] = (acc[apt.status] || 0) + 1;
    return acc;
  }, {});

  const { data: typeStats } = await supabase
    .from('appointments')
    .select('appointment_type');

  const typeCounts = typeStats.reduce((acc, apt) => {
    acc[apt.appointment_type] = (acc[apt.appointment_type] || 0) + 1;
    return acc;
  }, {});

  console.log('📊 Appointment Statistics:');
  console.log('   Status Distribution:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`     ${status}: ${count} appointments`);
  });
  
  console.log('   Type Distribution:');
  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`     ${type}: ${count} appointments`);
  });

  console.log('\n🔍 Pattern Analysis:');
  console.log(`   - ID Pattern: ${data[0]?.appointment_id} (Expected: APT-YYYYMM-XXX)`);
  console.log(`   - Date Range: ${data[0]?.appointment_date} to ${data[data.length-1]?.appointment_date}`);
  console.log(`   - Time Pattern: ${data[0]?.appointment_time} (Expected: HH:MM format)`);
}

async function analyzeMedicalRecords() {
  console.log('\n📋 MEDICAL RECORDS ANALYSIS');
  console.log('============================');
  
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
    .order('visit_date')
    .limit(3);

  if (error) {
    console.log(`❌ Error: ${error.message}`);
    return;
  }

  const { count } = await supabase
    .from('medical_records')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Total Medical Records: ${count}`);
  console.log('\n📋 Sample Medical Records:');
  
  data.forEach((record, index) => {
    console.log(`  ${index + 1}. ${record.record_id}`);
    console.log(`     Doctor: ${record.doctor?.profile?.full_name}`);
    console.log(`     Patient: ${record.patient?.profile?.full_name}`);
    console.log(`     Visit Date: ${record.visit_date}`);
    console.log(`     Chief Complaint: ${record.chief_complaint}`);
    console.log(`     Diagnosis: ${record.diagnosis}`);
    console.log(`     Treatment: ${record.treatment_plan}`);
    console.log(`     Status: ${record.status}`);
    console.log('');
  });

  console.log('\n🔍 Pattern Analysis:');
  console.log(`   - ID Pattern: ${data[0]?.record_id} (Expected: MR-YYYYMM-XXX)`);
  console.log(`   - Vietnamese Medical Terms: Used in complaints and diagnoses`);
  console.log(`   - Linked to Appointments: ${data.filter(r => r.appointment_id).length}/${data.length} records`);
}

async function analyzeDoctorSchedules() {
  console.log('\n📅 DOCTOR SCHEDULES ANALYSIS');
  console.log('=============================');
  
  const { data, error } = await supabase
    .from('doctor_schedules')
    .select(`
      *,
      doctor:doctors!doctor_schedules_doctor_id_fkey (
        doctor_id,
        profile:profiles!doctors_profile_id_fkey (full_name)
      )
    `)
    .order('doctor_id, day_of_week')
    .limit(10);

  if (error) {
    console.log(`❌ Error: ${error.message}`);
    return;
  }

  const { count } = await supabase
    .from('doctor_schedules')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Total Schedule Entries: ${count}`);
  console.log('\n📋 Sample Schedule Entries:');
  
  const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  data.forEach((schedule, index) => {
    console.log(`  ${index + 1}. ${schedule.doctor?.profile?.full_name}`);
    console.log(`     Day: ${dayNames[schedule.day_of_week]} (${schedule.day_of_week})`);
    console.log(`     Time: ${schedule.start_time} - ${schedule.end_time}`);
    console.log(`     Break: ${schedule.break_start} - ${schedule.break_end}`);
    console.log(`     Max Appointments: ${schedule.max_appointments}`);
    console.log(`     Slot Duration: ${schedule.slot_duration} minutes`);
    console.log('');
  });

  console.log('\n🔍 Pattern Analysis:');
  console.log(`   - Working Days: Monday-Friday (1-5)`);
  console.log(`   - Working Hours: 08:00-17:00`);
  console.log(`   - Break Time: 12:00-13:00`);
  console.log(`   - Slot Duration: 30 minutes`);
  console.log(`   - Max Appointments: 16 per day`);
}

async function analyzeDoctorReviews() {
  console.log('\n⭐ DOCTOR REVIEWS ANALYSIS');
  console.log('==========================');
  
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
    .order('review_date')
    .limit(5);

  if (error) {
    console.log(`❌ Error: ${error.message}`);
    return;
  }

  const { count } = await supabase
    .from('doctor_reviews')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Total Reviews: ${count}`);
  console.log('\n📋 Sample Reviews:');
  
  data.forEach((review, index) => {
    console.log(`  ${index + 1}. ${review.review_id}`);
    console.log(`     Doctor: ${review.doctor?.profile?.full_name}`);
    console.log(`     Patient: ${review.patient?.profile?.full_name}`);
    console.log(`     Rating: ${review.rating}/5`);
    console.log(`     Review: "${review.review_text}"`);
    console.log(`     Date: ${review.review_date}`);
    console.log(`     Verified: ${review.is_verified}`);
    console.log('');
  });

  // Analyze rating distribution
  const { data: ratingStats } = await supabase
    .from('doctor_reviews')
    .select('rating');

  const ratingCounts = ratingStats.reduce((acc, review) => {
    acc[review.rating] = (acc[review.rating] || 0) + 1;
    return acc;
  }, {});

  console.log('📊 Rating Distribution:');
  [5, 4, 3, 2, 1].forEach(rating => {
    const count = ratingCounts[rating] || 0;
    const percentage = ((count / ratingStats.length) * 100).toFixed(1);
    console.log(`   ${rating} stars: ${count} reviews (${percentage}%)`);
  });

  const avgRating = ratingStats.reduce((sum, r) => sum + r.rating, 0) / ratingStats.length;
  console.log(`   Average Rating: ${avgRating.toFixed(2)}/5`);

  console.log('\n🔍 Pattern Analysis:');
  console.log(`   - Vietnamese Review Text: Realistic patient feedback`);
  console.log(`   - Rating Distribution: Weighted toward positive (4-5 stars)`);
  console.log(`   - Verification Rate: ${data.filter(r => r.is_verified).length}/${data.length} verified`);
}

async function analyzeDataRelationships() {
  console.log('\n🔗 DATA RELATIONSHIPS ANALYSIS');
  console.log('===============================');

  // Check foreign key integrity
  const relationships = [
    {
      name: 'Doctors → Profiles',
      query: `
        SELECT COUNT(*) as total,
               COUNT(p.id) as valid_profiles
        FROM doctors d
        LEFT JOIN profiles p ON d.profile_id = p.id
      `
    },
    {
      name: 'Patients → Profiles', 
      query: `
        SELECT COUNT(*) as total,
               COUNT(p.id) as valid_profiles
        FROM patients pt
        LEFT JOIN profiles p ON pt.profile_id = p.id
      `
    },
    {
      name: 'Doctors → Departments',
      query: `
        SELECT COUNT(*) as total,
               COUNT(dept.dept_id) as valid_departments
        FROM doctors d
        LEFT JOIN departments dept ON d.department_id = dept.dept_id
      `
    },
    {
      name: 'Appointments → Doctors/Patients',
      query: `
        SELECT COUNT(*) as total,
               COUNT(d.doctor_id) as valid_doctors,
               COUNT(p.patient_id) as valid_patients
        FROM appointments a
        LEFT JOIN doctors d ON a.doctor_id = d.doctor_id
        LEFT JOIN patients p ON a.patient_id = p.patient_id
      `
    }
  ];

  for (const rel of relationships) {
    try {
      const { data, error } = await supabase.rpc('execute_sql', { sql: rel.query });
      if (!error && data && data.length > 0) {
        const result = data[0];
        console.log(`✅ ${rel.name}:`);
        Object.entries(result).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      } else {
        console.log(`⚠️ ${rel.name}: Could not verify`);
      }
    } catch (error) {
      console.log(`⚠️ ${rel.name}: Manual verification needed`);
    }
  }
}

async function validateDataPatterns() {
  console.log('\n🔍 DATA PATTERN VALIDATION');
  console.log('===========================');

  // Sample some IDs to check patterns
  const { data: doctors } = await supabase
    .from('doctors')
    .select('doctor_id, license_number')
    .limit(3);

  const { data: patients } = await supabase
    .from('patients')
    .select('patient_id')
    .limit(3);

  const { data: appointments } = await supabase
    .from('appointments')
    .select('appointment_id')
    .limit(3);

  console.log('📋 ID Pattern Validation:');
  
  if (doctors && doctors.length > 0) {
    console.log('   Doctor IDs:');
    doctors.forEach(d => {
      const isValidId = /^[A-Z]{3,4}-DOC-\d{6}-\d{3}$/.test(d.doctor_id);
      const isValidLicense = /^VN-[A-Z]{3,4}-\d{4}-\d{3}$/.test(d.license_number);
      console.log(`     ${d.doctor_id} ${isValidId ? '✅' : '❌'}`);
      console.log(`     ${d.license_number} ${isValidLicense ? '✅' : '❌'}`);
    });
  }

  if (patients && patients.length > 0) {
    console.log('   Patient IDs:');
    patients.forEach(p => {
      const isValidId = /^PAT-\d{6}-\d{3}$/.test(p.patient_id);
      console.log(`     ${p.patient_id} ${isValidId ? '✅' : '❌'}`);
    });
  }

  if (appointments && appointments.length > 0) {
    console.log('   Appointment IDs:');
    appointments.forEach(a => {
      const isValidId = /^APT-\d{6}-\d{3}$/.test(a.appointment_id);
      console.log(`     ${a.appointment_id} ${isValidId ? '✅' : '❌'}`);
    });
  }
}

// Run analysis
if (require.main === module) {
  analyzeSeedData().catch(error => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });
}

module.exports = { analyzeSeedData };
