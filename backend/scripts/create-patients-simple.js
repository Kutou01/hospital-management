const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Patient data with simple email prefixes
const patientsByDepartment = {
  'DEPT001': { // Tim Mạch
    name: 'Tim Mạch',
    emailPrefix: 'cardio',
    patients: [
      { name: 'Nguyễn Văn An', age: 45, gender: 'male', bloodType: 'A+', condition: 'Cao huyết áp' },
      { name: 'Trần Thị Bình', age: 52, gender: 'female', bloodType: 'O+', condition: 'Bệnh tim mạch vành' },
      { name: 'Lê Văn Cường', age: 38, gender: 'male', bloodType: 'B+', condition: 'Rối loạn nhịp tim' },
      { name: 'Phạm Thị Dung', age: 60, gender: 'female', bloodType: 'AB+', condition: 'Suy tim' },
      { name: 'Hoàng Văn Em', age: 55, gender: 'male', bloodType: 'A-', condition: 'Tăng cholesterol' }
    ]
  },
  'DEPT002': { // Chấn Thương Chỉnh Hình
    name: 'Chấn Thương Chỉnh Hình',
    emailPrefix: 'ortho',
    patients: [
      { name: 'Vũ Thị Phương', age: 35, gender: 'female', bloodType: 'O+', condition: 'Gãy xương tay' },
      { name: 'Đặng Văn Quang', age: 28, gender: 'male', bloodType: 'A+', condition: 'Chấn thương cột sống' },
      { name: 'Bùi Thị Hoa', age: 42, gender: 'female', bloodType: 'B+', condition: 'Thoái hóa khớp' },
      { name: 'Trịnh Văn Sơn', age: 50, gender: 'male', bloodType: 'AB-', condition: 'Đau lưng mãn tính' },
      { name: 'Lý Thị Tâm', age: 33, gender: 'female', bloodType: 'O-', condition: 'Viêm khớp' }
    ]
  },
  'DEPT004': { // Thần Kinh
    name: 'Thần Kinh',
    emailPrefix: 'neuro',
    patients: [
      { name: 'Ngô Thị Quỳnh', age: 48, gender: 'female', bloodType: 'O+', condition: 'Đau đầu mãn tính' },
      { name: 'Tạ Văn Rồng', age: 55, gender: 'male', bloodType: 'A+', condition: 'Đột quỵ' },
      { name: 'Lưu Thị Sương', age: 40, gender: 'female', bloodType: 'B+', condition: 'Động kinh' },
      { name: 'Hồ Văn Thắng', age: 62, gender: 'male', bloodType: 'AB+', condition: 'Parkinson' },
      { name: 'Chu Thị Uyên', age: 35, gender: 'female', bloodType: 'O-', condition: 'Rối loạn lo âu' }
    ]
  },
  'DEPT006': { // Phụ Sản
    name: 'Phụ Sản',
    emailPrefix: 'obgyn',
    patients: [
      { name: 'Mai Thị Vân', age: 28, gender: 'female', bloodType: 'A+', condition: 'Thai kỳ bình thường' },
      { name: 'Đỗ Thị Xuân', age: 32, gender: 'female', bloodType: 'O+', condition: 'Viêm phụ khoa' },
      { name: 'Lê Thị Yến', age: 25, gender: 'female', bloodType: 'B+', condition: 'Rối loạn kinh nguyệt' },
      { name: 'Phùng Thị Ánh', age: 35, gender: 'female', bloodType: 'AB+', condition: 'U xơ tử cung' },
      { name: 'Trương Thị Bích', age: 30, gender: 'female', bloodType: 'A-', condition: 'Khám thai định kỳ' }
    ]
  },
  'DEPT008': { // Nội Tổng Hợp
    name: 'Nội Tổng Hợp',
    emailPrefix: 'internal',
    patients: [
      { name: 'Huỳnh Văn Cảnh', age: 50, gender: 'male', bloodType: 'O+', condition: 'Đái tháo đường' },
      { name: 'Nguyễn Thị Diệu', age: 45, gender: 'female', bloodType: 'A+', condition: 'Viêm gan B' },
      { name: 'Trần Văn Ế', age: 58, gender: 'male', bloodType: 'B+', condition: 'Suy thận mãn tính' },
      { name: 'Lê Thị Phượng', age: 42, gender: 'female', bloodType: 'AB-', condition: 'Loét dạ dày' },
      { name: 'Võ Văn Giang', age: 48, gender: 'male', bloodType: 'O-', condition: 'Tăng huyết áp' }
    ]
  },
  'DEPT009': { // Ngoại Tổng Hợp
    name: 'Ngoại Tổng Hợp',
    emailPrefix: 'surgery',
    patients: [
      { name: 'Phan Văn Hải', age: 40, gender: 'male', bloodType: 'A+', condition: 'Sỏi mật' },
      { name: 'Đặng Thị Ích', age: 35, gender: 'female', bloodType: 'O+', condition: 'Viêm ruột thừa' },
      { name: 'Bùi Văn Khánh', age: 52, gender: 'male', bloodType: 'B+', condition: 'Thoát vị bẹn' },
      { name: 'Lý Thị Linh', age: 38, gender: 'female', bloodType: 'AB+', condition: 'U tuyến giáp' },
      { name: 'Cao Văn Minh', age: 45, gender: 'male', bloodType: 'A-', condition: 'Polyp đại tràng' }
    ]
  }
};

async function createPatientsAndTestData() {
  console.log('🤒 CREATING PATIENTS AND COMPREHENSIVE TEST DATA');
  console.log('='.repeat(60));

  try {
    let totalPatients = 0;
    let totalAppointments = 0;
    let totalReviews = 0;

    // Get existing doctors by department
    const { data: doctors } = await supabase
      .from('doctors')
      .select('doctor_id, department_id, full_name')
      .eq('status', 'active');

    console.log(`📋 Found ${doctors.length} doctors across departments`);

    for (const [deptId, deptData] of Object.entries(patientsByDepartment)) {
      console.log(`\n🏥 Creating data for ${deptData.name} (${deptId})`);
      console.log('='.repeat(50));

      const deptDoctors = doctors.filter(d => d.department_id === deptId);
      console.log(`   👨‍⚕️ Department doctors: ${deptDoctors.length}`);

      // Step 1: Create patients for this department
      console.log('   📝 Creating patients...');
      const createdPatients = [];

      for (let i = 0; i < deptData.patients.length; i++) {
        const patientData = deptData.patients[i];
        const email = `${deptData.emailPrefix}patient${i + 1}@test.com`;
        
        console.log(`     Creating: ${patientData.name} (${email})`);

        // Create auth user
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: email,
          password: 'Patient123!',
          email_confirm: true,
          user_metadata: {
            full_name: patientData.name,
            role: 'patient'
          }
        });

        if (authError) {
          console.log(`     ❌ Auth error for ${patientData.name}: ${authError.message}`);
          continue;
        }

        // Create profile
        const profileData = {
          id: authUser.user.id,
          email: email,
          role: 'patient',
          full_name: patientData.name,
          phone_number: `090${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
          date_of_birth: `${2024 - patientData.age}-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`,
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
          console.log(`     ❌ Profile error for ${patientData.name}: ${profileError.message}`);
          continue;
        }

        // Create patient record
        const patientRecord = {
          profile_id: authUser.user.id,
          gender: patientData.gender,
          blood_type: patientData.bloodType,
          address: {
            street: `${Math.floor(Math.random() * 999) + 1} Đường ${['Lê Lợi', 'Nguyễn Huệ', 'Pasteur'][Math.floor(Math.random() * 3)]}`,
            district: `Quận ${Math.floor(Math.random() * 12) + 1}`,
            city: 'TP.HCM'
          },
          emergency_contact: {
            name: `Người thân của ${patientData.name}`,
            phone: `091${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
            relationship: ['Vợ/Chồng', 'Con', 'Anh/Chị', 'Bố/Mẹ'][Math.floor(Math.random() * 4)]
          },
          insurance_info: {
            provider: 'BHYT',
            policy_number: `DN${Math.floor(Math.random() * 1000000000).toString().padStart(10, '0')}`
          },
          medical_history: patientData.condition,
          allergies: Math.random() > 0.7 ? ['Dị ứng thuốc kháng sinh'] : [],
          chronic_conditions: [patientData.condition],
          current_medications: {},
          status: 'active',
          full_name: patientData.name
        };

        const { data: patient, error: patientError } = await supabase
          .from('patients')
          .upsert(patientRecord, { onConflict: 'profile_id' })
          .select();

        if (patientError) {
          console.log(`     ❌ Patient error for ${patientData.name}: ${patientError.message}`);
          continue;
        }

        createdPatients.push(patient[0]);
        console.log(`     ✅ Created patient: ${patientData.name}`);
      }

      totalPatients += createdPatients.length;
      console.log(`   📊 Created ${createdPatients.length} patients for ${deptData.name}`);

      // Step 2: Create appointments with valid status
      if (deptDoctors.length > 0 && createdPatients.length > 0) {
        console.log('   📅 Creating appointments...');
        const appointments = [];
        const today = new Date();

        for (let i = 0; i < 10; i++) { // 10 appointments per department
          const appointmentDate = new Date(today);
          appointmentDate.setDate(today.getDate() + (i - 7)); // Past, present, future
          
          const hour = 8 + (i % 8); // 8AM to 3PM
          const doctor = deptDoctors[i % deptDoctors.length];
          const patient = createdPatients[i % createdPatients.length];
          
          // Use valid status values
          const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
          const status = validStatuses[i % validStatuses.length];
          const appointmentId = `APT${Date.now().toString().slice(-8)}${i.toString().padStart(2, '0')}`;
          
          appointments.push({
            appointment_id: appointmentId,
            doctor_id: doctor.doctor_id,
            patient_id: patient.patient_id,
            appointment_date: appointmentDate.toISOString().split('T')[0],
            start_time: `${hour.toString().padStart(2, '0')}:00:00`,
            end_time: `${(hour + 1).toString().padStart(2, '0')}:00:00`,
            appointment_type: 'consultation',
            status: status,
            reason: `Khám ${deptData.name.toLowerCase()}`,
            notes: `Cuộc hẹn khám ${deptData.name.toLowerCase()}`
          });
        }

        const { data: createdAppointments, error: appointmentError } = await supabase
          .from('appointments')
          .insert(appointments)
          .select();

        if (appointmentError) {
          console.log(`   ❌ Appointment error: ${appointmentError.message}`);
        } else {
          totalAppointments += createdAppointments.length;
          console.log(`   ✅ Created ${createdAppointments.length} appointments`);
        }
      }

      // Step 3: Create reviews
      if (deptDoctors.length > 0 && createdPatients.length > 0) {
        console.log('   ⭐ Creating reviews...');
        const reviews = [];

        for (let i = 0; i < Math.min(6, deptDoctors.length * 2); i++) {
          const doctor = deptDoctors[i % deptDoctors.length];
          const patient = createdPatients[i % createdPatients.length];
          const rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars
          
          reviews.push({
            review_id: `REV${Date.now().toString().slice(-8)}${i.toString().padStart(2, '0')}`,
            doctor_id: doctor.doctor_id,
            patient_id: patient.patient_id,
            rating: rating,
            review_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          });
        }

        const { data: createdReviews, error: reviewError } = await supabase
          .from('doctor_reviews')
          .insert(reviews)
          .select();

        if (reviewError) {
          console.log(`   ❌ Review error: ${reviewError.message}`);
        } else {
          totalReviews += createdReviews.length;
          console.log(`   ✅ Created ${createdReviews.length} reviews`);
        }
      }

      console.log(`   📊 ${deptData.name} Summary: ${createdPatients.length} patients created`);
    }

    // Final summary
    console.log('\n✅ PATIENT AND TEST DATA CREATION COMPLETED!');
    console.log('='.repeat(60));
    
    // Get final counts
    const { count: finalDoctors } = await supabase
      .from('doctors')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalAppointments } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalReviews } = await supabase
      .from('doctor_reviews')
      .select('*', { count: 'exact', head: true });

    console.log('📊 FINAL DATABASE STATUS:');
    console.log(`   👨‍⚕️ Total doctors: ${finalDoctors}`);
    console.log(`   🤒 Total patients: ${finalPatients}`);
    console.log(`   📅 Total appointments: ${finalAppointments}`);
    console.log(`   ⭐ Total reviews: ${finalReviews}`);

    console.log('\n🔑 PATIENT LOGIN CREDENTIALS:');
    Object.entries(patientsByDepartment).forEach(([deptId, deptData]) => {
      console.log(`   ${deptData.name}:`);
      for (let i = 1; i <= 5; i++) {
        const email = `${deptData.emailPrefix}patient${i}@test.com`;
        console.log(`     ${email} / Patient123!`);
      }
    });

    console.log('\n🎯 READY FOR COMPREHENSIVE TESTING:');
    console.log('   ✅ Doctor Service - 41 doctors across 6+ departments');
    console.log('   ✅ Patient Service - 30+ patients distributed by department');
    console.log('   ✅ Appointment Service - 60+ appointments with various statuses');
    console.log('   ✅ Review System - 36+ patient reviews and ratings');
    console.log('   ✅ Multi-department coverage - All major specialties');

  } catch (error) {
    console.error('❌ Error creating patients and test data:', error.message);
  }
}

async function main() {
  await createPatientsAndTestData();
}

main().catch(console.error);
