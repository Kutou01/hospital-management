#!/usr/bin/env node

/**
 * Test script để kiểm tra đăng nhập admin
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

async function testAdminLogin() {
  console.log('🚀 Testing admin login...\n');
  
  const adminEmail = 'admin@hospital.com';
  const commonPasswords = ['admin123', 'password', '123456', 'admin', 'hospital123'];
  
  try {
    console.log('📧 Admin email:', adminEmail);
    
    for (const password of commonPasswords) {
      console.log(`\n🔄 Trying password: ${password}`);
      
      const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: password
      });
      
      if (!signinError && signinData.user) {
        console.log('✅ Admin login successful with password:', password);
        console.log('👤 Admin ID:', signinData.user.id);
        console.log('📧 Email:', signinData.user.email);
        
        // Get admin profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signinData.user.id)
          .single();
        
        if (profileError) {
          console.error('❌ Admin profile fetch failed:', profileError);
        } else {
          console.log('✅ Admin profile data:', profileData);
          console.log('🎭 Role:', profileData.role);
        }
        
        // Test admin dashboard access
        console.log('\n🏥 Testing admin dashboard access...');
        
        // Check if admin can access all users
        const { data: allUsers, error: usersError } = await supabase
          .from('user_details')
          .select('auth_id, email, full_name, role')
          .limit(10);
        
        if (usersError) {
          console.error('❌ Admin cannot access user list:', usersError);
        } else {
          console.log('✅ Admin can access user list');
          console.log(`📊 Total users visible: ${allUsers.length}`);
          allUsers.forEach(user => {
            console.log(`   - ${user.full_name} (${user.role}) - ${user.email}`);
          });
        }
        
        // Sign out
        await supabase.auth.signOut();
        console.log('\n✅ Admin signed out successfully');
        
        console.log('\n🎉 Admin login test completed successfully!');
        console.log('📧 Admin Email:', adminEmail);
        console.log('🔒 Admin Password:', password);
        console.log('🎭 Role: admin');
        return;
      } else {
        console.log('❌ Failed with password:', password);
      }
    }
    
    console.log('\n❌ Could not login admin with any common password');
    console.log('💡 Admin account may need password reset');
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

testAdminLogin();
