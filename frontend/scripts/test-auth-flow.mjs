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

async function testAuthFlow() {
  try {
    log('🧪 Starting authentication flow test...');

    // Test with the account we just created
    const testCredentials = {
      email: 'test.doctor.1748360059637@hospital.com',
      password: 'TestPassword123!'
    };

    log(`📝 Testing login with: ${testCredentials.email}`);

    // 1. Test sign in
    log('🔐 Testing sign in...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testCredentials.email,
      password: testCredentials.password,
    });

    if (authError) {
      log(`❌ Auth signin failed: ${authError.message}`);
      return false;
    }

    if (!authData.user) {
      log('❌ No user returned from auth signin');
      return false;
    }

    log(`✅ Auth signin successful: ${authData.user.id}`);

    // 2. Test getting user profile
    log('👤 Testing profile retrieval...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profileData) {
      log(`❌ Profile retrieval failed: ${profileError?.message || 'No profile data'}`);
      return false;
    }

    log(`✅ Profile retrieved: ${profileData.full_name} (${profileData.role})`);

    // 3. Test getting current session
    log('🔍 Testing session retrieval...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      log(`❌ Session retrieval failed: ${sessionError.message}`);
      return false;
    }

    if (!session) {
      log('❌ No session found');
      return false;
    }

    log(`✅ Session retrieved: ${session.user.id}`);

    // 4. Test getting current user
    log('👤 Testing current user retrieval...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      log(`❌ Current user retrieval failed: ${userError.message}`);
      return false;
    }

    if (!user) {
      log('❌ No current user found');
      return false;
    }

    log(`✅ Current user retrieved: ${user.id}`);

    // 5. Test role-based access
    if (profileData.role === 'doctor') {
      log('👨‍⚕️ Testing doctor-specific data...');

      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select(`
          *,
          profiles!inner(full_name, email),
          departments(name)
        `)
        .eq('profile_id', authData.user.id)
        .single();

      if (doctorError || !doctorData) {
        log(`❌ Doctor data retrieval failed: ${doctorError?.message || 'No doctor data'}`);
        return false;
      }

      log(`✅ Doctor data retrieved: ${doctorData.doctor_id} - ${doctorData.specialization}`);
    }

    // 6. Test sign out
    log('🚪 Testing sign out...');
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      log(`❌ Sign out failed: ${signOutError.message}`);
      return false;
    }

    log('✅ Sign out successful');

    // 7. Verify session is cleared
    log('🔍 Verifying session is cleared...');
    const { data: { session: postLogoutSession } } = await supabase.auth.getSession();

    if (postLogoutSession) {
      log('❌ Session still exists after logout');
      return false;
    }

    log('✅ Session cleared after logout');

    log('✅ Authentication flow test completed successfully!');
    return true;

  } catch (error) {
    log(`❌ Exception: ${error.message}`);
    return false;
  }
}

// Run the test
testAuthFlow()
  .then(success => {
    if (success) {
      log('🎉 Authentication flow test PASSED');
      process.exit(0);
    } else {
      log('💥 Authentication flow test FAILED');
      process.exit(1);
    }
  })
  .catch(error => {
    log(`💥 Test crashed: ${error.message}`);
    process.exit(1);
  });
