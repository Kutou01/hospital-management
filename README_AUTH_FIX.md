# 🔧 Hướng dẫn Fix Lỗi Infinite Recursion trong Auth Service

## 🔍 Tình trạng hiện tại

Auth Service của bạn gặp lỗi **"infinite recursion detected in policy for relation profiles"** khi thực hiện đăng ký/đăng nhập.

### ✅ Điểm tích cực đã phát hiện:

- **Auth Service code đúng**: Đã sử dụng `supabaseAdmin` với service role key
- **Middleware hoạt động tốt**: Logic authentication middleware không có vấn đề
- **Supabase config chính xác**: Service role và anon key đã được setup đúng

### ❌ Vấn đề chính:

- **RLS Policies có circular dependency**: Các policies trên bảng `profiles` tham chiếu lẫn nhau gây infinite recursion

## 🛠️ Các bước fix

### Bước 1: Chạy SQL Script để fix RLS Policies

1. **Mở Supabase Dashboard**

   - Truy cập: https://supabase.com/dashboard
   - Chọn project của bạn
   - Vào **SQL Editor**

2. **Chạy script fix**

   ```sql
   -- Copy nội dung file: fix-auth-infinite-recursion.sql
   -- Paste vào SQL Editor và chạy
   ```

   **Hoặc copy trực tiếp:**

   ```sql
   -- Tắt RLS tạm thời
   ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

   -- Xóa tất cả policies cũ
   DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
   DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
   DROP POLICY IF EXISTS "Service role full access" ON profiles;
   -- ... (xem file fix-auth-infinite-recursion.sql để có danh sách đầy đủ)

   -- Tạo policies mới đơn giản
   CREATE POLICY "Service role full access"
   ON profiles FOR ALL
   USING (auth.jwt() ->> 'role' = 'service_role');

   CREATE POLICY "Users can read own profile"
   ON profiles FOR SELECT
   USING (auth.uid() = id);

   CREATE POLICY "Users can update own profile"
   ON profiles FOR UPDATE
   USING (auth.uid() = id);

   CREATE POLICY "Enable insert for authenticated users"
   ON profiles FOR INSERT
   WITH CHECK (auth.uid() = id);

   -- Bật lại RLS
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ```

### Bước 2: Test kết quả

1. **Chạy test script**

   ```bash
   node test-auth-service-fix.js
   ```

2. **Restart Auth Service** (nếu đang chạy)

   ```bash
   # Nếu dùng Docker
   docker restart backend-auth-service-1
   docker logs backend-auth-service-1 --tail 20

   # Nếu chạy trực tiếp
   cd backend/services/auth-service
   npm restart
   ```

### Bước 3: Test đăng ký/đăng nhập

1. **Test qua frontend**

   - Truy cập trang đăng ký
   - Thử đăng ký tài khoản mới
   - Kiểm tra có còn lỗi infinite recursion không

2. **Test qua API**
   ```bash
   curl -X POST http://localhost:3001/auth/signup \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "TestPassword123!",
       "full_name": "Test User",
       "role": "patient"
     }'
   ```

## 🚨 Nếu vẫn có lỗi

### Option A: Tắt RLS hoàn toàn (Development only)

```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

### Option B: Kiểm tra lại các bảng khác

```sql
-- Kiểm tra các bảng khác có thể gây conflict
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Option C: Xem logs chi tiết

```bash
# Kiểm tra logs Supabase trong Dashboard
# Hoặc logs từ Auth Service
docker logs backend-auth-service-1 --tail 50
```

## ✅ Kiểm tra thành công

Sau khi fix, bạn sẽ thấy:

1. **Auth Service khởi động bình thường** - không có lỗi infinite recursion
2. **Đăng ký thành công** - users mới có thể đăng ký
3. **Đăng nhập hoạt động** - authentication flow bình thường
4. **Middleware hoạt động** - protected routes không bị lỗi

## 📊 Giải thích kỹ thuật

### Nguyên nhân gốc rễ:

- RLS policies trên bảng `profiles` có các điều kiện phức tạp
- Policies tham chiếu đến nhau tạo thành vòng lặp
- Khi Supabase query profiles, nó phải evaluate tất cả policies → infinite loop

### Giải pháp:

- **Đơn giản hóa policies**: Chỉ dùng `auth.uid()` và `auth.jwt() ->> 'role'`
- **Tách biệt concerns**: Service role bypass tất cả RLS
- **Tránh subqueries phức tạp**: Không dùng EXISTS, IN với các bảng khác

### Tại sao Auth Service vẫn hoạt động:

- Auth Service dùng **service role key** → bypass RLS
- Policies chỉ ảnh hưởng đến **anonymous** và **authenticated user** queries
- Service role có quyền tuyệt đối trên database

## 🎯 Kết luận

Code Auth Service của bạn **hoàn toàn đúng**. Vấn đề chỉ nằm ở cấu hình RLS policies trong database. Sau khi fix policies, hệ thống sẽ hoạt động bình thường.

**Files cần sử dụng:**

- `fix-auth-infinite-recursion.sql` - Script fix chính
- `test-auth-service-fix.js` - Script test sau khi fix
- File này (`README_AUTH_FIX.md`) - Hướng dẫn chi tiết
