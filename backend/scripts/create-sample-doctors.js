const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://ciasxktujslgsdgylimv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpYXN4a3R1anNsZ3NkZ3lsaW12Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA2MTE5MiwiZXhwIjoyMDY3NjM3MTkyfQ.ulj25FnFrqa80DAnvsxIMgvHm1wAccJZMiMDcE5dDLk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSampleDoctors() {
  console.log('🏥 Creating sample doctors...');

  try {
    // First, create departments if they don't exist
    const sampleDepartments = [
      { id: 'CARD', name: 'Khoa Tim Mạch', code: 'CARD', description: 'Chuyên khoa tim mạch và mạch máu' },
      { id: 'GENE', name: 'Khoa Nội Tổng Hợp', code: 'GENE', description: 'Khoa nội tổng hợp' },
      { id: 'EMER', name: 'Khoa Cấp Cứu', code: 'EMER', description: 'Khoa cấp cứu và hồi sức' },
      { id: 'PEDI', name: 'Khoa Nhi', code: 'PEDI', description: 'Khoa nhi khoa' },
      { id: 'ORTH', name: 'Khoa Chấn Thương Chỉnh Hình', code: 'ORTH', description: 'Khoa chấn thương chỉnh hình' },
      { id: 'NEUR', name: 'Khoa Thần Kinh', code: 'NEUR', description: 'Khoa thần kinh' }
    ];

    console.log('📋 Creating departments...');
    for (const dept of sampleDepartments) {
      const { error: deptError } = await supabase
        .from('departments')
        .upsert(dept, { onConflict: 'id' });

      if (deptError) {
        console.error(`Error creating department ${dept.id}:`, deptError);
      } else {
        console.log(`✅ Created/Updated department: ${dept.id} - ${dept.name}`);
      }
    }

    // Now get the departments
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('*');

    if (deptError) {
      console.error('Error fetching departments:', deptError);
      return;
    }

    console.log(`📋 Found ${departments.length} departments`);

    // Use the created departments
    const availableDepartments = departments.filter(d => d.id);

    // Sample doctors data
    const sampleDoctors = [
      // Department 1
      {
        first_name: 'Nguyễn',
        last_name: 'Văn Đức',
        email: 'doctor@hospital.com',
        phone: '+84901234567',
        specialization: 'Tim mạch',
        license_number: 'BV-TM-001',
        experience_years: 15,
        consultation_fee: 500000,
        status: 'active',
        department_id: 'CARD',
        bio: 'Bác sĩ chuyên khoa Tim mạch với 15 năm kinh nghiệm',
        education: 'Tiến sĩ Y khoa - Đại học Y Hà Nội',
        languages: ['Vietnamese', 'English']
      },
      {
        first_name: 'Trần',
        last_name: 'Thị Mai',
        email: 'dr.mai@hospital.com',
        phone: '+84901234568',
        specialization: 'Tim mạch can thiệp',
        license_number: 'BV-TM-002',
        experience_years: 12,
        consultation_fee: 600000,
        status: 'active',
        department_id: 'CARD',
        bio: 'Chuyên gia tim mạch can thiệp, thạc sĩ y học',
        education: 'Thạc sĩ Y khoa - Đại học Y Thành phố Hồ Chí Minh',
        languages: ['Vietnamese', 'English', 'French']
      },
      // Department 2
      {
        first_name: 'Lê',
        last_name: 'Văn Hùng',
        email: 'dr.hung@hospital.com',
        phone: '+84901234569',
        specialization: 'Nội tổng hợp',
        license_number: 'BV-NT-001',
        experience_years: 10,
        consultation_fee: 300000,
        status: 'active',
        department_id: 'GENE',
        bio: 'Bác sĩ nội tổng hợp với kinh nghiệm điều trị đa dạng',
        education: 'Bác sĩ Y khoa - Đại học Y Hà Nội',
        languages: ['Vietnamese']
      },
      {
        first_name: 'Phạm',
        last_name: 'Thị Lan',
        email: 'dr.lan@hospital.com',
        phone: '+84901234570',
        specialization: 'Nội tiết',
        license_number: 'BV-NT-002',
        experience_years: 8,
        consultation_fee: 400000,
        status: 'active',
        department_id: 'GENE',
        bio: 'Chuyên khoa nội tiết, điều trị tiểu đường và rối loạn hormone',
        education: 'Thạc sĩ Y khoa - Đại học Y Huế',
        languages: ['Vietnamese', 'English']
      },
      // Department 3
      {
        first_name: 'Hoàng',
        last_name: 'Văn Nam',
        email: 'dr.nam@hospital.com',
        phone: '+84901234571',
        specialization: 'Cấp cứu',
        license_number: 'BV-CC-001',
        experience_years: 7,
        consultation_fee: 200000,
        status: 'active',
        department_id: 'EMER',
        bio: 'Bác sĩ cấp cứu với kinh nghiệm xử lý các tình huống khẩn cấp',
        education: 'Bác sĩ Y khoa - Đại học Y Thái Bình',
        languages: ['Vietnamese']
      },
      // Department 4
      {
        first_name: 'Vũ',
        last_name: 'Thị Hoa',
        email: 'dr.hoa@hospital.com',
        phone: '+84901234572',
        specialization: 'Nhi khoa',
        license_number: 'BV-NK-001',
        experience_years: 9,
        consultation_fee: 350000,
        status: 'active',
        department_id: 'PEDI',
        bio: 'Bác sĩ nhi khoa chuyên điều trị trẻ em',
        education: 'Thạc sĩ Y khoa - Đại học Y Hà Nội',
        languages: ['Vietnamese', 'English']
      },
      // Department 5
      {
        first_name: 'Đặng',
        last_name: 'Văn Tuấn',
        email: 'dr.tuan@hospital.com',
        phone: '+84901234573',
        specialization: 'Chấn thương chỉnh hình',
        license_number: 'BV-CT-001',
        experience_years: 11,
        consultation_fee: 450000,
        status: 'active',
        department_id: 'ORTH',
        bio: 'Chuyên khoa chấn thương chỉnh hình, phẫu thuật xương khớp',
        education: 'Tiến sĩ Y khoa - Đại học Y Thành phố Hồ Chí Minh',
        languages: ['Vietnamese', 'English']
      },
      // Department 6
      {
        first_name: 'Bùi',
        last_name: 'Thị Nga',
        email: 'dr.nga@hospital.com',
        phone: '+84901234574',
        specialization: 'Thần kinh',
        license_number: 'BV-TK-001',
        experience_years: 13,
        consultation_fee: 550000,
        status: 'active',
        department_id: 'NEUR',
        bio: 'Bác sĩ thần kinh với chuyên môn cao về các bệnh lý não bộ',
        education: 'Tiến sĩ Y khoa - Đại học Y Hà Nội',
        languages: ['Vietnamese', 'English', 'Japanese']
      }
    ];

    // Filter out doctors without department_id
    const validDoctors = sampleDoctors.filter(doctor => doctor.department_id);
    
    console.log(`👨‍⚕️ Creating ${validDoctors.length} doctors...`);

    // Create doctors in batches
    for (const doctor of validDoctors) {
      try {
        // First create user account
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: doctor.email,
          password: 'Doctor123.',
          email_confirm: true,
          user_metadata: {
            role: 'doctor',
            first_name: doctor.first_name,
            last_name: doctor.last_name
          }
        });

        if (authError) {
          console.error(`Error creating auth user for ${doctor.email}:`, authError);
          continue;
        }

        console.log(`✅ Created auth user: ${doctor.email}`);

        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authUser.user.id,
            email: doctor.email,
            first_name: doctor.first_name,
            last_name: doctor.last_name,
            role: 'doctor',
            phone: doctor.phone,
            status: 'active'
          });

        if (profileError) {
          console.error(`Error creating profile for ${doctor.email}:`, profileError);
          continue;
        }

        // Generate doctor ID
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const randomNum = Math.floor(Math.random() * 900) + 100;
        
        // Get department code for doctor ID
        const department = departments.find(d => d.id === doctor.department_id);
        const deptCode = department?.code || 'GEN';
        const doctorId = `${deptCode}-DOC-${year}${month}-${randomNum}`;

        // Create doctor record
        const { error: doctorError } = await supabase
          .from('doctors')
          .insert({
            id: doctorId,
            user_id: authUser.user.id,
            first_name: doctor.first_name,
            last_name: doctor.last_name,
            email: doctor.email,
            phone: doctor.phone,
            specialization: doctor.specialization,
            license_number: doctor.license_number,
            experience_years: doctor.experience_years,
            consultation_fee: doctor.consultation_fee,
            department_id: doctor.department_id,
            status: doctor.status,
            bio: doctor.bio,
            education: doctor.education,
            languages: doctor.languages
          });

        if (doctorError) {
          console.error(`Error creating doctor record for ${doctor.email}:`, doctorError);
          continue;
        }

        console.log(`✅ Created doctor: ${doctorId} - ${doctor.first_name} ${doctor.last_name}`);

        // Create sample availability (Monday to Friday, 8 AM to 5 PM)
        const availabilitySlots = [];
        for (let day = 1; day <= 5; day++) { // Monday to Friday
          for (let hour = 8; hour <= 16; hour++) { // 8 AM to 4 PM (last slot)
            availabilitySlots.push({
              doctor_id: doctorId,
              day_of_week: day,
              start_time: `${hour.toString().padStart(2, '0')}:00`,
              end_time: `${(hour + 1).toString().padStart(2, '0')}:00`,
              is_available: true
            });
          }
        }

        const { error: availabilityError } = await supabase
          .from('doctor_availability')
          .insert(availabilitySlots);

        if (availabilityError) {
          console.error(`Error creating availability for ${doctorId}:`, availabilityError);
        } else {
          console.log(`✅ Created availability for ${doctorId}`);
        }

      } catch (error) {
        console.error(`Error processing doctor ${doctor.email}:`, error);
      }
    }

    console.log('🎉 Sample doctors creation completed!');

    // Display summary
    const { data: createdDoctors, error: countError } = await supabase
      .from('doctors')
      .select('id, first_name, last_name, specialization, department_id')
      .eq('status', 'active');

    if (!countError) {
      console.log(`\n📊 Total active doctors: ${createdDoctors.length}`);
      createdDoctors.forEach(doctor => {
        console.log(`   - ${doctor.id}: ${doctor.first_name} ${doctor.last_name} (${doctor.specialization})`);
      });
    }

  } catch (error) {
    console.error('❌ Error creating sample doctors:', error);
  }
}

// Run the script
createSampleDoctors();
