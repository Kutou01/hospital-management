const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static('frontend/public'));

// Simple test route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Hospital Management - Test</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .status { padding: 20px; border-radius: 8px; margin: 20px 0; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
        .btn { padding: 10px 20px; margin: 10px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏥 Hospital Management System</h1>
        
        <div class="status success">
          ✅ Server đang chạy thành công trên port ${PORT}
        </div>
        
        <div class="status info">
          📋 Các trang có sẵn:
          <ul>
            <li><a href="/doctors" class="btn">Danh sách bác sĩ</a></li>
            <li><a href="/auth/login" class="btn">Đăng nhập</a></li>
            <li><a href="/api/doctors" class="btn">API Doctors</a></li>
          </ul>
        </div>
        
        <div class="status info">
          🔧 Nếu bạn thấy trang này, có nghĩa là:
          <ul>
            <li>Server Express đang hoạt động</li>
            <li>Port 3000 đã được mở</li>
            <li>Có thể Next.js đang gặp vấn đề</li>
          </ul>
        </div>
        
        <p><strong>Giải pháp:</strong> Hãy thử restart Next.js development server hoặc kiểm tra console logs.</p>
      </div>
    </body>
    </html>
  `);
});

// Test API route
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test API hoạt động!',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log('📝 Nếu bạn thấy message này, server đang hoạt động!');
});
