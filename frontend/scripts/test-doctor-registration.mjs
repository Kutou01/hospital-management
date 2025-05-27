#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

async function testDoctorRegistration() {
  try {
    log('🧪 Starting doctor registration test...');

    // Generate unique test data
    const timestamp = Date.now();
    const testDoctorData = {
      email: `test.doctor.${timestamp}@hospital.com`,
      password: 'TestPassword123!',
      full_name: `Dr. Test Doctor ${timestamp}`,
      phone_number: `0901${timestamp.toString().slice(-6)}`,
      role: 'doctor',
      specialty: 'Khoa Nội tổng hợp',
      license_number: `MD${timestamp}`,
      qualification: 'Bác sĩ Đa khoa',
      department_id: 'DEPT001' // Khoa Nội tổng hợp
    };

    log(`📝 Test doctor data: ${testDoctorData.email}`);

    // 1. Create auth user
    log('🔐 Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testDoctorData.email,
      password: testDoctorData.password,
      options: {
        data: {
          full_name: testDoctorData.full_name,
          phone_number: testDoctorData.phone_number,
          role: testDoctorData.role,
          specialty: testDoctorData.specialty,
          license_number: testDoctorData.license_number,
          qualification: testDoctorData.qualification,
          department_id: testDoctorData.department_id,
        }
      }
    });

    if (authError) {
      log(`❌ Auth signup failed: ${authError.message}`);
      return false;
    }

    if (!authData.user) {
      log('❌ No user returned from auth signup');
      return false;
    }

    log(`✅ Auth user created: ${authData.user.id}`);

    // 2. Wait for trigger to create profile
    log('⏳ Waiting for profile creation trigger...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Check if profile was created
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profileData) {
      log(`❌ Profile creation failed: ${profileError?.message || 'No profile data'}`);
      return false;
    }

    log(`✅ Profile created: ${profileData.full_name} (${profileData.role})`);

    // 4. Create doctor profile
    log('👨‍⚕️ Creating doctor profile...');
    const doctorData = {
      profile_id: authData.user.id,
      license_number: testDoctorData.license_number,
      specialization: testDoctorData.specialty,
      qualification: testDoctorData.qualification,
      department_id: testDoctorData.department_id,
      experience_years: 0,
      consultation_fee: null,
      status: 'active',
      bio: null,
      languages_spoken: null,
      working_hours: {}
    };

    const { data: doctorResult, error: doctorError } = await supabase
      .from('doctors')
      .insert([doctorData])
      .select()
      .single();

    if (doctorError) {
      log(`❌ Doctor profile creation failed: ${doctorError.message}`);
      log(`❌ Doctor error details:`, doctorError);
      return false;
    }

    log(`✅ Doctor profile created: ${doctorResult.doctor_id}`);

    // 5. Verify the complete registration
    log('🔍 Verifying complete registration...');

    const { data: completeDoctor, error: verifyError } = await supabase
      .from('doctors')
      .select(`
        *,
        profiles!inner(full_name, email, role),
        departments(name)
      `)
      .eq('profile_id', authData.user.id)
      .single();

    if (verifyError || !completeDoctor) {
      log(`❌ Verification failed: ${verifyError?.message || 'No complete data'}`);
      return false;
    }

    log(`✅ Registration verification successful:`);
    log(`   - Doctor ID: ${completeDoctor.doctor_id}`);
    log(`   - Name: ${completeDoctor.profiles.full_name}`);
    log(`   - Email: ${completeDoctor.profiles.email}`);
    log(`   - Role: ${completeDoctor.profiles.role}`);
    log(`   - Specialization: ${completeDoctor.specialization}`);
    log(`   - License: ${completeDoctor.license_number}`);
    log(`   - Department: ${completeDoctor.departments?.name || 'N/A'}`);

    // 6. Keep test data for authentication testing
    log('💾 Keeping test data for authentication testing...');
    log(`📧 Test account email: ${testDoctorData.email}`);
    log(`🔑 Test account password: ${testDoctorData.password}`);

    log('✅ Test completed successfully!');
    return true;

  } catch (error) {
    log(`❌ Exception: ${error.message}`);
    return false;
  }
}

// Run the test
testDoctorRegistration()
  .then(success => {
    if (success) {
      log('🎉 Doctor registration test PASSED');
      process.exit(0);
    } else {
      log('💥 Doctor registration test FAILED');
      process.exit(1);
    }
  })
  .catch(error => {
    log(`💥 Test crashed: ${error.message}`);
    process.exit(1);
  });
