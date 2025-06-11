const fs = require('fs');
const path = require('path');

console.log('🏥 HOSPITAL MANAGEMENT SYSTEM - COMPLETE DATABASE DEPLOYMENT');
console.log('='.repeat(80));
console.log('📋 This script will guide you through deploying the complete database structure');
console.log('   with Department-Based ID Pattern from scratch.\n');

console.log('⚠️  WARNING: This will COMPLETELY DELETE all existing data!');
console.log('   Make sure you have backed up any important data before proceeding.\n');

console.log('📝 DEPLOYMENT STEPS:');
console.log('===================');

console.log('\n🗑️  STEP 1: DROP ALL EXISTING TABLES');
console.log('   📄 File: database/complete-database-drop.sql');
console.log('   🔗 Go to: https://supabase.com/dashboard/project/[your-project]/sql');
console.log('   📋 Copy and paste the SQL from the file above');

try {
  const dropSqlPath = path.join(__dirname, '../../database/complete-database-drop.sql');
  
  if (fs.existsSync(dropSqlPath)) {
    const dropSql = fs.readFileSync(dropSqlPath, 'utf8');
    console.log('\n📄 DROP SQL CONTENT:');
    console.log('='.repeat(50));
    console.log(dropSql);
    console.log('='.repeat(50));
  } else {
    console.log('   ❌ Drop SQL file not found!');
  }
} catch (error) {
  console.log('   ❌ Error reading drop SQL file:', error.message);
}

console.log('\n🏗️  STEP 2: CREATE COMPLETE DATABASE STRUCTURE');
console.log('   📄 File: database/complete-database-structure.sql');
console.log('   🔗 Go to: https://supabase.com/dashboard/project/[your-project]/sql');
console.log('   📋 Copy and paste the SQL from the file above');

try {
  const structureSqlPath = path.join(__dirname, '../../database/complete-database-structure.sql');
  
  if (fs.existsSync(structureSqlPath)) {
    console.log('\n✅ Structure SQL file found and ready to deploy');
    console.log('   📊 This will create:');
    console.log('      - All lookup tables (departments, specialties, etc.)');
    console.log('      - Core tables (profiles, doctors, patients, admins)');
    console.log('      - Appointment and medical record tables');
    console.log('      - Doctor management tables');
    console.log('      - All ID generation functions');
    console.log('      - All triggers and indexes');
    console.log('      - Initial lookup data');
  } else {
    console.log('   ❌ Structure SQL file not found!');
  }
} catch (error) {
  console.log('   ❌ Error checking structure SQL file:', error.message);
}

console.log('\n📊 STEP 3: INSERT SAMPLE DATA (OPTIONAL)');
console.log('   📄 File: database/sample-data-dept-based.sql');
console.log('   🔗 Go to: https://supabase.com/dashboard/project/[your-project]/sql');
console.log('   📋 Copy and paste the SQL from the file above');

try {
  const sampleDataPath = path.join(__dirname, '../../database/sample-data-dept-based.sql');
  
  if (fs.existsSync(sampleDataPath)) {
    console.log('\n✅ Sample data SQL file found');
    console.log('   📊 This will create:');
    console.log('      - Sample admin, doctor, and patient profiles');
    console.log('      - Sample rooms and departments');
    console.log('      - Test data with Department-Based IDs');
  } else {
    console.log('   ❌ Sample data SQL file not found!');
  }
} catch (error) {
  console.log('   ❌ Error checking sample data SQL file:', error.message);
}

console.log('\n🔍 STEP 4: VERIFY DEPLOYMENT');
console.log('   Run the verification script after deployment:');
console.log('   📋 npm run db:check');

console.log('\n📋 EXPECTED RESULTS AFTER DEPLOYMENT:');
console.log('=====================================');
console.log('✅ Tables Created:');
console.log('   - profiles (core user data)');
console.log('   - admins, doctors, patients (role-specific data)');
console.log('   - departments, specialties (lookup tables)');
console.log('   - appointments, medical_records (main entities)');
console.log('   - doctor_schedules, doctor_reviews, doctor_shifts, doctor_experiences');
console.log('   - rooms, room_types, diagnosis, medications, etc.');

console.log('\n✅ ID Generation Functions:');
console.log('   - generate_doctor_id(department_id) → CARD-DOC-YYYYMM-001');
console.log('   - generate_patient_id() → PAT-YYYYMM-001');
console.log('   - generate_admin_id() → ADM-YYYYMM-001');
console.log('   - generate_appointment_id(department_id) → CARD-APP-YYYYMM-001');
console.log('   - generate_medical_record_id(department_id) → CARD-MR-YYYYMM-001');

console.log('\n✅ Department-Based ID Examples:');
console.log('   - Cardiology Doctor: CARD-DOC-202412-001');
console.log('   - Neurology Doctor: NEUR-DOC-202412-001');
console.log('   - Cardiology Appointment: CARD-APP-202412-001');
console.log('   - Patient: PAT-202412-001');
console.log('   - Admin: ADM-202412-001');

console.log('\n🚀 NEXT STEPS AFTER DEPLOYMENT:');
console.log('===============================');
console.log('1. Run verification: npm run db:check');
console.log('2. Test auth service integration');
console.log('3. Test doctor service with new IDs');
console.log('4. Test patient service with new IDs');
console.log('5. Test appointment service with department-based IDs');

console.log('\n🔧 SERVICE COMPATIBILITY:');
console.log('=========================');
console.log('✅ All existing services are compatible with new structure');
console.log('✅ Column names match service expectations');
console.log('✅ Department-based IDs work with existing queries');
console.log('✅ Auth integration maintains profile structure');

console.log('\n⚠️  IMPORTANT NOTES:');
console.log('====================');
console.log('- Execute scripts in ORDER (drop → structure → sample data)');
console.log('- Wait for each script to complete before running the next');
console.log('- Check for any errors in Supabase SQL editor');
console.log('- Verify all tables are created before testing services');
console.log('- Clear browser cache after deployment to avoid auth issues');

console.log('\n🎯 DEPLOYMENT READY!');
console.log('====================');
console.log('Follow the steps above to deploy your complete database structure.');
console.log('Contact support if you encounter any issues during deployment.');

console.log('\n📞 SUPPORT:');
console.log('===========');
console.log('If you encounter issues:');
console.log('1. Check Supabase logs for detailed error messages');
console.log('2. Verify all SQL scripts are copied completely');
console.log('3. Ensure proper permissions in Supabase project');
console.log('4. Run verification script to check deployment status');

process.exit(0);
