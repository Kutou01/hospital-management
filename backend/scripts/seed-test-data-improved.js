#!/usr/bin/env node

/**
 * Improved Test Data Seeding Script
 * Uses consistent, department-based ID patterns
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Department code mapping
const DEPARTMENT_CODE_MAP = {
  'DEPT001': 'CARD', // Tim Mạch -> Cardiology
  'DEPT002': 'ORTH', // Chấn Thương Chỉnh Hình -> Orthopedics
  'DEPT003': 'PEDI', // Nhi -> Pediatrics
  'DEPT004': 'NEUR', // Thần Kinh -> Neurology
  'DEPT005': 'DERM', // Da Liễu -> Dermatology
  'DEPT006': 'OBGY', // Phụ Sản -> Obstetrics & Gynecology
  'DEPT007': 'EMER', // Cấp Cứu -> Emergency
  'DEPT008': 'INTE', // Nội Tổng Hợp -> Internal Medicine
  'DEPT009': 'SURG', // Ngoại Tổng Hợp -> Surgery
  'DEPT010': 'OPHT', // Mắt -> Ophthalmology
  'DEPT011': 'ENT',  // Tai Mũi Họng -> ENT
  'DEPT012': 'PSYC'  // Tâm Thần -> Psychiatry
};

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

// Generate current date string for IDs
function getCurrentDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}${month}`;
}

async function seedTestDataImproved() {
  console.log('🌱 Starting IMPROVED test data seeding with consistent ID patterns...\n');

  try {
    // Step 1: Check departments and create mapping
    console.log('🏥 Analyzing departments and creating code mapping...');
    const departments = await getDepartmentsWithCodes();

    if (!departments || departments.length === 0) {
      console.log('❌ No departments found. Please ensure departments exist first.');
      return;
    }

    console.log(`✅ Found ${departments.length} departments with code mapping:`);
    departments.forEach(dept => {
      console.log(`   ${dept.department_id} (${dept.department_name}) -> ${dept.code}`);
    });

    // Step 2: Seed doctors with department-based IDs
    console.log('\n👨‍⚕️ Seeding doctors with department-based IDs...');
    await seedDoctorsImproved(departments);

    // Step 3: Seed patients with date-based IDs
    console.log('\n👤 Seeding patients with date-based IDs...');
    await seedPatientsImproved();

    // Step 4: Seed doctor schedules with department-based IDs
    console.log('\n📅 Seeding doctor schedules with department-based IDs...');
    await seedDoctorSchedulesImproved(departments);

    // Step 5: Seed appointments with date-based IDs
    console.log('\n📋 Seeding appointments with date-based IDs...');
    await seedAppointmentsImproved();

    // Step 6: Seed medical records with date-based IDs
    console.log('\n📄 Seeding medical records with date-based IDs...');
    await seedMedicalRecordsImproved();

    // Step 7: Seed reviews with date-based IDs
    console.log('\n⭐ Seeding doctor reviews with date-based IDs...');
    await seedDoctorReviewsImproved();

    console.log('\n🎉 Improved test data seeding completed successfully!');
    console.log('\n📊 ID Pattern Summary:');
    console.log('   👨‍⚕️ Doctors: CARD-DOC-202412-001 (department-based)');
    console.log('   📅 Schedules: CARD-SCH-202412-001 (department-based)');
    console.log('   👤 Patients: PAT-202412-001 (date-based)');
    console.log('   📋 Appointments: APT-202412-001 (date-based)');
    console.log('   📄 Medical Records: MR-202412-001 (date-based)');
    console.log('   ⭐ Reviews: REV-202412-001 (date-based)');

  } catch (error) {
    console.error('❌ Error during improved seeding:', error);
  }
}

async function getDepartmentsWithCodes() {
  const { data: departments, error } = await supabase
    .from('departments')
    .select('department_id, department_name, department_code, is_active')
    .eq('is_active', true)
    .order('department_id');

  if (error) {
    console.log(`❌ Error fetching departments: ${error.message}`);
    return [];
  }

  // Map departments with proper codes
  return departments.map(dept => ({
    ...dept,
    code: DEPARTMENT_CODE_MAP[dept.department_id] || dept.department_code || dept.department_id
  }));
}

async function seedDoctorsImproved(departments) {
  const totalDoctors = 120;
  const doctorsPerDept = Math.floor(totalDoctors / departments.length);
  const remainder = totalDoctors % departments.length;
  const dateString = getCurrentDateString();

  const specialtyMapping = {
    'CARD': ['Tim mạch', 'Tim mạch can thiệp', 'Siêu âm tim', 'Điện tâm đồ'],
    'ORTH': ['Chấn thương chỉnh hình', 'Cột sống', 'Khớp', 'Thể thao'],
    'PEDI': ['Nhi khoa', 'Nhi tim mạch', 'Nhi hô hấp', 'Nhi tiêu hóa'],
    'NEUR': ['Thần kinh', 'Thần kinh cột sống', 'Đột quỵ', 'Động kinh'],
    'DERM': ['Da liễu', 'Thẩm mỹ da', 'Dị ứng da', 'Da liễu nhi'],
    'OBGY': ['Sản phụ khoa', 'Thai sản', 'Phụ khoa', 'Kế hoạch hóa gia đình'],
    'EMER': ['Cấp cứu', 'Hồi sức cấp cứu', 'Chống độc', 'Cấp cứu ngoại khoa'],
    'INTE': ['Nội tổng quát', 'Nội tiết', 'Tiểu đường', 'Tuyến giáp'],
    'SURG': ['Phẫu thuật tổng quát', 'Phẫu thuật nội soi', 'Phẫu thuật cấp cứu'],
    'OPHT': ['Nhãn khoa', 'Phẫu thuật mắt', 'Khúc xạ', 'Võng mạc'],
    'ENT': ['Tai mũi họng', 'Phẫu thuật tai', 'Phẫu thuật mũi', 'Phẫu thuật họng'],
    'PSYC': ['Tâm thần', 'Tâm lý trị liệu', 'Rối loạn tâm thần', 'Tư vấn tâm lý']
  };

  const firstNames = ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Huynh', 'Phan', 'Vu', 'Vo', 'Dang'];
  const maleMiddleNames = ['Van', 'Duc', 'Minh', 'Hoang', 'Quang', 'Thanh', 'Huu', 'Cong', 'Thanh', 'Tuan'];
  const femaleMiddleNames = ['Thi', 'Minh', 'Thu', 'Hong', 'Lan', 'Mai', 'Kim', 'Thanh', 'Ngoc', 'Phuong'];
  const maleLastNames = ['An', 'Binh', 'Cuong', 'Dung', 'Hai', 'Khang', 'Long', 'Nam', 'Phong', 'Quan'];
  const femaleLastNames = ['Anh', 'Bich', 'Chi', 'Dung', 'Ha', 'Linh', 'Loan', 'Nga', 'Oanh', 'Phuc'];

  let doctorCount = 0;

  for (let deptIndex = 0; deptIndex < departments.length; deptIndex++) {
    const dept = departments[deptIndex];
    const doctorsForThisDept = doctorsPerDept + (deptIndex < remainder ? 1 : 0);

    console.log(`   Generating ${doctorsForThisDept} doctors for ${dept.department_name} (${dept.code})`);

    const specialties = specialtyMapping[dept.code] || [dept.department_name];

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
      const email = `bs.${firstName.toLowerCase()}.${lastName.toLowerCase()}${doctorCount}@hospital.com`;
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

        // Create doctor with improved ID pattern: CARD-DOC-202412-001
        const doctorId = `${dept.code}-DOC-${dateString}-${String(i).padStart(3, '0')}`;
        const { error: doctorError } = await supabase
          .from('doctors')
          .insert({
            doctor_id: doctorId,
            profile_id: authData.user.id,
            specialty: specialty,
            qualification: 'Thạc sĩ Y khoa',
            department_id: dept.department_id,
            license_number: `VN-${dept.code}-${String(doctorCount).padStart(4, '0')}`,
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

  console.log(`   ✅ Completed: ${doctorCount} doctors created with department-based IDs`);
}

async function seedPatientsImproved() {
  const dateString = getCurrentDateString();
  const firstNames = ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Huynh', 'Phan', 'Vu', 'Vo', 'Dang'];
  const maleMiddleNames = ['Van', 'Duc', 'Minh', 'Hoang', 'Quang'];
  const femaleMiddleNames = ['Thi', 'Minh', 'Thu', 'Hong', 'Lan'];
  const maleLastNames = ['An', 'Binh', 'Cuong', 'Dung', 'Hai'];
  const femaleLastNames = ['Anh', 'Bich', 'Chi', 'Dung', 'Ha'];
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
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@gmail.com`;
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

      // Create patient with improved ID pattern: PAT-202412-001
      const patientId = `PAT-${dateString}-${String(i).padStart(3, '0')}`;
      const { error: patientError } = await supabase
        .from('patients')
        .insert({
          patient_id: patientId,
          profile_id: authData.user.id,
          gender: isGender,
          blood_type: bloodTypes[Math.floor(Math.random() * bloodTypes.length)],
          address: {
            street: `${Math.floor(Math.random() * 999) + 1} Nguyen Hue`,
            district: 'Quan 1',
            city: 'TP. Ho Chi Minh'
          },
          emergency_contact: {
            name: `${firstName} Thi B`,
            phone: `097${Math.floor(Math.random() * 9000000) + 1000000}`,
            relationship: 'spouse'
          },
          medical_history: 'Khoe manh, khong co tien su benh ly',
          allergies: [],
          status: 'active',
          notes: 'Benh nhan hop tac tot'
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

  console.log(`   ✅ Completed: 30 patients created with date-based IDs`);
}

async function seedDoctorSchedulesImproved(departments) {
  const dateString = getCurrentDateString();

  // Get all doctors
  const { data: doctors } = await supabase
    .from('doctors')
    .select('doctor_id, department_id')
    .limit(120);

  if (!doctors || doctors.length === 0) {
    console.log('   ⚠️ No doctors found for schedules');
    return;
  }

  let scheduleCount = 0;
  let scheduleIdCounter = 1;

  for (const doctor of doctors) {
    // Find department code for this doctor
    const dept = departments.find(d => d.department_id === doctor.department_id);
    const deptCode = dept ? dept.code : 'GEN';

    // Create schedule for Monday-Friday
    for (let day = 1; day <= 5; day++) {
      // Improved ID pattern: CARD-SCH-202412-001
      const scheduleId = `${deptCode}-SCH-${dateString}-${String(scheduleIdCounter).padStart(3, '0')}`;

      const { error } = await supabase
        .from('doctor_schedules')
        .insert({
          schedule_id: scheduleId,
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
      scheduleIdCounter++;
    }
  }

  console.log(`   ✅ Created ${scheduleCount} schedule entries with department-based IDs`);
}

async function seedAppointmentsImproved() {
  const dateString = getCurrentDateString();

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

    // Improved ID pattern: APT-202412-001
    const appointmentId = `APT-${dateString}-${String(i).padStart(3, '0')}`;

    const { error } = await supabase
      .from('appointments')
      .insert({
        appointment_id: appointmentId,
        doctor_id: doctor.doctor_id,
        patient_id: patient.patient_id,
        appointment_date: appointmentDate.toISOString().split('T')[0],
        appointment_time: appointmentTime,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        appointment_type: types[Math.floor(Math.random() * types.length)],
        notes: 'Kham tong quat dinh ky'
      });

    if (!error) {
      appointmentCount++;
    }
  }

  console.log(`   ✅ Created ${appointmentCount} appointments with date-based IDs`);
}

async function seedMedicalRecordsImproved() {
  const dateString = getCurrentDateString();

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

  const diagnoses = ['Tang huyet ap nhe', 'Viem duong ho hap tren', 'Viem da day cap'];

  let recordCount = 0;
  for (let i = 0; i < appointments.length; i++) {
    const appointment = appointments[i];

    // Improved ID pattern: MR-202412-001
    const recordId = `MR-${dateString}-${String(i + 1).padStart(3, '0')}`;

    const { error } = await supabase
      .from('medical_records')
      .insert({
        record_id: recordId,
        appointment_id: appointment.appointment_id,
        doctor_id: appointment.doctor_id,
        patient_id: appointment.patient_id,
        visit_date: appointment.appointment_date,
        chief_complaint: 'Dau dau, chong mat',
        diagnosis: diagnoses[Math.floor(Math.random() * diagnoses.length)],
        treatment_plan: 'Thuoc ha huyet ap, theo doi huyet ap hang ngay',
        notes: 'Benh nhan can tai kham sau 2 tuan',
        status: 'active'
      });

    if (!error) {
      recordCount++;
    }
  }

  console.log(`   ✅ Created ${recordCount} medical records with date-based IDs`);
}

async function seedDoctorReviewsImproved() {
  const dateString = getCurrentDateString();

  // Get doctors and patients
  const { data: doctors } = await supabase.from('doctors').select('doctor_id').limit(50);
  const { data: patients } = await supabase.from('patients').select('patient_id').limit(30);

  if (!doctors || !patients) {
    console.log('   ⚠️ No doctors or patients found for reviews');
    return;
  }

  const reviewTexts = [
    'Bac si rat tan tam va chuyen nghiep.',
    'Kham benh ky luong, thai do than thien.',
    'Hai long voi dich vu kham chua benh.'
  ];

  let reviewCount = 0;
  for (let i = 1; i <= 150; i++) {
    const doctor = doctors[Math.floor(Math.random() * doctors.length)];
    const patient = patients[Math.floor(Math.random() * patients.length)];
    const rating = Math.floor(Math.random() * 5) + 1;

    // Improved ID pattern: REV-202412-001
    const reviewId = `REV-${dateString}-${String(i).padStart(3, '0')}`;

    const { error } = await supabase
      .from('doctor_reviews')
      .insert({
        review_id: reviewId,
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

  console.log(`   ✅ Created ${reviewCount} doctor reviews with date-based IDs`);
}

// Run improved seeding
if (require.main === module) {
  seedTestDataImproved().catch(error => {
    console.error('❌ Improved seeding failed:', error);
    process.exit(1);
  });
}

module.exports = { seedTestDataImproved };