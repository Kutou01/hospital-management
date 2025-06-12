#!/usr/bin/env node

/**
 * Quick Data Summary Script
 * Provides a concise overview of seeded data
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getDataSummary() {
  console.log('📊 Hospital Management System - Data Summary');
  console.log('============================================\n');

  try {
    // Get counts for all tables
    const tables = [
      'departments',
      'profiles', 
      'doctors',
      'patients',
      'appointments',
      'medical_records',
      'doctor_schedules',
      'doctor_reviews'
    ];

    const counts = {};
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      counts[table] = error ? 0 : count;
    }

    // Display summary
    console.log('📋 Data Overview:');
    console.log('=================');
    console.log(`🏥 Departments: ${counts.departments}`);
    console.log(`👤 Profiles: ${counts.profiles}`);
    console.log(`👨‍⚕️ Doctors: ${counts.doctors}`);
    console.log(`🤒 Patients: ${counts.patients}`);
    console.log(`📅 Appointments: ${counts.appointments}`);
    console.log(`📋 Medical Records: ${counts.medical_records}`);
    console.log(`⏰ Doctor Schedules: ${counts.doctor_schedules}`);
    console.log(`⭐ Doctor Reviews: ${counts.doctor_reviews}`);

    // Calculate ratios
    console.log('\n📊 Data Ratios:');
    console.log('===============');
    if (counts.doctors > 0) {
      console.log(`👨‍⚕️ Doctors per Department: ${(counts.doctors / counts.departments).toFixed(1)}`);
      console.log(`📅 Schedules per Doctor: ${(counts.doctor_schedules / counts.doctors).toFixed(1)}`);
      console.log(`⭐ Reviews per Doctor: ${(counts.doctor_reviews / counts.doctors).toFixed(1)}`);
    }
    
    if (counts.patients > 0) {
      console.log(`📋 Appointments per Patient: ${(counts.appointments / counts.patients).toFixed(1)}`);
    }

    if (counts.appointments > 0) {
      console.log(`📄 Medical Records per Appointment: ${(counts.medical_records / counts.appointments * 100).toFixed(1)}%`);
    }

    // Quick validation
    console.log('\n✅ Quick Validation:');
    console.log('====================');
    
    const validations = [
      { name: 'Departments exist', condition: counts.departments >= 5, expected: '5 departments' },
      { name: 'Doctors distributed', condition: counts.doctors >= 50, expected: '100 doctors (20 per dept)' },
      { name: 'Patients created', condition: counts.patients >= 20, expected: '30 patients' },
      { name: 'Appointments scheduled', condition: counts.appointments >= 30, expected: '50 appointments' },
      { name: 'Schedules generated', condition: counts.doctor_schedules >= 200, expected: '500 schedules (5 days × 100 doctors)' },
      { name: 'Reviews available', condition: counts.doctor_reviews >= 50, expected: '150 reviews' }
    ];

    validations.forEach(validation => {
      const status = validation.condition ? '✅' : '❌';
      console.log(`${status} ${validation.name} (${validation.expected})`);
    });

    // Sample data check
    console.log('\n🔍 Sample Data Check:');
    console.log('=====================');
    
    // Check doctor ID pattern
    const { data: sampleDoctor } = await supabase
      .from('doctors')
      .select('doctor_id, license_number')
      .limit(1);
    
    if (sampleDoctor && sampleDoctor.length > 0) {
      const doctor = sampleDoctor[0];
      const idValid = /^[A-Z]{3,4}-DOC-\d{6}-\d{3}$/.test(doctor.doctor_id);
      const licenseValid = /^VN-[A-Z]{3,4}-\d{4}-\d{3}$/.test(doctor.license_number);
      
      console.log(`👨‍⚕️ Doctor ID Pattern: ${doctor.doctor_id} ${idValid ? '✅' : '❌'}`);
      console.log(`📜 License Pattern: ${doctor.license_number} ${licenseValid ? '✅' : '❌'}`);
    }

    // Check patient ID pattern
    const { data: samplePatient } = await supabase
      .from('patients')
      .select('patient_id')
      .limit(1);
    
    if (samplePatient && samplePatient.length > 0) {
      const patient = samplePatient[0];
      const idValid = /^PAT-\d{6}-\d{3}$/.test(patient.patient_id);
      
      console.log(`🤒 Patient ID Pattern: ${patient.patient_id} ${idValid ? '✅' : '❌'}`);
    }

    // Check appointment ID pattern
    const { data: sampleAppointment } = await supabase
      .from('appointments')
      .select('appointment_id')
      .limit(1);
    
    if (sampleAppointment && sampleAppointment.length > 0) {
      const appointment = sampleAppointment[0];
      const idValid = /^APT-\d{6}-\d{3}$/.test(appointment.appointment_id);
      
      console.log(`📅 Appointment ID Pattern: ${appointment.appointment_id} ${idValid ? '✅' : '❌'}`);
    }

    // Department distribution
    const { data: deptDistribution } = await supabase
      .from('doctors')
      .select('department_id');
    
    if (deptDistribution && deptDistribution.length > 0) {
      const deptCounts = deptDistribution.reduce((acc, doc) => {
        acc[doc.department_id] = (acc[doc.department_id] || 0) + 1;
        return acc;
      }, {});

      console.log('\n🏥 Department Distribution:');
      console.log('===========================');
      Object.entries(deptCounts).forEach(([dept, count]) => {
        const expected = 20;
        const status = count === expected ? '✅' : count > 0 ? '⚠️' : '❌';
        console.log(`${status} ${dept}: ${count} doctors (expected: ${expected})`);
      });
    }

    // Review rating distribution
    const { data: reviews } = await supabase
      .from('doctor_reviews')
      .select('rating');
    
    if (reviews && reviews.length > 0) {
      const ratingCounts = reviews.reduce((acc, review) => {
        acc[review.rating] = (acc[review.rating] || 0) + 1;
        return acc;
      }, {});

      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

      console.log('\n⭐ Review Rating Distribution:');
      console.log('==============================');
      [5, 4, 3, 2, 1].forEach(rating => {
        const count = ratingCounts[rating] || 0;
        const percentage = ((count / reviews.length) * 100).toFixed(1);
        console.log(`${rating} stars: ${count} reviews (${percentage}%)`);
      });
      console.log(`Average Rating: ${avgRating.toFixed(2)}/5`);
    }

    console.log('\n🎯 Summary:');
    console.log('===========');
    const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);
    console.log(`📊 Total Records: ${totalRecords.toLocaleString()}`);
    console.log(`🏥 Hospital Departments: ${counts.departments}`);
    console.log(`👥 Healthcare Providers: ${counts.doctors}`);
    console.log(`🤒 Registered Patients: ${counts.patients}`);
    console.log(`📅 Scheduled Appointments: ${counts.appointments}`);
    console.log(`📋 Medical Documentation: ${counts.medical_records}`);
    console.log(`⭐ Patient Feedback: ${counts.doctor_reviews}`);

    const dataQuality = validations.filter(v => v.condition).length / validations.length * 100;
    console.log(`\n🎯 Data Quality Score: ${dataQuality.toFixed(1)}%`);

    if (dataQuality >= 80) {
      console.log('🎉 Excellent! Data is ready for comprehensive testing.');
    } else if (dataQuality >= 60) {
      console.log('⚠️ Good, but some data may need attention.');
    } else {
      console.log('❌ Data quality issues detected. Consider re-seeding.');
    }

  } catch (error) {
    console.error('❌ Error getting data summary:', error);
  }
}

// Run summary
if (require.main === module) {
  getDataSummary().catch(error => {
    console.error('❌ Data summary failed:', error);
    process.exit(1);
  });
}

module.exports = { getDataSummary };
