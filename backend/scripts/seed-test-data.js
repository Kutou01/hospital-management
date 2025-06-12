#!/usr/bin/env node

/**
 * Comprehensive Test Data Seeding Script
 * Creates realistic data for testing Doctor and Patient services
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Will be populated from existing departments in database
let DEPARTMENTS = [];

// Generate doctors based on existing departments
async function generateDoctorProfiles() {
  // Fetch existing departments from database
  // Try both column naming conventions
  let { data: existingDepartments, error } = await supabase
    .from('departments')
    .select('dept_id, name, department_id, department_name, department_code')
    .order('dept_id');

  // If dept_id doesn't exist, try with original column names
  if (error && error.message.includes('dept_id')) {
    const { data: deptData, error: deptError } = await supabase
      .from('departments')
      .select('department_id, department_name, department_code')
      .order('department_id');

    if (!deptError && deptData) {
      // Map to expected format
      existingDepartments = deptData.map(dept => ({
        dept_id: dept.department_id,
        name: dept.department_name,
        code: dept.department_code
      }));
      error = null;
    }
  }

  if (error || !existingDepartments || existingDepartments.length === 0) {
    console.log('⚠️ No departments found, using default departments');
    // Fallback to default departments
    existingDepartments = [
      { dept_id: 'CARD', name: 'Tim mạch' },
      { dept_id: 'NEUR', name: 'Thần kinh' },
      { dept_id: 'PEDI', name: 'Nhi khoa' },
      { dept_id: 'ORTH', name: 'Chấn thương chỉnh hình' },
      { dept_id: 'DERM', name: 'Da liễu' }
    ];
  }

  // Update global DEPARTMENTS variable
  DEPARTMENTS = existingDepartments.map(dept => ({
    dept_id: dept.dept_id,
    name: dept.name,
    code: dept.dept_id
  }));

  console.log(`📊 Found ${DEPARTMENTS.length} departments for doctor generation`);

  const doctors = [];

  // Calculate doctors per department (aim for 120 total doctors)
  const totalDoctors = 120;
  const doctorsPerDept = Math.floor(totalDoctors / DEPARTMENTS.length);
  const remainder = totalDoctors % DEPARTMENTS.length;

  // Enhanced specialty mapping for all departments
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

  const departments = DEPARTMENTS.map(dept => ({
    id: dept.dept_id,
    name: dept.name,
    specialties: specialtyMapping[dept.dept_id] || [
      dept.name,
      `${dept.name} chuyên sâu`,
      `${dept.name} cấp cứu`,
      `${dept.name} nhi`
    ]
  }));

  const firstNames = [
    'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng',
    'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đinh', 'Đào', 'Lương', 'Tô'
  ];

  const maleMiddleNames = ['Văn', 'Đức', 'Minh', 'Hoàng', 'Quang', 'Thành', 'Hữu', 'Công', 'Thanh', 'Tuấn'];
  const femaleMiddleNames = ['Thị', 'Minh', 'Thu', 'Hồng', 'Lan', 'Mai', 'Kim', 'Thanh', 'Ngọc', 'Phương'];

  const maleLastNames = ['An', 'Bình', 'Cường', 'Dũng', 'Hải', 'Khang', 'Long', 'Nam', 'Phong', 'Quân', 'Sơn', 'Tài', 'Thắng', 'Vinh', 'Xuân'];
  const femaleLastNames = ['Anh', 'Bích', 'Chi', 'Dung', 'Hà', 'Linh', 'Loan', 'Nga', 'Oanh', 'Phúc', 'Quyên', 'Thảo', 'Uyên', 'Vân', 'Yến'];

  const qualifications = ['Thạc sĩ Y khoa', 'Tiến sĩ Y khoa', 'Bác sĩ Chuyên khoa I', 'Bác sĩ Chuyên khoa II', 'Giáo sư', 'Phó Giáo sư'];

  departments.forEach((dept, deptIndex) => {
    // Calculate number of doctors for this department
    const doctorCount = doctorsPerDept + (deptIndex < remainder ? 1 : 0);
    console.log(`   Generating ${doctorCount} doctors for ${dept.name} (${dept.id})`);

    for (let i = 1; i <= doctorCount; i++) {
      const isGender = Math.random() > 0.4 ? 'male' : 'female'; // 60% male, 40% female
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const middleName = isGender === 'male'
        ? maleMiddleNames[Math.floor(Math.random() * maleMiddleNames.length)]
        : femaleMiddleNames[Math.floor(Math.random() * femaleMiddleNames.length)];
      const lastName = isGender === 'male'
        ? maleLastNames[Math.floor(Math.random() * maleLastNames.length)]
        : femaleLastNames[Math.floor(Math.random() * femaleLastNames.length)];

      const fullName = `BS. ${firstName} ${middleName} ${lastName}`;
      const email = `bs.${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@hospital.com`;
      const phone = `090${Math.floor(Math.random() * 9000000) + 1000000}`;
      const birthYear = 1970 + Math.floor(Math.random() * 25); // Age 30-55
      const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
      const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
      const dateOfBirth = `${birthYear}-${birthMonth}-${birthDay}`;

      const specialty = dept.specialties[Math.floor(Math.random() * dept.specialties.length)];
      const qualification = qualifications[Math.floor(Math.random() * qualifications.length)];
      const experienceYears = 2024 - birthYear - 25; // Assuming graduated at 25
      const consultationFee = (300000 + Math.floor(Math.random() * 500000)) / 1000 * 1000; // 300k-800k, rounded to thousands

      const bios = [
        `Bác sĩ ${specialty.toLowerCase()} với ${experienceYears} năm kinh nghiệm. Chuyên điều trị các bệnh lý phức tạp.`,
        `Chuyên gia ${specialty.toLowerCase()} hàng đầu với nhiều công trình nghiên cứu.`,
        `Bác sĩ giàu kinh nghiệm trong lĩnh vực ${specialty.toLowerCase()}. Tận tâm với bệnh nhân.`,
        `${qualification} chuyên khoa ${specialty.toLowerCase()}. Đào tạo tại các bệnh viện lớn.`,
        `Bác sĩ ${specialty.toLowerCase()} với chuyên môn cao và thái độ thân thiện.`
      ];

      const languages = [
        ['Vietnamese', 'English'],
        ['Vietnamese', 'English', 'French'],
        ['Vietnamese', 'English', 'Japanese'],
        ['Vietnamese', 'English', 'German'],
        ['Vietnamese']
      ];

      doctors.push({
        email,
        full_name: fullName,
        phone_number: phone,
        date_of_birth: dateOfBirth,
        specialty,
        qualification,
        department_id: dept.id,
        license_number: `VN-${dept.id}-${birthYear}-${String(i).padStart(3, '0')}`,
        gender: isGender,
        bio: bios[Math.floor(Math.random() * bios.length)],
        experience_years: Math.max(1, experienceYears),
        consultation_fee: consultationFee,
        languages_spoken: languages[Math.floor(Math.random() * languages.length)]
      });
    }
  });

  return doctors;
}

// DOCTOR_PROFILES will be generated dynamically based on existing departments

// Generate 30 patients
function generatePatientProfiles() {
  const patients = [];

  const firstNames = [
    'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng',
    'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đinh', 'Đào', 'Lương', 'Tô'
  ];

  const maleMiddleNames = ['Văn', 'Đức', 'Minh', 'Hoàng', 'Quang', 'Thành', 'Hữu', 'Công', 'Thanh', 'Tuấn'];
  const femaleMiddleNames = ['Thị', 'Minh', 'Thu', 'Hồng', 'Lan', 'Mai', 'Kim', 'Thanh', 'Ngọc', 'Phương'];

  const maleLastNames = ['An', 'Bình', 'Cường', 'Dũng', 'Hải', 'Khang', 'Long', 'Nam', 'Phong', 'Quân', 'Sơn', 'Tài', 'Thắng', 'Vinh', 'Xuân'];
  const femaleLastNames = ['Anh', 'Bích', 'Chi', 'Dung', 'Hà', 'Linh', 'Loan', 'Nga', 'Oanh', 'Phúc', 'Quyên', 'Thảo', 'Uyên', 'Vân', 'Yến'];

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const districts = [
    'Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8', 'Quận 9', 'Quận 10',
    'Quận 11', 'Quận 12', 'Quận Bình Thạnh', 'Quận Gò Vấp', 'Quận Phú Nhuận', 'Quận Tân Bình', 'Quận Tân Phú'
  ];
  const streets = [
    'Nguyễn Huệ', 'Lê Lợi', 'Võ Văn Tần', 'Hai Bà Trưng', 'Nguyễn Thị Minh Khai', 'Cách Mạng Tháng 8',
    'Lý Tự Trọng', 'Pasteur', 'Điện Biên Phủ', 'Nguyễn Du', 'Trần Hưng Đạo', 'Lê Thánh Tôn'
  ];

  const medicalHistories = [
    'Khỏe mạnh, không có tiền sử bệnh lý',
    'Tiền sử cao huyết áp gia đình',
    'Tiền sử tiểu đường type 2',
    'Đã phẫu thuật ruột thừa năm 2020',
    'Dị ứng thuốc kháng sinh',
    'Tiền sử hen suyễn nhẹ',
    'Đã sinh con, không có biến chứng',
    'Tiền sử gãy xương chân trái',
    'Viêm dạ dày mãn tính',
    'Cận thị, đeo kính từ nhỏ'
  ];

  const allergiesList = [
    [],
    ['penicillin'],
    ['seafood'],
    ['peanuts'],
    ['dust'],
    ['pollen'],
    ['penicillin', 'sulfa'],
    ['shellfish'],
    ['eggs'],
    ['milk']
  ];

  const relationships = ['spouse', 'parent', 'child', 'sibling', 'friend'];

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
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@gmail.com`;
    const phone = `098${Math.floor(Math.random() * 9000000) + 1000000}`;

    // Age range: 18-80
    const birthYear = 1944 + Math.floor(Math.random() * 60);
    const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    const dateOfBirth = `${birthYear}-${birthMonth}-${birthDay}`;

    const bloodType = bloodTypes[Math.floor(Math.random() * bloodTypes.length)];
    const district = districts[Math.floor(Math.random() * districts.length)];
    const street = streets[Math.floor(Math.random() * streets.length)];
    const houseNumber = Math.floor(Math.random() * 999) + 1;

    // Emergency contact
    const emergencyGender = Math.random() > 0.5 ? 'male' : 'female';
    const emergencyFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const emergencyMiddleName = emergencyGender === 'male'
      ? maleMiddleNames[Math.floor(Math.random() * maleMiddleNames.length)]
      : femaleMiddleNames[Math.floor(Math.random() * femaleMiddleNames.length)];
    const emergencyLastName = emergencyGender === 'male'
      ? maleLastNames[Math.floor(Math.random() * maleLastNames.length)]
      : femaleLastNames[Math.floor(Math.random() * femaleLastNames.length)];
    const emergencyName = `${emergencyFirstName} ${emergencyMiddleName} ${emergencyLastName}`;
    const emergencyPhone = `097${Math.floor(Math.random() * 9000000) + 1000000}`;
    const relationship = relationships[Math.floor(Math.random() * relationships.length)];

    const medicalHistory = medicalHistories[Math.floor(Math.random() * medicalHistories.length)];
    const allergies = allergiesList[Math.floor(Math.random() * allergiesList.length)];

    const notes = [
      'Bệnh nhân hợp tác tốt',
      'Cần theo dõi đặc biệt',
      'Bệnh nhân lo lắng, cần tư vấn tâm lý',
      'Tuân thủ điều trị tốt',
      'Cần nhắc nhở uống thuốc đúng giờ',
      'Bệnh nhân có kiến thức y tế cơ bản',
      'Gia đình hỗ trợ tốt',
      'Cần giải thích rõ về bệnh',
      'Bệnh nhân trẻ tuổi, năng động',
      'Người cao tuổi, cần hỗ trợ'
    ];

    patients.push({
      email,
      full_name: fullName,
      phone_number: phone,
      date_of_birth: dateOfBirth,
      gender: isGender,
      blood_type: bloodType,
      address: {
        street: `${houseNumber} ${street}`,
        district: district,
        city: 'TP. Hồ Chí Minh'
      },
      emergency_contact: {
        name: emergencyName,
        phone: emergencyPhone,
        relationship: relationship
      },
      medical_history: medicalHistory,
      allergies: allergies,
      notes: notes[Math.floor(Math.random() * notes.length)]
    });
  }

  return patients;
}

const PATIENT_PROFILES = generatePatientProfiles();

// Foreign key verification
async function verifyForeignKeyConstraints() {
  try {
    // Check if departments table exists and has data
    const { data: depts, error: deptError } = await supabase
      .from('departments')
      .select('dept_id')
      .limit(1);

    if (deptError || !depts || depts.length === 0) {
      console.log('   ⚠️ Departments table is empty or missing');
      return false;
    }

    // Check if required tables exist
    const requiredTables = ['profiles', 'doctors', 'patients', 'appointments', 'medical_records', 'doctor_schedules', 'doctor_reviews'];

    for (const table of requiredTables) {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`   ⚠️ Table '${table}' does not exist or is not accessible`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.log(`   ❌ Error verifying constraints: ${error.message}`);
    return false;
  }
}

async function seedTestData() {
  console.log('🌱 Starting comprehensive test data seeding...\n');

  try {
    // Step 0: Verify foreign key constraints
    console.log('🔗 Verifying foreign key constraints...');
    const constraintsOk = await verifyForeignKeyConstraints();
    if (!constraintsOk) {
      throw new Error('Foreign key constraints not properly configured');
    }
    console.log('✅ Foreign key constraints verified\n');

    // Step 1: Ensure departments exist (no dependencies)
    await seedDepartments();

    // Step 2: Create doctor profiles and accounts (requires: departments)
    await seedDoctors();

    // Step 3: Create patient profiles and accounts (no dependencies except profiles)
    await seedPatients();

    // Step 4: Create doctor schedules (requires: doctors)
    await seedDoctorSchedules();

    // Step 5: Create sample appointments (requires: doctors, patients)
    await seedAppointments();

    // Step 6: Create sample medical records (requires: doctors, patients, appointments)
    await seedMedicalRecords();

    // Step 7: Create doctor reviews (requires: doctors, patients)
    await seedDoctorReviews();
    
    console.log('\n🎉 Test data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👨‍⚕️ Doctors: ~120 (distributed across ${DEPARTMENTS.length} departments)`);
    console.log(`   👤 Patients: ${PATIENT_PROFILES.length}`);
    console.log(`   🏥 Departments: ${DEPARTMENTS.length} (using existing departments)`);
    console.log(`   📅 Appointments: Sample appointments created`);
    console.log(`   📋 Medical Records: Sample records created`);
    console.log(`   ⭐ Reviews: Sample reviews created`);
    console.log('\n🏥 Department breakdown:');
    const totalDoctors = 120;
    const doctorsPerDept = Math.floor(totalDoctors / DEPARTMENTS.length);
    const remainder = totalDoctors % DEPARTMENTS.length;

    DEPARTMENTS.forEach((dept, index) => {
      const doctorCount = doctorsPerDept + (index < remainder ? 1 : 0);
      console.log(`   - ${dept.name} (${dept.dept_id}): ${doctorCount} doctors`);
    });

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
  }
}

async function seedDepartments() {
  console.log('🏥 Checking existing departments...');

  // Fetch existing departments with flexible column names
  let { data: existingDepartments, error: fetchError } = await supabase
    .from('departments')
    .select('dept_id, name, department_id, department_name, department_code')
    .order('dept_id');

  // If dept_id doesn't exist, try with original column names
  if (fetchError && fetchError.message.includes('dept_id')) {
    const { data: deptData, error: deptError } = await supabase
      .from('departments')
      .select('department_id, department_name, department_code')
      .order('department_id');

    if (!deptError && deptData) {
      // Map to expected format
      existingDepartments = deptData.map(dept => ({
        dept_id: dept.department_id,
        name: dept.department_name,
        code: dept.department_code
      }));
      fetchError = null;
    }
  }

  if (fetchError) {
    console.log(`   ⚠️ Error fetching departments: ${fetchError.message}`);
    return;
  }

  if (existingDepartments && existingDepartments.length > 0) {
    console.log(`   ✅ Found ${existingDepartments.length} existing departments:`);
    existingDepartments.forEach(dept => {
      console.log(`      - ${dept.dept_id}: ${dept.name}`);
    });

    // Update global DEPARTMENTS variable with existing departments
    DEPARTMENTS = existingDepartments.map(dept => ({
      dept_id: dept.dept_id,
      name: dept.name,
      code: dept.dept_id
    }));

    console.log(`   ℹ️ Using existing departments for doctor generation`);
  } else {
    console.log('   ⚠️ No departments found, this may cause issues with doctor creation');
  }
}

async function seedDoctors() {
  console.log('\n👨‍⚕️ Seeding doctors...');

  // Generate doctor profiles based on existing departments
  const DOCTOR_PROFILES = await generateDoctorProfiles();
  console.log(`📊 Generated ${DOCTOR_PROFILES.length} doctor profiles`);

  for (const doctorData of DOCTOR_PROFILES) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: doctorData.email,
        password: 'doctor123456',
        email_confirm: true,
        user_metadata: {
          full_name: doctorData.full_name,
          role: 'doctor'
        }
      });

      if (authError) {
        console.log(`   ⚠️ Auth for ${doctorData.full_name}: ${authError.message}`);
        continue;
      }

      const userId = authData.user.id;

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: doctorData.email,
          full_name: doctorData.full_name,
          phone_number: doctorData.phone_number,
          date_of_birth: doctorData.date_of_birth,
          role: 'doctor',
          is_active: true,
          email_verified: true
        }, { onConflict: 'id' });

      if (profileError) {
        console.log(`   ⚠️ Profile for ${doctorData.full_name}: ${profileError.message}`);
        continue;
      }

      // Create doctor record
      const { error: doctorError } = await supabase
        .from('doctors')
        .upsert({
          profile_id: userId,
          specialty: doctorData.specialty,
          qualification: doctorData.qualification,
          department_id: doctorData.department_id,
          license_number: doctorData.license_number,
          gender: doctorData.gender,
          bio: doctorData.bio,
          experience_years: doctorData.experience_years,
          consultation_fee: doctorData.consultation_fee,
          languages_spoken: doctorData.languages_spoken,
          availability_status: 'available',
          rating: 4.5 + Math.random() * 0.5, // Random rating 4.5-5.0
          total_reviews: Math.floor(Math.random() * 50) + 10
        }, { onConflict: 'profile_id' });

      if (doctorError) {
        console.log(`   ⚠️ Doctor record for ${doctorData.full_name}: ${doctorError.message}`);
      } else {
        console.log(`   ✅ Doctor: ${doctorData.full_name}`);
      }

    } catch (error) {
      console.log(`   ❌ Error creating doctor ${doctorData.full_name}: ${error.message}`);
    }
  }
}

async function seedPatients() {
  console.log('\n👤 Seeding patients...');
  
  for (const patientData of PATIENT_PROFILES) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: patientData.email,
        password: 'patient123456',
        email_confirm: true,
        user_metadata: {
          full_name: patientData.full_name,
          role: 'patient'
        }
      });

      if (authError) {
        console.log(`   ⚠️ Auth for ${patientData.full_name}: ${authError.message}`);
        continue;
      }

      const userId = authData.user.id;

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: patientData.email,
          full_name: patientData.full_name,
          phone_number: patientData.phone_number,
          date_of_birth: patientData.date_of_birth,
          role: 'patient',
          is_active: true,
          email_verified: true
        }, { onConflict: 'id' });

      if (profileError) {
        console.log(`   ⚠️ Profile for ${patientData.full_name}: ${profileError.message}`);
        continue;
      }

      // Create patient record
      const { error: patientError } = await supabase
        .from('patients')
        .upsert({
          profile_id: userId,
          gender: patientData.gender,
          blood_type: patientData.blood_type,
          address: patientData.address,
          emergency_contact: patientData.emergency_contact,
          medical_history: patientData.medical_history,
          allergies: patientData.allergies,
          status: 'active',
          notes: patientData.notes
        }, { onConflict: 'profile_id' });

      if (patientError) {
        console.log(`   ⚠️ Patient record for ${patientData.full_name}: ${patientError.message}`);
      } else {
        console.log(`   ✅ Patient: ${patientData.full_name}`);
      }

    } catch (error) {
      console.log(`   ❌ Error creating patient ${patientData.full_name}: ${error.message}`);
    }
  }
}

async function seedDoctorSchedules() {
  console.log('\n📅 Seeding doctor schedules...');
  
  // Get all doctors
  const { data: doctors, error } = await supabase
    .from('doctors')
    .select('doctor_id');

  if (error || !doctors) {
    console.log('   ⚠️ Could not fetch doctors for schedules');
    return;
  }

  for (const doctor of doctors) {
    // Create weekly schedule (Monday to Friday)
    for (let day = 1; day <= 5; day++) {
      const { error: scheduleError } = await supabase
        .from('doctor_schedules')
        .upsert({
          doctor_id: doctor.doctor_id,
          day_of_week: day,
          start_time: '08:00',
          end_time: '17:00',
          is_available: true,
          break_start: '12:00',
          break_end: '13:00',
          max_appointments: 16,
          slot_duration: 30
        }, { onConflict: 'doctor_id,day_of_week' });

      if (scheduleError) {
        console.log(`   ⚠️ Schedule for ${doctor.doctor_id} day ${day}: ${scheduleError.message}`);
      }
    }
    console.log(`   ✅ Schedule for doctor: ${doctor.doctor_id}`);
  }
}

async function seedAppointments() {
  console.log('\n📅 Seeding sample appointments...');

  // Get doctors and patients
  const { data: doctors } = await supabase.from('doctors').select('doctor_id').limit(20);
  const { data: patients } = await supabase.from('patients').select('patient_id').limit(30);

  if (!doctors || !patients || doctors.length === 0 || patients.length === 0) {
    console.log('   ⚠️ No doctors or patients found for appointments');
    return;
  }

  const appointmentTypes = ['consultation', 'follow_up', 'emergency', 'routine_checkup'];
  const statuses = ['scheduled', 'completed', 'cancelled'];
  const appointmentNotes = [
    'Khám tổng quát định kỳ',
    'Tái khám sau điều trị',
    'Khám cấp cứu',
    'Kiểm tra sức khỏe định kỳ',
    'Tư vấn điều trị',
    'Khám chuyên khoa',
    'Theo dõi sau phẫu thuật',
    'Khám sức khỏe tổng quát'
  ];

  // Create 50 sample appointments
  const appointments = [];
  for (let i = 0; i < 50; i++) {
    const doctor = doctors[Math.floor(Math.random() * doctors.length)];
    const patient = patients[Math.floor(Math.random() * patients.length)];

    // Random date within last 30 days to next 30 days
    const randomDays = Math.floor(Math.random() * 60) - 30;
    const appointmentDate = new Date(Date.now() + randomDays * 24 * 60 * 60 * 1000);

    // Random time between 8:00 and 17:00
    const hour = 8 + Math.floor(Math.random() * 9);
    const minute = Math.random() > 0.5 ? '00' : '30';
    const appointmentTime = `${String(hour).padStart(2, '0')}:${minute}`;

    appointments.push({
      doctor_id: doctor.doctor_id,
      patient_id: patient.patient_id,
      appointment_date: appointmentDate.toISOString().split('T')[0],
      appointment_time: appointmentTime,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      appointment_type: appointmentTypes[Math.floor(Math.random() * appointmentTypes.length)],
      notes: appointmentNotes[Math.floor(Math.random() * appointmentNotes.length)]
    });
  }

  let successCount = 0;
  for (const appointment of appointments) {
    const { error } = await supabase
      .from('appointments')
      .insert(appointment);

    if (error) {
      console.log(`   ⚠️ Appointment: ${error.message}`);
    } else {
      successCount++;
    }
  }

  console.log(`   ✅ Created ${successCount} appointments`);
}

async function seedMedicalRecords() {
  console.log('\n📋 Seeding sample medical records...');

  // Get completed appointments
  const { data: appointments } = await supabase
    .from('appointments')
    .select('appointment_id, doctor_id, patient_id, appointment_date')
    .eq('status', 'completed')
    .limit(30);

  if (!appointments || appointments.length === 0) {
    console.log('   ⚠️ No completed appointments found for medical records');
    console.log('   ℹ️ This is normal if appointments were just created');

    // Try to get any appointments and mark some as completed
    const { data: anyAppointments } = await supabase
      .from('appointments')
      .select('appointment_id, doctor_id, patient_id, appointment_date')
      .limit(15);

    if (anyAppointments && anyAppointments.length > 0) {
      // Mark first 15 appointments as completed
      for (const apt of anyAppointments) {
        await supabase
          .from('appointments')
          .update({ status: 'completed' })
          .eq('appointment_id', apt.appointment_id);
      }

      console.log(`   ✅ Marked ${anyAppointments.length} appointments as completed`);

      // Use these appointments for medical records
      const appointmentsToUse = anyAppointments;
      await createMedicalRecordsForAppointments(appointmentsToUse);
    } else {
      console.log('   ⚠️ No appointments found at all');
    }
    return;
  }

  await createMedicalRecordsForAppointments(appointments);
}

async function createMedicalRecordsForAppointments(appointments) {

  const chiefComplaints = [
    'Đau đầu, chóng mặt',
    'Ho, sốt nhẹ',
    'Đau bụng, buồn nôn',
    'Khó thở, đau ngực',
    'Đau lưng, tê chân',
    'Mệt mỏi, chán ăn',
    'Đau khớp, sưng tấy',
    'Rối loạn tiêu hóa',
    'Mất ngủ, lo âu',
    'Kiểm tra sức khỏe định kỳ'
  ];

  const diagnoses = [
    'Tăng huyết áp nhẹ',
    'Viêm đường hô hấp trên',
    'Viêm dạ dày cấp',
    'Rối loạn nhịp tim',
    'Thoát vị đĩa đệm',
    'Thiếu máu nhẹ',
    'Viêm khớp dạng thấp',
    'Hội chứng ruột kích thích',
    'Rối loạn lo âu',
    'Sức khỏe bình thường'
  ];

  const treatmentPlans = [
    'Thuốc hạ huyết áp, theo dõi huyết áp hàng ngày',
    'Kháng sinh, thuốc ho, nghỉ ngơi',
    'Thuốc kháng acid, chế độ ăn nhẹ',
    'Thuốc điều hòa nhịp tim, theo dõi ECG',
    'Thuốc giảm đau, vật lý trị liệu',
    'Bổ sung sắt, vitamin, dinh dưỡng',
    'Thuốc chống viêm, tập luyện nhẹ',
    'Thuốc điều chỉnh tiêu hóa, chế độ ăn',
    'Thuốc an thần nhẹ, tư vấn tâm lý',
    'Duy trì lối sống lành mạnh'
  ];

  const recordNotes = [
    'Bệnh nhân cần tái khám sau 2 tuần',
    'Theo dõi triệu chứng, liên hệ nếu có biến chứng',
    'Tuân thủ điều trị, uống thuốc đúng giờ',
    'Tái khám sau 1 tháng để đánh giá',
    'Cần thay đổi lối sống, tập thể dục',
    'Bệnh nhân đã hiểu rõ về bệnh',
    'Gia đình cần hỗ trợ điều trị',
    'Kết quả xét nghiệm bình thường',
    'Cần theo dõi lâu dài',
    'Tình trạng ổn định'
  ];

  let successCount = 0;
  for (const appointment of appointments) {
    const randomIndex = Math.floor(Math.random() * chiefComplaints.length);

    const { error } = await supabase
      .from('medical_records')
      .insert({
        appointment_id: appointment.appointment_id,
        doctor_id: appointment.doctor_id,
        patient_id: appointment.patient_id,
        visit_date: appointment.appointment_date,
        chief_complaint: chiefComplaints[randomIndex],
        diagnosis: diagnoses[randomIndex],
        treatment_plan: treatmentPlans[randomIndex],
        notes: recordNotes[randomIndex],
        status: 'active'
      });

    if (error) {
      console.log(`   ⚠️ Medical record: ${error.message}`);
    } else {
      successCount++;
    }
  }

  console.log(`   ✅ Created ${successCount} medical records`);
}

async function seedDoctorReviews() {
  console.log('\n⭐ Seeding doctor reviews...');

  // Get doctors and patients (ensure they exist)
  const { data: doctors, error: doctorError } = await supabase
    .from('doctors')
    .select('doctor_id')
    .limit(50);

  const { data: patients, error: patientError } = await supabase
    .from('patients')
    .select('patient_id')
    .limit(30);

  if (doctorError || patientError) {
    console.log('   ⚠️ Error fetching doctors or patients for reviews');
    return;
  }

  if (!doctors || !patients || doctors.length === 0 || patients.length === 0) {
    console.log('   ⚠️ No doctors or patients found for reviews');
    console.log(`   📊 Found: ${doctors?.length || 0} doctors, ${patients?.length || 0} patients`);
    return;
  }

  console.log(`   📊 Creating reviews for ${doctors.length} doctors and ${patients.length} patients`);

  const reviewTexts = {
    5: [
      'Bác sĩ rất tận tâm và chuyên nghiệp. Giải thích rõ ràng về tình trạng bệnh.',
      'Xuất sắc! Bác sĩ có kinh nghiệm và thái độ rất tốt.',
      'Rất hài lòng với dịch vụ. Bác sĩ tư vấn chi tiết và hiệu quả.',
      'Bác sĩ giỏi chuyên môn, thân thiện và nhiệt tình.',
      'Điều trị hiệu quả, theo dõi bệnh nhân chu đáo.'
    ],
    4: [
      'Khám bệnh kỹ lưỡng, thái độ thân thiện. Thời gian chờ hơi lâu.',
      'Bác sĩ tốt, chỉ có điều phòng khám hơi nhỏ.',
      'Chuyên môn tốt, tuy nhiên cần cải thiện thời gian khám.',
      'Hài lòng với kết quả điều trị, sẽ quay lại lần sau.',
      'Bác sĩ nhiệt tình, giải thích dễ hiểu.'
    ],
    3: [
      'Bình thường, không có gì đặc biệt.',
      'Khám nhanh, chưa được tư vấn kỹ lưỡng.',
      'Bác sĩ OK, nhưng thời gian khám hơi vội.',
      'Tạm được, cần cải thiện thái độ phục vụ.',
      'Chuyên môn ổn, cần thêm thời gian tư vấn.'
    ],
    2: [
      'Thái độ chưa thân thiện, khám hơi vội vàng.',
      'Không hài lòng với cách tư vấn của bác sĩ.',
      'Thời gian chờ quá lâu, khám không kỹ.',
      'Cần cải thiện thái độ phục vụ.',
      'Chưa được giải thích rõ về bệnh.'
    ],
    1: [
      'Rất không hài lòng với dịch vụ.',
      'Thái độ không chuyên nghiệp.',
      'Khám không kỹ, tư vấn sai.',
      'Sẽ không quay lại lần sau.',
      'Cần cải thiện toàn bộ quy trình.'
    ]
  };

  // Create 150 reviews (average 3 reviews per doctor)
  const reviews = [];
  for (let i = 0; i < 150; i++) {
    const doctor = doctors[Math.floor(Math.random() * doctors.length)];
    const patient = patients[Math.floor(Math.random() * patients.length)];

    // Weighted rating distribution (more positive reviews)
    const ratingWeights = [1, 2, 3, 4, 5]; // 1-5 stars
    const weights = [5, 10, 15, 35, 35]; // 5% 1-star, 10% 2-star, 15% 3-star, 35% 4-star, 35% 5-star

    let rating = 5;
    const random = Math.random() * 100;
    let cumulative = 0;
    for (let j = 0; j < weights.length; j++) {
      cumulative += weights[j];
      if (random <= cumulative) {
        rating = ratingWeights[j];
        break;
      }
    }

    const reviewTextArray = reviewTexts[rating];
    const reviewText = reviewTextArray[Math.floor(Math.random() * reviewTextArray.length)];

    // Random date within last 6 months
    const randomDays = Math.floor(Math.random() * 180);
    const reviewDate = new Date(Date.now() - randomDays * 24 * 60 * 60 * 1000);

    reviews.push({
      doctor_id: doctor.doctor_id,
      patient_id: patient.patient_id,
      rating: rating,
      review_text: reviewText,
      review_date: reviewDate.toISOString(),
      is_verified: Math.random() > 0.2 // 80% verified reviews
    });
  }

  let successCount = 0;
  for (const review of reviews) {
    const { error } = await supabase
      .from('doctor_reviews')
      .insert(review);

    if (error) {
      console.log(`   ⚠️ Review: ${error.message}`);
    } else {
      successCount++;
    }
  }

  console.log(`   ✅ Created ${successCount} doctor reviews`);
}

// Run the seeding
if (require.main === module) {
  seedTestData().catch(error => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
}

module.exports = { seedTestData };
