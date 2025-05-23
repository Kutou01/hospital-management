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
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTable(data) {
  console.table(data);
}

async function analyzeDatabase() {
  log('magenta', '🔍 Analyzing Existing Supabase Database');
  log('magenta', '=====================================');
  
  try {
    // Check if Supabase credentials are configured
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      log('red', '❌ Supabase credentials not found in .env file');
      log('yellow', '📋 Please add your Supabase URL and Service Role Key to .env file');
      return;
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    log('blue', `🔗 Connecting to: ${process.env.SUPABASE_URL}`);
    console.log('');

    // Get all tables using PostgreSQL system tables
    log('cyan', '📊 Discovering Tables...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_info');

    if (tablesError) {
      // Fallback: Try to query known tables
      log('yellow', '⚠️  Could not get table list via RPC, trying known tables...');
      await analyzeKnownTables(supabase);
      return;
    }

    if (!tables || tables.length === 0) {
      log('yellow', '⚠️  No tables found, trying known tables...');
      await analyzeKnownTables(supabase);
      return;
    }

    log('green', `✅ Found ${tables.length} tables`);
    console.log('');

    // Analyze each table
    for (const table of tables) {
      await analyzeTable(supabase, table.table_name);
    }

    // Generate migration plan
    await generateMigrationPlan(supabase);

  } catch (error) {
    log('red', `❌ Error analyzing database: ${error.message}`);
    
    // Try fallback method
    log('yellow', '🔄 Trying fallback analysis...');
    try {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      await analyzeKnownTables(supabase);
    } catch (fallbackError) {
      log('red', `❌ Fallback analysis failed: ${fallbackError.message}`);
    }
  }
}

async function analyzeKnownTables(supabase) {
  log('cyan', '📋 Analyzing Known Hospital Management Tables...');
  
  const knownTables = [
    'users', 'doctors', 'patients', 'appointments', 
    'departments', 'rooms', 'medical_records', 'prescriptions',
    'billing', 'payments', 'schedules', 'availability'
  ];

  const existingTables = [];
  const tableAnalysis = {};

  for (const tableName of knownTables) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (!error) {
        existingTables.push(tableName);
        tableAnalysis[tableName] = {
          exists: true,
          rowCount: count || 0,
          error: null
        };
        log('green', `✅ ${tableName}: ${count || 0} records`);
      }
    } catch (tableError) {
      tableAnalysis[tableName] = {
        exists: false,
        rowCount: 0,
        error: tableError.message
      };
      log('red', `❌ ${tableName}: Not found`);
    }
  }

  console.log('');
  log('cyan', '📊 Table Analysis Summary:');
  logTable(tableAnalysis);

  // Analyze existing tables in detail
  for (const tableName of existingTables) {
    await analyzeTable(supabase, tableName);
  }

  // Generate migration plan based on existing tables
  await generateMigrationPlan(supabase, existingTables, tableAnalysis);
}

async function analyzeTable(supabase, tableName) {
  try {
    log('blue', `🔍 Analyzing table: ${tableName}`);
    
    // Get sample data
    const { data: sampleData, error: sampleError } = await supabase
      .from(tableName)
      .select('*')
      .limit(3);

    if (sampleError) {
      log('red', `  ❌ Error reading ${tableName}: ${sampleError.message}`);
      return;
    }

    // Get row count
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      log('yellow', `  ⚠️  Could not get count for ${tableName}`);
    } else {
      log('green', `  📊 Records: ${count}`);
    }

    // Analyze structure
    if (sampleData && sampleData.length > 0) {
      const columns = Object.keys(sampleData[0]);
      log('cyan', `  📋 Columns (${columns.length}): ${columns.join(', ')}`);
      
      // Show sample data
      if (sampleData.length > 0) {
        log('white', '  📄 Sample data:');
        console.log('  ', JSON.stringify(sampleData[0], null, 2).split('\n').map(line => '    ' + line).join('\n'));
      }
    }

    console.log('');
  } catch (error) {
    log('red', `  ❌ Error analyzing ${tableName}: ${error.message}`);
  }
}

async function generateMigrationPlan(supabase, existingTables = [], tableAnalysis = {}) {
  log('magenta', '🎯 Migration Plan Generation');
  log('magenta', '============================');
  
  const microservices = {
    'auth-service': {
      tables: ['users', 'sessions', 'user_roles', 'permissions'],
      description: 'User authentication and authorization'
    },
    'doctor-service': {
      tables: ['doctors', 'doctor_profiles', 'specializations', 'schedules', 'availability'],
      description: 'Doctor management and scheduling'
    },
    'patient-service': {
      tables: ['patients', 'patient_profiles', 'medical_history', 'emergency_contacts'],
      description: 'Patient management and medical records'
    },
    'appointment-service': {
      tables: ['appointments', 'appointment_slots', 'bookings'],
      description: 'Appointment booking and management'
    },
    'department-service': {
      tables: ['departments', 'rooms', 'facilities'],
      description: 'Hospital departments and room management'
    },
    'medical-service': {
      tables: ['medical_records', 'prescriptions', 'diagnoses', 'treatments'],
      description: 'Medical records and treatment management'
    },
    'billing-service': {
      tables: ['billing', 'payments', 'invoices', 'insurance'],
      description: 'Billing and payment processing'
    }
  };

  log('cyan', '📋 Recommended Microservices Architecture:');
  console.log('');

  const migrationPlan = {};

  for (const [serviceName, serviceInfo] of Object.entries(microservices)) {
    log('blue', `🏥 ${serviceName.toUpperCase()}`);
    log('white', `   Description: ${serviceInfo.description}`);
    
    const foundTables = [];
    const missingTables = [];
    
    for (const table of serviceInfo.tables) {
      if (existingTables.includes(table)) {
        foundTables.push(table);
        const count = tableAnalysis[table]?.rowCount || 0;
        log('green', `   ✅ ${table} (${count} records)`);
      } else {
        missingTables.push(table);
        log('yellow', `   ⚠️  ${table} (missing)`);
      }
    }
    
    migrationPlan[serviceName] = {
      foundTables,
      missingTables,
      priority: foundTables.length > 0 ? 'HIGH' : 'LOW',
      readyForMigration: foundTables.length > 0
    };
    
    console.log('');
  }

  // Generate specific migration steps
  log('magenta', '🚀 Next Steps Recommendation');
  log('magenta', '============================');
  
  const highPriorityServices = Object.entries(migrationPlan)
    .filter(([_, info]) => info.priority === 'HIGH')
    .sort((a, b) => b[1].foundTables.length - a[1].foundTables.length);

  if (highPriorityServices.length === 0) {
    log('yellow', '⚠️  No existing tables found for microservices migration');
    log('cyan', '📋 Recommended approach: Start fresh with microservices');
    log('white', '   1. Create new tables in Supabase for each service');
    log('white', '   2. Implement microservices one by one');
    log('white', '   3. Migrate existing data if any');
    return;
  }

  log('green', `✅ Found ${highPriorityServices.length} services ready for migration:`);
  console.log('');

  let step = 1;
  for (const [serviceName, info] of highPriorityServices) {
    log('cyan', `Step ${step}: Migrate ${serviceName}`);
    log('white', `   Tables: ${info.foundTables.join(', ')}`);
    log('white', `   Status: ${info.foundTables.length} tables ready`);
    
    if (info.missingTables.length > 0) {
      log('yellow', `   Missing: ${info.missingTables.join(', ')}`);
    }
    
    console.log('');
    step++;
  }

  // Generate specific commands
  log('blue', '💻 Specific Commands to Run:');
  console.log('');
  
  log('white', '1. Update .env with your Supabase credentials:');
  log('cyan', '   SUPABASE_URL=your-project-url');
  log('cyan', '   SUPABASE_SERVICE_ROLE_KEY=your-service-key');
  console.log('');
  
  log('white', '2. Install dependencies:');
  log('cyan', '   npm install');
  log('cyan', '   cd shared && npm install && npm run build && cd ..');
  log('cyan', '   cd services/auth-service && npm install && cd ../..');
  console.log('');
  
  log('white', '3. Start with highest priority service:');
  const firstService = highPriorityServices[0];
  if (firstService) {
    log('cyan', `   # Start ${firstService[0]} (has ${firstService[1].foundTables.length} existing tables)`);
    log('cyan', '   ./scripts/setup-with-supabase.sh');
  }
  console.log('');
  
  log('white', '4. Test the integration:');
  log('cyan', '   node scripts/test-supabase-integration.js');
  console.log('');

  // Save migration plan to file
  const fs = require('fs');
  const migrationReport = {
    timestamp: new Date().toISOString(),
    supabaseUrl: process.env.SUPABASE_URL,
    existingTables,
    tableAnalysis,
    migrationPlan,
    recommendations: {
      highPriorityServices: highPriorityServices.map(([name, info]) => ({
        service: name,
        foundTables: info.foundTables,
        missingTables: info.missingTables
      }))
    }
  };

  fs.writeFileSync('migration-analysis.json', JSON.stringify(migrationReport, null, 2));
  log('green', '✅ Migration analysis saved to migration-analysis.json');
}

// Run the analysis
analyzeDatabase().catch(error => {
  log('red', `❌ Analysis failed: ${error.message}`);
  process.exit(1);
});
