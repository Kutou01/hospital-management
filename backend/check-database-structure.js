const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://ciasxktujslgsdgylimv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpYXN4a3R1anNsZ3NkZ3lsaW12Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzU1NTU2NSwiZXhwIjoyMDYzMTMxNTY1fQ.R2IieQgCFPQ5sgEqPSJmF9uB1hZasJHg5enl2alJpn4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseStructure() {
  console.log('🏥 KIỂM TRA CẤU TRÚC DATABASE HOSPITAL MANAGEMENT SYSTEM');
  console.log('='.repeat(70));

  try {
    // 1. Kiểm tra các bảng chính
    console.log('\n📋 1. DANH SÁCH CÁC BẢNG CHÍNH:');
    console.log('-'.repeat(50));
    
    const tables = [
      'profiles', 'doctors', 'patients', 'departments', 'appointments', 
      'medical_records', 'doctor_reviews', 'doctor_work_schedules',
      'doctor_work_experiences', 'doctor_emergency_contacts', 'doctor_settings'
    ];

    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${table}: KHÔNG TỒN TẠI hoặc LỖI - ${error.message}`);
        } else {
          console.log(`✅ ${table}: ${count || 0} records`);
        }
      } catch (err) {
        console.log(`❌ ${table}: LỖI - ${err.message}`);
      }
    }

    // 2. Kiểm tra cấu trúc bảng profiles
    console.log('\n👤 2. CẤU TRÚC BẢNG PROFILES:');
    console.log('-'.repeat(50));
    
    const { data: profileSample } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profileSample && profileSample.length > 0) {
      const columns = Object.keys(profileSample[0]);
      console.log('Các cột:', columns.join(', '));
      console.log('Mẫu dữ liệu:', JSON.stringify(profileSample[0], null, 2));
    }

    // 3. Kiểm tra cấu trúc bảng doctors
    console.log('\n👨‍⚕️ 3. CẤU TRÚC BẢNG DOCTORS:');
    console.log('-'.repeat(50));
    
    const { data: doctorSample } = await supabase
      .from('doctors')
      .select('*')
      .limit(1);
    
    if (doctorSample && doctorSample.length > 0) {
      const columns = Object.keys(doctorSample[0]);
      console.log('Các cột:', columns.join(', '));
      console.log('Mẫu dữ liệu:', JSON.stringify(doctorSample[0], null, 2));
    }

    // 4. Kiểm tra cấu trúc bảng patients
    console.log('\n🤒 4. CẤU TRÚC BẢNG PATIENTS:');
    console.log('-'.repeat(50));
    
    const { data: patientSample } = await supabase
      .from('patients')
      .select('*')
      .limit(1);
    
    if (patientSample && patientSample.length > 0) {
      const columns = Object.keys(patientSample[0]);
      console.log('Các cột:', columns.join(', '));
      console.log('Mẫu dữ liệu:', JSON.stringify(patientSample[0], null, 2));
    }

    // 5. Kiểm tra cấu trúc bảng appointments
    console.log('\n📅 5. CẤU TRÚC BẢNG APPOINTMENTS:');
    console.log('-'.repeat(50));
    
    const { data: appointmentSample } = await supabase
      .from('appointments')
      .select('*')
      .limit(1);
    
    if (appointmentSample && appointmentSample.length > 0) {
      const columns = Object.keys(appointmentSample[0]);
      console.log('Các cột:', columns.join(', '));
      console.log('Mẫu dữ liệu:', JSON.stringify(appointmentSample[0], null, 2));
    }

    // 6. Kiểm tra cấu trúc bảng departments
    console.log('\n🏢 6. CẤU TRÚC BẢNG DEPARTMENTS:');
    console.log('-'.repeat(50));
    
    const { data: departmentSample } = await supabase
      .from('departments')
      .select('*')
      .limit(1);
    
    if (departmentSample && departmentSample.length > 0) {
      const columns = Object.keys(departmentSample[0]);
      console.log('Các cột:', columns.join(', '));
      console.log('Mẫu dữ liệu:', JSON.stringify(departmentSample[0], null, 2));
    }

    // 7. Kiểm tra database functions
    console.log('\n⚙️ 7. KIỂM TRA DATABASE FUNCTIONS:');
    console.log('-'.repeat(50));
    
    try {
      const { data: functions } = await supabase.rpc('verify_hospital_functions');
      if (functions) {
        functions.forEach(func => {
          const status = func.exists ? '✅' : '❌';
          console.log(`${status} ${func.function_name}`);
        });
      }
    } catch (err) {
      console.log('❌ Không thể kiểm tra functions:', err.message);
    }

  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra database:', error.message);
  }
}

// Chạy kiểm tra
checkDatabaseStructure();
