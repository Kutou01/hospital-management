const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCurrentData() {
  console.log('🔍 CHECKING CURRENT DATABASE DATA');
  console.log('='.repeat(50));

  try {
    // Check profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.log('❌ Error checking profiles:', profilesError.message);
      return;
    }

    console.log(`📋 Profiles: ${profiles?.length || 0} records`);
    if (profiles && profiles.length > 0) {
      console.log('   Sample profiles:');
      profiles.slice(0, 3).forEach(p => {
        console.log(`   - ${p.full_name} (${p.role}) - ${p.email}`);
      });
    }

    // Check departments
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .order('department_id');

    console.log(`\n🏥 Departments: ${departments?.length || 0} records`);
    if (departments && departments.length > 0) {
      departments.forEach(d => {
        console.log(`   - ${d.department_id}: ${d.department_name}`);
      });
    }

    // Check specialties
    const { data: specialties, error: specError } = await supabase
      .from('specialties')
      .select('*')
      .order('specialty_id');

    console.log(`\n🩺 Specialties: ${specialties?.length || 0} records`);
    if (specialties && specialties.length > 0) {
      specialties.slice(0, 5).forEach(s => {
        console.log(`   - ${s.specialty_id}: ${s.specialty_name} (${s.department_id})`);
      });
    }

    // Check doctors
    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select(`
        *,
        departments:department_id(department_name),
        specialties:specialty_id(specialty_name)
      `)
      .order('created_at', { ascending: false });

    console.log(`\n👨‍⚕️ Doctors: ${doctors?.length || 0} records`);
    if (doctors && doctors.length > 0) {
      doctors.slice(0, 5).forEach(d => {
        console.log(`   - ${d.doctor_id}: ${d.full_name} (${d.specialization})`);
      });
    }

    // Check patients
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    console.log(`\n🤒 Patients: ${patients?.length || 0} records`);
    if (patients && patients.length > 0) {
      patients.slice(0, 3).forEach(p => {
        console.log(`   - ${p.patient_id}: ${p.full_name}`);
      });
    }

    // Check appointments
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false });

    console.log(`\n📅 Appointments: ${appointments?.length || 0} records`);
    if (appointments && appointments.length > 0) {
      appointments.slice(0, 3).forEach(a => {
        console.log(`   - ${a.appointment_id}: ${a.appointment_date} ${a.start_time} (${a.status})`);
      });
    }

    // Check doctor reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('doctor_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    console.log(`\n⭐ Doctor Reviews: ${reviews?.length || 0} records`);
    if (reviews && reviews.length > 0) {
      reviews.slice(0, 3).forEach(r => {
        console.log(`   - Doctor ${r.doctor_id}: ${r.rating}/5 stars`);
      });
    }

    return {
      profiles: profiles?.length || 0,
      departments: departments?.length || 0,
      specialties: specialties?.length || 0,
      doctors: doctors?.length || 0,
      patients: patients?.length || 0,
      appointments: appointments?.length || 0,
      reviews: reviews?.length || 0,
      departmentsList: departments || [],
      specialtiesList: specialties || []
    };

  } catch (error) {
    console.error('❌ Error checking data:', error.message);
    return null;
  }
}

async function createTestData(currentData) {
  console.log('\n🚀 CREATING COMPREHENSIVE TEST DATA');
  console.log('='.repeat(50));

  try {
    // Ensure we have departments
    if (currentData.departments === 0) {
      console.log('📝 Creating departments...');
      const departments = [
        { department_id: 'DEPT001', department_name: 'Tim mạch', description: 'Khoa Tim mạch' },
        { department_id: 'DEPT002', department_name: 'Thần kinh', description: 'Khoa Thần kinh' },
        { department_id: 'DEPT003', department_name: 'Nhi khoa', description: 'Khoa Nhi' },
        { department_id: 'DEPT004', department_name: 'Sản phụ khoa', description: 'Khoa Sản phụ khoa' },
        { department_id: 'DEPT005', department_name: 'Ngoại khoa', description: 'Khoa Ngoại' }
      ];

      const { error: deptError } = await supabase
        .from('departments')
        .upsert(departments);

      if (deptError) {
        console.log('❌ Error creating departments:', deptError.message);
        return;
      }
      console.log('✅ Created 5 departments');
    }

    // Ensure we have specialties
    if (currentData.specialties === 0) {
      console.log('📝 Creating specialties...');
      const specialties = [
        { specialty_id: 'SPEC001', specialty_name: 'Tim mạch can thiệp', department_id: 'DEPT001' },
        { specialty_id: 'SPEC002', specialty_name: 'Siêu âm tim', department_id: 'DEPT001' },
        { specialty_id: 'SPEC003', specialty_name: 'Thần kinh học', department_id: 'DEPT002' },
        { specialty_id: 'SPEC004', specialty_name: 'Nhi tim mạch', department_id: 'DEPT003' },
        { specialty_id: 'SPEC005', specialty_name: 'Nhi tiêu hóa', department_id: 'DEPT003' },
        { specialty_id: 'SPEC006', specialty_name: 'Sản khoa', department_id: 'DEPT004' },
        { specialty_id: 'SPEC007', specialty_name: 'Phụ khoa', department_id: 'DEPT004' },
        { specialty_id: 'SPEC008', specialty_name: 'Ngoại tổng quát', department_id: 'DEPT005' }
      ];

      const { error: specError } = await supabase
        .from('specialties')
        .upsert(specialties);

      if (specError) {
        console.log('❌ Error creating specialties:', specError.message);
        return;
      }
      console.log('✅ Created 8 specialties');
    }

    // Create test doctor profiles if needed
    if (currentData.doctors < 5) {
      console.log('📝 Creating doctor test data...');
      
      const doctorProfiles = [
        {
          email: 'doctor1@hospital.com',
          role: 'doctor',
          full_name: 'BS. Nguyễn Văn Hùng',
          phone_number: '0901234567',
          date_of_birth: '1980-05-15'
        },
        {
          email: 'doctor2@hospital.com',
          role: 'doctor',
          full_name: 'BS. Trần Thị Lan',
          phone_number: '0901234568',
          date_of_birth: '1985-08-20'
        },
        {
          email: 'doctor3@hospital.com',
          role: 'doctor',
          full_name: 'BS. Lê Minh Tuấn',
          phone_number: '0901234569',
          date_of_birth: '1978-12-10'
        },
        {
          email: 'doctor4@hospital.com',
          role: 'doctor',
          full_name: 'BS. Phạm Thị Mai',
          phone_number: '0901234570',
          date_of_birth: '1982-03-25'
        },
        {
          email: 'doctor5@hospital.com',
          role: 'doctor',
          full_name: 'BS. Hoàng Văn Nam',
          phone_number: '0901234571',
          date_of_birth: '1975-11-08'
        }
      ];

      // Create profiles first
      const { data: createdProfiles, error: profileError } = await supabase
        .from('profiles')
        .upsert(doctorProfiles, { onConflict: 'email' })
        .select();

      if (profileError) {
        console.log('❌ Error creating doctor profiles:', profileError.message);
        return;
      }

      console.log(`✅ Created ${createdProfiles.length} doctor profiles`);

      // Create doctor records
      const doctors = [
        {
          profile_id: createdProfiles[0].profile_id,
          full_name: 'BS. Nguyễn Văn Hùng',
          specialization: 'Tim mạch can thiệp',
          qualification: 'Tiến sĩ Y khoa, Chuyên khoa II Tim mạch',
          department_id: 'DEPT001',
          specialty_id: 'SPEC001',
          license_number: 'VN-HM-1234',
          gender: 'male',
          phone_number: '0901234567',
          email: 'doctor1@hospital.com',
          experience_years: 15,
          consultation_fee: 500000,
          status: 'active'
        },
        {
          profile_id: createdProfiles[1].profile_id,
          full_name: 'BS. Trần Thị Lan',
          specialization: 'Thần kinh học',
          qualification: 'Thạc sĩ Y khoa, Chuyên khoa I Thần kinh',
          department_id: 'DEPT002',
          specialty_id: 'SPEC003',
          license_number: 'VN-HM-1235',
          gender: 'female',
          phone_number: '0901234568',
          email: 'doctor2@hospital.com',
          experience_years: 10,
          consultation_fee: 400000,
          status: 'active'
        },
        {
          profile_id: createdProfiles[2].profile_id,
          full_name: 'BS. Lê Minh Tuấn',
          specialization: 'Nhi tim mạch',
          qualification: 'Tiến sĩ Y khoa, Chuyên khoa II Nhi',
          department_id: 'DEPT003',
          specialty_id: 'SPEC004',
          license_number: 'VN-HM-1236',
          gender: 'male',
          phone_number: '0901234569',
          email: 'doctor3@hospital.com',
          experience_years: 18,
          consultation_fee: 600000,
          status: 'active'
        },
        {
          profile_id: createdProfiles[3].profile_id,
          full_name: 'BS. Phạm Thị Mai',
          specialization: 'Sản khoa',
          qualification: 'Thạc sĩ Y khoa, Chuyên khoa I Sản phụ khoa',
          department_id: 'DEPT004',
          specialty_id: 'SPEC006',
          license_number: 'VN-HM-1237',
          gender: 'female',
          phone_number: '0901234570',
          email: 'doctor4@hospital.com',
          experience_years: 12,
          consultation_fee: 450000,
          status: 'active'
        },
        {
          profile_id: createdProfiles[4].profile_id,
          full_name: 'BS. Hoàng Văn Nam',
          specialization: 'Ngoại tổng quát',
          qualification: 'Tiến sĩ Y khoa, Chuyên khoa II Ngoại',
          department_id: 'DEPT005',
          specialty_id: 'SPEC008',
          license_number: 'VN-HM-1238',
          gender: 'male',
          phone_number: '0901234571',
          email: 'doctor5@hospital.com',
          experience_years: 20,
          consultation_fee: 550000,
          status: 'active'
        }
      ];

      const { data: createdDoctors, error: doctorError } = await supabase
        .from('doctors')
        .upsert(doctors, { onConflict: 'email' })
        .select();

      if (doctorError) {
        console.log('❌ Error creating doctors:', doctorError.message);
        return;
      }

      console.log(`✅ Created ${createdDoctors.length} doctors with proper IDs`);
    }

    // Create test patients if needed
    if (currentData.patients < 3) {
      console.log('📝 Creating patient test data...');

      const patientProfiles = [
        {
          email: 'patient1@test.com',
          role: 'patient',
          full_name: 'Nguyễn Thị Hoa',
          phone_number: '0987654321',
          date_of_birth: '1990-06-15'
        },
        {
          email: 'patient2@test.com',
          role: 'patient',
          full_name: 'Trần Văn Minh',
          phone_number: '0987654322',
          date_of_birth: '1985-03-20'
        },
        {
          email: 'patient3@test.com',
          role: 'patient',
          full_name: 'Lê Thị Mai',
          phone_number: '0987654323',
          date_of_birth: '1992-12-10'
        }
      ];

      const { data: createdPatientProfiles, error: patientProfileError } = await supabase
        .from('profiles')
        .upsert(patientProfiles, { onConflict: 'email' })
        .select();

      if (patientProfileError) {
        console.log('❌ Error creating patient profiles:', patientProfileError.message);
      } else {
        const patients = [
          {
            profile_id: createdPatientProfiles[0].profile_id,
            full_name: 'Nguyễn Thị Hoa',
            gender: 'female',
            phone_number: '0987654321',
            email: 'patient1@test.com',
            emergency_contact: '0912345678',
            blood_type: 'A+',
            allergies: 'Không có',
            medical_history: 'Tiền sử cao huyết áp'
          },
          {
            profile_id: createdPatientProfiles[1].profile_id,
            full_name: 'Trần Văn Minh',
            gender: 'male',
            phone_number: '0987654322',
            email: 'patient2@test.com',
            emergency_contact: '0912345679',
            blood_type: 'O+',
            allergies: 'Dị ứng thuốc kháng sinh',
            medical_history: 'Tiền sử đái tháo đường'
          },
          {
            profile_id: createdPatientProfiles[2].profile_id,
            full_name: 'Lê Thị Mai',
            gender: 'female',
            phone_number: '0987654323',
            email: 'patient3@test.com',
            emergency_contact: '0912345680',
            blood_type: 'B+',
            allergies: 'Không có',
            medical_history: 'Khỏe mạnh'
          }
        ];

        const { data: createdPatients, error: patientError } = await supabase
          .from('patients')
          .upsert(patients, { onConflict: 'email' })
          .select();

        if (patientError) {
          console.log('❌ Error creating patients:', patientError.message);
        } else {
          console.log(`✅ Created ${createdPatients.length} patients`);
        }
      }
    }

    // Create test appointments if needed
    if (currentData.appointments < 10) {
      console.log('📝 Creating appointment test data...');

      // Get existing doctors and patients
      const { data: existingDoctors } = await supabase
        .from('doctors')
        .select('doctor_id')
        .limit(3);

      const { data: existingPatients } = await supabase
        .from('patients')
        .select('patient_id')
        .limit(3);

      if (existingDoctors && existingPatients && existingDoctors.length > 0 && existingPatients.length > 0) {
        const today = new Date();
        const appointments = [];

        // Create appointments for different dates and times
        for (let i = 0; i < 12; i++) {
          const appointmentDate = new Date(today);
          appointmentDate.setDate(today.getDate() + (i - 6)); // Past, present, and future appointments

          const hour = 8 + (i % 8); // 8AM to 3PM
          const status = i < 4 ? 'completed' : i < 8 ? 'confirmed' : 'pending';

          appointments.push({
            doctor_id: existingDoctors[i % existingDoctors.length].doctor_id,
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
          .upsert(appointments)
          .select();

        if (appointmentError) {
          console.log('❌ Error creating appointments:', appointmentError.message);
        } else {
          console.log(`✅ Created ${createdAppointments.length} appointments`);
        }
      }
    }

    // Create doctor reviews if needed
    if (currentData.reviews < 5) {
      console.log('📝 Creating doctor review test data...');

      const { data: existingDoctors } = await supabase
        .from('doctors')
        .select('doctor_id')
        .limit(5);

      const { data: existingPatients } = await supabase
        .from('patients')
        .select('patient_id')
        .limit(3);

      if (existingDoctors && existingPatients && existingDoctors.length > 0 && existingPatients.length > 0) {
        const reviews = [];
        const reviewComments = [
          'Bác sĩ rất tận tâm và chuyên nghiệp',
          'Khám bệnh kỹ lưỡng, giải thích rõ ràng',
          'Thái độ thân thiện, điều trị hiệu quả',
          'Bác sĩ giỏi, kinh nghiệm nhiều',
          'Rất hài lòng với dịch vụ khám chữa bệnh'
        ];

        for (let i = 0; i < 15; i++) {
          const rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars mostly
          reviews.push({
            doctor_id: existingDoctors[i % existingDoctors.length].doctor_id,
            patient_id: existingPatients[i % existingPatients.length].patient_id,
            rating: rating,
            comment: reviewComments[i % reviewComments.length],
            review_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          });
        }

        const { data: createdReviews, error: reviewError } = await supabase
          .from('doctor_reviews')
          .upsert(reviews)
          .select();

        if (reviewError) {
          console.log('❌ Error creating reviews:', reviewError.message);
        } else {
          console.log(`✅ Created ${createdReviews.length} doctor reviews`);
        }
      }
    }

    console.log('\n✅ Test data creation completed!');

  } catch (error) {
    console.error('❌ Error creating test data:', error.message);
  }
}

async function main() {
  console.log('🏥 HOSPITAL MANAGEMENT - DOCTOR SERVICE TEST DATA SETUP');
  console.log('='.repeat(60));
  
  const currentData = await checkCurrentData();
  
  if (!currentData) {
    console.log('❌ Failed to check current data');
    return;
  }

  console.log('\n📊 SUMMARY:');
  console.log(`   Profiles: ${currentData.profiles}`);
  console.log(`   Departments: ${currentData.departments}`);
  console.log(`   Specialties: ${currentData.specialties}`);
  console.log(`   Doctors: ${currentData.doctors}`);
  console.log(`   Patients: ${currentData.patients}`);
  console.log(`   Appointments: ${currentData.appointments}`);
  console.log(`   Reviews: ${currentData.reviews}`);

  if (currentData.doctors < 5 || currentData.departments === 0 || currentData.specialties === 0) {
    await createTestData(currentData);
  } else {
    console.log('\n✅ Sufficient test data already exists!');
  }

  // Final verification
  console.log('\n🔍 FINAL VERIFICATION:');
  await checkCurrentData();
}

main().catch(console.error);
