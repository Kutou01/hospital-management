@echo off
echo ============================================================================
echo SETUP CHATBOT BOOKING SYSTEM
echo ============================================================================
echo.

echo [1/5] Tao database functions...
echo Chay file: chatbot-booking-functions.sql trong Supabase SQL Editor
echo.
pause

echo [2/5] Cai dat dependencies cho backend service...
cd backend\services\chatbot-booking-service
call npm install
echo.

echo [3/5] Tao file .env cho service...
if not exist .env (
    copy .env.example .env
    echo Da tao file .env. Vui long cap nhat cac bien moi truong.
) else (
    echo File .env da ton tai.
)
echo.

echo [4/5] Build backend service...
call npm run build
echo.

echo [5/5] Kiem tra cau hinh...
echo - Database functions: Can chay chatbot-booking-functions.sql
echo - Backend service: Port 3005
echo - Frontend widget: Da tao ChatbotBookingWidget.tsx
echo.

echo ============================================================================
echo SETUP HOAN TAT!
echo ============================================================================
echo.
echo Cac buoc tiep theo:
echo 1. Chay chatbot-booking-functions.sql trong Supabase
echo 2. Cap nhat .env voi SUPABASE_SERVICE_ROLE_KEY
echo 3. Chay: npm run dev (trong thu muc chatbot-booking-service)
echo 4. Them ChatbotBookingWidget vao trang web
echo.
echo API Endpoints:
echo - Health check: http://localhost:3005/health
echo - Specialties: http://localhost:3005/api/specialties
echo - Doctors: http://localhost:3005/api/doctors
echo - Time slots: http://localhost:3005/api/slots/:doctorId/:date
echo - Sessions: http://localhost:3005/api/session
echo.
pause
