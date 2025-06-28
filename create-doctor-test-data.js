const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://ciasxktujslgsdgylimv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpYXN4a3R1anNsZ3NkZ3lsaW12Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzU1NTU2NSwiZXhwIjoyMDYzMTMxNTY1fQ.R2IieQgCFPQ5sgEqPSJmF9uB1hZasJHg5enl2alJpn4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDoctorTestData() {
  console.log('🏥 Creating comprehensive test data for doctor@hospital.com...\n');

  try {
    // 1. Find doctor profile
    console.log('📋 Step 1: Finding doctor profile...');
    const { data: doctorProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'doctor@hospital.com')
      .single();

    if (profileError || !doctorProfile) {
      console.log('❌ Doctor profile not found. Creating profile first...');
      
      // Create profile
      const { data: newProfile, error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          email: 'doctor@hospital.com',
          full_name: 'BS. Nguyễn Văn Minh',
          role: 'doctor',
          phone_number: '0901234567',
          date_of_birth: '1985-03-15',
          is_active: true,
          email_verified: true,
          phone_verified: true,
          login_count: 5,
          two_factor_enabled: false
        })
        .select()
        .single();

      if (createProfileError) {
        console.log('❌ Error creating profile:', createProfileError.message);
        return;
      }
      
      console.log('✅ Created doctor profile:', newProfile.id);
      doctorProfile = newProfile;
    } else {
      console.log('✅ Found doctor profile:', doctorProfile.id);
    }

    // 2. Find or create doctor record
    console.log('\n📋 Step 2: Finding/creating doctor record...');
    let { data: doctorRecord, error: doctorError } = await supabase
      .from('doctors')
      .select('*')
      .eq('profile_id', doctorProfile.id)
      .single();

    if (doctorError || !doctorRecord) {
      console.log('Creating doctor record...');
      
      const { data: newDoctor, error: createDoctorError } = await supabase
        .from('doctors')
        .insert({
          profile_id: doctorProfile.id,
          specialty: 'Tim Mạch',
          qualification: 'Tiến sĩ Y khoa',
          department_id: 'DEPT001',
          license_number: 'VN-TM-2024',
          gender: 'male',
          bio: 'Bác sĩ chuyên khoa Tim Mạch với 15 năm kinh nghiệm. Chuyên điều trị các bệnh lý tim mạch phức tạp.',
          experience_years: 15,
          consultation_fee: 500000,
          address: {
            street: '123 Đường Nguyễn Văn Cừ',
            ward: 'Phường 4',
            district: 'Quận 5',
            city: 'TP. Hồ Chí Minh',
            country: 'Việt Nam'
          },
          languages_spoken: ['Vietnamese', 'English'],
          availability_status: 'available',
          rating: 4.8,
          total_reviews: 127,
          status: 'active',
          is_active: true,
          success_rate: 95.5,
          total_revenue: 125000000,
          average_consultation_time: 30,
          certifications: [
            {
              name: 'Chứng chỉ Tim Mạch Quốc tế',
              issuer: 'Hội Tim Mạch Việt Nam',
              date: '2020-06-15'
            },
            {
              name: 'Chứng chỉ Siêu âm Tim',
              issuer: 'Bệnh viện Chợ Rẫy',
              date: '2019-03-20'
            }
          ],
          specializations: [
            'Điều trị bệnh mạch vành',
            'Siêu âm tim',
            'Điện tâm đồ',
            'Phẫu thuật tim hở'
          ],
          awards: [
            {
              name: 'Bác sĩ xuất sắc năm 2023',
              organization: 'Sở Y tế TP.HCM',
              year: 2023
            }
          ]
        })
        .select()
        .single();

      if (createDoctorError) {
        console.log('❌ Error creating doctor:', createDoctorError.message);
        return;
      }
      
      doctorRecord = newDoctor;
      console.log('✅ Created doctor record:', doctorRecord.doctor_id);
    } else {
      console.log('✅ Found doctor record:', doctorRecord.doctor_id);
    }

    // 3. Get existing patients from database
    console.log('\n📋 Step 3: Getting existing patients from database...');
    const { data: existingPatients, error: patientsError } = await supabase
      .from('patients')
      .select(`
        *,
        profile:profiles!profile_id (
          id,
          full_name,
          email
        )
      `)
      .limit(5);

    if (patientsError) {
      console.log('❌ Error fetching patients:', patientsError.message);
      return;
    }

    if (!existingPatients || existingPatients.length === 0) {
      console.log('❌ No patients found in database. Please create some patients first.');
      return;
    }

    console.log(`✅ Found ${existingPatients.length} existing patients:`);
    existingPatients.forEach(patient => {
      console.log(`   - ${patient.profile?.full_name} (${patient.patient_id})`);
    });

    const createdPatients = existingPatients;

    // 4. Create appointments with proper ID format
    console.log('\n📋 Step 4: Creating test appointments...');

    // Function to generate appointment ID based on existing pattern
    function generateAppointmentId(index) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const timestamp = Date.now().toString().slice(-3);
      const sequence = String(index + 1).padStart(3, '0');

      return `APT-${year}${month}-${timestamp}${sequence}`;
    }

    const appointmentData = [
      {
        patient_id: createdPatients[0]?.patient_id,
        appointment_date: '2025-06-28',
        start_time: '09:00:00',
        end_time: '09:30:00',
        status: 'scheduled',
        reason: 'Khám định kỳ tim mạch',
        notes: 'Bệnh nhân có triệu chứng đau ngực nhẹ'
      },
      {
        patient_id: createdPatients[1]?.patient_id,
        appointment_date: '2025-06-28',
        start_time: '10:00:00',
        end_time: '10:30:00',
        status: 'completed',
        reason: 'Tái khám sau phẫu thuật',
        notes: 'Kiểm tra vết mổ và tình trạng hồi phục',
        diagnosis: 'Hồi phục tốt sau phẫu thuật',
        prescription: 'Thuốc chống đông máu, thuốc hạ cholesterol'
      },
      {
        patient_id: createdPatients[2]?.patient_id,
        appointment_date: '2025-06-29',
        start_time: '14:00:00',
        end_time: '14:30:00',
        status: 'scheduled',
        reason: 'Siêu âm tim',
        notes: 'Bệnh nhân cần làm siêu âm tim để đánh giá chức năng'
      },
      {
        patient_id: createdPatients[3]?.patient_id || createdPatients[0]?.patient_id,
        appointment_date: '2025-06-25',
        start_time: '15:00:00',
        end_time: '15:30:00',
        status: 'completed',
        reason: 'Khám sức khỏe định kỳ',
        notes: 'Khám tổng quát và đo huyết áp',
        diagnosis: 'Sức khỏe ổn định',
        prescription: 'Thuốc hạ huyết áp'
      },
      {
        patient_id: createdPatients[4]?.patient_id || createdPatients[1]?.patient_id,
        appointment_date: '2025-06-30',
        start_time: '11:00:00',
        end_time: '11:30:00',
        status: 'scheduled',
        reason: 'Khám tái khám',
        notes: 'Bệnh nhân cần tái khám sau điều trị'
      }
    ];

    let appointmentCount = 0;
    for (let i = 0; i < appointmentData.length; i++) {
      const appt = appointmentData[i];
      if (!appt.patient_id) continue;

      // Add small delay to ensure unique timestamps
      await new Promise(resolve => setTimeout(resolve, 200));

      const appointmentId = generateAppointmentId(i);

      const { data: appointment, error: apptError } = await supabase
        .from('appointments')
        .insert({
          appointment_id: appointmentId,
          doctor_id: doctorRecord.doctor_id,
          patient_id: appt.patient_id,
          appointment_date: appt.appointment_date,
          start_time: appt.start_time,
          end_time: appt.end_time,
          appointment_type: 'consultation',
          status: appt.status,
          reason: appt.reason,
          notes: appt.notes,
          diagnosis: appt.diagnosis || null,
          prescription: appt.prescription || null,
          follow_up_required: false
        })
        .select()
        .single();

      if (apptError) {
        console.log('❌ Error creating appointment:', apptError.message);
        console.log('   Error details:', apptError);
      } else {
        console.log(`✅ Created appointment: ${appointment.appointment_id} (${appt.status})`);
        appointmentCount++;
      }
    }

    // 5. Create doctor reviews
    console.log('\n📋 Step 5: Creating doctor reviews...');

    // Function to generate review ID
    function generateReviewId(index) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const sequence = String(index + 1).padStart(3, '0');

      return `REV-${year}${month}-${sequence}`;
    }

    const reviewsData = [
      {
        patient_id: createdPatients[0]?.patient_id,
        rating: 5,
        review_text: 'Bác sĩ rất tận tâm và chuyên nghiệp. Giải thích rõ ràng về tình trạng bệnh.',
        is_verified: true
      },
      {
        patient_id: createdPatients[1]?.patient_id,
        rating: 5,
        review_text: 'Phẫu thuật thành công, bác sĩ có tay nghề cao. Rất hài lòng với dịch vụ.',
        is_verified: true
      },
      {
        patient_id: createdPatients[2]?.patient_id,
        rating: 4,
        review_text: 'Bác sĩ khám rất kỹ, tuy nhiên thời gian chờ hơi lâu.',
        is_verified: true
      }
    ];

    let reviewCount = 0;
    for (let i = 0; i < reviewsData.length; i++) {
      const review = reviewsData[i];
      if (!review.patient_id) continue;

      // Try with review_id first (custom format)
      let reviewData = {
        review_id: generateReviewId(i),
        doctor_id: doctorRecord.doctor_id,
        patient_id: review.patient_id,
        rating: review.rating,
        review_text: review.review_text,
        is_verified: review.is_verified,
        helpful_count: Math.floor(Math.random() * 10)
      };

      let { data: doctorReview, error: reviewError } = await supabase
        .from('doctor_reviews')
        .insert(reviewData)
        .select()
        .single();

      if (reviewError && reviewError.message.includes('review_id')) {
        // Try without review_id (UUID auto-generated)
        console.log('Trying with UUID format...');
        const { review_id, ...dataWithoutReviewId } = reviewData;

        const { data: doctorReview2, error: reviewError2 } = await supabase
          .from('doctor_reviews')
          .insert(dataWithoutReviewId)
          .select()
          .single();

        if (reviewError2) {
          console.log('❌ Error creating review:', reviewError2.message);
        } else {
          console.log(`✅ Created review: ${review.rating} stars (UUID: ${doctorReview2.id})`);
          reviewCount++;
        }
      } else if (reviewError) {
        console.log('❌ Error creating review:', reviewError.message);
      } else {
        console.log(`✅ Created review: ${review.rating} stars (${doctorReview.review_id})`);
        reviewCount++;
      }
    }

    console.log('\n🎉 Test data creation completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`👨‍⚕️ Doctor: ${doctorRecord.doctor_id} - ${doctorProfile.full_name}`);
    console.log(`👥 Patients: ${createdPatients.length} existing patients used`);
    console.log(`📅 Appointments: ${appointmentCount} appointments created`);
    console.log(`⭐ Reviews: ${reviewCount} reviews created`);
    console.log('\n✅ You can now test the doctor service with comprehensive data!');
    console.log('\n🔗 Test URLs:');
    console.log(`   - Doctor Profile: http://localhost:3000/doctor/profile`);
    console.log(`   - Doctor API: http://localhost:3002/api/doctors/${doctorRecord.doctor_id}`);
    console.log(`   - Appointments API: http://localhost:3100/internal/appointments/doctor/${doctorRecord.doctor_id}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
createDoctorTestData();
