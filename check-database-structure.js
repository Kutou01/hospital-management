/**
 * Script kiểm tra chi tiết cấu trúc database Supabase
 * Chạy: node check-database-structure.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Lấy thông tin từ biến môi trường
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Lỗi: Thiếu biến môi trường SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Tạo client với Service Role Key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkDatabaseStructure() {
  console.log('🔍 Kiểm tra cấu trúc Database...\n');
  console.log('='.repeat(60) + '\n');

  const tables = [
    'profiles',
    'departments', 
    'doctors',
    'patients',
    'appointments',
    'medical_records',
    'prescriptions',
    'billing'
  ];

  for (const table of tables) {
    console.log(`📊 Bảng: ${table.toUpperCase()}`);
    console.log('-'.repeat(40));
    
    try {
      // Lấy số lượng record
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.log(`   ❌ Lỗi: ${countError.message}`);
      } else {
        console.log(`   ✅ Số lượng records: ${count || 0}`);
      }

      // Lấy sample data (3 records)
      const { data, error: dataError } = await supabase
        .from(table)
        .select('*')
        .limit(3);
      
      if (dataError) {
        console.log(`   ❌ Không thể lấy dữ liệu: ${dataError.message}`);
      } else if (data && data.length > 0) {
        // Hiển thị cấu trúc columns
        const columns = Object.keys(data[0]);
        console.log(`   📝 Columns (${columns.length}):`, columns.join(', '));
        
        // Hiển thị sample record
        console.log(`   📋 Sample record:`);
        const sample = data[0];
        for (const [key, value] of Object.entries(sample)) {
          const displayValue = value === null ? 'null' : 
                             typeof value === 'object' ? JSON.stringify(value) :
                             String(value).substring(0, 50) + (String(value).length > 50 ? '...' : '');
          console.log(`      - ${key}: ${displayValue}`);
        }
      } else {
        console.log('   ⚠️ Bảng trống (chưa có dữ liệu)');
      }
      
    } catch (error) {
      console.log(`   ❌ Lỗi không xác định: ${error.message}`);
    }
    
    console.log('');
  }

  // Kiểm tra RLS (Row Level Security)
  console.log('='.repeat(60));
  console.log('\n🔒 Kiểm tra Row Level Security (RLS):\n');
  
  for (const table of tables) {
    try {
      // Thử query với anon key để kiểm tra RLS
      const anonClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY);
      const { data, error } = await anonClient
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.message.includes('recursion') || error.code === 'PGRST301') {
          console.log(`   ${table}: ⚠️ RLS có vấn đề hoặc chưa cấu hình đúng`);
        } else if (error.code === '42501') {
          console.log(`   ${table}: ✅ RLS đã bật (quyền truy cập bị giới hạn)`);
        } else {
          console.log(`   ${table}: ❓ ${error.message}`);
        }
      } else {
        console.log(`   ${table}: ⚠️ RLS có thể chưa được cấu hình (truy cập tự do)`);
      }
    } catch (error) {
      console.log(`   ${table}: ❌ Lỗi kiểm tra: ${error.message}`);
    }
  }

  // Kiểm tra Storage Buckets
  console.log('\n' + '='.repeat(60));
  console.log('\n📦 Kiểm tra Storage Buckets:\n');
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.log(`❌ Lỗi: ${error.message}`);
    } else if (buckets && buckets.length > 0) {
      for (const bucket of buckets) {
        console.log(`   📁 ${bucket.name}`);
        console.log(`      - ID: ${bucket.id}`);
        console.log(`      - Public: ${bucket.public ? '✅' : '❌'}`);
        console.log(`      - Created: ${new Date(bucket.created_at).toLocaleDateString()}`);
        
        // Thử liệt kê files trong bucket
        const { data: files } = await supabase.storage
          .from(bucket.name)
          .list('', { limit: 3 });
        
        if (files && files.length > 0) {
          console.log(`      - Files: ${files.length} file(s)`);
        } else {
          console.log(`      - Files: Trống`);
        }
      }
    } else {
      console.log('   ⚠️ Chưa có bucket nào được tạo');
      console.log('   💡 Gợi ý: Tạo buckets cho avatars, medical-images, documents...');
    }
  } catch (error) {
    console.log(`❌ Lỗi: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Kiểm tra hoàn tất!');
}

// Chạy kiểm tra
checkDatabaseStructure().catch(console.error);
