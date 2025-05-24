// Create test users using regular signup
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ciasxktujslgsdgylimv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpYXN4a3R1anNsZ3NkZ3lsaW12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NTU1NjUsImV4cCI6MjA2MzEzMTU2NX0.fd7UdZk2mZsV1K0vKM8V9YWKcfyEY1fr4Q9OQvHd8UQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestUsers() {
  console.log('🧪 Creating test users...');

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

      // Create user using regular signup
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            role: userData.role,
            full_name: userData.full_name,
            phone_number: userData.phone_number
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          console.log(`✅ ${userData.role} user already exists`);
          continue;
        }
        console.error(`❌ Error creating ${userData.role}:`, error.message);
        continue;
      }

      console.log(`✅ ${userData.role} user created:`, data.user?.email);

      // Wait for trigger to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if custom user was created
      const { data: customUser, error: customUserError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', data.user.id)
        .single();

      if (customUserError) {
        console.error(`❌ Error fetching custom user for ${userData.email}:`, customUserError.message);
        continue;
      }

      console.log(`✅ Custom user created: ${customUser.user_id}`);

      // Create role-specific profile if needed
      if (userData.role === 'doctor' && userData.specialty) {
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
      } else if (userData.role === 'patient' && userData.date_of_birth) {
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

      // Sign out after creating user
      await supabase.auth.signOut();

    } catch (error) {
      console.error(`❌ Unexpected error creating ${userData.email}:`, error.message);
    }
  }

  console.log('\n🎉 Test user creation completed!');
  console.log('\n📋 Test credentials:');
  console.log('Admin: admin@hospital.com / admin123');
  console.log('Doctor: doctor@hospital.com / doctor123');
  console.log('Patient: patient@hospital.com / patient123');
}

createTestUsers();
