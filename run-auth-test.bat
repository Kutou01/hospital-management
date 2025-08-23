@echo off

REM Script để chạy Playwright auth test trên Windows
REM Run this script to test auth flow end-to-end

echo 🎭 Playwright Auth Test Runner
echo ==============================

REM Check if Node.js is installed
echo 📦 Checking dependencies...

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

REM Check if Playwright is installed
npm list playwright >nul 2>&1
if %errorlevel% neq 0 (
    echo 📥 Installing Playwright...
    npm install playwright
    echo 🔽 Installing browser binaries...
    npx playwright install chromium
)

REM Check if frontend is running
echo 🌐 Checking if frontend is running...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is running on port 3000
    set FRONTEND_RUNNING=true
) else (
    echo ❌ Frontend is not running on port 3000
    set FRONTEND_RUNNING=false
)

REM Check if auth service is running
echo 🔐 Checking if auth service is running...
curl -s http://localhost:3001/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Auth service is running on port 3001
    set AUTH_RUNNING=true
) else (
    echo ❌ Auth service is not running on port 3001
    set AUTH_RUNNING=false
)

REM Recommendations if services not running
if "%FRONTEND_RUNNING%"=="false" goto :show_help
if "%AUTH_RUNNING%"=="false" goto :show_help
goto :run_tests

:show_help
echo.
echo ⚠️  Some services are not running. Please start them:
echo.

if "%FRONTEND_RUNNING%"=="false" (
    echo 📱 Frontend:
    echo    cd frontend ^&^& npm run dev
)

if "%AUTH_RUNNING%"=="false" (
    echo 🔐 Auth Service:
    echo    cd backend\services\auth-service ^&^& npm run dev
    echo    # OR
    echo    docker-compose up auth-service
)

echo.
echo After starting services, run this script again.
pause
exit /b 1

:run_tests
echo.
echo 🚀 All services are running! Starting Playwright tests...
echo.

REM Set environment variables
set FRONTEND_URL=http://localhost:3000
set AUTH_SERVICE_URL=http://localhost:3001
set HEADLESS=false

REM Run the test
node test-auth-with-playwright.js

echo.
echo 🎭 Playwright test completed!
echo.
echo 💡 Tips:
echo    - Set HEADLESS=true to run in headless mode
echo    - Modify test-auth-with-playwright.js to customize test scenarios
echo    - Check browser console for additional debugging info

pause
