#!/usr/bin/env node

/**
 * Script để sửa lỗi infinite recursion trong admin policies
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAdminPolicies() {
  console.log('🔧 Fixing admin policies...\n');
  
  try {
    // Drop existing problematic policies
    console.log('1️⃣ Dropping problematic policies...');
    
    const dropQueries = [
      'DROP POLICY IF EXISTS "Super admins can view all admins" ON admins;',
      'DROP POLICY IF EXISTS "Admins can view own data" ON admins;'
    ];
    
    for (const query of dropQueries) {
      console.log(`Executing: ${query}`);
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.log(`⚠️  Warning: ${error.message}`);
      } else {
        console.log('✅ Success');
      }
    }
    
    // Create new policies without recursion
    console.log('\n2️⃣ Creating new policies...');
    
    const createQueries = [
      `CREATE POLICY "Admins can view own data" ON admins
        FOR SELECT USING (profile_id = auth.uid());`,
      
      `CREATE POLICY "Admins can update own data" ON admins
        FOR UPDATE USING (profile_id = auth.uid());`,
      
      `CREATE POLICY "Allow admin creation" ON admins
        FOR INSERT WITH CHECK (true);`,
      
      `CREATE POLICY "Super admins can view all admins" ON admins
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
          )
        );`,
      
      `CREATE POLICY "Super admins can manage all admins" ON admins
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
          )
        );`
    ];
    
    for (const query of createQueries) {
      console.log(`Executing policy creation...`);
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.error(`❌ Error: ${error.message}`);
      } else {
        console.log('✅ Policy created successfully');
      }
    }
    
    console.log('\n🎉 Admin policies fixed successfully!');
    
  } catch (error) {
    console.error('💥 Failed to fix admin policies:', error);
  }
}

fixAdminPolicies();
