const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Doctor data by department
const doctorsByDepartment = {
  'DEPT001': { // Khoa Tim Mạch
    name: 'Tim Mạch',
    doctors: [
      { name: 'BS. Nguyễn Văn Hùng', specialty: 'SPEC028', qualification: 'Tiến sĩ Y khoa, Chuyên khoa II Tim mạch', experience: 15, fee: 500000, gender: 'male' },
      { name: 'BS. Trần Thị Lan', specialty: 'SPEC029', qualification: 'Thạc sĩ Y khoa, Chuyên khoa I Tim mạch can thiệp', experience: 12, fee: 600000, gender: 'female' },
      { name: 'BS. Lê Minh Tuấn', specialty: 'SPEC028', qualification: 'Tiến sĩ Y khoa, Chuyên khoa II Tim mạch', experience: 18, fee: 550000, gender: 'male' },
      { name: 'BS. Phạm Thị Mai', specialty: 'SPEC029', qualification: 'Thạc sĩ Y khoa, Chuyên khoa I Tim mạch can thiệp', experience: 10, fee: 450000, gender: 'female' },
      { name: 'BS. Hoàng Văn Nam', specialty: 'SPEC028', qualification: 'Tiến sĩ Y khoa, Chuyên khoa II Tim mạch', experience: 20, fee: 650000, gender: 'male' }
    ]
  },
  'DEPT002': { // Khoa Chấn Thương Chỉnh Hình
    name: 'Chấn Thương Chỉnh Hình',
    doctors: [
      { name: 'BS. Vũ Thị Hoa', specialty: 'SPEC030', qualification: 'Tiến sĩ Y khoa, Chuyên khoa II Chấn thương chỉnh hình', experience: 16, fee: 500000, gender: 'female' },
      { name: 'BS. Đặng Văn Minh', specialty: 'SPEC031', qualification: 'Thạc sĩ Y khoa, Chuyên khoa I Phẫu thuật cột sống', experience: 14, fee: 550000, gender: 'male' },
      { name: 'BS. Bùi Thị Linh', specialty: 'SPEC030', qualification: 'Tiến sĩ Y khoa, Chuyên khoa II Chấn thương chỉnh hình', experience: 11, fee: 450000, gender: 'female' },
      { name: 'BS. Trịnh Văn Đức', specialty: 'SPEC031', qualification: 'Thạc sĩ Y khoa, Chuyên khoa I Phẫu thuật cột sống', experience: 13, fee: 480000, gender: 'male' },
      { name: 'BS. Lý Thị Nga', specialty: 'SPEC030', qualification: 'Tiến sĩ Y khoa, Chuyên khoa II Chấn thương chỉnh hình', experience: 19, fee: 580000, gender: 'female' }
    ]
  },
  'DEPT003': { // Khoa Nhi
    name: 'Nhi',
    doctors: [
      { name: 'BS. Cao Văn Thành', specialty: 'SPEC032', qualification: 'Tiến sĩ Y khoa, Chuyên khoa II Nhi khoa', experience: 17, fee: 400000, gender: 'male' },
      { name: 'BS. Đinh Thị Hương', specialty: 'SPEC033', qualification: 'Thạc sĩ Y khoa, Chuyên khoa I Nhi tim mạch', experience: 12, fee: 500000, gender: 'female' },
      { name: 'BS. Phan Văn Long', specialty: 'SPEC034', qualification: 'Tiến sĩ Y khoa, Chuyên khoa II Nhi tiêu hóa', experience: 15, fee: 450000, gender: 'male' },
      { name: 'BS. Võ Thị Kim', specialty: 'SPEC032', qualification: 'Thạc sĩ Y khoa, Chuyên khoa I Nhi khoa', experience: 9, fee: 380000, gender: 'female' },
      { name: 'BS. Dương Văn Hải', specialty: 'SPEC033', qualification: 'Tiến sĩ Y khoa, Chuyên khoa II Nhi tim mạch', experience: 14, fee: 480000, gender: 'male' }
    ]
  },
  'DEPT004': { // Khoa Thần Kinh
    name: 'Thần Kinh',
    doctors: [
      { name: 'BS. Ngô Thị Bình', specialty: 'SPEC035', qualification: 'Tiến sĩ Y khoa, Chuyên khoa II Thần kinh học', experience: 18, fee: 550000, gender: 'female' },
      { name: 'BS. Tạ Văn Quang', specialty: 'SPEC036', qualification: 'Thạc sĩ Y khoa, Chuyên khoa I Phẫu thuật thần kinh', experience: 16, fee: 600000, gender: 'male' },
      { name: 'BS. Lưu Thị Oanh', specialty: 'SPEC035', qualification: 'Tiến sĩ Y khoa, Chuyên khoa II Thần kinh học', experience: 13, fee: 500000, gender: 'female' },
      { name: 'BS. Hồ Văn Tùng', specialty: 'SPEC036', qualification: 'Thạc sĩ Y khoa, Chuyên khoa I Phẫu thuật thần kinh', experience: 11, fee: 520000, gender: 'male' },
      { name: 'BS. Chu Thị Lan', specialty: 'SPEC035', qualification: 'Tiến sĩ Y khoa, Chuyên khoa II Thần kinh học', experience: 20, fee: 580000, gender: 'female' }
    ]
  },
  'DEPT006': { // Khoa Phụ Sản
    name: 'Phụ Sản',
    doctors: [
      { name: 'BS. Mai Thị Hồng', specialty: 'SPEC037', qualification: 'Tiến sĩ Y khoa, Chuyên khoa II Sản khoa', experience: 15, fee: 450000, gender: 'female' },
      { name: 'BS. Đỗ Văn Kiên', specialty: 'SPEC038', qualification: 'Thạc sĩ Y khoa, Chuyên khoa I Phụ khoa', experience: 12, fee: 400000, gender: 'male' },
      { name: 'BS. Lê Thị Xuân', specialty: 'SPEC037', qualification: 'Tiến sĩ Y khoa, Chuyên khoa II Sản khoa', experience: 17, fee: 500000, gender: 'female' },
      { name: 'BS. Phùng Văn Đạt', specialty: 'SPEC038', qualification: 'Thạc sĩ Y khoa, Chuyên khoa I Phụ khoa', experience: 10, fee: 380000, gender: 'male' },
      { name: 'BS. Trương Thị Yến', specialty: 'SPEC037', qualification: 'Tiến sĩ Y khoa, Chuyên khoa II Sản khoa', experience: 19, fee: 520000, gender: 'female' }
    ]
  },
  'DEPT008': { // Khoa Nội Tổng Hợp
    name: 'Nội Tổng Hợp',
    doctors: [
      { name: 'BS. Huỳnh Văn Tâm', specialty: 'SPEC039', qualification: 'Tiến sĩ Y khoa, Chuyên khoa II Nội tổng hợp', experience: 16, fee: 400000, gender: 'male' },
      { name: 'BS. Nguyễn Thị Thu', specialty: 'SPEC040', qualification: 'Thạc sĩ Y khoa, Chuyên khoa I Tiêu hóa', experience: 13, fee: 450000, gender: 'female' },
      { name: 'BS. Trần Văn Phúc', specialty: 'SPEC041', qualification: 'Tiến sĩ Y khoa, Chuyên khoa II Hô hấp', experience: 14, fee: 480000, gender: 'male' },
      { name: 'BS. Lê Thị Hạnh', specialty: 'SPEC042', qualification: 'Thạc sĩ Y khoa, Chuyên khoa I Thận - Tiết niệu', experience: 11, fee: 420000, gender: 'female' },
      { name: 'BS. Võ Văn Sơn', specialty: 'SPEC039', qualification: 'Tiến sĩ Y khoa, Chuyên khoa II Nội tổng hợp', experience: 18, fee: 500000, gender: 'male' }
    ]
  },
  'DEPT009': { // Khoa Ngoại Tổng Hợp
    name: 'Ngoại Tổng Hợp',
    doctors: [
      { name: 'BS. Phan Văn Dũng', specialty: 'SPEC043', qualification: 'Tiến sĩ Y khoa, Chuyên khoa II Ngoại tổng hợp', experience: 17, fee: 520000, gender: 'male' },
      { name: 'BS. Đặng Thị Liên', specialty: 'SPEC044', qualification: 'Thạc sĩ Y khoa, Chuyên khoa I Ngoại tiêu hóa', experience: 12, fee: 480000, gender: 'female' },
      { name: 'BS. Bùi Văn Hùng', specialty: 'SPEC045', qualification: 'Tiến sĩ Y khoa, Chuyên khoa II Ngoại lồng ngực', experience: 15, fee: 550000, gender: 'male' },
      { name: 'BS. Lý Thị Phương', specialty: 'SPEC043', qualification: 'Thạc sĩ Y khoa, Chuyên khoa I Ngoại tổng hợp', experience: 10, fee: 450000, gender: 'female' },
      { name: 'BS. Cao Văn Minh', specialty: 'SPEC044', qualification: 'Tiến sĩ Y khoa, Chuyên khoa II Ngoại tiêu hóa', experience: 19, fee: 580000, gender: 'male' }
    ]
  }
};

async function createDoctorsByDepartment() {
  console.log('👨‍⚕️ CREATING 5 DOCTORS FOR EACH DEPARTMENT');
  console.log('='.repeat(60));

  try {
    let totalCreated = 0;
    let totalProfiles = 0;

    for (const [deptId, deptData] of Object.entries(doctorsByDepartment)) {
      console.log(`\n🏥 Creating doctors for ${deptData.name} (${deptId})`);
      console.log('='.repeat(50));

      const createdAuthUsers = [];
      const createdProfiles = [];
      const createdDoctors = [];

      // Step 1: Create auth users and profiles
      for (let i = 0; i < deptData.doctors.length; i++) {
        const doctorData = deptData.doctors[i];
        // Create simple email without Vietnamese characters
        const emailPrefix = `${deptData.name.toLowerCase().replace(/\s+/g, '')}${i + 1}`;
        const email = `${emailPrefix}@hospital.com`;
        
        console.log(`   📝 Creating: ${doctorData.name}`);

        // Create auth user
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: email,
          password: 'Doctor123!',
          email_confirm: true,
          user_metadata: {
            full_name: doctorData.name,
            role: 'doctor'
          }
        });

        if (authError) {
          console.log(`   ❌ Auth error for ${doctorData.name}: ${authError.message}`);
          continue;
        }

        createdAuthUsers.push({
          ...doctorData,
          email: email,
          auth_id: authUser.user.id
        });

        // Create profile
        const profileData = {
          id: authUser.user.id,
          email: email,
          role: 'doctor',
          full_name: doctorData.name,
          phone_number: `090${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
          date_of_birth: `19${70 + Math.floor(Math.random() * 20)}-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`,
          is_active: true,
          email_verified: true,
          phone_verified: false,
          login_count: 0,
          two_factor_enabled: false
        };

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .upsert(profileData, { onConflict: 'id' })
          .select();

        if (profileError) {
          console.log(`   ❌ Profile error for ${doctorData.name}: ${profileError.message}`);
          continue;
        }

        createdProfiles.push(profile[0]);
        console.log(`   ✅ Created profile: ${email}`);
      }

      // Step 2: Create doctor records
      console.log(`\n   👨‍⚕️ Creating doctor records...`);
      
      for (let i = 0; i < createdAuthUsers.length; i++) {
        const userData = createdAuthUsers[i];
        const licenseNum = `VN-${deptData.name.substring(0, 2).toUpperCase()}-${(1000 + totalCreated + i).toString()}`;
        
        const doctorRecord = {
          profile_id: userData.auth_id,
          specialty: userData.specialty,
          department_id: deptId,
          license_number: licenseNum,
          qualification: userData.qualification,
          experience_years: userData.experience,
          consultation_fee: userData.fee,
          gender: userData.gender,
          address: {
            street: `${Math.floor(Math.random() * 999) + 1} Đường ${['Lê Lợi', 'Nguyễn Huệ', 'Pasteur', 'Hai Bà Trưng', 'Trần Hưng Đạo'][Math.floor(Math.random() * 5)]}`,
            district: `Quận ${Math.floor(Math.random() * 12) + 1}`,
            city: 'TP.HCM'
          },
          bio: `Bác sĩ ${deptData.name.toLowerCase()} với ${userData.experience} năm kinh nghiệm`,
          languages_spoken: ['Vietnamese', 'English'],
          availability_status: 'available',
          rating: Math.round((4 + Math.random()) * 10) / 10, // 4.0 - 5.0
          total_reviews: Math.floor(Math.random() * 50) + 10, // 10-60 reviews
          status: 'active',
          full_name: userData.name,
          is_active: true
        };

        const { data: doctor, error: doctorError } = await supabase
          .from('doctors')
          .upsert(doctorRecord, { onConflict: 'license_number' })
          .select();

        if (doctorError) {
          console.log(`   ❌ Doctor error for ${userData.name}: ${doctorError.message}`);
          continue;
        }

        createdDoctors.push(doctor[0]);
        console.log(`   ✅ Created doctor: ${userData.name} (${licenseNum})`);
      }

      console.log(`\n   📊 ${deptData.name} Summary:`);
      console.log(`      Auth users: ${createdAuthUsers.length}`);
      console.log(`      Profiles: ${createdProfiles.length}`);
      console.log(`      Doctors: ${createdDoctors.length}`);

      totalCreated += createdDoctors.length;
      totalProfiles += createdProfiles.length;
    }

    // Final summary
    console.log('\n✅ CREATION COMPLETED!');
    console.log('='.repeat(60));
    console.log(`📊 Total Summary:`);
    console.log(`   👥 Profiles created: ${totalProfiles}`);
    console.log(`   👨‍⚕️ Doctors created: ${totalCreated}`);
    console.log(`   🏥 Departments covered: ${Object.keys(doctorsByDepartment).length}`);

    // Verify final counts
    const { count: finalDoctorCount } = await supabase
      .from('doctors')
      .select('*', { count: 'exact', head: true });

    const { count: finalProfileCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'doctor');

    console.log(`\n🔍 Database Verification:`);
    console.log(`   👨‍⚕️ Total doctors in DB: ${finalDoctorCount}`);
    console.log(`   👥 Total doctor profiles in DB: ${finalProfileCount}`);

    console.log(`\n🔑 Login credentials format:`);
    console.log(`   Email: [doctorname]@hospital.com`);
    console.log(`   Password: Doctor123!`);
    console.log(`   Example: nguyenvanhung@hospital.com / Doctor123!`);

  } catch (error) {
    console.error('❌ Error creating doctors by department:', error.message);
  }
}

async function main() {
  await createDoctorsByDepartment();
}

main().catch(console.error);
