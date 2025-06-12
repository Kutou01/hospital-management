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

// Vietnamese sample data
const DEPARTMENTS = [
  { dept_id: 'CARD', name: 'Tim mạch', code: 'CARD' },
  { dept_id: 'NEUR', name: 'Thần kinh', code: 'NEUR' },
  { dept_id: 'PEDI', name: 'Nhi khoa', code: 'PEDI' },
  { dept_id: 'ORTH', name: 'Chấn thương chỉnh hình', code: 'ORTH' },
  { dept_id: 'DERM', name: 'Da liễu', code: 'DERM' }
];

const DOCTOR_PROFILES = [
  {
    email: 'bs.nguyen.tim@hospital.com',
    full_name: 'BS. Nguyễn Văn Tâm',
    phone_number: '0901234567',
    date_of_birth: '1980-05-15',
    specialty: 'Tim mạch',
    qualification: 'Thạc sĩ Y khoa',
    department_id: 'CARD',
    license_number: 'VN-CARD-2020-001',
    gender: 'male',
    bio: 'Bác sĩ chuyên khoa tim mạch với 15 năm kinh nghiệm. Chuyên điều trị các bệnh lý tim mạch phức tạp.',
    experience_years: 15,
    consultation_fee: 500000,
    languages_spoken: ['Vietnamese', 'English']
  },
  {
    email: 'bs.tran.thuy@hospital.com',
    full_name: 'BS. Trần Thị Thủy',
    phone_number: '0901234568',
    date_of_birth: '1985-08-20',
    specialty: 'Nhi khoa',
    qualification: 'Tiến sĩ Y khoa',
    department_id: 'PEDI',
    license_number: 'VN-PEDI-2018-002',
    gender: 'female',
    bio: 'Bác sĩ nhi khoa với chuyên môn cao về các bệnh lý trẻ em. Tốt nghiệp loại xuất sắc.',
    experience_years: 12,
    consultation_fee: 400000,
    languages_spoken: ['Vietnamese', 'English', 'French']
  },
  {
    email: 'bs.le.duc@hospital.com',
    full_name: 'BS. Lê Văn Đức',
    phone_number: '0901234569',
    date_of_birth: '1978-12-10',
    specialty: 'Thần kinh',
    qualification: 'Tiến sĩ Y khoa',
    department_id: 'NEUR',
    license_number: 'VN-NEUR-2019-003',
    gender: 'male',
    bio: 'Chuyên gia thần kinh hàng đầu với nhiều công trình nghiên cứu quốc tế.',
    experience_years: 18,
    consultation_fee: 600000,
    languages_spoken: ['Vietnamese', 'English', 'Japanese']
  }
];

const PATIENT_PROFILES = [
  {
    email: 'nguyen.van.a@gmail.com',
    full_name: 'Nguyễn Văn A',
    phone_number: '0987654321',
    date_of_birth: '1990-03-15',
    gender: 'male',
    blood_type: 'O+',
    address: {
      street: '123 Nguyễn Huệ',
      district: 'Quận 1',
      city: 'TP. Hồ Chí Minh'
    },
    emergency_contact: {
      name: 'Nguyễn Thị B',
      phone: '0987654322',
      relationship: 'spouse'
    },
    medical_history: 'Tiền sử cao huyết áp gia đình',
    allergies: ['penicillin'],
    notes: 'Bệnh nhân hợp tác tốt'
  },
  {
    email: 'tran.thi.c@gmail.com',
    full_name: 'Trần Thị C',
    phone_number: '0987654323',
    date_of_birth: '1985-07-22',
    gender: 'female',
    blood_type: 'A+',
    address: {
      street: '456 Lê Lợi',
      district: 'Quận 3',
      city: 'TP. Hồ Chí Minh'
    },
    emergency_contact: {
      name: 'Trần Văn D',
      phone: '0987654324',
      relationship: 'husband'
    },
    medical_history: 'Đã sinh 2 con, không có tiền sử bệnh lý',
    allergies: [],
    notes: 'Bệnh nhân cần theo dõi đặc biệt'
  },
  {
    email: 'le.van.e@gmail.com',
    full_name: 'Lê Văn E',
    phone_number: '0987654325',
    date_of_birth: '1995-11-08',
    gender: 'male',
    blood_type: 'B+',
    address: {
      street: '789 Võ Văn Tần',
      district: 'Quận 10',
      city: 'TP. Hồ Chí Minh'
    },
    emergency_contact: {
      name: 'Lê Thị F',
      phone: '0987654326',
      relationship: 'mother'
    },
    medical_history: 'Khỏe mạnh, không có tiền sử bệnh lý',
    allergies: ['seafood'],
    notes: 'Bệnh nhân trẻ tuổi, cần tư vấn dinh dưỡng'
  }
];

async function seedTestData() {
  console.log('🌱 Starting comprehensive test data seeding...\n');

  try {
    // Step 1: Ensure departments exist
    await seedDepartments();
    
    // Step 2: Create doctor profiles and accounts
    await seedDoctors();
    
    // Step 3: Create patient profiles and accounts
    await seedPatients();
    
    // Step 4: Create doctor schedules
    await seedDoctorSchedules();
    
    // Step 5: Create sample appointments
    await seedAppointments();
    
    // Step 6: Create sample medical records
    await seedMedicalRecords();
    
    // Step 7: Create doctor reviews
    await seedDoctorReviews();
    
    console.log('\n🎉 Test data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👨‍⚕️ Doctors: ${DOCTOR_PROFILES.length}`);
    console.log(`   👤 Patients: ${PATIENT_PROFILES.length}`);
    console.log(`   🏥 Departments: ${DEPARTMENTS.length}`);
    console.log(`   📅 Appointments: Sample appointments created`);
    console.log(`   📋 Medical Records: Sample records created`);
    console.log(`   ⭐ Reviews: Sample reviews created`);

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
  }
}

async function seedDepartments() {
  console.log('🏥 Seeding departments...');
  
  for (const dept of DEPARTMENTS) {
    const { error } = await supabase
      .from('departments')
      .upsert(dept, { onConflict: 'dept_id' });
    
    if (error) {
      console.log(`   ⚠️ Department ${dept.name}: ${error.message}`);
    } else {
      console.log(`   ✅ Department: ${dept.name}`);
    }
  }
}

async function seedDoctors() {
  console.log('\n👨‍⚕️ Seeding doctors...');
  
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
  const { data: doctors } = await supabase.from('doctors').select('doctor_id').limit(2);
  const { data: patients } = await supabase.from('patients').select('patient_id').limit(2);

  if (!doctors || !patients || doctors.length === 0 || patients.length === 0) {
    console.log('   ⚠️ No doctors or patients found for appointments');
    return;
  }

  // Create sample appointments
  const appointments = [
    {
      doctor_id: doctors[0].doctor_id,
      patient_id: patients[0].patient_id,
      appointment_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      appointment_time: '09:00',
      status: 'scheduled',
      appointment_type: 'consultation',
      notes: 'Khám tổng quát định kỳ'
    },
    {
      doctor_id: doctors[0].doctor_id,
      patient_id: patients[1].patient_id,
      appointment_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
      appointment_time: '10:30',
      status: 'scheduled',
      appointment_type: 'follow_up',
      notes: 'Tái khám sau điều trị'
    }
  ];

  for (const appointment of appointments) {
    const { error } = await supabase
      .from('appointments')
      .insert(appointment);

    if (error) {
      console.log(`   ⚠️ Appointment: ${error.message}`);
    } else {
      console.log(`   ✅ Appointment: ${appointment.doctor_id} -> ${appointment.patient_id}`);
    }
  }
}

async function seedMedicalRecords() {
  console.log('\n📋 Seeding sample medical records...');
  
  // Get appointments
  const { data: appointments } = await supabase
    .from('appointments')
    .select('appointment_id, doctor_id, patient_id')
    .limit(2);

  if (!appointments || appointments.length === 0) {
    console.log('   ⚠️ No appointments found for medical records');
    return;
  }

  for (const appointment of appointments) {
    const { error } = await supabase
      .from('medical_records')
      .insert({
        appointment_id: appointment.appointment_id,
        doctor_id: appointment.doctor_id,
        patient_id: appointment.patient_id,
        visit_date: new Date().toISOString().split('T')[0],
        chief_complaint: 'Đau đầu, chóng mặt',
        diagnosis: 'Tăng huyết áp nhẹ',
        treatment_plan: 'Thuốc hạ huyết áp, theo dõi huyết áp hàng ngày',
        notes: 'Bệnh nhân cần tái khám sau 2 tuần',
        status: 'active'
      });

    if (error) {
      console.log(`   ⚠️ Medical record: ${error.message}`);
    } else {
      console.log(`   ✅ Medical record for appointment: ${appointment.appointment_id}`);
    }
  }
}

async function seedDoctorReviews() {
  console.log('\n⭐ Seeding doctor reviews...');
  
  // Get doctors and patients
  const { data: doctors } = await supabase.from('doctors').select('doctor_id').limit(2);
  const { data: patients } = await supabase.from('patients').select('patient_id').limit(2);

  if (!doctors || !patients || doctors.length === 0 || patients.length === 0) {
    console.log('   ⚠️ No doctors or patients found for reviews');
    return;
  }

  const reviews = [
    {
      doctor_id: doctors[0].doctor_id,
      patient_id: patients[0].patient_id,
      rating: 5,
      review_text: 'Bác sĩ rất tận tâm và chuyên nghiệp. Giải thích rõ ràng về tình trạng bệnh.',
      review_date: new Date().toISOString(),
      is_verified: true
    },
    {
      doctor_id: doctors[0].doctor_id,
      patient_id: patients[1].patient_id,
      rating: 4,
      review_text: 'Khám bệnh kỹ lưỡng, thái độ thân thiện. Thời gian chờ hơi lâu.',
      review_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
      is_verified: true
    }
  ];

  for (const review of reviews) {
    const { error } = await supabase
      .from('doctor_reviews')
      .insert(review);

    if (error) {
      console.log(`   ⚠️ Review: ${error.message}`);
    } else {
      console.log(`   ✅ Review for doctor: ${review.doctor_id}`);
    }
  }
}

// Run the seeding
if (require.main === module) {
  seedTestData().catch(error => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
}

module.exports = { seedTestData };
