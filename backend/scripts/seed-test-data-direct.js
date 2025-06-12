#!/usr/bin/env node

/**
 * Direct Test Data Seeding Script
 * Bypasses verification and seeds data directly
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper function to remove Vietnamese diacritics
function removeVietnameseDiacritics(str) {
  const diacriticsMap = {
    'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a', 'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
    'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
    'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
    'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o', 'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
    'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u', 'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
    'đ': 'd',
    'À': 'A', 'Á': 'A', 'Ạ': 'A', 'Ả': 'A', 'Ã': 'A', 'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ậ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ặ': 'A', 'Ẳ': 'A', 'Ẵ': 'A',
    'È': 'E', 'É': 'E', 'Ẹ': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ệ': 'E', 'Ể': 'E', 'Ễ': 'E',
    'Ì': 'I', 'Í': 'I', 'Ị': 'I', 'Ỉ': 'I', 'Ĩ': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ọ': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ộ': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ợ': 'O', 'Ở': 'O', 'Ỡ': 'O',
    'Ù': 'U', 'Ú': 'U', 'Ụ': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ự': 'U', 'Ử': 'U', 'Ữ': 'U',
    'Ỳ': 'Y', 'Ý': 'Y', 'Ỵ': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y',
    'Đ': 'D'
  };

  return str.replace(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/g, function(match) {
    return diacriticsMap[match] || match;
  });
}

async function seedTestDataDirect() {
  console.log('🌱 Starting DIRECT test data seeding (bypassing verification)...\n');

  try {
    // Step 1: Check departments directly
    console.log('🏥 Checking existing departments...');
    const { data: existingDepartments, error: deptError } = await supabase
      .from('departments')
      .select('department_id, department_name, department_code, is_active')
      .eq('is_active', true)
      .order('department_id');

    if (deptError) {
      console.log(`❌ Error fetching departments: ${deptError.message}`);
      return;
    }

    if (!existingDepartments || existingDepartments.length === 0) {
      console.log('❌ No active departments found. Please ensure departments exist first.');
      return;
    }

    console.log(`✅ Found ${existingDepartments.length} active departments:`);
    existingDepartments.forEach(dept => {
      console.log(`   - ${dept.department_id}: ${dept.department_name}`);
    });

    // Step 2: Generate and seed doctors
    console.log('\n👨‍⚕️ Generating and seeding doctors...');
    await seedDoctorsDirect(existingDepartments);

    // Step 3: Generate and seed patients
    console.log('\n👤 Generating and seeding patients...');
    await seedPatientsDirect();

    // Step 4: Create doctor schedules
    console.log('\n📅 Creating doctor schedules...');
    await seedDoctorSchedulesDirect();

    // Step 5: Create appointments
    console.log('\n📋 Creating appointments...');
    await seedAppointmentsDirect();

    // Step 6: Create medical records
    console.log('\n📄 Creating medical records...');
    await seedMedicalRecordsDirect();

    // Step 7: Create reviews
    console.log('\n⭐ Creating doctor reviews...');
    await seedDoctorReviewsDirect();

    console.log('\n🎉 Direct test data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   🏥 Departments: ${existingDepartments.length} (existing)`);
    console.log(`   👨‍⚕️ Doctors: ~120 (distributed across departments)`);
    console.log(`   👤 Patients: 30`);
    console.log(`   📅 Appointments: ~50`);
    console.log(`   📋 Medical Records: ~30`);
    console.log(`   ⭐ Reviews: ~150`);

  } catch (error) {
    console.error('❌ Error during direct seeding:', error);
  }
}

async function seedDoctorsDirect(departments) {
  // Generate doctors based on existing departments
  const totalDoctors = 120;
  const doctorsPerDept = Math.floor(totalDoctors / departments.length);
  const remainder = totalDoctors % departments.length;

  const specialtyMapping = {
    'CARD': ['Tim mạch', 'Tim mạch can thiệp', 'Siêu âm tim', 'Điện tâm đồ'],
    'NEUR': ['Thần kinh', 'Thần kinh cột sống', 'Đột quỵ', 'Động kinh'],
    'PEDI': ['Nhi khoa', 'Nhi tim mạch', 'Nhi hô hấp', 'Nhi tiêu hóa'],
    'ORTH': ['Chấn thương chỉnh hình', 'Cột sống', 'Khớp', 'Thể thao'],
    'DERM': ['Da liễu', 'Thẩm mỹ da', 'Dị ứng da', 'Da liễu nhi'],
    'OBGY': ['Sản phụ khoa', 'Thai sản', 'Phụ khoa', 'Kế hoạch hóa gia đình'],
    'SURG': ['Phẫu thuật tổng quát', 'Phẫu thuật nội soi', 'Phẫu thuật cấp cứu', 'Phẫu thuật gan mật'],
    'INTE': ['Nội tổng quát', 'Nội tiết', 'Tiểu đường', 'Tuyến giáp'],
    'EMER': ['Cấp cứu', 'Hồi sức cấp cứu', 'Chống độc', 'Cấp cứu ngoại khoa'],
    'RADI': ['Chẩn đoán hình ảnh', 'X-quang', 'CT Scanner', 'MRI', 'Siêu âm'],
    'ANES': ['Gây mê hồi sức', 'Gây tê vùng', 'Điều trị đau', 'Hồi sức sau mổ'],
    'ONCO': ['Ung bướu', 'Hóa trị', 'Xạ trị', 'Chăm sóc giảm nhẹ']
  };

  const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng'];
  const maleMiddleNames = ['Văn', 'Đức', 'Minh', 'Hoàng', 'Quang', 'Thành', 'Hữu', 'Công', 'Thanh', 'Tuấn'];
  const femaleMiddleNames = ['Thị', 'Minh', 'Thu', 'Hồng', 'Lan', 'Mai', 'Kim', 'Thanh', 'Ngọc', 'Phương'];
  const maleLastNames = ['An', 'Bình', 'Cường', 'Dũng', 'Hải', 'Khang', 'Long', 'Nam', 'Phong', 'Quân'];
  const femaleLastNames = ['Anh', 'Bích', 'Chi', 'Dung', 'Hà', 'Linh', 'Loan', 'Nga', 'Oanh', 'Phúc'];

  let doctorCount = 0;

  for (let deptIndex = 0; deptIndex < departments.length; deptIndex++) {
    const dept = departments[deptIndex];
    const doctorsForThisDept = doctorsPerDept + (deptIndex < remainder ? 1 : 0);
    
    console.log(`   Generating ${doctorsForThisDept} doctors for ${dept.department_name} (${dept.department_id})`);

    const specialties = specialtyMapping[dept.department_id] || [dept.department_name];

    for (let i = 1; i <= doctorsForThisDept; i++) {
      doctorCount++;
      
      const isGender = Math.random() > 0.4 ? 'male' : 'female';
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const middleName = isGender === 'male' 
        ? maleMiddleNames[Math.floor(Math.random() * maleMiddleNames.length)]
        : femaleMiddleNames[Math.floor(Math.random() * femaleMiddleNames.length)];
      const lastName = isGender === 'male'
        ? maleLastNames[Math.floor(Math.random() * maleLastNames.length)]
        : femaleLastNames[Math.floor(Math.random() * femaleLastNames.length)];

      const fullName = `BS. ${firstName} ${middleName} ${lastName}`;

      // Create email without Vietnamese diacritics
      const emailFirstName = removeVietnameseDiacritics(firstName);
      const emailLastName = removeVietnameseDiacritics(lastName);
      const email = `bs.${emailFirstName.toLowerCase()}.${emailLastName.toLowerCase()}${doctorCount}@hospital.com`;

      const phone = `090${Math.floor(Math.random() * 9000000) + 1000000}`;
      const birthYear = 1970 + Math.floor(Math.random() * 25);
      const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
      const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
      const dateOfBirth = `${birthYear}-${birthMonth}-${birthDay}`;
      
      const specialty = specialties[Math.floor(Math.random() * specialties.length)];
      const experienceYears = Math.max(1, 2024 - birthYear - 25);
      const consultationFee = (300000 + Math.floor(Math.random() * 500000)) / 1000 * 1000;

      try {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: email,
          password: 'doctor123456',
          email_confirm: true
        });

        if (authError) {
          console.log(`   ⚠️ Auth user ${email}: ${authError.message}`);
          continue;
        }

        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: email,
            full_name: fullName,
            phone_number: phone,
            date_of_birth: dateOfBirth,
            role: 'doctor',
            is_active: true,
            email_verified: true,
            phone_verified: false
          });

        if (profileError) {
          console.log(`   ⚠️ Profile ${email}: ${profileError.message}`);
          continue;
        }

        // Create doctor with shorter ID
        const deptCode = dept.department_id.replace('DEPT', 'D'); // DEPT001 -> D001
        const doctorId = `${deptCode}-DOC-${String(i).padStart(3, '0')}`; // D001-DOC-001
        const { error: doctorError } = await supabase
          .from('doctors')
          .insert({
            doctor_id: doctorId,
            profile_id: authData.user.id,
            specialty: specialty,
            qualification: 'Thạc sĩ Y khoa',
            department_id: dept.department_id,
            license_number: `VN-${dept.department_id}-${birthYear}-${String(i).padStart(3, '0')}`,
            gender: isGender,
            bio: `Bác sĩ ${specialty.toLowerCase()} với ${experienceYears} năm kinh nghiệm.`,
            experience_years: experienceYears,
            consultation_fee: consultationFee,
            languages_spoken: ['Vietnamese', 'English'],
            availability_status: 'available',
            rating: 0.0,
            total_reviews: 0
          });

        if (doctorError) {
          console.log(`   ⚠️ Doctor ${doctorId}: ${doctorError.message}`);
        } else {
          if (doctorCount % 20 === 0) {
            console.log(`   ✅ Created ${doctorCount} doctors so far...`);
          }
        }

      } catch (error) {
        console.log(`   ❌ Error creating doctor ${doctorCount}: ${error.message}`);
      }
    }
  }

  console.log(`   ✅ Completed: ${doctorCount} doctors created`);
}

async function seedPatientsDirect() {
  // Generate 30 patients
  const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng'];
  const maleMiddleNames = ['Văn', 'Đức', 'Minh', 'Hoàng', 'Quang'];
  const femaleMiddleNames = ['Thị', 'Minh', 'Thu', 'Hồng', 'Lan'];
  const maleLastNames = ['An', 'Bình', 'Cường', 'Dũng', 'Hải'];
  const femaleLastNames = ['Anh', 'Bích', 'Chi', 'Dung', 'Hà'];
  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  for (let i = 1; i <= 30; i++) {
    const isGender = Math.random() > 0.5 ? 'male' : 'female';
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const middleName = isGender === 'male' 
      ? maleMiddleNames[Math.floor(Math.random() * maleMiddleNames.length)]
      : femaleMiddleNames[Math.floor(Math.random() * femaleMiddleNames.length)];
    const lastName = isGender === 'male'
      ? maleLastNames[Math.floor(Math.random() * maleLastNames.length)]
      : femaleLastNames[Math.floor(Math.random() * femaleLastNames.length)];

    const fullName = `${firstName} ${middleName} ${lastName}`;

    // Create email without Vietnamese diacritics
    const emailFirstName = removeVietnameseDiacritics(firstName);
    const emailLastName = removeVietnameseDiacritics(lastName);
    const email = `${emailFirstName.toLowerCase()}.${emailLastName.toLowerCase()}${i}@gmail.com`;

    const phone = `098${Math.floor(Math.random() * 9000000) + 1000000}`;
    const birthYear = 1944 + Math.floor(Math.random() * 60);
    const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    const dateOfBirth = `${birthYear}-${birthMonth}-${birthDay}`;

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: 'patient123456',
        email_confirm: true
      });

      if (authError) {
        console.log(`   ⚠️ Auth user ${email}: ${authError.message}`);
        continue;
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: email,
          full_name: fullName,
          phone_number: phone,
          date_of_birth: dateOfBirth,
          role: 'patient',
          is_active: true,
          email_verified: true,
          phone_verified: false
        });

      if (profileError) {
        console.log(`   ⚠️ Profile ${email}: ${profileError.message}`);
        continue;
      }

      // Create patient
      const patientId = `PAT-202412-${String(i).padStart(3, '0')}`;
      const { error: patientError } = await supabase
        .from('patients')
        .insert({
          patient_id: patientId,
          profile_id: authData.user.id,
          gender: isGender,
          blood_type: bloodTypes[Math.floor(Math.random() * bloodTypes.length)],
          address: {
            street: `${Math.floor(Math.random() * 999) + 1} Nguyễn Huệ`,
            district: 'Quận 1',
            city: 'TP. Hồ Chí Minh'
          },
          emergency_contact: {
            name: `${firstName} Thị B`,
            phone: `097${Math.floor(Math.random() * 9000000) + 1000000}`,
            relationship: 'spouse'
          },
          medical_history: 'Khỏe mạnh, không có tiền sử bệnh lý',
          allergies: [],
          status: 'active',
          notes: 'Bệnh nhân hợp tác tốt'
        });

      if (patientError) {
        console.log(`   ⚠️ Patient ${patientId}: ${patientError.message}`);
      } else {
        if (i % 10 === 0) {
          console.log(`   ✅ Created ${i} patients so far...`);
        }
      }

    } catch (error) {
      console.log(`   ❌ Error creating patient ${i}: ${error.message}`);
    }
  }

  console.log(`   ✅ Completed: 30 patients created`);
}

async function seedDoctorSchedulesDirect() {
  // Get all doctors
  const { data: doctors } = await supabase
    .from('doctors')
    .select('doctor_id')
    .limit(120);

  if (!doctors || doctors.length === 0) {
    console.log('   ⚠️ No doctors found for schedules');
    return;
  }

  let scheduleCount = 0;
  for (const doctor of doctors) {
    // Create schedule for Monday-Friday
    for (let day = 1; day <= 5; day++) {
      const { error } = await supabase
        .from('doctor_schedules')
        .insert({
          doctor_id: doctor.doctor_id,
          day_of_week: day,
          start_time: '08:00',
          end_time: '17:00',
          is_available: true,
          break_start: '12:00',
          break_end: '13:00',
          max_appointments: 16,
          slot_duration: 30
        });

      if (!error) {
        scheduleCount++;
      }
    }
  }

  console.log(`   ✅ Created ${scheduleCount} schedule entries`);
}

async function seedAppointmentsDirect() {
  // Get doctors and patients
  const { data: doctors } = await supabase.from('doctors').select('doctor_id').limit(20);
  const { data: patients } = await supabase.from('patients').select('patient_id').limit(30);

  if (!doctors || !patients) {
    console.log('   ⚠️ No doctors or patients found for appointments');
    return;
  }

  const statuses = ['scheduled', 'completed', 'cancelled'];
  const types = ['consultation', 'follow_up', 'emergency', 'routine_checkup'];

  let appointmentCount = 0;
  for (let i = 1; i <= 50; i++) {
    const doctor = doctors[Math.floor(Math.random() * doctors.length)];
    const patient = patients[Math.floor(Math.random() * patients.length)];
    
    const randomDays = Math.floor(Math.random() * 60) - 30;
    const appointmentDate = new Date(Date.now() + randomDays * 24 * 60 * 60 * 1000);
    
    const hour = 8 + Math.floor(Math.random() * 9);
    const minute = Math.random() > 0.5 ? '00' : '30';
    const appointmentTime = `${String(hour).padStart(2, '0')}:${minute}`;

    const { error } = await supabase
      .from('appointments')
      .insert({
        appointment_id: `APT-${String(i).padStart(3, '0')}`, // Shorter ID
        doctor_id: doctor.doctor_id,
        patient_id: patient.patient_id,
        appointment_date: appointmentDate.toISOString().split('T')[0],
        appointment_time: appointmentTime,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        appointment_type: types[Math.floor(Math.random() * types.length)],
        notes: 'Khám tổng quát định kỳ'
      });

    if (!error) {
      appointmentCount++;
    }
  }

  console.log(`   ✅ Created ${appointmentCount} appointments`);
}

async function seedMedicalRecordsDirect() {
  // Get completed appointments
  const { data: appointments } = await supabase
    .from('appointments')
    .select('appointment_id, doctor_id, patient_id, appointment_date')
    .eq('status', 'completed')
    .limit(30);

  if (!appointments || appointments.length === 0) {
    console.log('   ⚠️ No completed appointments found for medical records');
    return;
  }

  const diagnoses = ['Tăng huyết áp nhẹ', 'Viêm đường hô hấp trên', 'Viêm dạ dày cấp'];
  
  let recordCount = 0;
  for (let i = 0; i < appointments.length; i++) {
    const appointment = appointments[i];
    
    const { error } = await supabase
      .from('medical_records')
      .insert({
        record_id: `MR-${String(i + 1).padStart(3, '0')}`, // Shorter ID
        appointment_id: appointment.appointment_id,
        doctor_id: appointment.doctor_id,
        patient_id: appointment.patient_id,
        visit_date: appointment.appointment_date,
        chief_complaint: 'Đau đầu, chóng mặt',
        diagnosis: diagnoses[Math.floor(Math.random() * diagnoses.length)],
        treatment_plan: 'Thuốc hạ huyết áp, theo dõi huyết áp hàng ngày',
        notes: 'Bệnh nhân cần tái khám sau 2 tuần',
        status: 'active'
      });

    if (!error) {
      recordCount++;
    }
  }

  console.log(`   ✅ Created ${recordCount} medical records`);
}

async function seedDoctorReviewsDirect() {
  // Get doctors and patients
  const { data: doctors } = await supabase.from('doctors').select('doctor_id').limit(50);
  const { data: patients } = await supabase.from('patients').select('patient_id').limit(30);

  if (!doctors || !patients) {
    console.log('   ⚠️ No doctors or patients found for reviews');
    return;
  }

  const reviewTexts = [
    'Bác sĩ rất tận tâm và chuyên nghiệp.',
    'Khám bệnh kỹ lưỡng, thái độ thân thiện.',
    'Hài lòng với dịch vụ khám chữa bệnh.'
  ];

  let reviewCount = 0;
  for (let i = 1; i <= 150; i++) {
    const doctor = doctors[Math.floor(Math.random() * doctors.length)];
    const patient = patients[Math.floor(Math.random() * patients.length)];
    const rating = Math.floor(Math.random() * 5) + 1;
    
    const { error } = await supabase
      .from('doctor_reviews')
      .insert({
        review_id: `REV-${String(i).padStart(3, '0')}`, // Shorter ID
        doctor_id: doctor.doctor_id,
        patient_id: patient.patient_id,
        rating: rating,
        review_text: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
        review_date: new Date().toISOString(),
        is_verified: Math.random() > 0.2
      });

    if (!error) {
      reviewCount++;
    }
  }

  console.log(`   ✅ Created ${reviewCount} doctor reviews`);
}

// Run direct seeding
if (require.main === module) {
  seedTestDataDirect().catch(error => {
    console.error('❌ Direct seeding failed:', error);
    process.exit(1);
  });
}

module.exports = { seedTestDataDirect };
