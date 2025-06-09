const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://ciasxktujslgsdgylimv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role key để bypass RLS

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to generate email from full name
function generateEmail(fullName, birthDate = null, patientId = null, counter = null) {
  const normalized = fullName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/đ/g, 'd')
    .replace(/[^a-z\s]/g, '')
    .trim()
    .split(' ')
    .join('');

  let baseEmail = normalized;

  // Handle duplicates
  if (counter && counter > 1) {
    // Strategy 1: Add birth year
    if (birthDate) {
      try {
        const birthYear = birthDate.split('-')[0];
        baseEmail = `${normalized}${birthYear}`;
      } catch {
        // Strategy 2: Add patient ID number
        if (patientId) {
          const patientNum = patientId.match(/(\d+)$/);
          if (patientNum) {
            baseEmail = `${normalized}${patientNum[1]}`;
          } else {
            baseEmail = `${normalized}${counter}`;
          }
        } else {
          baseEmail = `${normalized}${counter}`;
        }
      }
    } else if (patientId) {
      // Strategy 2: Add patient ID number
      const patientNum = patientId.match(/(\d+)$/);
      if (patientNum) {
        baseEmail = `${normalized}${patientNum[1]}`;
      } else {
        baseEmail = `${normalized}${counter}`;
      }
    } else {
      // Strategy 3: Add counter
      baseEmail = `${normalized}${counter}`;
    }
  }

  return `${baseEmail}@hospital.com`;
}

// Function to generate unique email
function generateUniqueEmail(fullName, birthDate, patientId, usedEmails) {
  let counter = 1;
  let email;

  do {
    email = generateEmail(fullName, birthDate, patientId, counter > 1 ? counter : null);
    counter++;

    // Safety check
    if (counter > 1000) {
      const uuid = require('crypto').randomUUID().substring(0, 8);
      email = `${generateEmail(fullName).substring(0, 10)}${uuid}@hospital.com`;
      break;
    }
  } while (usedEmails.has(email));

  usedEmails.add(email);
  return email;
}

// Function to extract phone from emergency contact
function extractPhone(emergencyContact) {
  try {
    const contact = JSON.parse(emergencyContact);
    return contact.phone || null;
  } catch {
    return null;
  }
}

// Main function to import patients data
async function importPatientsData(csvFilePath) {
  console.log('🚀 Starting patients data import...');

  const profiles = [];
  const patients = [];
  const usedEmails = new Set();
  let duplicateCount = 0;

  // Read CSV file
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        // Generate unique email
        const baseEmail = generateEmail(row.full_name);
        const uniqueEmail = generateUniqueEmail(
          row.full_name,
          row.date_of_birth,
          row.patient_id,
          usedEmails
        );

        // Check if duplicate was resolved
        if (uniqueEmail !== baseEmail) {
          duplicateCount++;
          console.log(`⚠️  Duplicate email resolved: ${row.full_name} -> ${uniqueEmail}`);
        }

        // Create profile data
        const profile = {
          id: row.profile_id,
          email: uniqueEmail,
          full_name: row.full_name,
          role: 'patient',
          phone_number: extractPhone(row.emergency_contact),
          email_verified: true,
          phone_verified: false,
          is_active: row.status === 'active',
          created_at: row.created_at,
          updated_at: row.updated_at
        };
        
        // Create patient data
        const patient = {
          patient_id: row.patient_id,
          profile_id: row.profile_id,
          full_name: row.full_name,
          date_of_birth: row.date_of_birth,
          gender: row.gender,
          blood_type: row.blood_type || null,
          address: row.address ? JSON.parse(row.address) : null,
          emergency_contact: row.emergency_contact ? JSON.parse(row.emergency_contact) : null,
          insurance_info: row.insurance_info ? JSON.parse(row.insurance_info) : null,
          medical_history: row.medical_history || null,
          allergies: row.allergies ? JSON.parse(row.allergies) : null,
          current_medications: row.current_medications ? JSON.parse(row.current_medications) : null,
          status: row.status,
          notes: row.notes || null,
          created_at: row.created_at,
          updated_at: row.updated_at,
          created_by: row.created_by || null
        };
        
        profiles.push(profile);
        patients.push(patient);
      })
      .on('end', async () => {
        try {
          console.log(`📊 Found ${profiles.length} records to import`);
          
          // Step 1: Insert profiles first
          console.log('📝 Inserting profiles...');
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .upsert(profiles, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            });
          
          if (profilesError) {
            console.error('❌ Error inserting profiles:', profilesError);
            reject(profilesError);
            return;
          }
          
          console.log(`✅ Successfully inserted ${profiles.length} profiles`);
          
          // Step 2: Insert patients
          console.log('👥 Inserting patients...');
          const { data: patientsData, error: patientsError } = await supabase
            .from('patients')
            .upsert(patients, { 
              onConflict: 'patient_id',
              ignoreDuplicates: false 
            });
          
          if (patientsError) {
            console.error('❌ Error inserting patients:', patientsError);
            reject(patientsError);
            return;
          }
          
          console.log(`✅ Successfully inserted ${patients.length} patients`);
          console.log('🎉 Import completed successfully!');
          
          // Verify data
          await verifyImport();
          
          resolve({ profiles: profiles.length, patients: patients.length });
          
        } catch (error) {
          console.error('❌ Import failed:', error);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('❌ Error reading CSV:', error);
        reject(error);
      });
  });
}

// Function to verify import
async function verifyImport() {
  console.log('\n🔍 Verifying import...');
  
  try {
    // Count profiles
    const { count: profileCount, error: profileError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'patient');
    
    if (profileError) {
      console.error('❌ Error counting profiles:', profileError);
      return;
    }
    
    // Count patients
    const { count: patientCount, error: patientError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });
    
    if (patientError) {
      console.error('❌ Error counting patients:', patientError);
      return;
    }
    
    console.log(`📊 Total patient profiles: ${profileCount}`);
    console.log(`👥 Total patients: ${patientCount}`);
    
    // Check for orphaned records
    const { data: orphanedPatients, error: orphanError } = await supabase
      .from('patients')
      .select(`
        patient_id,
        profile_id,
        profiles!inner(id)
      `)
      .is('profiles.id', null);
    
    if (orphanError) {
      console.error('❌ Error checking orphaned records:', orphanError);
      return;
    }
    
    if (orphanedPatients && orphanedPatients.length > 0) {
      console.warn(`⚠️  Found ${orphanedPatients.length} orphaned patient records`);
    } else {
      console.log('✅ All patient records have corresponding profiles');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Function to clean up existing data (optional)
async function cleanupExistingData() {
  console.log('🧹 Cleaning up existing patient data...');
  
  try {
    // Delete existing patients
    const { error: patientsError } = await supabase
      .from('patients')
      .delete()
      .neq('patient_id', 'DUMMY'); // Delete all
    
    if (patientsError) {
      console.error('❌ Error deleting patients:', patientsError);
      return false;
    }
    
    // Delete existing patient profiles
    const { error: profilesError } = await supabase
      .from('profiles')
      .delete()
      .eq('role', 'patient');
    
    if (profilesError) {
      console.error('❌ Error deleting profiles:', profilesError);
      return false;
    }
    
    console.log('✅ Cleanup completed');
    return true;
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    return false;
  }
}

// CLI usage
if (require.main === module) {
  const csvFilePath = process.argv[2];
  const shouldCleanup = process.argv.includes('--cleanup');
  
  if (!csvFilePath) {
    console.error('❌ Please provide CSV file path');
    console.log('Usage: node import-patients-data.js <csv-file-path> [--cleanup]');
    process.exit(1);
  }
  
  if (!supabaseServiceKey) {
    console.error('❌ Please set SUPABASE_SERVICE_ROLE_KEY environment variable');
    process.exit(1);
  }
  
  async function run() {
    try {
      if (shouldCleanup) {
        const cleanupSuccess = await cleanupExistingData();
        if (!cleanupSuccess) {
          process.exit(1);
        }
      }
      
      await importPatientsData(csvFilePath);
      console.log('🎉 All done!');
      
    } catch (error) {
      console.error('❌ Script failed:', error);
      process.exit(1);
    }
  }
  
  run();
}

module.exports = {
  importPatientsData,
  cleanupExistingData,
  verifyImport
};
