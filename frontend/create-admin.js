#!/usr/bin/env node

/**
 * Script để tạo tài khoản admin
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

async function createAdmin() {
  console.log('🚀 Creating admin account...\n');
  
  const adminEmail = 'admin@hospital.com';
  const adminPassword = 'admin123';
  
  try {
    console.log('📧 Admin email:', adminEmail);
    console.log('🔒 Admin password:', adminPassword);
    
    // Step 1: Create admin user
    console.log('\n1️⃣ Creating admin auth user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: {
          full_name: 'Hospital Administrator',
          role: 'admin',
          phone_number: '0123456789'
        }
      }
    });
    
    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️  Admin user already exists, trying to sign in...');
        
        const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password: adminPassword
        });
        
        if (signinError) {
          console.error('❌ Admin signin failed:', signinError);
          return;
        }
        
        console.log('✅ Admin signin successful');
        console.log('👤 Admin ID:', signinData.user?.id);
        
        // Check if profile exists
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signinData.user.id)
          .single();
        
        if (profileError) {
          console.log('⚠️  Admin profile not found, creating...');
          
          // Create profile manually
          const { data: newProfile, error: newProfileError } = await supabase
            .from('profiles')
            .insert([{
              id: signinData.user.id,
              full_name: 'Hospital Administrator',
              role: 'admin',
              phone_number: '0123456789',
              phone_verified: false,
              email_verified: true,
              is_active: true
            }])
            .select()
            .single();
          
          if (newProfileError) {
            console.error('❌ Failed to create admin profile:', newProfileError);
            return;
          }
          
          console.log('✅ Admin profile created successfully');
        } else {
          console.log('✅ Admin profile already exists');
          console.log('📋 Profile data:', profileData);
        }
        
        await supabase.auth.signOut();
        console.log('✅ Admin account ready for use');
        return;
      } else {
        console.error('❌ Admin auth creation failed:', authError);
        return;
      }
    }
    
    console.log('✅ Admin auth user created successfully');
    console.log('👤 Admin ID:', authData.user?.id);
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
          full_name: 'Hospital Administrator',
          role: 'admin',
          phone_number: '0123456789',
          phone_verified: false,
          email_verified: true,
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
    
    // Step 4: Test admin login
    console.log('\n4️⃣ Testing admin login...');
    const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });
    
    if (signinError) {
      console.error('❌ Admin login test failed:', signinError);
    } else {
      console.log('✅ Admin login test successful');
      console.log('🔑 Session:', signinData.session ? 'Present' : 'Missing');
      
      // Check user details view
      console.log('\n5️⃣ Checking admin in user details view...');
      const { data: userDetails, error: userDetailsError } = await supabase
        .from('user_details')
        .select('*')
        .eq('auth_id', authData.user.id)
        .single();
      
      if (userDetailsError) {
        console.error('❌ User details view error:', userDetailsError);
      } else {
        console.log('✅ Admin in user details view');
        console.log('👤 Admin details:', userDetails);
      }
    }
    
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await supabase.auth.signOut();
    console.log('✅ Signed out successfully');
    
    console.log('\n🎉 Admin account created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔒 Password:', adminPassword);
    console.log('🎭 Role: admin');
    
  } catch (error) {
    console.error('💥 Admin creation failed with error:', error);
  }
}

createAdmin();
