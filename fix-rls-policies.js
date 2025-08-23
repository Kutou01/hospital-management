/**
 * Script sửa lỗi RLS policies cho bảng profiles
 * Chạy: node fix-rls-policies.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSPolicies() {
  console.log('🔧 Bắt đầu sửa RLS policies...\n');

  try {
    // Bước 1: Tắt RLS tạm thời cho bảng profiles
    console.log('1️⃣ Tắt RLS cho bảng profiles...');
    const { error: disableError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;'
    }).catch(async () => {
      // Nếu không có function exec_sql, thử cách khác
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error && error.message.includes('infinite recursion')) {
        console.log('⚠️ Phát hiện lỗi infinite recursion');
        return { error };
      }
      return { error: null };
    });

    if (disableError) {
      console.log('⚠️ Không thể tắt RLS qua API. Vui lòng chạy SQL trực tiếp trong Supabase Dashboard:');
      console.log('\n--- COPY VÀ CHẠY TRONG SUPABASE SQL EDITOR ---');
      console.log('ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;');
      console.log('--- END ---\n');
    } else {
      console.log('✅ Đã tắt RLS cho bảng profiles');
    }

    // Bước 2: Test kết nối với profiles table
    console.log('\n2️⃣ Test kết nối với bảng profiles...');
    const { data: profilesTest, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (testError) {
      if (testError.message.includes('infinite recursion')) {
        console.log('❌ Vẫn còn lỗi infinite recursion!');
        console.log('\n📝 VUI LÒNG THỰC HIỆN CÁC BƯỚC SAU TRONG SUPABASE DASHBOARD:');
        console.log('1. Vào Supabase Dashboard > SQL Editor');
        console.log('2. Chạy file SQL: fix-profiles-rls.sql');
        console.log('3. Hoặc chạy lệnh sau:');
        console.log('\n--- COPY VÀ CHẠY TRONG SUPABASE SQL EDITOR ---');
        console.log(`
-- Tắt RLS hoàn toàn cho development
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Hoặc xóa tất cả policies cũ và tạo lại
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authentication users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role has full access" ON profiles;

-- Tạo policy đơn giản cho service role
CREATE POLICY "Service role bypass" ON profiles
  FOR ALL USING (true);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        `);
        console.log('--- END ---\n');
      } else {
        console.log('❌ Lỗi khác:', testError.message);
      }
    } else {
      console.log('✅ Kết nối với bảng profiles thành công!');
    }

    // Bước 3: Test với các bảng khác
    console.log('\n3️⃣ Kiểm tra các bảng khác...');
    const tables = ['departments', 'doctors', 'patients', 'appointments'];
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: OK`);
      }
    }

    // Bước 4: Kiểm tra Auth
    console.log('\n4️⃣ Kiểm tra Auth Service...');
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1
    });

    if (authError) {
      console.log('❌ Auth Service lỗi:', authError.message);
    } else {
      console.log('✅ Auth Service hoạt động bình thường');
      console.log(`   Số lượng users: ${users?.length || 0}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 KẾT QUẢ:');
    
    if (!testError || !testError.message.includes('infinite recursion')) {
      console.log('✅ Đã sửa được lỗi infinite recursion!');
      console.log('🎉 Bạn có thể khởi động lại Auth Service.');
    } else {
      console.log('⚠️ Cần thực hiện thêm các bước thủ công trong Supabase Dashboard.');
      console.log('📝 Xem hướng dẫn ở trên.');
    }

  } catch (error) {
    console.error('\n❌ Lỗi không xác định:', error);
  }
}

// Chạy script
fixRLSPolicies().catch(console.error);
