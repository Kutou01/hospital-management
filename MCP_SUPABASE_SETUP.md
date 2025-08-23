# Hướng dẫn kết nối Supabase qua MCP Server trong Warp Terminal

## ✅ Các bước đã hoàn thành

1. **Cài đặt dependencies**
   ```bash
   npm install @supabase/supabase-js dotenv
   ```

2. **Cập nhật MCP server** (`mcp-supabase-server.js`)
   - Đã thêm dotenv để load biến môi trường
   - Server sẽ tự động đọc credentials từ file `.env`

3. **Tạo file cấu hình** (`warp-mcp-config.json`)
   - Đường dẫn Node.js: `C:\Program Files\nodejs\node.exe`
   - Server script: `D:\TEST\hospital-management\mcp-supabase-server.js`

4. **Test kết nối thành công**
   - Database URL: https://ciasxktujslgsdgylimv.supabase.co
   - Các bảng đã xác nhận:
     - patients: 47 records
     - doctors: 42 records
     - appointments: 31 records
     - medical_records: 0 records

## 🚀 Cách thêm MCP Server vào Warp Terminal

### Bước 1: Mở Warp Settings
- Nhấn `Cmd/Ctrl + ,` hoặc click vào menu Settings
- Chọn tab **"MCP Servers"**

### Bước 2: Thêm MCP Server mới
- Click nút **"Add MCP Server"**
- Nhập tên server: `supabase`

### Bước 3: Paste cấu hình
Copy và paste nội dung sau:

```json
{
  "command": "C:\\Program Files\\nodejs\\node.exe",
  "args": ["D:\\TEST\\hospital-management\\mcp-supabase-server.js"],
  "working_directory": "D:\\TEST\\hospital-management",
  "env": {
    "SUPABASE_URL": "https://ciasxktujslgsdgylimv.supabase.co",
    "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpYXN4a3R1anNsZ3NkZ3lsaW12Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA2MTE5MiwiZXhwIjoyMDY3NjM3MTkyfQ.ulj25FnFrqa80DAnvsxIMgvHm1wAccJZMiMDcE5dDLk"
  }
}
```

### Bước 4: Save và Restart
1. Click **"Save"**
2. Restart Warp Terminal để áp dụng cấu hình

## 📝 Cách sử dụng MCP Server trong Warp

Sau khi cấu hình xong, bạn có thể sử dụng các lệnh MCP để tương tác với Supabase:

### Ví dụ các thao tác:

1. **Query dữ liệu từ bảng patients:**
   ```
   @supabase select từ bảng patients với limit 5
   ```

2. **Thêm dữ liệu mới:**
   ```
   @supabase insert vào bảng doctors với data {name: "Dr. Smith", specialization: "Cardiology"}
   ```

3. **Update dữ liệu:**
   ```
   @supabase update bảng appointments set status='confirmed' where id=1
   ```

4. **Xóa dữ liệu:**
   ```
   @supabase delete từ bảng medical_records where patient_id=123
   ```

## 🔧 Các tools có sẵn trong MCP Server

- **query**: Thực thi SQL query trực tiếp
- **select**: Lấy dữ liệu từ bảng
- **insert**: Thêm dữ liệu mới
- **update**: Cập nhật dữ liệu
- **delete**: Xóa dữ liệu
- **rpc**: Gọi stored procedures/functions

## 🐛 Troubleshooting

### Nếu gặp lỗi kết nối:
1. Kiểm tra file `.env` có đầy đủ biến môi trường
2. Chạy `node test-mcp-connection.js` để test kết nối
3. Đảm bảo đường dẫn trong config là chính xác
4. Restart Warp Terminal sau khi thay đổi config

### Nếu không thấy MCP server trong Warp:
1. Kiểm tra Warp version (cần version hỗ trợ MCP)
2. Xem logs trong Warp Developer Tools (F12)
3. Verify JSON config format đúng

## 📚 Tài liệu tham khảo

- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [MCP Protocol Specification](https://github.com/anthropics/mcp)
- [Warp Terminal Documentation](https://docs.warp.dev)
