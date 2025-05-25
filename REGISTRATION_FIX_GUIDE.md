# Hướng dẫn sửa lỗi đăng ký không hoàn chỉnh

## Vấn đề

Khi đăng ký không thành công (do lỗi validation hoặc lỗi khác), dữ liệu user vẫn được tạo trong Supabase Auth, và sau đó có thể dùng thông tin này để đăng nhập. Điều này xảy ra vì:

1. `supabase.auth.signUp()` tạo user trong Supabase Auth trước
2. Các bước tạo profile và role-specific data có thể thất bại sau đó
3. User tồn tại trong auth nhưng không có dữ liệu profile đầy đủ

## Giải pháp đã triển khai

### 1. Cải thiện validation trong đăng ký (`frontend/lib/auth.ts`)

- **Validation trước khi tạo auth user**: Kiểm tra tất cả dữ liệu cần thiết trước khi gọi `signUp`
- **Better error handling**: Thông báo lỗi rõ ràng hơn
- **Rollback logic**: Ghi log khi cần cleanup (mặc dù không thể xóa auth user từ client)

### 2. Validation khi đăng nhập (`frontend/lib/auth/auth-validation.ts`)

- **Profile validation**: Kiểm tra user có profile đầy đủ không
- **Role-specific validation**: Đảm bảo có dữ liệu doctor/patient/admin tương ứng
- **Auto sign-out**: Tự động đăng xuất user không hoàn chỉnh

### 3. Script cleanup (`backend/scripts/cleanup-incomplete-users.js`)

- **Tìm user không hoàn chỉnh**: Quét tất cả user trong auth và kiểm tra profile
- **Xóa user không hoàn chỉnh**: Sử dụng service role key để xóa auth user
- **Interactive confirmation**: Hỏi xác nhận trước khi xóa

## Cách sử dụng

### Chạy script cleanup

```bash
# Từ thư mục backend
npm run cleanup:incomplete-users

# Hoặc chạy trực tiếp
node scripts/cleanup-incomplete-users.js
```

### Kiểm tra user hiện tại

Script sẽ:
1. Liệt kê tất cả user trong Supabase Auth
2. Kiểm tra từng user có profile đầy đủ không
3. Hiển thị danh sách user không hoàn chỉnh
4. Hỏi xác nhận trước khi xóa

### Cấu hình môi trường

Đảm bảo có các biến môi trường:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Lưu ý**: Cần service role key (không phải anon key) để có thể xóa auth users.

## Cách hoạt động của validation mới

### Khi đăng ký

1. **Frontend validation**: Kiểm tra form data đầy đủ
2. **Pre-auth validation**: Validate dữ liệu trước khi tạo auth user
3. **Auth user creation**: Tạo user trong Supabase Auth
4. **Profile creation**: Tạo profile và role-specific data
5. **Rollback on failure**: Nếu bước 4 thất bại, ghi log để cleanup sau

### Khi đăng nhập

1. **Auth sign in**: Đăng nhập với email/password
2. **Profile validation**: Kiểm tra user có profile đầy đủ
3. **Role validation**: Kiểm tra có dữ liệu role-specific
4. **Auto sign-out**: Nếu không đầy đủ, tự động đăng xuất và báo lỗi

## Các file đã thay đổi

### Frontend
- `frontend/lib/auth.ts`: Cải thiện signUp và signIn validation
- `frontend/lib/auth/auth-validation.ts`: Utility functions cho validation
- `frontend/app/auth/register/page.tsx`: Better error handling

### Backend
- `backend/scripts/cleanup-incomplete-users.js`: Script cleanup
- `backend/package.json`: Thêm npm script

### Documentation
- `REGISTRATION_FIX_GUIDE.md`: Hướng dẫn này

## Lưu ý quan trọng

1. **Service Role Key**: Cần service role key để xóa auth users
2. **Backup trước khi cleanup**: Nên backup database trước khi chạy script
3. **Test trước**: Test script trên môi trường dev trước khi chạy production
4. **Monitor logs**: Theo dõi console logs để debug issues

## Kiểm tra hiệu quả

### Test case 1: Đăng ký thất bại
1. Đăng ký với thông tin thiếu (ví dụ: doctor không có specialization)
2. Kiểm tra user không được tạo trong auth
3. Hoặc nếu được tạo, không thể đăng nhập được

### Test case 2: User không hoàn chỉnh
1. Chạy script cleanup
2. Kiểm tra user không hoàn chỉnh được liệt kê
3. Xác nhận xóa và kiểm tra user đã bị xóa

### Test case 3: Đăng nhập với user không hoàn chỉnh
1. Thử đăng nhập với user không có profile đầy đủ
2. Kiểm tra bị tự động đăng xuất với thông báo lỗi rõ ràng

## Troubleshooting

### Script không chạy được
- Kiểm tra environment variables
- Đảm bảo có service role key (không phải anon key)
- Kiểm tra network connection đến Supabase

### Validation không hoạt động
- Kiểm tra import paths trong auth-validation.ts
- Verify Supabase client configuration
- Check console logs cho error details

### User vẫn có thể đăng nhập
- Chạy script cleanup để xóa user không hoàn chỉnh
- Kiểm tra validation logic trong signIn function
- Verify database schema và relationships
