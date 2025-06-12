#!/usr/bin/env node

/**
 * Check Existing Departments Script
 * Fetches all departments from Supabase to update seed data
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkExistingDepartments() {
  console.log('🏥 Checking Existing Departments on Supabase');
  console.log('=============================================\n');

  try {
    const { data: departments, error } = await supabase
      .from('departments')
      .select('*')
      .order('dept_id');

    if (error) {
      console.log(`❌ Error fetching departments: ${error.message}`);
      return;
    }

    if (!departments || departments.length === 0) {
      console.log('⚠️ No departments found in database');
      return;
    }

    console.log(`📊 Found ${departments.length} departments:\n`);

    departments.forEach((dept, index) => {
      console.log(`${index + 1}. ${dept.dept_id} - ${dept.name}`);
      console.log(`   Code: ${dept.code || 'N/A'}`);
      console.log(`   Description: ${dept.description || 'N/A'}`);
      console.log(`   Active: ${dept.is_active !== false ? 'Yes' : 'No'}`);
      console.log('');
    });

    // Generate updated seed data structure
    console.log('📋 Updated Seed Data Structure:');
    console.log('===============================\n');

    console.log('const DEPARTMENTS = [');
    departments.forEach(dept => {
      console.log(`  { dept_id: '${dept.dept_id}', name: '${dept.name}', code: '${dept.code || dept.dept_id}' },`);
    });
    console.log('];');

    console.log('\n🎯 Recommended Doctor Distribution:');
    console.log('===================================');
    const doctorsPerDept = Math.floor(120 / departments.length); // 120 doctors total
    const remainder = 120 % departments.length;

    departments.forEach((dept, index) => {
      const doctorCount = doctorsPerDept + (index < remainder ? 1 : 0);
      console.log(`${dept.dept_id} (${dept.name}): ${doctorCount} doctors`);
    });

    console.log(`\nTotal: 120 doctors across ${departments.length} departments`);

    // Generate specialties mapping
    console.log('\n🏥 Suggested Specialties by Department:');
    console.log('======================================');
    
    const specialtyMapping = generateSpecialtyMapping(departments);
    specialtyMapping.forEach(mapping => {
      console.log(`\n${mapping.dept_id} - ${mapping.name}:`);
      mapping.specialties.forEach(specialty => {
        console.log(`  - ${specialty}`);
      });
    });

    return departments;

  } catch (error) {
    console.error('❌ Error checking departments:', error);
  }
}

function generateSpecialtyMapping(departments) {
  const specialtyMap = {
    'CARD': ['Tim mạch', 'Tim mạch can thiệp', 'Siêu âm tim', 'Điện tâm đồ'],
    'NEUR': ['Thần kinh', 'Thần kinh cột sống', 'Đột quỵ', 'Động kinh'],
    'PEDI': ['Nhi khoa', 'Nhi tim mạch', 'Nhi hô hấp', 'Nhi tiêu hóa'],
    'ORTH': ['Chấn thương chỉnh hình', 'Cột sống', 'Khớp', 'Thể thao'],
    'DERM': ['Da liễu', 'Thẩm mỹ da', 'Dị ứng da', 'Da liễu nhi'],
    'OBGY': ['Sản phụ khoa', 'Thai sản', 'Phụ khoa', 'Kế hoạch hóa gia đình'],
    'SURG': ['Phẫu thuật tổng quát', 'Phẫu thuật nội soi', 'Phẫu thuật cấp cứu', 'Phẫu thuật gan mật'],
    'INTE': ['Nội tổng quát', 'Nội tiết', 'Tiểu đường', 'Tuyến giáp'],
    'EMER': ['Cấp cứu', 'Hồi sức cấp cứu', 'Chống độc', 'Cấp cứu ngoại khoa'],
    'RADI': ['Chẩn đoán hình ảnh', 'X-quang', 'CT Scanner', 'MRI', 'Siêu âm'],
    'ANES': ['Gây mê hồi sức', 'Gây tê vùng', 'Điều trị đau', 'Hồi sức sau mổ'],
    'ONCO': ['Ung bướu', 'Hóa trị', 'Xạ trị', 'Chăm sóc giảm nhẹ']
  };

  return departments.map(dept => {
    const specialties = specialtyMap[dept.dept_id] || [
      dept.name,
      `${dept.name} chuyên sâu`,
      `${dept.name} cấp cứu`,
      `${dept.name} nhi`
    ];

    return {
      dept_id: dept.dept_id,
      name: dept.name,
      specialties: specialties
    };
  });
}

// Run check
if (require.main === module) {
  checkExistingDepartments().catch(error => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });
}

module.exports = { checkExistingDepartments, generateSpecialtyMapping };
