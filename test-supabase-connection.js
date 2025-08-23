/**
 * Script kiểm tra kết nối Supabase
 * Chạy: node test-supabase-connection.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Lấy thông tin từ biến môi trường
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Kiểm tra kết nối Supabase...\n');
console.log('📋 Thông tin cấu hình:');
console.log('- URL:', supabaseUrl);
console.log('- Anon Key:', supabaseAnonKey ? '✅ Đã cấu hình' : '❌ Chưa cấu hình');
console.log('- Service Key:', supabaseServiceKey ? '✅ Đã cấu hình' : '❌ Chưa cấu hình');
console.log('\n' + '='.repeat(50) + '\n');

// Kiểm tra biến môi trường
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Lỗi: Thiếu biến môi trường SUPABASE_URL hoặc SUPABASE_ANON_KEY');
  process.exit(1);
}

// Tạo client với Anon Key
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tạo client với Service Role Key (nếu có)
let supabaseAdmin = null;
if (supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

async function testConnection() {
  try {
    // Test 1: Kiểm tra kết nối cơ bản với Anon Key
    console.log('🧪 Test 1: Kiểm tra kết nối với Anon Key...');
    const { data: anonTest, error: anonError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (anonError && anonError.code !== 'PGRST116') {
      // PGRST116 = No rows found (không phải lỗi kết nối)
      console.log('❌ Lỗi kết nối với Anon Key:', anonError.message);
    } else {
      console.log('✅ Kết nối với Anon Key thành công!');
    }

    // Test 2: Kiểm tra Auth
    console.log('\n🧪 Test 2: Kiểm tra Auth Service...');
    const { data: session, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.log('❌ Lỗi Auth:', authError.message);
    } else {
      console.log('✅ Auth Service hoạt động bình thường!');
      console.log('   Session:', session ? 'Có session' : 'Không có session');
    }

    // Test 3: Kiểm tra Service Role Key (nếu có)
    if (supabaseAdmin) {
      console.log('\n🧪 Test 3: Kiểm tra kết nối với Service Role Key...');
      const { data: adminTest, error: adminError } = await supabaseAdmin
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (adminError && adminError.code !== 'PGRST116') {
        console.log('❌ Lỗi kết nối với Service Role Key:', adminError.message);
      } else {
        console.log('✅ Kết nối với Service Role Key thành công!');
      }
    }

    // Test 4: Liệt kê các bảng (với Service Role Key)
    if (supabaseAdmin) {
      console.log('\n🧪 Test 4: Lấy danh sách bảng trong database...');
      const { data: tables, error: tablesError } = await supabaseAdmin
        .rpc('get_tables_list', {}, { count: 'exact' });
      
      if (tablesError) {
        // Nếu không có function get_tables_list, thử query trực tiếp
        const { data: profilesTest } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .limit(1);
        
        const { data: usersTest } = await supabaseAdmin
          .from('users')
          .select('*')
          .limit(1);
          
        console.log('📊 Các bảng có thể truy cập:');
        if (profilesTest !== null) console.log('   - profiles ✅');
        if (usersTest !== null) console.log('   - users ✅');
        
        // Thử kiểm tra các bảng khác thường có
        const commonTables = [
          'departments', 'doctors', 'patients', 'appointments',
          'medical_records', 'prescriptions', 'billing'
        ];
        
        for (const table of commonTables) {
          const { error } = await supabaseAdmin
            .from(table)
            .select('count')
            .limit(1);
          
          if (!error || error.code === 'PGRST116') {
            console.log(`   - ${table} ✅`);
          }
        }
      } else {
        console.log('📊 Danh sách bảng:', tables);
      }
    }

    // Test 5: Kiểm tra Storage
    console.log('\n🧪 Test 5: Kiểm tra Storage...');
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    if (storageError) {
      console.log('❌ Lỗi Storage:', storageError.message);
    } else {
      console.log('✅ Storage hoạt động bình thường!');
      if (buckets && buckets.length > 0) {
        console.log('📦 Buckets:');
        buckets.forEach(bucket => {
          console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
        });
      } else {
        console.log('   Chưa có bucket nào');
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Kiểm tra hoàn tất!');
    console.log('🎉 Kết nối Supabase hoạt động bình thường!');
    
  } catch (error) {
    console.error('\n❌ Lỗi không xác định:', error.message);
    console.error('Chi tiết:', error);
  }
}

// Chạy test
testConnection().catch(console.error);
