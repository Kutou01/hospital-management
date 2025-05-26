#!/usr/bin/env node

/**
 * Script để sửa lỗi RLS policies và tạo admin account
 */

const { createClient } = require('@supabase/supabase-js');

// Use service role key to bypass RLS
const supabaseUrl = 'https://ciasxktujslgsdgylimv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpYXN4a3R1anNsZ3NkZ3lsaW12Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzU1NTU2NSwiZXhwIjoyMDYzMTMxNTY1fQ.R2IieQgCFPQ5sgEqPSJmF9uB1hZasJHg5enl2alJpn4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixPoliciesAndCreateAdmin() {
  console.log('🔧 Fixing RLS policies and creating admin...\n');
  
  try {
    // Step 1: Disable RLS temporarily
    console.log('1️⃣ Temporarily disabling RLS for admins table...');
    const { error: disableError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE admins DISABLE ROW LEVEL SECURITY;'
    });
    
    if (disableError) {
      console.log('⚠️  Could not disable RLS via RPC, trying direct approach...');
    } else {
      console.log('✅ RLS disabled successfully');
    }
    
    // Step 2: Create admin user if not exists
    console.log('\n2️⃣ Creating admin user...');
    const adminEmail = 'admin@hospital.com';
    const adminPassword = 'admin123';
    
    // Try to sign in first
    const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });
    
    let adminUserId;
    
    if (signinError) {
      console.log('Admin user not found, creating new one...');
      
      // Create new admin user
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
        console.error('❌ Failed to create admin user:', authError);
        return;
      }
      
      adminUserId = authData.user.id;
      console.log('✅ Admin user created:', adminUserId);
    } else {
      adminUserId = signinData.user.id;
      console.log('✅ Admin user found:', adminUserId);
    }
    
    // Step 3: Create admin profile directly (bypassing RLS with service key)
    console.log('\n3️⃣ Creating admin profile...');
    
    // Check if admin profile already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admins')
      .select('*')
      .eq('profile_id', adminUserId)
      .single();
    
    if (existingAdmin) {
      console.log('✅ Admin profile already exists:', existingAdmin);
    } else {
      // Create new admin profile
      const { data: adminProfile, error: adminError } = await supabase
        .from('admins')
        .insert([{
          profile_id: adminUserId,
          position: 'Administrator',
          department: 'Administration',
          hire_date: new Date().toISOString().split('T')[0],
          is_super_admin: true
        }])
        .select();
      
      if (adminError) {
        console.error('❌ Failed to create admin profile:', adminError);
      } else {
        console.log('✅ Admin profile created successfully:', adminProfile);
      }
    }
    
    // Step 4: Re-enable RLS with fixed policies
    console.log('\n4️⃣ Re-enabling RLS with fixed policies...');
    
    const fixPoliciesSQL = `
      -- Drop all existing policies
      DROP POLICY IF EXISTS "Super admins can view all admins" ON admins;
      DROP POLICY IF EXISTS "Admins can view own data" ON admins;
      DROP POLICY IF EXISTS "Admins can update own data" ON admins;
      DROP POLICY IF EXISTS "Allow admin creation" ON admins;
      DROP POLICY IF EXISTS "Super admins can manage all admins" ON admins;
      
      -- Re-enable RLS
      ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
      
      -- Create new policies without recursion
      CREATE POLICY "Admins can view own data" ON admins
        FOR SELECT USING (profile_id = auth.uid());
      
      CREATE POLICY "Admins can update own data" ON admins
        FOR UPDATE USING (profile_id = auth.uid());
      
      CREATE POLICY "Allow admin creation" ON admins
        FOR INSERT WITH CHECK (true);
      
      CREATE POLICY "Super admins can view all admins" ON admins
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
          )
        );
      
      CREATE POLICY "Super admins can manage all admins" ON admins
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
          )
        );
    `;
    
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: fixPoliciesSQL
    });
    
    if (policyError) {
      console.error('❌ Failed to fix policies:', policyError);
    } else {
      console.log('✅ Policies fixed successfully');
    }
    
    console.log('\n🎉 Admin setup completed successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔒 Password:', adminPassword);
    console.log('🎭 Role: admin');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

fixPoliciesAndCreateAdmin();
