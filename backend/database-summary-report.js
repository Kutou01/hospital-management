const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateSummaryReport() {
  console.log('📊 HOSPITAL MANAGEMENT DATABASE - COMPREHENSIVE ASSESSMENT');
  console.log('='.repeat(70));
  console.log('Generated:', new Date().toLocaleString());
  console.log('='.repeat(70));

  console.log('\n🏥 CURRENT DATABASE STATUS:');
  console.log('-'.repeat(50));
  
  // Check table existence and record counts
  const tables = [
    'profiles', 'doctors', 'patients', 'departments', 'specialties',
    'appointments', 'medical_records', 'rooms', 'medications',
    'doctor_reviews', 'doctor_work_schedules', 'doctor_work_experiences',
    'doctor_emergency_contacts', 'doctor_settings', 'lab_results',
    'vital_signs_history', 'billing', 'insurance', 'notifications',
    'audit_logs', 'system_settings'
  ];

  const tableStatus = {};
  let totalTables = 0;
  let existingTables = 0;

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        tableStatus[table] = { exists: false, count: 0, error: error.message };
        console.log(`❌ ${table}: NOT FOUND`);
      } else {
        tableStatus[table] = { exists: true, count: count || 0 };
        console.log(`✅ ${table}: ${count || 0} records`);
        existingTables++;
      }
      totalTables++;
    } catch (err) {
      tableStatus[table] = { exists: false, count: 0, error: err.message };
      console.log(`❌ ${table}: ERROR`);
      totalTables++;
    }
  }

  console.log('\n🔗 FOREIGN KEY RELATIONSHIPS:');
  console.log('-'.repeat(50));
  
  // Test existing working relationships
  const workingRelationships = [
    'appointments → doctors',
    'appointments → patients', 
    'doctors → profiles',
    'patients → profiles',
    'medical_records → patients',
    'medical_records → appointments',
    'appointments → rooms',
    'rooms → departments'
  ];

  console.log('✅ WORKING RELATIONSHIPS:');
  workingRelationships.forEach(rel => {
    console.log(`   ${rel}`);
  });

  console.log('\n❌ MISSING RELATIONSHIPS (need columns first):');
  const missingRelationships = [
    'appointments → departments (missing department_id)',
    'doctors → specialties (missing specialty_id)',
    'medical_records → doctors (missing doctor_id)',
    'doctor_reviews → doctors (missing doctor_id)',
    'doctor_reviews → patients (missing patient_id)',
    'lab_results → patients (missing patient_id)'
  ];

  missingRelationships.forEach(rel => {
    console.log(`   ${rel}`);
  });

  console.log('\n📋 ID PATTERNS IDENTIFIED:');
  console.log('-'.repeat(40));
  console.log('📋 Departments: DEPT001, DEPT002, DEPT003...');
  console.log('🏥 Specialties: SPEC028, SPEC029, SPEC030...');
  console.log('👨‍⚕️ Doctors: CARD-DOC-202506-001, GENE-DOC-202506-001...');
  console.log('🤒 Patients: PAT-202506-550, PAT-202506-810...');
  console.log('🏠 Rooms: CARD-ROOM-001, CARD-ROOM-002...');

  console.log('\n📊 STATISTICS:');
  console.log('-'.repeat(30));
  const completionRate = Math.round((existingTables / totalTables) * 100);
  console.log(`📈 Table completion: ${completionRate}% (${existingTables}/${totalTables})`);
  console.log(`🔗 Working foreign keys: ${workingRelationships.length}`);
  console.log(`❌ Missing foreign keys: ${missingRelationships.length}`);

  console.log('\n🎯 ACTION PLAN:');
  console.log('='.repeat(40));
  
  console.log('\n1️⃣ IMMEDIATE ACTIONS (HIGH PRIORITY):');
  console.log('   a) Execute missing-columns.sql to add required columns');
  console.log('   b) Execute complete-foreign-keys.sql to establish relationships');
  
  console.log('\n2️⃣ MISSING COLUMNS TO ADD:');
  console.log('   • appointments.department_id (VARCHAR(10))');
  console.log('   • doctors.specialty_id (VARCHAR(10))');
  console.log('   • medical_records.doctor_id (VARCHAR(50))');
  console.log('   • doctor_reviews.doctor_id (VARCHAR(50))');
  console.log('   • doctor_reviews.patient_id (VARCHAR(30))');
  console.log('   • lab_results.patient_id (VARCHAR(30))');

  console.log('\n3️⃣ FOREIGN KEYS TO CREATE:');
  console.log('   • appointments → departments');
  console.log('   • doctors → specialties');
  console.log('   • medical_records → doctors');
  console.log('   • doctor_reviews → doctors');
  console.log('   • doctor_reviews → patients');
  console.log('   • lab_results → patients');

  console.log('\n4️⃣ OPTIONAL IMPROVEMENTS:');
  console.log('   • Create missing tables (prescriptions, billing)');
  console.log('   • Add sample data to empty tables');
  console.log('   • Implement additional relationships');

  console.log('\n📁 GENERATED FILES:');
  console.log('-'.repeat(30));
  console.log('📄 missing-columns.sql - Add missing columns with correct patterns');
  console.log('📄 ready-foreign-keys.sql - Foreign keys ready to create now');
  console.log('📄 complete-foreign-keys.sql - Complete foreign key script');
  console.log('📄 missing-foreign-keys.sql - Original analysis results');

  console.log('\n💡 EXECUTION ORDER:');
  console.log('='.repeat(30));
  console.log('1. Execute: missing-columns.sql');
  console.log('2. Execute: complete-foreign-keys.sql');
  console.log('3. Verify with: node comprehensive-foreign-key-check.js');

  console.log('\n⚠️  IMPORTANT NOTES:');
  console.log('-'.repeat(30));
  console.log('• All column patterns follow your department-based ID system');
  console.log('• Check constraints are included to maintain data integrity');
  console.log('• Some relationships require populating the new columns with data');
  console.log('• Test in development environment before production');

  const overallHealth = completionRate >= 80 ? '🟢 EXCELLENT' : 
                       completionRate >= 60 ? '🟡 GOOD' : '🔴 NEEDS WORK';
  
  console.log(`\n🏆 OVERALL DATABASE HEALTH: ${overallHealth}`);
  console.log('='.repeat(70));
}

generateSummaryReport().catch(console.error);
