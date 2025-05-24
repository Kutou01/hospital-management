// Test script for Supabase Auth integration
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ciasxktujslgsdgylimv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpYXN4a3R1anNsZ3NkZ3lsaW12Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzU1NTU2NSwiZXhwIjoyMDYzMTMxNTY1fQ.R2IieQgCFPQ5sgEqPSJmF9uB1hZasJHg5enl2alJpn4';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUsers() {
  console.log('🧪 Creating test users for Supabase Auth...');

  const testUsers = [
    {
      email: 'admin@hospital.com',
      password: 'admin123',
      role: 'admin',
      full_name: 'Hospital Administrator',
      phone_number: '+84123456789'
    },
    {
      email: 'doctor@hospital.com',
      password: 'doctor123',
      role: 'doctor',
      full_name: 'Dr. Nguyen Van A',
      phone_number: '+84987654321',
      specialty: 'Cardiology',
      license_number: 'DOC123456'
    },
    {
      email: 'patient@hospital.com',
      password: 'patient123',
      role: 'patient',
      full_name: 'Tran Thi B',
      phone_number: '+84555666777',
      date_of_birth: '1990-01-01',
      gender: 'Female',
      address: '123 Main Street, Ho Chi Minh City'
    }
  ];

  for (const userData of testUsers) {
    try {
      console.log(`\n📝 Creating ${userData.role}: ${userData.email}`);

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          role: userData.role,
          full_name: userData.full_name,
          phone_number: userData.phone_number
        }
      });

      if (authError) {
        console.error(`❌ Error creating auth user for ${userData.email}:`, authError.message);
        continue;
      }

      console.log(`✅ Auth user created: ${authData.user.id}`);

      // Wait for trigger to create custom user record
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if custom user was created
      const { data: customUser, error: customUserError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authData.user.id)
        .single();

      if (customUserError) {
        console.error(`❌ Error fetching custom user for ${userData.email}:`, customUserError.message);
        continue;
      }

      console.log(`✅ Custom user created: ${customUser.user_id}`);

      // Create role-specific profile
      if (userData.role === 'doctor') {
        const doctorId = `DOC${Math.floor(100000 + Math.random() * 900000)}`;
        
        const { error: doctorError } = await supabase
          .from('doctors')
          .insert([{
            doctor_id: doctorId,
            user_id: customUser.user_id,
            full_name: userData.full_name,
            specialty: userData.specialty,
            license_number: userData.license_number,
            gender: 'Male',
            phone_number: userData.phone_number,
            email: userData.email
          }]);

        if (doctorError) {
          console.error(`❌ Error creating doctor profile:`, doctorError.message);
        } else {
          // Update user with profile_id
          await supabase
            .from('users')
            .update({ profile_id: doctorId })
            .eq('user_id', customUser.user_id);
          
          console.log(`✅ Doctor profile created: ${doctorId}`);
        }
      } else if (userData.role === 'patient') {
        const patientId = `PAT${Math.floor(100000 + Math.random() * 900000)}`;
        
        const { error: patientError } = await supabase
          .from('patients')
          .insert([{
            patient_id: patientId,
            user_id: customUser.user_id,
            full_name: userData.full_name,
            dateofbirth: userData.date_of_birth,
            gender: userData.gender,
            phone_number: userData.phone_number,
            email: userData.email,
            address: userData.address,
            registration_date: new Date().toISOString().split('T')[0]
          }]);

        if (patientError) {
          console.error(`❌ Error creating patient profile:`, patientError.message);
        } else {
          // Update user with profile_id
          await supabase
            .from('users')
            .update({ profile_id: patientId })
            .eq('user_id', customUser.user_id);
          
          console.log(`✅ Patient profile created: ${patientId}`);
        }
      }

    } catch (error) {
      console.error(`❌ Unexpected error creating ${userData.email}:`, error.message);
    }
  }

  console.log('\n🎉 Test user creation completed!');
}

async function testAuthentication() {
  console.log('\n🔐 Testing authentication...');

  // Test login with admin user
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'admin@hospital.com',
    password: 'admin123'
  });

  if (loginError) {
    console.error('❌ Login failed:', loginError.message);
    return;
  }

  console.log('✅ Login successful:', loginData.user.email);

  // Test getting user data
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', loginData.user.id)
    .single();

  if (userError) {
    console.error('❌ Error fetching user data:', userError.message);
    return;
  }

  console.log('✅ User data retrieved:', {
    id: userData.user_id,
    email: userData.email,
    role: userData.role,
    full_name: userData.full_name
  });

  // Sign out
  await supabase.auth.signOut();
  console.log('✅ Sign out successful');
}

async function checkDatabaseStructure() {
  console.log('\n🔍 Checking database structure...');

  // Check users table
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('user_id, email, role, auth_user_id')
    .limit(5);

  if (usersError) {
    console.error('❌ Error checking users table:', usersError.message);
  } else {
    console.log('✅ Users table:', users.length, 'records');
  }

  // Check doctors table
  const { data: doctors, error: doctorsError } = await supabase
    .from('doctors')
    .select('doctor_id, full_name, specialty, user_id')
    .limit(5);

  if (doctorsError) {
    console.error('❌ Error checking doctors table:', doctorsError.message);
  } else {
    console.log('✅ Doctors table:', doctors.length, 'records');
  }

  // Check patients table
  const { data: patients, error: patientsError } = await supabase
    .from('patients')
    .select('patient_id, full_name, user_id')
    .limit(5);

  if (patientsError) {
    console.error('❌ Error checking patients table:', patientsError.message);
  } else {
    console.log('✅ Patients table:', patients.length, 'records');
  }
}

async function main() {
  console.log('🏥 Hospital Management - Supabase Auth Test');
  console.log('==========================================');

  try {
    await checkDatabaseStructure();
    await createTestUsers();
    await testAuthentication();
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\n📋 Test credentials:');
    console.log('Admin: admin@hospital.com / admin123');
    console.log('Doctor: doctor@hospital.com / doctor123');
    console.log('Patient: patient@hospital.com / patient123');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
main();
