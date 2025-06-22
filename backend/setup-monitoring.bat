@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   HOSPITAL MONITORING SETUP
echo ========================================
echo.

echo [INFO] Installing monitoring dependencies...

echo [INFO] Installing prom-client in root package...
npm install prom-client@^15.1.0

echo [INFO] Installing prom-client in shared package...
cd shared
npm install prom-client@^15.1.0

echo [INFO] Building shared package...
npm run build

echo [INFO] Installing dependencies in API Gateway...
cd ..\api-gateway
npm install

echo [INFO] Installing dependencies in Auth Service...
cd ..\services\auth-service
npm install

echo [INFO] Building services...
cd ..\..
npm run build:gateway
npm run build:auth

echo.
echo [SUCCESS] Monitoring setup completed!
echo.
echo Next steps:
echo 1. Start monitoring stack: docker-management.bat monitoring
echo 2. Start core services: docker-management.bat core
echo 3. Access Grafana: http://localhost:3001 (admin/admin123)
echo 4. Access Prometheus: http://localhost:9090
echo.
pause
