const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyTableStructures() {
  console.log('🔍 VERIFYING TABLE STRUCTURES FOR FOREIGN KEY READINESS');
  console.log('='.repeat(65));

  // Define expected foreign key relationships with column checks
  const foreignKeyChecks = [
    {
      name: 'appointments → departments',
      sourceTable: 'appointments',
      sourceColumn: 'department_id',
      targetTable: 'departments',
      targetColumn: 'department_id',
      priority: 'HIGH'
    },
    {
      name: 'appointments → rooms',
      sourceTable: 'appointments',
      sourceColumn: 'room_id',
      targetTable: 'rooms',
      targetColumn: 'room_id',
      priority: 'MEDIUM'
    },
    {
      name: 'doctors → departments',
      sourceTable: 'doctors',
      sourceColumn: 'department_id',
      targetTable: 'departments',
      targetColumn: 'department_id',
      priority: 'HIGH'
    },
    {
      name: 'doctors → specialties',
      sourceTable: 'doctors',
      sourceColumn: 'specialty_id',
      targetTable: 'specialties',
      targetColumn: 'specialty_id',
      priority: 'MEDIUM'
    },
    {
      name: 'medical_records → doctors',
      sourceTable: 'medical_records',
      sourceColumn: 'doctor_id',
      targetTable: 'doctors',
      targetColumn: 'doctor_id',
      priority: 'HIGH'
    },
    {
      name: 'doctor_reviews → doctors',
      sourceTable: 'doctor_reviews',
      sourceColumn: 'doctor_id',
      targetTable: 'doctors',
      targetColumn: 'doctor_id',
      priority: 'MEDIUM'
    },
    {
      name: 'doctor_reviews → patients',
      sourceTable: 'doctor_reviews',
      sourceColumn: 'patient_id',
      targetTable: 'patients',
      targetColumn: 'patient_id',
      priority: 'MEDIUM'
    },
    {
      name: 'prescriptions → patients',
      sourceTable: 'prescriptions',
      sourceColumn: 'patient_id',
      targetTable: 'patients',
      targetColumn: 'patient_id',
      priority: 'MEDIUM'
    },
    {
      name: 'prescriptions → doctors',
      sourceTable: 'prescriptions',
      sourceColumn: 'doctor_id',
      targetTable: 'doctors',
      targetColumn: 'doctor_id',
      priority: 'MEDIUM'
    },
    {
      name: 'prescriptions → medications',
      sourceTable: 'prescriptions',
      sourceColumn: 'medication_id',
      targetTable: 'medications',
      targetColumn: 'medication_id',
      priority: 'MEDIUM'
    },
    {
      name: 'rooms → departments',
      sourceTable: 'rooms',
      sourceColumn: 'department_id',
      targetTable: 'departments',
      targetColumn: 'department_id',
      priority: 'MEDIUM'
    },
    {
      name: 'lab_results → patients',
      sourceTable: 'lab_results',
      sourceColumn: 'patient_id',
      targetTable: 'patients',
      targetColumn: 'patient_id',
      priority: 'MEDIUM'
    },
    {
      name: 'billing → patients',
      sourceTable: 'billing',
      sourceColumn: 'patient_id',
      targetTable: 'patients',
      targetColumn: 'patient_id',
      priority: 'MEDIUM'
    }
  ];

  const results = {
    ready: [],
    needsColumn: [],
    targetMissing: [],
    errors: []
  };

  console.log('\n📋 CHECKING TABLE STRUCTURES:');
  console.log('-'.repeat(50));

  for (const check of foreignKeyChecks) {
    console.log(`\n🔍 Checking: ${check.name} (${check.priority})`);
    
    try {
      // Check source table structure
      const { data: sourceData, error: sourceError } = await supabase
        .from(check.sourceTable)
        .select('*')
        .limit(1);

      if (sourceError) {
        console.log(`   ❌ Source table ${check.sourceTable} error: ${sourceError.message}`);
        results.errors.push({...check, error: `Source table error: ${sourceError.message}`});
        continue;
      }

      // Check if source column exists
      const sourceColumns = sourceData && sourceData.length > 0 
        ? Object.keys(sourceData[0]) 
        : [];
      
      const hasSourceColumn = sourceColumns.includes(check.sourceColumn);
      
      if (!hasSourceColumn) {
        console.log(`   ❌ Missing column: ${check.sourceTable}.${check.sourceColumn}`);
        results.needsColumn.push({...check, missingColumn: check.sourceColumn, table: check.sourceTable});
        continue;
      }

      // Check target table structure
      const { data: targetData, error: targetError } = await supabase
        .from(check.targetTable)
        .select('*')
        .limit(1);

      if (targetError) {
        console.log(`   ❌ Target table ${check.targetTable} error: ${targetError.message}`);
        results.targetMissing.push({...check, error: `Target table error: ${targetError.message}`});
        continue;
      }

      // Check if target column exists
      const targetColumns = targetData && targetData.length > 0 
        ? Object.keys(targetData[0]) 
        : [];
      
      const hasTargetColumn = targetColumns.includes(check.targetColumn);
      
      if (!hasTargetColumn) {
        console.log(`   ❌ Missing target column: ${check.targetTable}.${check.targetColumn}`);
        results.needsColumn.push({...check, missingColumn: check.targetColumn, table: check.targetTable});
        continue;
      }

      console.log(`   ✅ Ready: ${check.sourceTable}.${check.sourceColumn} → ${check.targetTable}.${check.targetColumn}`);
      results.ready.push(check);

    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
      results.errors.push({...check, error: err.message});
    }
  }

  // Display summary
  console.log('\n📊 VERIFICATION SUMMARY:');
  console.log('='.repeat(40));
  console.log(`✅ Ready for foreign keys: ${results.ready.length}`);
  console.log(`❌ Need column additions: ${results.needsColumn.length}`);
  console.log(`❌ Target table issues: ${results.targetMissing.length}`);
  console.log(`❌ Other errors: ${results.errors.length}`);

  // Show detailed results
  if (results.ready.length > 0) {
    console.log('\n✅ READY FOR FOREIGN KEY CREATION:');
    console.log('-'.repeat(40));
    results.ready.forEach(item => {
      console.log(`   ${item.priority}: ${item.name}`);
    });
  }

  if (results.needsColumn.length > 0) {
    console.log('\n⚠️  NEED COLUMN ADDITIONS:');
    console.log('-'.repeat(40));
    results.needsColumn.forEach(item => {
      console.log(`   ${item.priority}: ${item.name} - Missing ${item.table}.${item.missingColumn}`);
    });
  }

  if (results.targetMissing.length > 0) {
    console.log('\n❌ TARGET TABLE ISSUES:');
    console.log('-'.repeat(40));
    results.targetMissing.forEach(item => {
      console.log(`   ${item.priority}: ${item.name} - ${item.error}`);
    });
  }

  // Generate SQL for ready foreign keys
  if (results.ready.length > 0) {
    console.log('\n🔧 SQL FOR READY FOREIGN KEYS:');
    console.log('='.repeat(40));
    
    const readySQL = results.ready.map(item => {
      const constraintName = `${item.sourceTable}_${item.sourceColumn}_fkey`;
      return `
-- ${item.name} (${item.priority})
ALTER TABLE ${item.sourceTable}
ADD CONSTRAINT ${constraintName}
FOREIGN KEY (${item.sourceColumn}) REFERENCES ${item.targetTable}(${item.targetColumn});`;
    }).join('\n');

    console.log(readySQL);

    // Save ready SQL to file
    const fs = require('fs');
    const readyFilePath = './ready-foreign-keys.sql';
    fs.writeFileSync(readyFilePath, readySQL);
    console.log(`\n💾 Ready foreign keys SQL saved to: ${readyFilePath}`);
  }

  // Generate SQL for missing columns
  if (results.needsColumn.length > 0) {
    console.log('\n🔧 SQL FOR MISSING COLUMNS:');
    console.log('='.repeat(40));
    
    const columnSQL = results.needsColumn.map(item => {
      // Determine column type based on target
      let columnType = 'UUID';
      if (item.targetColumn.includes('id')) {
        if (item.targetTable === 'departments' || item.targetTable === 'specialties') {
          columnType = 'VARCHAR(50)';
        } else {
          columnType = 'UUID';
        }
      }
      
      return `
-- Add missing column for ${item.name}
ALTER TABLE ${item.table}
ADD COLUMN ${item.missingColumn} ${columnType};`;
    }).join('\n');

    console.log(columnSQL);

    // Save column SQL to file
    const fs = require('fs');
    const columnFilePath = './missing-columns.sql';
    fs.writeFileSync(columnFilePath, columnSQL);
    console.log(`\n💾 Missing columns SQL saved to: ${columnFilePath}`);
  }

  // Overall recommendation
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('='.repeat(30));
  
  if (results.needsColumn.length > 0) {
    console.log('1️⃣ First, add missing columns using missing-columns.sql');
  }
  
  if (results.ready.length > 0) {
    console.log('2️⃣ Then, create foreign keys using ready-foreign-keys.sql');
  }
  
  if (results.targetMissing.length > 0) {
    console.log('3️⃣ Fix target table issues before proceeding');
  }

  const completionRate = Math.round((results.ready.length / foreignKeyChecks.length) * 100);
  console.log(`\n📊 Current readiness: ${completionRate}% (${results.ready.length}/${foreignKeyChecks.length})`);
  
  if (completionRate >= 80) {
    console.log('🎉 Your database is well-prepared for foreign key relationships!');
  } else if (completionRate >= 50) {
    console.log('👍 Good progress, some work needed on missing columns');
  } else {
    console.log('⚠️  Significant preparation needed before adding foreign keys');
  }
}

verifyTableStructures().catch(console.error);
