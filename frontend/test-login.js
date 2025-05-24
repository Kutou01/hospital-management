#!/usr/bin/env node

/**
 * Test script để kiểm tra quá trình đăng nhập
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log('🚀 Testing login process...\n');
  
  // Test với user đã có trong database
  const testEmail = 'test@hospital.com';
  const testPassword = 'password123'; // Thử password phổ biến
  
  try {
    console.log('📧 Test email:', testEmail);
    console.log('🔒 Test password:', testPassword);
    
    // Step 1: Attempt login
    console.log('\n1️⃣ Attempting login...');
    const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (signinError) {
      console.error('❌ Login failed:', signinError.message);
      
      // Try with different common passwords
      const commonPasswords = ['123456', 'password', 'test123', 'hospital123'];
      
      for (const pwd of commonPasswords) {
        console.log(`\n🔄 Trying password: ${pwd}`);
        const { data, error } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: pwd
        });
        
        if (!error && data.user) {
          console.log('✅ Login successful with password:', pwd);
          console.log('👤 User ID:', data.user.id);
          console.log('📧 Email:', data.user.email);
          
          // Get user profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          
          if (profileError) {
            console.error('❌ Profile fetch failed:', profileError);
          } else {
            console.log('✅ Profile data:', profileData);
          }
          
          // Sign out
          await supabase.auth.signOut();
          console.log('✅ Signed out successfully');
          return;
        }
      }
      
      console.log('\n❌ Could not login with any common password');
      console.log('💡 You may need to reset the password or create a new test user');
      return;
    }
    
    console.log('✅ Login successful');
    console.log('👤 User ID:', signinData.user?.id);
    console.log('📧 Email:', signinData.user?.email);
    console.log('🔑 Session:', signinData.session ? 'Present' : 'Missing');
    
    // Step 2: Get user profile
    console.log('\n2️⃣ Fetching user profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signinData.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile fetch failed:', profileError);
    } else {
      console.log('✅ Profile data:', profileData);
    }
    
    // Step 3: Check user details view
    console.log('\n3️⃣ Checking user details view...');
    const { data: userDetails, error: userDetailsError } = await supabase
      .from('user_details')
      .select('*')
      .eq('auth_id', signinData.user.id)
      .single();
    
    if (userDetailsError) {
      console.error('❌ User details view error:', userDetailsError);
    } else {
      console.log('✅ User details view working');
      console.log('👤 User details:', userDetails);
    }
    
    // Step 4: Test role-based access
    console.log('\n4️⃣ Testing role-based access...');
    const userRole = profileData?.role;
    console.log('🎭 User role:', userRole);
    
    if (userRole === 'patient') {
      // Test patient-specific data access
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('auth_user_id', signinData.user.id)
        .single();
      
      if (patientError) {
        console.error('❌ Patient data access failed:', patientError);
      } else {
        console.log('✅ Patient data accessible:', patientData);
      }
    } else if (userRole === 'doctor') {
      // Test doctor-specific data access
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('*')
        .eq('auth_user_id', signinData.user.id)
        .single();
      
      if (doctorError) {
        console.error('❌ Doctor data access failed:', doctorError);
      } else {
        console.log('✅ Doctor data accessible:', doctorData);
      }
    }
    
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await supabase.auth.signOut();
    console.log('✅ Signed out successfully');
    
    console.log('\n🎉 Login test completed successfully!');
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

testLogin();
