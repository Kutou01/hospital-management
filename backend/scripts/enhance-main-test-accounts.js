const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function enhanceMainTestAccounts() {
  console.log('🔧 ENHANCING MAIN TEST ACCOUNTS');
  console.log('='.repeat(60));

  try {
    // Step 1: Check and enhance doctor@hospital.com
    console.log('👨‍⚕️ Step 1: Enhancing doctor@hospital.com...');
    
    const { data: doctorProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'doctor@hospital.com')
      .single();

    if (!doctorProfile) {
      console.log('❌ doctor@hospital.com profile not found');
      return;
    }

    console.log(`   ✅ Found doctor profile: ${doctorProfile.full_name}`);

    // Get the doctor record
    const { data: doctorRecord } = await supabase
      .from('doctors')
      .select('*')
      .eq('profile_id', doctorProfile.id)
      .single();

    if (!doctorRecord) {
      console.log('❌ Doctor record not found for doctor@hospital.com');
      return;
    }

    console.log(`   ✅ Found doctor record: ${doctorRecord.doctor_id}`);

    // Update doctor with comprehensive information
    const enhancedDoctorData = {
      full_name: 'BS. Nguyễn Văn Đức',
      specialty: 'SPEC028', // Tim Mạch Học
      department_id: 'DEPT001', // Khoa Tim Mạch
      license_number: 'VN-MAIN-0001',
      qualification: 'Tiến sĩ Y khoa, Chuyên khoa II Tim mạch, Thạc sĩ Quản lý Y tế',
      experience_years: 20,
      consultation_fee: 800000,
      gender: 'male',
      address: {
        street: '123 Đường Nguyễn Văn Cừ',
        district: 'Quận 1',
        city: 'TP.HCM',
        zipcode: '70000'
      },
      bio: 'Bác sĩ chuyên khoa Tim mạch với 20 năm kinh nghiệm. Chuyên điều trị các bệnh lý tim mạch phức tạp, can thiệp tim mạch và phẫu thuật tim. Từng tu nghiệp tại Mỹ và có nhiều công trình nghiên cứu quốc tế.',
      languages_spoken: ['Vietnamese', 'English', 'French'],
      availability_status: 'available',
      rating: 4.8,
      total_reviews: 15,
      status: 'active',
      is_active: true,
      certifications: [
        'Chứng chỉ Can thiệp Tim mạch - Hội Tim mạch Việt Nam',
        'Chứng chỉ Siêu âm Tim - ESC Europe',
        'Chứng chỉ Quản lý Y tế - Harvard School of Public Health'
      ],
      awards: [
        'Thầy thuốc Ưu tú 2020',
        'Giải thưởng Nghiên cứu Y học 2019',
        'Bác sĩ Xuất sắc TP.HCM 2018'
      ],
      research_interests: [
        'Can thiệp tim mạch qua da',
        'Điều trị suy tim tiến triển',
        'Ứng dụng AI trong chẩn đoán tim mạch'
      ]
    };

    const { error: doctorUpdateError } = await supabase
      .from('doctors')
      .update(enhancedDoctorData)
      .eq('doctor_id', doctorRecord.doctor_id);

    if (doctorUpdateError) {
      console.log(`   ❌ Error updating doctor: ${doctorUpdateError.message}`);
    } else {
      console.log('   ✅ Enhanced doctor record with comprehensive data');
    }

    // Update profile
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        full_name: 'BS. Nguyễn Văn Đức',
        phone_number: '0901234567',
        date_of_birth: '1980-05-15'
      })
      .eq('id', doctorProfile.id);

    if (profileUpdateError) {
      console.log(`   ❌ Error updating profile: ${profileUpdateError.message}`);
    } else {
      console.log('   ✅ Enhanced doctor profile');
    }

    // Step 2: Check and enhance patient@hospital.com
    console.log('\n🤒 Step 2: Enhancing patient@hospital.com...');
    
    const { data: patientProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'patient@hospital.com')
      .single();

    if (!patientProfile) {
      console.log('❌ patient@hospital.com profile not found');
      return;
    }

    console.log(`   ✅ Found patient profile: ${patientProfile.full_name}`);

    // Get the patient record
    const { data: patientRecord } = await supabase
      .from('patients')
      .select('*')
      .eq('profile_id', patientProfile.id)
      .single();

    if (!patientRecord) {
      console.log('❌ Patient record not found for patient@hospital.com');
      return;
    }

    console.log(`   ✅ Found patient record: ${patientRecord.patient_id}`);

    // Update patient with comprehensive information
    const enhancedPatientData = {
      full_name: 'Trần Thị Hương',
      gender: 'female',
      blood_type: 'A+',
      address: {
        street: '456 Đường Lê Lợi',
        district: 'Quận 1',
        city: 'TP.HCM',
        zipcode: '70000'
      },
      emergency_contact: {
        name: 'Trần Văn Minh',
        phone: '0912345678',
        relationship: 'Chồng',
        address: '456 Đường Lê Lợi, Quận 1, TP.HCM'
      },
      insurance_info: {
        provider: 'BHYT',
        policy_number: 'DN1234567890',
        expiry_date: '2025-12-31',
        coverage_type: 'Toàn diện'
      },
      medical_history: 'Tiền sử cao huyết áp từ năm 2020. Đã phẫu thuật cắt ruột thừa năm 2018. Không có tiền sử dị ứng thuốc.',
      allergies: [
        'Dị ứng với Penicillin',
        'Dị ứng với tôm cua'
      ],
      chronic_conditions: [
        'Cao huyết áp',
        'Tiểu đường type 2 nhẹ'
      ],
      current_medications: {
        'Amlodipine 5mg': 'Uống 1 viên/ngày vào buổi sáng',
        'Metformin 500mg': 'Uống 1 viên x 2 lần/ngày sau ăn',
        'Vitamin D3': 'Uống 1 viên/tuần'
      },
      status: 'active',
      notes: 'Bệnh nhân tuân thủ điều trị tốt. Cần theo dõi đường huyết định kỳ 3 tháng/lần.',
      date_of_birth: '1985-08-20'
    };

    const { error: patientUpdateError } = await supabase
      .from('patients')
      .update(enhancedPatientData)
      .eq('patient_id', patientRecord.patient_id);

    if (patientUpdateError) {
      console.log(`   ❌ Error updating patient: ${patientUpdateError.message}`);
    } else {
      console.log('   ✅ Enhanced patient record with comprehensive data');
    }

    // Update patient profile
    const { error: patientProfileUpdateError } = await supabase
      .from('profiles')
      .update({
        full_name: 'Trần Thị Hương',
        phone_number: '0987654321',
        date_of_birth: '1985-08-20'
      })
      .eq('id', patientProfile.id);

    if (patientProfileUpdateError) {
      console.log(`   ❌ Error updating patient profile: ${patientProfileUpdateError.message}`);
    } else {
      console.log('   ✅ Enhanced patient profile');
    }

    // Step 3: Create appointments between main doctor and patient
    console.log('\n📅 Step 3: Creating appointments between main accounts...');
    
    const mainAppointments = [];
    const today = new Date();
    
    // Create 10 appointments with various statuses and dates
    const appointmentData = [
      { days: -30, time: '09:00', status: 'completed', type: 'consultation', reason: 'Khám tổng quát định kỳ' },
      { days: -20, time: '10:00', status: 'completed', type: 'follow_up', reason: 'Tái khám sau điều trị' },
      { days: -10, time: '14:00', status: 'completed', type: 'consultation', reason: 'Khám chuyên khoa tim mạch' },
      { days: -5, time: '11:00', status: 'completed', type: 'consultation', reason: 'Kiểm tra huyết áp' },
      { days: 0, time: '15:00', status: 'confirmed', type: 'consultation', reason: 'Khám định kỳ hôm nay' },
      { days: 3, time: '09:30', status: 'confirmed', type: 'follow_up', reason: 'Tái khám kết quả xét nghiệm' },
      { days: 7, time: '10:30', status: 'scheduled', type: 'consultation', reason: 'Khám tim mạch định kỳ' },
      { days: 14, time: '14:30', status: 'scheduled', type: 'consultation', reason: 'Theo dõi điều trị' },
      { days: 21, time: '11:30', status: 'scheduled', type: 'follow_up', reason: 'Tái khám sau 3 tuần' },
      { days: 30, time: '16:00', status: 'scheduled', type: 'consultation', reason: 'Khám định kỳ tháng tới' }
    ];

    for (let i = 0; i < appointmentData.length; i++) {
      const apt = appointmentData[i];
      const appointmentDate = new Date(today);
      appointmentDate.setDate(today.getDate() + apt.days);
      
      const [hour, minute] = apt.time.split(':');
      const endHour = parseInt(hour) + 1;
      
      mainAppointments.push({
        appointment_id: `MAIN${Date.now().toString().slice(-6)}${i.toString().padStart(2, '0')}`,
        doctor_id: doctorRecord.doctor_id,
        patient_id: patientRecord.patient_id,
        appointment_date: appointmentDate.toISOString().split('T')[0],
        start_time: `${hour}:${minute}:00`,
        end_time: `${endHour.toString().padStart(2, '0')}:${minute}:00`,
        appointment_type: apt.type,
        status: apt.status,
        reason: apt.reason,
        notes: `Cuộc hẹn ${apt.reason.toLowerCase()} - ${apt.status}`
      });
    }

    const { data: createdMainAppointments, error: mainAppointmentError } = await supabase
      .from('appointments')
      .insert(mainAppointments)
      .select();

    if (mainAppointmentError) {
      console.log(`   ❌ Error creating main appointments: ${mainAppointmentError.message}`);
    } else {
      console.log(`   ✅ Created ${createdMainAppointments.length} appointments between main accounts`);
    }

    // Step 4: Create reviews from patient to doctor
    console.log('\n⭐ Step 4: Creating reviews from main patient to main doctor...');
    
    const mainReviews = [
      {
        review_id: `MAIN${Date.now().toString().slice(-6)}01`,
        doctor_id: doctorRecord.doctor_id,
        patient_id: patientRecord.patient_id,
        rating: 5,
        review_date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        review_id: `MAIN${Date.now().toString().slice(-6)}02`,
        doctor_id: doctorRecord.doctor_id,
        patient_id: patientRecord.patient_id,
        rating: 5,
        review_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ];

    // Check if reviews already exist
    const { data: existingReviews } = await supabase
      .from('doctor_reviews')
      .select('*')
      .eq('doctor_id', doctorRecord.doctor_id)
      .eq('patient_id', patientRecord.patient_id);

    if (existingReviews && existingReviews.length === 0) {
      const { data: createdMainReviews, error: mainReviewError } = await supabase
        .from('doctor_reviews')
        .insert(mainReviews)
        .select();

      if (mainReviewError) {
        console.log(`   ❌ Error creating main reviews: ${mainReviewError.message}`);
      } else {
        console.log(`   ✅ Created ${createdMainReviews.length} reviews from main patient`);
      }
    } else {
      console.log(`   ℹ️  Reviews already exist between main accounts`);
    }

    // Step 5: Update doctor rating
    console.log('\n📊 Step 5: Updating main doctor rating...');
    
    const { data: allDoctorReviews } = await supabase
      .from('doctor_reviews')
      .select('rating')
      .eq('doctor_id', doctorRecord.doctor_id);

    if (allDoctorReviews && allDoctorReviews.length > 0) {
      const totalRating = allDoctorReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / allDoctorReviews.length;
      
      await supabase
        .from('doctors')
        .update({
          rating: Math.round(averageRating * 10) / 10,
          total_reviews: allDoctorReviews.length
        })
        .eq('doctor_id', doctorRecord.doctor_id);
      
      console.log(`   ✅ Updated doctor rating: ${averageRating.toFixed(1)}/5 (${allDoctorReviews.length} reviews)`);
    }

    // Final summary
    console.log('\n✅ MAIN TEST ACCOUNTS ENHANCEMENT COMPLETED!');
    console.log('='.repeat(60));
    console.log('🔑 ENHANCED MAIN TEST ACCOUNTS:');
    console.log('');
    console.log('👨‍⚕️ DOCTOR ACCOUNT:');
    console.log('   Email: doctor@hospital.com');
    console.log('   Password: Doctor123!');
    console.log('   Name: BS. Nguyễn Văn Đức');
    console.log('   Specialty: Tim Mạch Học');
    console.log('   Experience: 20 years');
    console.log('   Rating: 4.8/5 stars');
    console.log('   Fee: 800,000 VND');
    console.log('');
    console.log('🤒 PATIENT ACCOUNT:');
    console.log('   Email: patient@hospital.com');
    console.log('   Password: Patient123!');
    console.log('   Name: Trần Thị Hương');
    console.log('   Age: 39 years old');
    console.log('   Conditions: Cao huyết áp, Tiểu đường type 2');
    console.log('   Insurance: BHYT - DN1234567890');
    console.log('');
    console.log('📅 APPOINTMENTS: 10 appointments (past, present, future)');
    console.log('⭐ REVIEWS: Patient has reviewed the doctor');
    console.log('');
    console.log('🎯 READY FOR COMPREHENSIVE TESTING!');

  } catch (error) {
    console.error('❌ Error enhancing main test accounts:', error.message);
  }
}

async function main() {
  await enhanceMainTestAccounts();
}

main().catch(console.error);
