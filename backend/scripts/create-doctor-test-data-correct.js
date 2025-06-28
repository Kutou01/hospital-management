const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDoctorTestData() {
  console.log('🏥 CREATING DOCTOR TEST DATA WITH CORRECT SCHEMA');
  console.log('='.repeat(60));

  try {
    // Step 1: Create doctor profiles
    console.log('📝 Step 1: Creating doctor profiles...');
    
    const doctorProfiles = [
      {
        email: 'doctor1@hospital.com',
        role: 'doctor',
        full_name: 'BS. Nguyễn Văn Hùng',
        phone_number: '0901234567',
        date_of_birth: '1980-05-15',
        is_active: true,
        email_verified: true,
        phone_verified: false,
        login_count: 0,
        two_factor_enabled: false
      },
      {
        email: 'doctor2@hospital.com', 
        role: 'doctor',
        full_name: 'BS. Trần Thị Lan',
        phone_number: '0901234568',
        date_of_birth: '1985-08-20',
        is_active: true,
        email_verified: true,
        phone_verified: false,
        login_count: 0,
        two_factor_enabled: false
      },
      {
        email: 'doctor3@hospital.com',
        role: 'doctor', 
        full_name: 'BS. Lê Minh Tuấn',
        phone_number: '0901234569',
        date_of_birth: '1978-12-10',
        is_active: true,
        email_verified: true,
        phone_verified: false,
        login_count: 0,
        two_factor_enabled: false
      },
      {
        email: 'doctor4@hospital.com',
        role: 'doctor',
        full_name: 'BS. Phạm Thị Mai',
        phone_number: '0901234570',
        date_of_birth: '1982-03-25',
        is_active: true,
        email_verified: true,
        phone_verified: false,
        login_count: 0,
        two_factor_enabled: false
      },
      {
        email: 'doctor5@hospital.com',
        role: 'doctor',
        full_name: 'BS. Hoàng Văn Nam',
        phone_number: '0901234571',
        date_of_birth: '1975-11-08',
        is_active: true,
        email_verified: true,
        phone_verified: false,
        login_count: 0,
        two_factor_enabled: false
      }
    ];

    const { data: createdProfiles, error: profileError } = await supabase
      .from('profiles')
      .upsert(doctorProfiles, { onConflict: 'email' })
      .select();

    if (profileError) {
      console.log('❌ Error creating doctor profiles:', profileError.message);
      return;
    }

    console.log(`✅ Created ${createdProfiles.length} doctor profiles`);

    // Step 2: Create doctor records
    console.log('\n📝 Step 2: Creating doctor records...');
    
    const doctors = [
      {
        profile_id: createdProfiles[0].id,
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
        profile_id: createdProfiles[1].id,
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
        profile_id: createdProfiles[2].id,
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
        profile_id: createdProfiles[3].id,
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
        profile_id: createdProfiles[4].id,
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

    // Step 3: Create patient test data
    console.log('\n📝 Step 3: Creating patient test data...');
    
    const patientProfiles = [
      {
        email: 'patient1@test.com',
        role: 'patient',
        full_name: 'Nguyễn Thị Hoa',
        phone_number: '0987654321',
        date_of_birth: '1990-06-15',
        is_active: true,
        email_verified: true,
        phone_verified: false,
        login_count: 0,
        two_factor_enabled: false
      },
      {
        email: 'patient2@test.com',
        role: 'patient', 
        full_name: 'Trần Văn Minh',
        phone_number: '0987654322',
        date_of_birth: '1985-03-20',
        is_active: true,
        email_verified: true,
        phone_verified: false,
        login_count: 0,
        two_factor_enabled: false
      },
      {
        email: 'patient3@test.com',
        role: 'patient',
        full_name: 'Lê Thị Mai',
        phone_number: '0987654323', 
        date_of_birth: '1992-12-10',
        is_active: true,
        email_verified: true,
        phone_verified: false,
        login_count: 0,
        two_factor_enabled: false
      }
    ];

    const { data: createdPatientProfiles, error: patientProfileError } = await supabase
      .from('profiles')
      .upsert(patientProfiles, { onConflict: 'email' })
      .select();

    if (patientProfileError) {
      console.log('❌ Error creating patient profiles:', patientProfileError.message);
      return;
    }

    const patients = [
      {
        profile_id: createdPatientProfiles[0].id,
        gender: 'female',
        blood_type: 'A+',
        address: {
          street: '123 Đường Lê Lợi',
          district: 'Quận 1',
          city: 'TP.HCM'
        },
        emergency_contact: {
          name: 'Nguyễn Văn An',
          phone: '0912345678',
          relationship: 'Chồng'
        },
        insurance_info: {
          provider: 'BHYT',
          policy_number: 'DN1234567890'
        },
        medical_history: 'Tiền sử cao huyết áp',
        allergies: ['Không có'],
        chronic_conditions: ['Cao huyết áp'],
        current_medications: {
          'Thuốc hạ áp': 'Uống hàng ngày'
        },
        status: 'active',
        full_name: 'Nguyễn Thị Hoa'
      },
      {
        profile_id: createdPatientProfiles[1].id,
        gender: 'male',
        blood_type: 'O+',
        address: {
          street: '456 Đường Nguyễn Huệ',
          district: 'Quận 3',
          city: 'TP.HCM'
        },
        emergency_contact: {
          name: 'Trần Thị Bình',
          phone: '0912345679',
          relationship: 'Vợ'
        },
        insurance_info: {
          provider: 'BHYT',
          policy_number: 'DN1234567891'
        },
        medical_history: 'Tiền sử đái tháo đường',
        allergies: ['Dị ứng thuốc kháng sinh'],
        chronic_conditions: ['Đái tháo đường type 2'],
        current_medications: {
          'Metformin': '500mg x 2 lần/ngày'
        },
        status: 'active',
        full_name: 'Trần Văn Minh'
      },
      {
        profile_id: createdPatientProfiles[2].id,
        gender: 'female',
        blood_type: 'B+',
        address: {
          street: '789 Đường Pasteur',
          district: 'Quận 5',
          city: 'TP.HCM'
        },
        emergency_contact: {
          name: 'Lê Văn Cường',
          phone: '0912345680',
          relationship: 'Anh trai'
        },
        insurance_info: {
          provider: 'BHYT',
          policy_number: 'DN1234567892'
        },
        medical_history: 'Khỏe mạnh',
        allergies: [],
        chronic_conditions: [],
        current_medications: {},
        status: 'active',
        full_name: 'Lê Thị Mai'
      }
    ];

    const { data: createdPatients, error: patientError } = await supabase
      .from('patients')
      .upsert(patients, { onConflict: 'profile_id' })
      .select();

    if (patientError) {
      console.log('❌ Error creating patients:', patientError.message);
      return;
    }

    console.log(`✅ Created ${createdPatients.length} patients`);

    console.log('\n✅ ALL TEST DATA CREATED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   - Doctor profiles: ${createdProfiles.length}`);
    console.log(`   - Doctor records: ${createdDoctors.length}`);
    console.log(`   - Patient profiles: ${createdPatientProfiles.length}`);
    console.log(`   - Patient records: ${createdPatients.length}`);

  } catch (error) {
    console.error('❌ Error creating test data:', error.message);
  }
}

async function main() {
  await createDoctorTestData();
}

main().catch(console.error);
