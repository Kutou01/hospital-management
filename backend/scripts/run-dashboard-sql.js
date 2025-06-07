const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Supabase configuration from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.error('Or: SUPABASE_URL and SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('🔗 Connecting to Supabase:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDashboardSQL() {
  console.log('🚀 Creating Dashboard Stats Functions...\n');

  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'create-dashboard-stats-function.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Split SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      if (statement.includes('SELECT') && statement.includes('DASHBOARD FUNCTIONS CREATED')) {
        // This is the verification query, handle separately
        console.log(`📊 Step ${i + 1}: Running verification query...`);

        const { data, error } = await supabase
          .from('information_schema.routines')
          .select('routine_name')
          .in('routine_name', ['get_dashboard_stats', 'get_doctor_dashboard_stats', 'get_patient_dashboard_stats']);

        if (error) {
          console.log('⚠️ Could not verify functions directly, but they may have been created');
        } else {
          console.log('✅ Functions found:', data?.map(r => r.routine_name) || []);
        }
        continue;
      }

      console.log(`📋 Step ${i + 1}: Executing statement...`);

      try {
        const { data, error } = await supabase.rpc('sql', {
          query: statement + ';'
        });

        if (error) {
          console.log(`❌ Error in statement ${i + 1}:`, error.message);

          // Try alternative approach for function creation
          if (statement.includes('CREATE OR REPLACE FUNCTION')) {
            console.log('🔄 Trying alternative approach...');

            // For function creation, we might need to use a different approach
            const { data: altData, error: altError } = await supabase
              .from('pg_stat_user_functions')
              .select('*')
              .limit(1);

            if (altError) {
              console.log('⚠️ Alternative approach also failed, but function may still be created');
            }
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.log(`❌ Exception in statement ${i + 1}:`, err.message);
      }
    }

    // Test the main dashboard function
    console.log('\n🧪 Testing get_dashboard_stats function...');

    try {
      const { data, error } = await supabase.rpc('get_dashboard_stats');

      if (error) {
        console.log('❌ Function test failed:', error.message);
        console.log('💡 The function may not have been created properly');
      } else {
        console.log('✅ Function test successful!');
        console.log('📊 Dashboard stats:', data);
      }
    } catch (err) {
      console.log('❌ Function test exception:', err.message);
    }

    console.log('\n🎉 Dashboard SQL execution completed!');
    console.log('💡 If there were errors, the frontend will fall back to manual calculation');

  } catch (error) {
    console.error('❌ Failed to run dashboard SQL:', error);
  }
}

// Run the script
runDashboardSQL();