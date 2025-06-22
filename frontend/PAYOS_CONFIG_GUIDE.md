# Hướng dẫn cấu hình PayOS

Để kết nối với cổng thanh toán PayOS, bạn cần tạo file `.env.local` trong thư mục `frontend` với các thông tin sau:

```
# Cấu hình PayOS
PAYOS_CLIENT_ID=your_client_id
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key
PAYOS_API_URL=https://api-merchant.payos.vn

# Cấu hình ứng dụng
NEXT_PUBLIC_APP_DOMAIN=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Các bước cấu hình

1. Đăng ký tài khoản PayOS tại [https://payos.vn](https://payos.vn)
2. Lấy thông tin Client ID, API Key và Checksum Key từ trang quản trị PayOS
3. Thay thế các giá trị `your_client_id`, `your_api_key`, và `your_checksum_key` bằng thông tin thực tế
4. Khởi động lại ứng dụng để áp dụng cấu hình mới

## Kiểm tra cấu hình

Sau khi cấu hình xong, bạn có thể kiểm tra kết nối với PayOS bằng cách thực hiện thanh toán thử nghiệm.

## Lưu ý

- Không chia sẻ thông tin API Key và Checksum Key với người khác
- Trong môi trường phát triển, bạn có thể sử dụng API URL `https://api-merchant-dev.payos.vn`
- Trong môi trường sản xuất, hãy sử dụng API URL `https://api-merchant.payos.vn` 