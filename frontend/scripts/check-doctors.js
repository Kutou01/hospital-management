const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function checkDoctors() {
  console.log('🔍 Checking available doctors...');
  
  try {
    const response = await axios.get(`${BASE_URL}/doctors`, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ API Response Status: ${response.status}`);
    
    if (response.data && response.data.success) {
      const data = response.data.data;
      
      if (Array.isArray(data)) {
        console.log(`📋 Found ${data.length} doctors:`);
        data.forEach((doctor, index) => {
          console.log(`   ${index + 1}. ${doctor.doctor_id}: ${doctor.full_name || 'N/A'} (${doctor.specialty || 'N/A'})`);
        });
        
        if (data.length > 0) {
          console.log(`\n💡 You can use these doctor IDs for testing:`);
          data.slice(0, 3).forEach(doctor => {
            console.log(`   - ${doctor.doctor_id}`);
          });
        }
      } else if (data && data.data) {
        // Paginated response
        const doctors = data.data;
        console.log(`📋 Found ${doctors.length} doctors (paginated):`);
        doctors.forEach((doctor, index) => {
          console.log(`   ${index + 1}. ${doctor.doctor_id}: ${doctor.full_name || 'N/A'} (${doctor.specialty || 'N/A'})`);
        });
        
        if (doctors.length > 0) {
          console.log(`\n💡 You can use these doctor IDs for testing:`);
          doctors.slice(0, 3).forEach(doctor => {
            console.log(`   - ${doctor.doctor_id}`);
          });
        }
      } else {
        console.log('📋 No doctors found or unexpected data structure');
        console.log('Data:', JSON.stringify(data, null, 2));
      }
    } else {
      console.log('❌ API returned error:', response.data?.error || 'Unknown error');
    }
    
  } catch (error) {
    console.log('❌ Failed to fetch doctors');
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data?.error || error.response.statusText}`);
      console.log(`   Message: ${error.response.data?.message || 'N/A'}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
  }
}

// Also test creating a doctor for testing
async function createTestDoctor() {
  console.log('\n🧪 Creating test doctor...');
  
  const testDoctorData = {
    profile_id: 'test-profile-id',
    full_name: 'BS. Nguyễn Văn Test',
    date_of_birth: '1985-01-01',
    specialty: 'Tim mạch',
    qualification: 'Thạc sĩ Y khoa',
    department_id: 'CARD',
    license_number: 'VN-TM-2024',
    gender: 'male',
    bio: 'Bác sĩ chuyên khoa tim mạch với 10 năm kinh nghiệm',
    experience_years: 10,
    consultation_fee: 500000,
    languages_spoken: ['Vietnamese', 'English'],
    phone_number: '0987654321',
    email: 'doctor.test@hospital.com'
  };
  
  try {
    const response = await axios.post(`${BASE_URL}/doctors`, testDoctorData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Test doctor created successfully!`);
    console.log(`   Doctor ID: ${response.data.data?.doctor_id}`);
    console.log(`   Name: ${response.data.data?.full_name}`);
    
    return response.data.data?.doctor_id;
    
  } catch (error) {
    console.log('❌ Failed to create test doctor');
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data?.error || error.response.statusText}`);
      console.log(`   Message: ${error.response.data?.message || 'N/A'}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
    
    return null;
  }
}

async function main() {
  console.log('🏥 Hospital Management - Doctor Check');
  console.log('=====================================');
  
  await checkDoctors();
  
  // Uncomment to create a test doctor
  // await createTestDoctor();
  
  console.log('\n💡 Next steps:');
  console.log('   1. Use one of the doctor IDs above for testing');
  console.log('   2. Update the TEST_DOCTOR_ID in test-profile-apis.js');
  console.log('   3. Run: node scripts/test-profile-apis.js');
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

module.exports = {
  checkDoctors,
  createTestDoctor
};
