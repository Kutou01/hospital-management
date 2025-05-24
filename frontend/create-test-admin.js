#!/usr/bin/env node

/**
 * Script để tạo tài khoản admin test mới
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

async function createTestAdmin() {
  console.log('🚀 Creating test admin account...\n');
  
  const adminEmail = `admin-${Date.now()}@hospital.com`;
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
          full_name: 'Test Hospital Administrator',
          role: 'admin',
          phone_number: '0123456789'
        }
      }
    });
    
    if (authError) {
      console.error('❌ Admin auth creation failed:', authError);
      return;
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
          full_name: 'Test Hospital Administrator',
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
      
      // Test admin access
      console.log('\n5️⃣ Testing admin access...');
      const { data: allUsers, error: usersError } = await supabase
        .from('user_details')
        .select('auth_id, email, full_name, role')
        .limit(5);
      
      if (usersError) {
        console.error('❌ Admin cannot access user list:', usersError);
      } else {
        console.log('✅ Admin can access user list');
        console.log(`📊 Users visible: ${allUsers.length}`);
        allUsers.forEach(user => {
          console.log(`   - ${user.full_name} (${user.role}) - ${user.email}`);
        });
      }
    }
    
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await supabase.auth.signOut();
    console.log('✅ Signed out successfully');
    
    console.log('\n🎉 Test admin account created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔒 Password:', adminPassword);
    console.log('🎭 Role: admin');
    console.log('\n💡 You can now use this account to test admin login on the website');
    
  } catch (error) {
    console.error('💥 Admin creation failed with error:', error);
  }
}

createTestAdmin();
