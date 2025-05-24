#!/usr/bin/env node

/**
 * Test script để kiểm tra quá trình đăng ký
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

async function testSignup() {
  console.log('🚀 Testing signup process...\n');
  
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  
  try {
    console.log('📧 Test email:', testEmail);
    console.log('🔒 Test password:', testPassword);
    
    // Step 1: Sign up
    console.log('\n1️⃣ Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test Patient User',
          role: 'patient',
          phone_number: '0123456789'
        }
      }
    });
    
    if (authError) {
      console.error('❌ Auth signup failed:', authError);
      return;
    }
    
    console.log('✅ Auth user created successfully');
    console.log('👤 User ID:', authData.user?.id);
    console.log('📧 Email:', authData.user?.email);
    console.log('📋 Metadata:', authData.user?.user_metadata);
    
    // Step 2: Wait for trigger to create profile
    console.log('\n2️⃣ Waiting for profile creation trigger...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 3: Check profile creation
    console.log('\n3️⃣ Checking profile creation...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile not found:', profileError);
      
      // Try to create profile manually
      console.log('\n🔧 Attempting manual profile creation...');
      const { data: manualProfile, error: manualError } = await supabase
        .from('profiles')
        .insert([{
          id: authData.user.id,
          full_name: 'Test Patient User',
          role: 'patient',
          phone_number: '0123456789',
          phone_verified: false,
          email_verified: false,
          is_active: true
        }])
        .select()
        .single();
      
      if (manualError) {
        console.error('❌ Manual profile creation failed:', manualError);
        return;
      } else {
        console.log('✅ Manual profile created successfully');
      }
    } else {
      console.log('✅ Profile created by trigger successfully');
      console.log('📋 Profile data:', profileData);
    }
    
    // Step 4: Create patient profile
    console.log('\n4️⃣ Creating patient profile...');
    const patientId = `PAT${Math.floor(100000 + Math.random() * 900000)}`;
    
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .insert([{
        patient_id: patientId,
        auth_user_id: authData.user.id,
        full_name: 'Test Patient User',
        dateofbirth: '1990-01-01',
        gender: 'Male',
        address: 'Test Address',
        registration_date: new Date().toISOString().split('T')[0]
      }])
      .select()
      .single();
    
    if (patientError) {
      console.error('❌ Patient profile creation failed:', patientError);
      console.error('Error details:', {
        message: patientError.message,
        details: patientError.details,
        hint: patientError.hint,
        code: patientError.code
      });
    } else {
      console.log('✅ Patient profile created successfully');
      console.log('🏥 Patient ID:', patientData.patient_id);
    }
    
    // Step 5: Test signin
    console.log('\n5️⃣ Testing signin...');
    const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (signinError) {
      console.error('❌ Signin failed:', signinError);
    } else {
      console.log('✅ Signin successful');
      console.log('🔑 Session:', signinData.session ? 'Present' : 'Missing');
      
      // Check user details view
      console.log('\n6️⃣ Checking user details view...');
      const { data: userDetails, error: userDetailsError } = await supabase
        .from('user_details')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      if (userDetailsError) {
        console.error('❌ User details view error:', userDetailsError);
      } else {
        console.log('✅ User details view working');
        console.log('👤 User details:', userDetails);
      }
    }
    
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await supabase.auth.signOut();
    console.log('✅ Signed out successfully');
    
    console.log('\n🎉 Signup test completed successfully!');
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

testSignup();
