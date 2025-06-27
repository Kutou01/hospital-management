const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMainAccounts() {
  console.log('🔍 CHECKING MAIN TEST ACCOUNTS DETAILS');
  console.log('='.repeat(60));

  try {
    // Check doctor@hospital.com
    console.log('👨‍⚕️ DOCTOR ACCOUNT DETAILS:');
    console.log('='.repeat(40));
    
    const { data: doctorProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'doctor@hospital.com')
      .single();

    if (doctorProfile) {
      console.log(`📧 Email: ${doctorProfile.email}`);
      console.log(`👤 Name: ${doctorProfile.full_name}`);
      console.log(`📱 Phone: ${doctorProfile.phone_number}`);
      console.log(`🎂 DOB: ${doctorProfile.date_of_birth}`);
      console.log(`🔐 Role: ${doctorProfile.role}`);
      console.log(`✅ Active: ${doctorProfile.is_active}`);
      console.log(`📧 Email Verified: ${doctorProfile.email_verified}`);

      // Get doctor record
      const { data: doctorRecord } = await supabase
        .from('doctors')
        .select('*')
        .eq('profile_id', doctorProfile.id)
        .single();

      if (doctorRecord) {
        console.log(`\n🏥 DOCTOR PROFESSIONAL INFO:`);
        console.log(`   ID: ${doctorRecord.doctor_id}`);
        console.log(`   License: ${doctorRecord.license_number}`);
        console.log(`   Department: ${doctorRecord.department_id}`);
        console.log(`   Specialty: ${doctorRecord.specialty}`);
        console.log(`   Experience: ${doctorRecord.experience_years} years`);
        console.log(`   Fee: ${doctorRecord.consultation_fee?.toLocaleString()} VND`);
        console.log(`   Rating: ${doctorRecord.rating}/5 (${doctorRecord.total_reviews} reviews)`);
        console.log(`   Status: ${doctorRecord.status} / ${doctorRecord.availability_status}`);
        console.log(`   Qualification: ${doctorRecord.qualification}`);
        console.log(`   Bio: ${doctorRecord.bio?.substring(0, 100)}...`);
        console.log(`   Languages: ${doctorRecord.languages_spoken?.join(', ')}`);
        
        if (doctorRecord.address) {
          console.log(`   Address: ${doctorRecord.address.street}, ${doctorRecord.address.district}, ${doctorRecord.address.city}`);
        }
      }

      // Get doctor's appointments
      const { data: doctorAppointments } = await supabase
        .from('appointments')
        .select(`
          *,
          patients!inner(full_name, patient_id)
        `)
        .eq('doctor_id', doctorRecord?.doctor_id)
        .order('appointment_date', { ascending: false });

      console.log(`\n📅 DOCTOR'S APPOINTMENTS (${doctorAppointments?.length || 0}):`);
      if (doctorAppointments && doctorAppointments.length > 0) {
        doctorAppointments.slice(0, 5).forEach((apt, index) => {
          console.log(`   ${index + 1}. ${apt.appointment_date} ${apt.start_time}`);
          console.log(`      Patient: ${apt.patients?.full_name || apt.patient_id}`);
          console.log(`      Type: ${apt.appointment_type} | Status: ${apt.status}`);
          console.log(`      Reason: ${apt.reason}`);
        });
        if (doctorAppointments.length > 5) {
          console.log(`   ... and ${doctorAppointments.length - 5} more appointments`);
        }
      }

      // Get doctor's reviews
      const { data: doctorReviews } = await supabase
        .from('doctor_reviews')
        .select(`
          *,
          patients!inner(full_name, patient_id)
        `)
        .eq('doctor_id', doctorRecord?.doctor_id)
        .order('review_date', { ascending: false });

      console.log(`\n⭐ DOCTOR'S REVIEWS (${doctorReviews?.length || 0}):`);
      if (doctorReviews && doctorReviews.length > 0) {
        doctorReviews.forEach((review, index) => {
          console.log(`   ${index + 1}. ${review.rating}/5 stars - ${review.review_date}`);
          console.log(`      From: ${review.patients?.full_name || review.patient_id}`);
        });
      }
    }

    // Check patient@hospital.com
    console.log('\n\n🤒 PATIENT ACCOUNT DETAILS:');
    console.log('='.repeat(40));
    
    const { data: patientProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'patient@hospital.com')
      .single();

    if (patientProfile) {
      console.log(`📧 Email: ${patientProfile.email}`);
      console.log(`👤 Name: ${patientProfile.full_name}`);
      console.log(`📱 Phone: ${patientProfile.phone_number}`);
      console.log(`🎂 DOB: ${patientProfile.date_of_birth}`);
      console.log(`🔐 Role: ${patientProfile.role}`);
      console.log(`✅ Active: ${patientProfile.is_active}`);
      console.log(`📧 Email Verified: ${patientProfile.email_verified}`);

      // Get patient record
      const { data: patientRecord } = await supabase
        .from('patients')
        .select('*')
        .eq('profile_id', patientProfile.id)
        .single();

      if (patientRecord) {
        console.log(`\n🏥 PATIENT MEDICAL INFO:`);
        console.log(`   ID: ${patientRecord.patient_id}`);
        console.log(`   Gender: ${patientRecord.gender}`);
        console.log(`   Blood Type: ${patientRecord.blood_type}`);
        console.log(`   Status: ${patientRecord.status}`);
        console.log(`   Medical History: ${patientRecord.medical_history}`);
        
        if (patientRecord.allergies && patientRecord.allergies.length > 0) {
          console.log(`   Allergies: ${patientRecord.allergies.join(', ')}`);
        }
        
        if (patientRecord.chronic_conditions && patientRecord.chronic_conditions.length > 0) {
          console.log(`   Chronic Conditions: ${patientRecord.chronic_conditions.join(', ')}`);
        }
        
        if (patientRecord.current_medications) {
          console.log(`   Current Medications:`);
          Object.entries(patientRecord.current_medications).forEach(([med, instruction]) => {
            console.log(`     - ${med}: ${instruction}`);
          });
        }
        
        if (patientRecord.emergency_contact) {
          console.log(`   Emergency Contact: ${patientRecord.emergency_contact.name} (${patientRecord.emergency_contact.relationship})`);
          console.log(`     Phone: ${patientRecord.emergency_contact.phone}`);
        }
        
        if (patientRecord.insurance_info) {
          console.log(`   Insurance: ${patientRecord.insurance_info.provider} - ${patientRecord.insurance_info.policy_number}`);
        }
        
        if (patientRecord.address) {
          console.log(`   Address: ${patientRecord.address.street}, ${patientRecord.address.district}, ${patientRecord.address.city}`);
        }
      }

      // Get patient's appointments
      const { data: patientAppointments } = await supabase
        .from('appointments')
        .select(`
          *,
          doctors!inner(full_name, doctor_id)
        `)
        .eq('patient_id', patientRecord?.patient_id)
        .order('appointment_date', { ascending: false });

      console.log(`\n📅 PATIENT'S APPOINTMENTS (${patientAppointments?.length || 0}):`);
      if (patientAppointments && patientAppointments.length > 0) {
        patientAppointments.forEach((apt, index) => {
          console.log(`   ${index + 1}. ${apt.appointment_date} ${apt.start_time}`);
          console.log(`      Doctor: ${apt.doctors?.full_name || apt.doctor_id}`);
          console.log(`      Type: ${apt.appointment_type} | Status: ${apt.status}`);
          console.log(`      Reason: ${apt.reason}`);
        });
      }

      // Get patient's reviews
      const { data: patientReviews } = await supabase
        .from('doctor_reviews')
        .select(`
          *,
          doctors!inner(full_name, doctor_id)
        `)
        .eq('patient_id', patientRecord?.patient_id)
        .order('review_date', { ascending: false });

      console.log(`\n⭐ PATIENT'S REVIEWS GIVEN (${patientReviews?.length || 0}):`);
      if (patientReviews && patientReviews.length > 0) {
        patientReviews.forEach((review, index) => {
          console.log(`   ${index + 1}. ${review.rating}/5 stars - ${review.review_date}`);
          console.log(`      To: ${review.doctors?.full_name || review.doctor_id}`);
        });
      }
    }

    // Summary
    console.log('\n\n📊 MAIN ACCOUNTS SUMMARY:');
    console.log('='.repeat(40));
    console.log(`👨‍⚕️ Doctor: ${doctorProfile?.full_name} (${doctorProfile?.email})`);
    console.log(`   - ${doctorAppointments?.length || 0} appointments`);
    console.log(`   - ${doctorReviews?.length || 0} reviews received`);
    console.log(`   - Rating: ${doctorRecord?.rating}/5`);
    console.log('');
    console.log(`🤒 Patient: ${patientProfile?.full_name} (${patientProfile?.email})`);
    console.log(`   - ${patientAppointments?.length || 0} appointments`);
    console.log(`   - ${patientReviews?.length || 0} reviews given`);
    console.log(`   - Medical conditions: ${patientRecord?.chronic_conditions?.length || 0}`);
    console.log('');
    console.log('🎯 BOTH ACCOUNTS ARE READY FOR COMPREHENSIVE TESTING!');
    console.log('');
    console.log('🔑 LOGIN CREDENTIALS:');
    console.log('   👨‍⚕️ Doctor: doctor@hospital.com / Doctor123!');
    console.log('   🤒 Patient: patient@hospital.com / Patient123!');

  } catch (error) {
    console.error('❌ Error checking main accounts:', error.message);
  }
}

async function main() {
  await checkMainAccounts();
}

main().catch(console.error);
