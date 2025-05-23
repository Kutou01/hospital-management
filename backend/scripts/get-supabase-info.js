const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function getSupabaseInfo() {
  log('magenta', '🔍 Supabase Project Information');
  log('magenta', '==============================');
  
  // Check environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || supabaseUrl === 'your-supabase-project-url') {
    log('red', '❌ SUPABASE_URL not configured');
    log('yellow', '📋 Please add your Supabase project URL to .env file');
    log('cyan', '   Example: SUPABASE_URL=https://your-project-id.supabase.co');
    return;
  }

  if (!supabaseKey || supabaseKey === 'your-supabase-service-role-key') {
    log('red', '❌ SUPABASE_SERVICE_ROLE_KEY not configured');
    log('yellow', '📋 Please add your Supabase service role key to .env file');
    return;
  }

  log('blue', `🔗 Project URL: ${supabaseUrl}`);
  
  // Extract project ID from URL
  const projectId = supabaseUrl.split('//')[1]?.split('.')[0];
  if (projectId) {
    log('cyan', `🆔 Project ID: ${projectId}`);
    log('cyan', `🌐 Dashboard: https://supabase.com/dashboard/project/${projectId}`);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection
    log('blue', '🔄 Testing connection...');
    
    // Try to get database info
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(1);

    if (error) {
      log('yellow', '⚠️  Direct table query failed, trying alternative method...');
      
      // Try a simple query that should work
      const { data: testData, error: testError } = await supabase
        .rpc('version');
      
      if (testError) {
        log('red', `❌ Connection test failed: ${testError.message}`);
        return;
      }
    }

    log('green', '✅ Connection successful!');
    console.log('');

    // Get available tables by trying common ones
    log('cyan', '📊 Checking for existing tables...');
    
    const commonTables = [
      'users', 'doctors', 'patients', 'appointments', 
      'departments', 'rooms', 'medical_records', 
      'prescriptions', 'billing', 'payments'
    ];

    const existingTables = [];
    const tableInfo = {};

    for (const tableName of commonTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          existingTables.push(tableName);
          tableInfo[tableName] = count || 0;
          log('green', `  ✅ ${tableName}: ${count || 0} records`);
        }
      } catch (err) {
        // Table doesn't exist, skip
      }
    }

    if (existingTables.length === 0) {
      log('yellow', '⚠️  No common hospital management tables found');
      log('cyan', '📋 This appears to be a fresh Supabase project');
    } else {
      log('green', `✅ Found ${existingTables.length} existing tables`);
      console.log('');
      
      // Show table summary
      log('cyan', '📊 Table Summary:');
      for (const [table, count] of Object.entries(tableInfo)) {
        log('white', `   ${table}: ${count} records`);
      }
    }

    console.log('');
    
    // Check for authentication tables
    log('cyan', '🔐 Checking authentication setup...');
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (!authError) {
        log('green', `✅ Supabase Auth enabled: ${authUsers.users?.length || 0} users`);
      }
    } catch (authErr) {
      log('yellow', '⚠️  Could not check Supabase Auth status');
    }

    // Check for storage
    log('cyan', '📁 Checking storage setup...');
    try {
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
      
      if (!storageError) {
        log('green', `✅ Supabase Storage enabled: ${buckets?.length || 0} buckets`);
        if (buckets && buckets.length > 0) {
          buckets.forEach(bucket => {
            log('white', `   📦 ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
          });
        }
      }
    } catch (storageErr) {
      log('yellow', '⚠️  Could not check Supabase Storage status');
    }

    console.log('');
    
    // Generate recommendations
    log('magenta', '🎯 Recommendations');
    log('magenta', '==================');
    
    if (existingTables.length > 0) {
      log('green', '✅ You have existing data - Perfect for microservices migration!');
      log('cyan', '📋 Recommended next steps:');
      log('white', '   1. Run database analysis: node scripts/analyze-existing-database.js');
      log('white', '   2. Setup microservices: ./scripts/setup-with-supabase.sh');
      log('white', '   3. Test integration: node scripts/test-supabase-integration.js');
    } else {
      log('yellow', '⚠️  No existing data found');
      log('cyan', '📋 Recommended approach:');
      log('white', '   1. Create tables using Supabase dashboard or SQL editor');
      log('white', '   2. Setup microservices: ./scripts/setup-with-supabase.sh');
      log('white', '   3. Import existing data if any');
    }

    console.log('');
    
    // Show useful links
    log('blue', '🔗 Useful Links:');
    log('cyan', `   Dashboard: https://supabase.com/dashboard/project/${projectId}`);
    log('cyan', `   Table Editor: https://supabase.com/dashboard/project/${projectId}/editor`);
    log('cyan', `   SQL Editor: https://supabase.com/dashboard/project/${projectId}/sql`);
    log('cyan', `   API Docs: https://supabase.com/dashboard/project/${projectId}/api`);
    log('cyan', `   Settings: https://supabase.com/dashboard/project/${projectId}/settings/api`);

  } catch (error) {
    log('red', `❌ Error getting Supabase info: ${error.message}`);
    
    if (error.message.includes('Invalid API key')) {
      log('yellow', '🔑 Please check your SUPABASE_SERVICE_ROLE_KEY in .env file');
    } else if (error.message.includes('fetch')) {
      log('yellow', '🌐 Please check your SUPABASE_URL in .env file');
    }
  }
}

// Run the info gathering
getSupabaseInfo().catch(error => {
  log('red', `❌ Failed to get Supabase info: ${error.message}`);
  process.exit(1);
});
