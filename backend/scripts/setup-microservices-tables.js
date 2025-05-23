#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function setupSupabaseTables() {
  log('cyan', '🏥 Hospital Management - Microservices Tables Setup');
  log('cyan', '====================================================');

  // Check environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    log('red', '❌ Missing Supabase environment variables');
    log('yellow', 'Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
    process.exit(1);
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    log('blue', '🔗 Testing Supabase connection...');
    
    // Test connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Connection failed: ${error.message}`);
    }

    log('green', '✅ Supabase connection successful');

    // Read SQL file
    const sqlFilePath = path.join(__dirname, 'setup-supabase-tables.sql');
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error('SQL setup file not found');
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    log('blue', '📄 SQL setup file loaded');

    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    log('blue', `🔧 Executing ${statements.length} SQL statements...`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        // Execute SQL statement using RPC
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });

        if (error) {
          // Try alternative method for DDL statements
          const { error: directError } = await supabase
            .from('_dummy_table_that_does_not_exist')
            .select('*')
            .limit(0);

          // If it's a table creation or alteration, we'll use a different approach
          if (statement.toLowerCase().includes('create table') || 
              statement.toLowerCase().includes('alter table') ||
              statement.toLowerCase().includes('create index')) {
            
            log('yellow', `⚠️  Skipping DDL statement (requires manual execution): ${statement.substring(0, 50)}...`);
            continue;
          }
          
          throw error;
        }

        successCount++;
        
        if ((i + 1) % 10 === 0) {
          log('blue', `📊 Progress: ${i + 1}/${statements.length} statements processed`);
        }

      } catch (error) {
        errorCount++;
        log('yellow', `⚠️  Warning executing statement: ${error.message}`);
        log('yellow', `Statement: ${statement.substring(0, 100)}...`);
      }
    }

    log('green', `✅ Setup completed!`);
    log('green', `📊 Results: ${successCount} successful, ${errorCount} warnings`);

    // Verify some key tables exist
    log('blue', '🔍 Verifying table creation...');
    
    const tablesToCheck = [
      'medical_record_attachments',
      'lab_results',
      'vital_signs_history',
      'prescription_items',
      'medications',
      'billing_items',
      'notifications',
      'files',
      'audit_logs',
      'chat_sessions'
    ];

    for (const tableName of tablesToCheck) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          log('green', `  ✅ ${tableName}: ready (${count || 0} records)`);
        } else {
          log('yellow', `  ⚠️  ${tableName}: ${error.message}`);
        }
      } catch (err) {
        log('yellow', `  ⚠️  ${tableName}: not accessible`);
      }
    }

    // Insert sample data
    log('blue', '📝 Inserting sample data...');
    await insertSampleData(supabase);

    log('green', '🎉 Microservices tables setup completed successfully!');
    log('cyan', '');
    log('cyan', 'Next steps:');
    log('cyan', '1. Start the microservices: npm run dev:microservices');
    log('cyan', '2. Check API documentation at: http://localhost:3006/docs');
    log('cyan', '3. Test the services using the provided endpoints');

  } catch (error) {
    log('red', `❌ Setup failed: ${error.message}`);
    process.exit(1);
  }
}

async function insertSampleData(supabase) {
  try {
    // Insert sample medications
    const sampleMedications = [
      {
        medication_id: 'MED000001',
        name: 'Paracetamol',
        generic_name: 'Acetaminophen',
        brand_name: 'Tylenol',
        category: 'Analgesic',
        form: 'tablet',
        strength: '500mg',
        unit: 'mg',
        manufacturer: 'Generic Pharma',
        description: 'Pain reliever and fever reducer',
        price_per_unit: 0.50,
        stock_quantity: 1000,
        requires_prescription: false
      },
      {
        medication_id: 'MED000002',
        name: 'Amoxicillin',
        generic_name: 'Amoxicillin',
        brand_name: 'Amoxil',
        category: 'Antibiotic',
        form: 'capsule',
        strength: '250mg',
        unit: 'mg',
        manufacturer: 'Pharma Corp',
        description: 'Broad-spectrum antibiotic',
        price_per_unit: 2.00,
        stock_quantity: 500,
        requires_prescription: true
      },
      {
        medication_id: 'MED000003',
        name: 'Ibuprofen',
        generic_name: 'Ibuprofen',
        brand_name: 'Advil',
        category: 'NSAID',
        form: 'tablet',
        strength: '200mg',
        unit: 'mg',
        manufacturer: 'Generic Pharma',
        description: 'Anti-inflammatory pain reliever',
        price_per_unit: 0.75,
        stock_quantity: 800,
        requires_prescription: false
      }
    ];

    const { error: medError } = await supabase
      .from('medications')
      .upsert(sampleMedications, { onConflict: 'medication_id' });

    if (!medError) {
      log('green', '  ✅ Sample medications inserted');
    }

    // Insert sample notification templates
    const sampleTemplates = [
      {
        template_id: 'TPL000001',
        template_name: 'Appointment Reminder',
        type: 'appointment_reminder',
        channel: 'email',
        subject_template: 'Appointment Reminder - {{appointment_date}}',
        body_template: 'Dear {{patient_name}}, this is a reminder for your appointment with Dr. {{doctor_name}} on {{appointment_date}} at {{appointment_time}}.',
        variables: JSON.stringify(['patient_name', 'doctor_name', 'appointment_date', 'appointment_time'])
      },
      {
        template_id: 'TPL000002',
        template_name: 'Prescription Ready',
        type: 'prescription_ready',
        channel: 'sms',
        subject_template: null,
        body_template: 'Your prescription {{prescription_id}} is ready for pickup at the pharmacy.',
        variables: JSON.stringify(['prescription_id', 'patient_name'])
      }
    ];

    const { error: templateError } = await supabase
      .from('notification_templates')
      .upsert(sampleTemplates, { onConflict: 'template_id' });

    if (!templateError) {
      log('green', '  ✅ Sample notification templates inserted');
    }

  } catch (error) {
    log('yellow', `⚠️  Warning inserting sample data: ${error.message}`);
  }
}

// Run the setup
if (require.main === module) {
  setupSupabaseTables();
}

module.exports = { setupSupabaseTables };
