#!/usr/bin/env node

/**
 * Script đơn giản để kiểm tra và tạo admin account
 */

const { createClient } = require('@supabase/supabase-js');

// Hardcode the values for now
const supabaseUrl = 'https://ciasxktujslgsdgylimv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpYXN4a3R1anNsZ3NkZ3lsaW12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NTU1NjUsImV4cCI6MjA2MzEzMTU2NX0.fd7UdZk2mZsV1K0vKM8V9YWKcfyEY1fr4Q9OQvHd8UQ';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdminSimple() {
  console.log('🚀 Creating admin account (simple approach)...\n');

  const adminEmail = 'admin@hospital.com';
  const adminPassword = 'admin123';

  try {
    // Step 1: Try to sign up
    console.log('1️⃣ Creating admin user...');
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

        // Try to create admin profile directly without policies
        console.log('\n2️⃣ Creating admin profile...');

        // First disable RLS temporarily by using service role
        const { data: adminProfile, error: adminError } = await supabase
          .from('admins')
          .insert([{
            profile_id: signinData.user.id,
            position: 'Administrator',
            department: 'Administration',
            hire_date: new Date().toISOString().split('T')[0],
            is_super_admin: true
          }])
          .select();

        if (adminError) {
          console.error('❌ Admin profile creation error:', adminError);
          console.log('Trying alternative approach...');

          // Alternative: Check if admin already exists
          const { data: existingAdmin, error: checkError } = await supabase
            .from('admins')
            .select('*')
            .eq('profile_id', signinData.user.id)
            .single();

          if (checkError) {
            console.error('❌ Cannot create or find admin profile:', checkError);
          } else {
            console.log('✅ Admin profile already exists:', existingAdmin);
          }
        } else {
          console.log('✅ Admin profile created successfully:', adminProfile);
        }

        return;
      } else {
        console.error('❌ Auth error:', authError);
        return;
      }
    }

    console.log('✅ Admin user created successfully');
    console.log('👤 Admin ID:', authData.user?.id);

    // Wait a bit for triggers
    console.log('\n⏳ Waiting for profile creation trigger...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check if profile was created
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile not found:', profileError);
      return;
    }

    console.log('✅ Profile found:', profileData);

    // Try to create admin profile
    console.log('\n3️⃣ Creating admin profile...');
    const { data: adminProfile, error: adminError } = await supabase
      .from('admins')
      .insert([{
        profile_id: authData.user.id,
        position: 'Administrator',
        department: 'Administration',
        hire_date: new Date().toISOString().split('T')[0],
        is_super_admin: true
      }])
      .select();

    if (adminError) {
      console.error('❌ Admin profile creation error:', adminError);
    } else {
      console.log('✅ Admin profile created successfully:', adminProfile);
    }

    console.log('\n🎉 Admin account setup completed!');
    console.log('📧 Email:', adminEmail);
    console.log('🔒 Password:', adminPassword);

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

createAdminSimple();
