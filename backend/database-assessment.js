const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://ciasxktujslgsdgylimv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpYXN4a3R1anNsZ3NkZ3lsaW12Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzU1NTU2NSwiZXhwIjoyMDYzMTMxNTY1fQ.R2IieQgCFPQ5sgEqPSJmF9uB1hZasJHg5enl2alJpn4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function assessDatabase() {
  console.log('🏥 ĐÁNH GIÁ TỔNG THỂ DATABASE HOSPITAL MANAGEMENT SYSTEM');
  console.log('='.repeat(70));

  // Danh sách bảng cần thiết cho hệ thống hospital management hoàn chỉnh
  const requiredTables = {
    // Core tables
    'profiles': { priority: 'HIGH', description: 'Thông tin người dùng cơ bản' },
    'doctors': { priority: 'HIGH', description: 'Thông tin bác sĩ' },
    'patients': { priority: 'HIGH', description: 'Thông tin bệnh nhân' },
    'departments': { priority: 'HIGH', description: 'Khoa phòng' },
    'appointments': { priority: 'HIGH', description: 'Lịch hẹn khám' },
    'medical_records': { priority: 'HIGH', description: 'Hồ sơ bệnh án' },
    
    // Doctor management
    'doctor_reviews': { priority: 'MEDIUM', description: 'Đánh giá bác sĩ' },
    'doctor_work_schedules': { priority: 'MEDIUM', description: 'Lịch làm việc bác sĩ' },
    'doctor_work_experiences': { priority: 'LOW', description: 'Kinh nghiệm làm việc' },
    'doctor_emergency_contacts': { priority: 'LOW', description: 'Liên hệ khẩn cấp bác sĩ' },
    'doctor_settings': { priority: 'LOW', description: 'Cài đặt cá nhân bác sĩ' },
    
    // Medical system
    'prescriptions': { priority: 'MEDIUM', description: 'Đơn thuốc' },
    'medications': { priority: 'MEDIUM', description: 'Danh mục thuốc' },
    'lab_results': { priority: 'MEDIUM', description: 'Kết quả xét nghiệm' },
    'vital_signs_history': { priority: 'MEDIUM', description: 'Lịch sử sinh hiệu' },
    
    // Hospital management
    'rooms': { priority: 'MEDIUM', description: 'Phòng khám/phòng bệnh' },
    'specialties': { priority: 'MEDIUM', description: 'Chuyên khoa' },
    'billing': { priority: 'MEDIUM', description: 'Hóa đơn thanh toán' },
    'insurance': { priority: 'LOW', description: 'Bảo hiểm y tế' },
    
    // System tables
    'audit_logs': { priority: 'LOW', description: 'Nhật ký hệ thống' },
    'notifications': { priority: 'LOW', description: 'Thông báo' },
    'system_settings': { priority: 'LOW', description: 'Cài đặt hệ thống' }
  };

  console.log('\n📊 1. KIỂM TRA CÁC BẢNG CẦN THIẾT:');
  console.log('-'.repeat(50));

  const tableStatus = {};
  
  for (const [tableName, info] of Object.entries(requiredTables)) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        tableStatus[tableName] = { exists: false, count: 0, priority: info.priority, description: info.description };
        console.log(`❌ ${tableName} (${info.priority}): THIẾU - ${info.description}`);
      } else {
        tableStatus[tableName] = { exists: true, count: count || 0, priority: info.priority, description: info.description };
        console.log(`✅ ${tableName} (${info.priority}): ${count || 0} records - ${info.description}`);
      }
    } catch (err) {
      tableStatus[tableName] = { exists: false, count: 0, priority: info.priority, description: info.description };
      console.log(`❌ ${tableName} (${info.priority}): LỖI - ${info.description}`);
    }
  }

  // Phân tích thiếu sót
  console.log('\n🔍 2. PHÂN TÍCH THIẾU SÓT:');
  console.log('-'.repeat(50));

  const missingHigh = Object.entries(tableStatus).filter(([name, status]) => !status.exists && status.priority === 'HIGH');
  const missingMedium = Object.entries(tableStatus).filter(([name, status]) => !status.exists && status.priority === 'MEDIUM');
  const missingLow = Object.entries(tableStatus).filter(([name, status]) => !status.exists && status.priority === 'LOW');

  console.log(`🔴 THIẾU BẢNG MỨC ĐỘ CAO (${missingHigh.length}):`);
  missingHigh.forEach(([name, status]) => {
    console.log(`   - ${name}: ${status.description}`);
  });

  console.log(`🟡 THIẾU BẢNG MỨC ĐỘ TRUNG BÌNH (${missingMedium.length}):`);
  missingMedium.forEach(([name, status]) => {
    console.log(`   - ${name}: ${status.description}`);
  });

  console.log(`🟢 THIẾU BẢNG MỨC ĐỘ THẤP (${missingLow.length}):`);
  missingLow.forEach(([name, status]) => {
    console.log(`   - ${name}: ${status.description}`);
  });

  // Kiểm tra dữ liệu
  console.log('\n📈 3. PHÂN TÍCH DỮ LIỆU:');
  console.log('-'.repeat(50));

  const existingTables = Object.entries(tableStatus).filter(([name, status]) => status.exists);
  
  console.log('Bảng có dữ liệu:');
  existingTables.forEach(([name, status]) => {
    if (status.count > 0) {
      console.log(`✅ ${name}: ${status.count} records`);
    } else {
      console.log(`⚠️  ${name}: 0 records (bảng trống)`);
    }
  });

  // Đánh giá tổng thể
  console.log('\n🎯 4. ĐÁNH GIÁ TỔNG THỂ:');
  console.log('-'.repeat(50));

  const totalTables = Object.keys(requiredTables).length;
  const existingTablesCount = existingTables.length;
  const completionRate = Math.round((existingTablesCount / totalTables) * 100);

  console.log(`📊 Tỷ lệ hoàn thành: ${completionRate}% (${existingTablesCount}/${totalTables} bảng)`);
  
  if (missingHigh.length === 0) {
    console.log('✅ TẤT CẢ BẢNG CỐT LÕI ĐÃ CÓ');
  } else {
    console.log(`❌ THIẾU ${missingHigh.length} BẢNG CỐT LÕI QUAN TRỌNG`);
  }

  // Khuyến nghị
  console.log('\n💡 5. KHUYẾN NGHỊ CẢI THIỆN:');
  console.log('-'.repeat(50));

  if (missingHigh.length > 0) {
    console.log('🔴 ƯU TIÊN CAO - Cần tạo ngay:');
    missingHigh.forEach(([name, status]) => {
      console.log(`   - Tạo bảng ${name}: ${status.description}`);
    });
  }

  if (missingMedium.length > 0) {
    console.log('🟡 ƯU TIÊN TRUNG BÌNH - Nên có:');
    missingMedium.forEach(([name, status]) => {
      console.log(`   - Tạo bảng ${name}: ${status.description}`);
    });
  }

  // Kiểm tra bảng trống
  const emptyTables = existingTables.filter(([name, status]) => status.count === 0);
  if (emptyTables.length > 0) {
    console.log('⚠️  CẦN THÊM DỮ LIỆU:');
    emptyTables.forEach(([name, status]) => {
      console.log(`   - ${name}: Bảng trống, cần thêm dữ liệu mẫu`);
    });
  }

  console.log('\n🏆 KẾT LUẬN:');
  console.log('-'.repeat(50));
  
  if (completionRate >= 80 && missingHigh.length === 0) {
    console.log('✅ DATABASE ĐÃ KHÁ HOÀN CHỈNH cho hệ thống hospital management');
  } else if (completionRate >= 60) {
    console.log('⚠️  DATABASE CẦN CẢI THIỆN THÊM để đạt tiêu chuẩn hoàn chỉnh');
  } else {
    console.log('❌ DATABASE CÒN THIẾU NHIỀU THÀNH PHẦN QUAN TRỌNG');
  }
}

// Chạy đánh giá
assessDatabase();
