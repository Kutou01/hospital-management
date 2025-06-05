const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPatientRelationship() {
  try {
    console.log('🔍 Checking patient relationship...\n');
    
    // Test different patient relationship names
    const patientRelationships = [
      'patients!fk_appointments_patient',
      'patients!fk_appointments_patient_id', 
      'patients!appointments_patient_id_fkey',
      'patients!appointments_patient_fkey',
      'patients',
      'patients!patient_id'
    ];
    
    for (const rel of patientRelationships) {
      try {
        console.log(`Testing: ${rel}`);
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            appointment_id,
            patient_id,
            ${rel} (
              patient_id,
              full_name
            )
          `)
          .limit(1);
        
        if (error) {
          console.log(`❌ ${rel}: ${error.message}`);
        } else {
          console.log(`✅ ${rel}: works!`);
          if (data && data.length > 0) {
            console.log('Sample result:', JSON.stringify(data[0], null, 2));
          }
        }
      } catch (e) {
        console.log(`❌ ${rel}: ${e.message}`);
      }
      console.log('---');
    }
    
    // Also test if we can create an appointment with existing data
    console.log('\n📋 Testing appointment creation with shorter ID...');
    
    const shortId = 'APT' + Date.now().toString().slice(-6);
    console.log('Using ID:', shortId);
    
    const { data: insertData, error: insertError } = await supabase
      .from('appointments')
      .insert({
        appointment_id: shortId,
        patient_id: 'PAT1749103297539',
        doctor_id: 'DOC825571',
        appointment_date: new Date().toISOString().split('T')[0],
        status: 'scheduled',
        notes: 'Test appointment'
      })
      .select();
    
    if (insertError) {
      console.log('❌ Insert failed:', insertError.message);
    } else {
      console.log('✅ Insert succeeded:', insertData);
      
      // Test the query with the new appointment
      console.log('\n📋 Testing query with new appointment...');
      
      const { data: queryData, error: queryError } = await supabase
        .from('appointments')
        .select(`
          appointment_id,
          patient_id,
          doctor_id,
          appointment_date,
          status,
          doctors!fk_appointments_doctor (
            doctor_id,
            full_name,
            specialization
          )
        `)
        .eq('appointment_id', shortId);
      
      if (queryError) {
        console.log('❌ Query failed:', queryError.message);
      } else {
        console.log('✅ Query succeeded:', queryData);
      }
      
      // Clean up
      await supabase
        .from('appointments')
        .delete()
        .eq('appointment_id', shortId);
      console.log('🧹 Cleaned up test appointment');
    }
    
  } catch (error) {
    console.error('❌ Exception:', error.message);
  }
}

checkPatientRelationship();
