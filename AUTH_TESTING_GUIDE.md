# 🎭 Hướng dẫn Test Auth Service với Playwright

## 📋 Tổng quan

Tôi đã tạo 3 cách để test auth service của bạn:

1. **🎭 Full UI Test với Playwright** - Test toàn bộ flow qua browser
2. **🧪 Simple API Test** - Test direct API endpoints
3. **🔧 Manual Testing Scripts** - Chạy từng bước để debug

---

## 🚀 CÁCH 1: Full UI Test với Playwright

### 📁 Files:
- `test-auth-with-playwright.js` - Main test script
- `run-auth-test.sh` - Linux/Mac runner
- `run-auth-test.bat` - Windows runner

### 🏃‍♂️ Cách chạy:

#### **Linux/Mac:**
```bash
# Make executable
chmod +x run-auth-test.sh

# Run test
./run-auth-test.sh
```

#### **Windows:**
```cmd
# Run test
run-auth-test.bat
```

#### **Manual (any OS):**
```bash
# Install dependencies
npm install playwright
npx playwright install chromium

# Set environment variables
export FRONTEND_URL="http://localhost:3000"
export AUTH_SERVICE_URL="http://localhost:3001"
export HEADLESS="false"  # Set to true for headless mode

# Run test
node test-auth-with-playwright.js
```

### ✅ Test sẽ thực hiện:
1. **Navigate** to frontend page
2. **Register** new user qua UI
3. **Login** với credentials 
4. **Verify** authenticated state
5. **Cleanup** (logout)

### 🎯 Requirements:
- Frontend running on port 3000
- Auth service running on port 3001
- Playwright installed

---

## 🧪 CÁCH 2: Simple API Test

### 📁 Files:
- `simple-auth-test.js` - Lightweight API test

### 🏃‍♂️ Cách chạy:
```bash
# Install axios if needed
npm install axios

# Run test
node simple-auth-test.js
```

### ✅ Test sẽ thực hiện:
1. **Health check** auth service
2. **Email availability** check
3. **Register** user via API
4. **Login** user via API
5. **Token verification** 
6. **Profile fetch** with token

### 🎯 Requirements:
- Chỉ cần auth service running
- Không cần frontend
- Faster execution

---

## 🔧 CÁCH 3: Manual Testing

### 🏃‍♂️ Test từng endpoint:

#### **1. Health Check:**
```bash
curl http://localhost:3001/health
```

#### **2. Email Check:**
```bash
curl -X POST http://localhost:3001/auth/check-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

#### **3. Register User:**
```bash
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"TestPassword123!",
    "full_name":"Test User",
    "role":"patient",
    "phone_number":"0987654321"
  }'
```

#### **4. Login User:**
```bash
curl -X POST http://localhost:3001/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"TestPassword123!"
  }'
```

#### **5. Verify Token:**
```bash
# Replace YOUR_TOKEN with actual token from login
curl -X GET http://localhost:3001/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Expected Results

### ✅ **Successful Test Results:**

```
📊 TEST RESULTS SUMMARY
==================================================
Navigation      ✅ PASS     Frontend page loading
Registration    ✅ PASS     User signup process  
Login          ✅ PASS     User signin process
Authentication ✅ PASS     Authenticated state
Cleanup        ✅ PASS     Logout/cleanup

🎉 ALL TESTS PASSED! Auth flow working perfectly!
```

### ❌ **Common Issues & Solutions:**

#### **Frontend không chạy:**
```bash
cd frontend
npm run dev
```

#### **Auth service không chạy:**
```bash
cd backend/services/auth-service
npm run dev

# OR với Docker
docker-compose up auth-service
```

#### **Database connection issues:**
- Check Supabase credentials
- Run RLS fix script nếu cần
- Verify environment variables

#### **Port conflicts:**
- Frontend: Change to different port
- Auth service: Update port in config

---

## 🔍 Advanced Testing

### 🎛️ **Environment Variables:**

```bash
# Test configuration
export FRONTEND_URL="http://localhost:3000"
export AUTH_SERVICE_URL="http://localhost:3001" 
export HEADLESS="false"           # Show browser
export TIMEOUT="30000"            # 30 second timeout

# Test user configuration
export TEST_EMAIL="custom@test.com"
export TEST_PASSWORD="CustomPass123!"
export TEST_NAME="Custom Test User"
```

### 🐛 **Debug Mode:**

```bash
# Run with debug info
DEBUG=true node test-auth-with-playwright.js

# Run with slower execution
SLOW_MO=1000 node test-auth-with-playwright.js

# Run with video recording
RECORD_VIDEO=true node test-auth-with-playwright.js
```

### 📹 **Video Recording:**

Playwright có thể record video của test:

```javascript
// Add to test script
const context = await browser.newContext({
  recordVideo: {
    dir: './test-videos/',
    size: { width: 1280, height: 720 }
  }
});
```

---

## 🎯 Test Coverage

### ✅ **Được test:**
- ✅ User registration flow
- ✅ User login flow  
- ✅ Token generation & validation
- ✅ Role-based data creation
- ✅ Profile management
- ✅ Error handling
- ✅ UI interaction patterns

### 📋 **Có thể thêm:**
- Multiple role testing (doctor, admin)
- OAuth flow testing
- Password reset flow
- Session management
- Rate limiting tests
- Security vulnerability tests

---

## 🚀 CI/CD Integration

### **GitHub Actions:**
```yaml
name: Auth Tests
on: [push, pull_request]
jobs:
  auth-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx playwright install chromium
      - run: npm run start:services
      - run: node simple-auth-test.js
      - run: HEADLESS=true node test-auth-with-playwright.js
```

### **Docker Integration:**
```dockerfile
FROM mcr.microsoft.com/playwright:latest
COPY . /app
WORKDIR /app
RUN npm install
CMD ["node", "test-auth-with-playwright.js"]
```

---

## 📞 Support

### 🔧 **Troubleshooting:**
1. Kiểm tra services đang chạy
2. Verify port numbers
3. Check browser console logs
4. Review network requests
5. Validate environment variables

### 💡 **Tips:**
- Run simple test trước để verify API
- Dùng headless=false để debug UI issues
- Check browser developer tools khi test fail
- Monitor auth service logs during testing

**Happy Testing! 🎭✨**
