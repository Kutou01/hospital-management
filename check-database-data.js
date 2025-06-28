// Script để kiểm tra dữ liệu database cho doctor@hospital.com
const { createClient } = require('@supabase/supabase-js');

// Supabase config - sử dụng service role key từ .env
const supabaseUrl = 'https://ciasxktujslgsdgylimv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpYXN4a3R1anNsZ3NkZ3lsaW12Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzU1NTU2NSwiZXhwIjoyMDYzMTMxNTY1fQ.R2IieQgCFPQ5sgEqPSJmF9uB1hZasJHg5enl2alJpn4'; // Service role key từ .env

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseData() {
  console.log('🔍 Checking Database Data for doctor@hospital.com\n');

  try {
    // 1. Check profiles table
    console.log('1️⃣ Checking profiles table...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'doctor@hospital.com');

    if (profileError) {
      console.log('❌ Profile error:', profileError.message);
      return;
    }

    if (profiles.length === 0) {
      console.log('❌ No profile found for doctor@hospital.com');
      return;
    }

    const profile = profiles[0];
    console.log('✅ Profile found:');
    console.log(`   ID: ${profile.id}`);
    console.log(`   Email: ${profile.email}`);
    console.log(`   Full Name: ${profile.full_name}`);
    console.log(`   Role: ${profile.role}`);
    console.log(`   Phone: ${profile.phone_number}`);

    // 2. Check doctors table
    console.log('\n2️⃣ Checking doctors table...');
    const { data: doctors, error: doctorError } = await supabase
      .from('doctors')
      .select('*')
      .eq('profile_id', profile.id);

    if (doctorError) {
      console.log('❌ Doctor error:', doctorError.message);
    } else if (doctors.length === 0) {
      console.log('❌ No doctor record found');
    } else {
      const doctor = doctors[0];
      console.log('✅ Doctor record found:');
      console.log(`   Doctor ID: ${doctor.doctor_id}`);
      console.log(`   Full Name: ${doctor.full_name || 'NULL'}`);
      console.log(`   Specialty: ${doctor.specialty}`);
      console.log(`   Qualification: ${doctor.qualification || 'NULL'}`);
      console.log(`   License: ${doctor.license_number}`);
      console.log(`   Experience: ${doctor.experience_years} years`);
      console.log(`   Consultation Fee: ${doctor.consultation_fee || 'NULL'}`);
      console.log(`   Languages: ${JSON.stringify(doctor.languages_spoken)}`);
      console.log(`   Bio: ${doctor.bio || 'NULL'}`);
      console.log(`   Certifications: ${JSON.stringify(doctor.certifications)}`);
      console.log(`   Awards: ${JSON.stringify(doctor.awards)}`);

      const doctorId = doctor.doctor_id;

      // 3. Check appointments
      console.log('\n3️⃣ Checking appointments...');
      const { data: appointments, error: appointmentError } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', doctorId);

      if (appointmentError) {
        console.log('❌ Appointment error:', appointmentError.message);
      } else {
        console.log(`✅ Found ${appointments.length} appointments`);
        if (appointments.length > 0) {
          appointments.slice(0, 3).forEach((apt, index) => {
            console.log(`   ${index + 1}. ${apt.appointment_date} ${apt.appointment_time} - Status: ${apt.status}`);
          });
        }
      }

      // 4. Check doctor_schedules
      console.log('\n4️⃣ Checking doctor_schedules...');
      const { data: schedules, error: scheduleError } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', doctorId);

      if (scheduleError) {
        console.log('❌ Schedule error:', scheduleError.message);
      } else {
        console.log(`✅ Found ${schedules.length} schedule records`);
        if (schedules.length > 0) {
          schedules.slice(0, 3).forEach((schedule, index) => {
            console.log(`   ${index + 1}. ${schedule.day_of_week} ${schedule.start_time}-${schedule.end_time}`);
          });
        }
      }

      // 5. Check doctor_reviews
      console.log('\n5️⃣ Checking doctor_reviews...');
      const { data: reviews, error: reviewError } = await supabase
        .from('doctor_reviews')
        .select('*')
        .eq('doctor_id', doctorId);

      if (reviewError) {
        console.log('❌ Review error:', reviewError.message);
      } else {
        console.log(`✅ Found ${reviews.length} reviews`);
        if (reviews.length > 0) {
          reviews.slice(0, 3).forEach((review, index) => {
            console.log(`   ${index + 1}. Rating: ${review.rating}/5 - ${review.comment?.substring(0, 50)}...`);
          });
        }
      }

      // 6. Check doctor_experiences
      console.log('\n6️⃣ Checking doctor_experiences...');
      const { data: experiences, error: experienceError } = await supabase
        .from('doctor_experiences')
        .select('*')
        .eq('doctor_id', doctorId);

      if (experienceError) {
        console.log('❌ Experience error:', experienceError.message);
      } else {
        console.log(`✅ Found ${experiences.length} experience records`);
        if (experiences.length > 0) {
          experiences.forEach((exp, index) => {
            console.log(`   ${index + 1}. ${exp.position} at ${exp.organization || 'NULL'} (${exp.experience_type})`);
          });
        }
      }

      // 7. Check patients table for appointment data
      console.log('\n7️⃣ Checking patients table...');
      const { data: patients, error: patientError } = await supabase
        .from('patients')
        .select('patient_id, full_name')
        .limit(5);

      if (patientError) {
        console.log('❌ Patient error:', patientError.message);
      } else {
        console.log(`✅ Found ${patients.length} patients in system`);
        if (patients.length > 0) {
          patients.forEach((patient, index) => {
            console.log(`   ${index + 1}. ${patient.patient_id} - ${patient.full_name || 'NULL'}`);
          });
        }
      }

      // 8. Check departments
      console.log('\n8️⃣ Checking departments...');
      const { data: departments, error: deptError } = await supabase
        .from('departments')
        .select('*')
        .eq('department_id', doctor.department_id);

      if (deptError) {
        console.log('❌ Department error:', deptError.message);
      } else if (departments.length > 0) {
        const dept = departments[0];
        console.log('✅ Department found:');
        console.log(`   ID: ${dept.department_id}`);
        console.log(`   Name: ${dept.name}`);
        console.log(`   Description: ${dept.description || 'NULL'}`);
      }
    }

  } catch (error) {
    console.error('❌ Database check error:', error.message);
  }
}

async function generateSampleData() {
  console.log('\n🔧 Generating sample data recommendations...\n');
  
  console.log('📝 SQL Scripts to add missing data:\n');
  
  // Sample appointments
  console.log('-- Add sample appointments');
  console.log(`INSERT INTO appointments (appointment_id, doctor_id, patient_id, appointment_date, appointment_time, appointment_type, status, notes) VALUES
('APT-001', 'GENE-DOC-202506-006', 'PAT-202506-001', CURRENT_DATE, '09:00:00', 'Khám tổng quát', 'scheduled', 'Khám sức khỏe định kỳ'),
('APT-002', 'GENE-DOC-202506-006', 'PAT-202506-002', CURRENT_DATE, '10:30:00', 'Tái khám', 'scheduled', 'Theo dõi điều trị'),
('APT-003', 'GENE-DOC-202506-006', 'PAT-202506-003', CURRENT_DATE + 1, '14:00:00', 'Khám chuyên khoa', 'scheduled', 'Khám tim mạch');`);
  
  // Sample reviews
  console.log('\n-- Add sample reviews');
  console.log(`INSERT INTO doctor_reviews (review_id, doctor_id, patient_id, rating, comment, review_date) VALUES
('REV-001', 'GENE-DOC-202506-006', 'PAT-202506-001', 5, 'Bác sĩ rất tận tâm và chuyên nghiệp. Giải thích rõ ràng về tình trạng bệnh.', CURRENT_DATE - 7),
('REV-002', 'GENE-DOC-202506-006', 'PAT-202506-002', 4, 'Khám bệnh kỹ lưỡng, thái độ thân thiện. Rất hài lòng với dịch vụ.', CURRENT_DATE - 14),
('REV-003', 'GENE-DOC-202506-006', 'PAT-202506-003', 5, 'Bác sĩ có kinh nghiệm, chẩn đoán chính xác. Sẽ quay lại khám tiếp.', CURRENT_DATE - 21);`);
  
  // Update doctor info
  console.log('\n-- Update doctor information');
  console.log(`UPDATE doctors SET 
full_name = 'BS. Nguyễn Văn Đức',
qualification = 'Thạc sĩ Y khoa, Chuyên khoa II Nội tổng hợp',
consultation_fee = 500000,
bio = 'Bác sĩ chuyên khoa Nội tổng hợp với 14 năm kinh nghiệm. Chuyên điều trị các bệnh lý nội khoa phức tạp, tư vấn sức khỏe và khám sức khỏe định kỳ.',
languages_spoken = '["Tiếng Việt", "English"]',
certifications = '["Chứng chỉ Nội khoa", "Chứng chỉ Siêu âm tim", "Chứng chỉ Điện tim"]',
awards = '["Bác sĩ xuất sắc 2023", "Giải thưởng phục vụ bệnh nhân tốt"]'
WHERE doctor_id = 'GENE-DOC-202506-006';`);
  
  // Update experiences
  console.log('\n-- Update doctor experiences');
  console.log(`UPDATE doctor_experiences SET 
organization = CASE 
  WHEN position = 'Bác sĩ Nội khoa' THEN 'Bệnh viện Đa khoa Trung ương'
  WHEN position = 'Bác sĩ thực tập' THEN 'Bệnh viện Đại học Y Hà Nội'
  ELSE organization
END
WHERE doctor_id = 'GENE-DOC-202506-006';`);
}

// Run checks
checkDatabaseData().then(() => {
  generateSampleData();
});
