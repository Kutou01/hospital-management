const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestDataWithAuth() {
  console.log('🏥 CREATING TEST DATA WITH SUPABASE AUTH');
  console.log('='.repeat(60));

  try {
    // Step 1: Create doctor users in Supabase Auth
    console.log('📝 Step 1: Creating doctor users in Supabase Auth...');
    
    const doctorUsers = [
      {
        email: 'doctor1@hospital.com',
        password: 'Doctor123!',
        full_name: 'BS. Nguyễn Văn Hùng',
        phone: '0901234567',
        role: 'doctor'
      },
      {
        email: 'doctor2@hospital.com',
        password: 'Doctor123!',
        full_name: 'BS. Trần Thị Lan',
        phone: '0901234568',
        role: 'doctor'
      },
      {
        email: 'doctor3@hospital.com',
        password: 'Doctor123!',
        full_name: 'BS. Lê Minh Tuấn',
        phone: '0901234569',
        role: 'doctor'
      },
      {
        email: 'doctor4@hospital.com',
        password: 'Doctor123!',
        full_name: 'BS. Phạm Thị Mai',
        phone: '0901234570',
        role: 'doctor'
      },
      {
        email: 'doctor5@hospital.com',
        password: 'Doctor123!',
        full_name: 'BS. Hoàng Văn Nam',
        phone: '0901234571',
        role: 'doctor'
      }
    ];

    const createdAuthUsers = [];

    for (const userData of doctorUsers) {
      console.log(`   Creating auth user: ${userData.email}`);
      
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name,
          phone: userData.phone,
          role: userData.role
        }
      });

      if (authError) {
        console.log(`   ❌ Error creating auth user ${userData.email}:`, authError.message);
        continue;
      }

      console.log(`   ✅ Created auth user: ${userData.email} (ID: ${authUser.user.id})`);
      createdAuthUsers.push({
        ...userData,
        auth_id: authUser.user.id
      });
    }

    console.log(`✅ Created ${createdAuthUsers.length} auth users`);

    // Step 2: Create profiles for the auth users
    console.log('\n📝 Step 2: Creating profiles...');
    
    const profiles = createdAuthUsers.map(user => ({
      id: user.auth_id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      phone_number: user.phone,
      date_of_birth: '1980-01-01', // Default date
      is_active: true,
      email_verified: true,
      phone_verified: false,
      login_count: 0,
      two_factor_enabled: false
    }));

    const { data: createdProfiles, error: profileError } = await supabase
      .from('profiles')
      .upsert(profiles, { onConflict: 'id' })
      .select();

    if (profileError) {
      console.log('❌ Error creating profiles:', profileError.message);
      return;
    }

    console.log(`✅ Created ${createdProfiles.length} profiles`);

    // Step 3: Create doctor records
    console.log('\n📝 Step 3: Creating doctor records...');
    
    const doctors = [
      {
        profile_id: createdAuthUsers[0].auth_id,
        specialty: 'SPEC028', // Tim Mạch Học
        department_id: 'DEPT001',
        license_number: 'VN-HM-1234',
        qualification: 'Tiến sĩ Y khoa, Chuyên khoa II Tim mạch',
        experience_years: 15,
        consultation_fee: 500000,
        gender: 'male',
        address: {
          street: '123 Đường ABC',
          district: 'Quận 1',
          city: 'TP.HCM'
        },
        bio: 'Bác sĩ chuyên khoa tim mạch với 15 năm kinh nghiệm',
        languages_spoken: ['Vietnamese', 'English'],
        availability_status: 'available',
        rating: 4.5,
        total_reviews: 25,
        status: 'active',
        full_name: 'BS. Nguyễn Văn Hùng',
        is_active: true
      },
      {
        profile_id: createdAuthUsers[1].auth_id,
        specialty: 'SPEC030', // Chấn Thương Chỉnh Hình
        department_id: 'DEPT002',
        license_number: 'VN-HM-1235',
        qualification: 'Thạc sĩ Y khoa, Chuyên khoa I Chấn thương chỉnh hình',
        experience_years: 10,
        consultation_fee: 400000,
        gender: 'female',
        address: {
          street: '456 Đường DEF',
          district: 'Quận 3',
          city: 'TP.HCM'
        },
        bio: 'Bác sĩ chuyên khoa chấn thương chỉnh hình',
        languages_spoken: ['Vietnamese'],
        availability_status: 'available',
        rating: 4.8,
        total_reviews: 18,
        status: 'active',
        full_name: 'BS. Trần Thị Lan',
        is_active: true
      },
      {
        profile_id: createdAuthUsers[2].auth_id,
        specialty: 'SPEC032', // Nhi Khoa
        department_id: 'DEPT003',
        license_number: 'VN-HM-1236',
        qualification: 'Tiến sĩ Y khoa, Chuyên khoa II Nhi',
        experience_years: 18,
        consultation_fee: 600000,
        gender: 'male',
        address: {
          street: '789 Đường GHI',
          district: 'Quận 5',
          city: 'TP.HCM'
        },
        bio: 'Bác sĩ nhi khoa với kinh nghiệm phong phú',
        languages_spoken: ['Vietnamese', 'English'],
        availability_status: 'available',
        rating: 4.9,
        total_reviews: 32,
        status: 'active',
        full_name: 'BS. Lê Minh Tuấn',
        is_active: true
      },
      {
        profile_id: createdAuthUsers[3].auth_id,
        specialty: 'SPEC028', // Tim Mạch Học
        department_id: 'DEPT001',
        license_number: 'VN-HM-1237',
        qualification: 'Thạc sĩ Y khoa, Chuyên khoa I Tim mạch',
        experience_years: 12,
        consultation_fee: 450000,
        gender: 'female',
        address: {
          street: '321 Đường JKL',
          district: 'Quận 7',
          city: 'TP.HCM'
        },
        bio: 'Bác sĩ tim mạch chuyên về siêu âm tim',
        languages_spoken: ['Vietnamese', 'English'],
        availability_status: 'available',
        rating: 4.7,
        total_reviews: 22,
        status: 'active',
        full_name: 'BS. Phạm Thị Mai',
        is_active: true
      },
      {
        profile_id: createdAuthUsers[4].auth_id,
        specialty: 'SPEC030', // Chấn Thương Chỉnh Hình
        department_id: 'DEPT002',
        license_number: 'VN-HM-1238',
        qualification: 'Tiến sĩ Y khoa, Chuyên khoa II Chấn thương',
        experience_years: 20,
        consultation_fee: 550000,
        gender: 'male',
        address: {
          street: '654 Đường MNO',
          district: 'Quận 10',
          city: 'TP.HCM'
        },
        bio: 'Bác sĩ chấn thương chỉnh hình với 20 năm kinh nghiệm',
        languages_spoken: ['Vietnamese', 'English', 'French'],
        availability_status: 'available',
        rating: 4.6,
        total_reviews: 28,
        status: 'active',
        full_name: 'BS. Hoàng Văn Nam',
        is_active: true
      }
    ];

    const { data: createdDoctors, error: doctorError } = await supabase
      .from('doctors')
      .upsert(doctors, { onConflict: 'license_number' })
      .select();

    if (doctorError) {
      console.log('❌ Error creating doctors:', doctorError.message);
      return;
    }

    console.log(`✅ Created ${createdDoctors.length} doctors`);

    // Step 4: Create some appointments for testing
    console.log('\n📝 Step 4: Creating test appointments...');
    
    // Get existing patients
    const { data: existingPatients } = await supabase
      .from('patients')
      .select('patient_id')
      .limit(3);

    if (existingPatients && existingPatients.length > 0 && createdDoctors.length > 0) {
      const today = new Date();
      const appointments = [];

      for (let i = 0; i < 6; i++) {
        const appointmentDate = new Date(today);
        appointmentDate.setDate(today.getDate() + (i - 3)); // Past, present, and future
        
        const hour = 9 + (i % 6); // 9AM to 2PM
        const status = i < 2 ? 'completed' : i < 4 ? 'confirmed' : 'pending';
        
        appointments.push({
          doctor_id: createdDoctors[i % createdDoctors.length].doctor_id,
          patient_id: existingPatients[i % existingPatients.length].patient_id,
          appointment_date: appointmentDate.toISOString().split('T')[0],
          start_time: `${hour.toString().padStart(2, '0')}:00:00`,
          end_time: `${(hour + 1).toString().padStart(2, '0')}:00:00`,
          appointment_type: ['Khám tổng quát', 'Tái khám', 'Khám chuyên khoa'][i % 3],
          status: status,
          notes: `Ghi chú cuộc hẹn ${i + 1}`,
          reason: ['Đau ngực', 'Khám định kỳ', 'Theo dõi điều trị'][i % 3]
        });
      }

      const { data: createdAppointments, error: appointmentError } = await supabase
        .from('appointments')
        .insert(appointments)
        .select();

      if (appointmentError) {
        console.log('❌ Error creating appointments:', appointmentError.message);
      } else {
        console.log(`✅ Created ${createdAppointments.length} appointments`);
      }
    }

    console.log('\n✅ ALL TEST DATA CREATED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   - Auth users: ${createdAuthUsers.length}`);
    console.log(`   - Profiles: ${createdProfiles.length}`);
    console.log(`   - Doctors: ${createdDoctors.length}`);
    console.log('\n🔑 Login credentials:');
    createdAuthUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} / Doctor123!`);
    });

  } catch (error) {
    console.error('❌ Error creating test data:', error.message);
  }
}

async function main() {
  await createTestDataWithAuth();
}

main().catch(console.error);
