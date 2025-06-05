const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://ciasxkujslgsdgylimw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpYXN4a3Vqc2xnc2RneWxpbXciLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzM0NzY5NzE5LCJleHAiOjIwNTAzNDU3MTl9.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runRLSFix() {
  console.log('🔧 Starting RLS Policies Fix...');
  console.log('=' .repeat(50));

  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'fix-rls-policies.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.includes('SELECT') && statement.includes('as info')) {
        // This is a diagnostic query, execute and show results
        console.log(`\n🔍 Executing diagnostic query ${i + 1}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });

        if (error) {
          console.log(`⚠️ Query ${i + 1} error:`, error.message);
        } else {
          console.log(`✅ Query ${i + 1} results:`, data);
        }
      } else if (statement.includes('DROP POLICY') || statement.includes('CREATE POLICY') || 
                 statement.includes('GRANT') || statement.includes('ALTER TABLE')) {
        // This is a structural change, execute it
        console.log(`\n🔨 Executing statement ${i + 1}: ${statement.substring(0, 50)}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });

        if (error) {
          console.log(`❌ Statement ${i + 1} failed:`, error.message);
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } else if (statement.includes('public.create_user_profile_enhanced')) {
        // This is a test query
        console.log(`\n🧪 Executing test query ${i + 1}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });

        if (error) {
          console.log(`❌ Test ${i + 1} failed:`, error.message);
        } else {
          console.log(`✅ Test ${i + 1} results:`, data);
        }
      }

      // Small delay between statements
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n' + '=' .repeat(50));
    console.log('🎉 RLS Policies Fix completed!');
    
    // Final verification
    console.log('\n🔍 Final verification - checking policies...');
    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT 
          tablename,
          policyname,
          cmd,
          roles
        FROM pg_policies 
        WHERE tablename IN ('patients', 'doctors', 'admins', 'profiles')
        ORDER BY tablename, policyname;
      `
    });

    if (policiesError) {
      console.log('❌ Failed to verify policies:', policiesError.message);
    } else {
      console.log('✅ Current RLS policies:', policies);
    }

    // Test patient registration
    console.log('\n🧪 Testing patient registration...');
    const testUserId = '88888888-8888-8888-8888-888888888888';
    
    const { data: testResult, error: testError } = await supabase.rpc('create_user_profile_enhanced', {
      user_id: testUserId,
      user_email: 'test-rls-patient@example.com',
      user_name: 'Test RLS Patient',
      user_phone: '0123456789',
      user_role: 'patient',
      user_gender: 'other',
      user_specialty: null,
      user_dob: '1990-01-01'
    });

    if (testError) {
      console.log('❌ Patient registration test failed:', testError.message);
    } else {
      console.log('✅ Patient registration test successful:', testResult);
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the fix
runRLSFix().then(() => {
  console.log('\n🏁 Script completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
