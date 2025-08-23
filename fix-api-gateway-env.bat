@echo off
echo 🔧 Fixing API Gateway Environment Variables for Local Development

echo.
echo 📝 Setting environment variables:
echo AUTH_SERVICE_URL=http://localhost:3001
echo DOCTOR_SERVICE_URL=http://localhost:3002
echo PATIENT_SERVICE_URL=http://localhost:3003
echo APPOINTMENT_SERVICE_URL=http://localhost:3004
echo DEPARTMENT_SERVICE_URL=http://localhost:3005
echo MEDICAL_RECORDS_SERVICE_URL=http://localhost:3006
echo BILLING_SERVICE_URL=http://localhost:3008
echo NOTIFICATION_SERVICE_URL=http://localhost:3011

echo.
echo 🔄 Starting API Gateway with correct local service URLs...

cd backend\services\api-gateway

set AUTH_SERVICE_URL=http://localhost:3001
set DOCTOR_SERVICE_URL=http://localhost:3002
set PATIENT_SERVICE_URL=http://localhost:3003
set APPOINTMENT_SERVICE_URL=http://localhost:3004
set DEPARTMENT_SERVICE_URL=http://localhost:3005
set MEDICAL_RECORDS_SERVICE_URL=http://localhost:3006
set BILLING_SERVICE_URL=http://localhost:3008
set NOTIFICATION_SERVICE_URL=http://localhost:3011

echo.
echo ✅ Environment variables set! Now starting API Gateway...
echo.
npm run dev
