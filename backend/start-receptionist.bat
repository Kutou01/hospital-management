@echo off
setlocal enabledelayedexpansion

REM Quick start script for Receptionist Service (Windows)
REM This script starts receptionist service and its dependencies

set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "BLUE=[94m"
set "NC=[0m"

:main
if "%1"=="" goto help
if "%1"=="start" goto start_receptionist
if "%1"=="init-db" goto init_database
if "%1"=="logs" goto show_logs
if "%1"=="stop" goto stop_services
if "%1"=="test" goto run_tests
if "%1"=="help" goto help
goto help

:print_header
echo %BLUE%================================%NC%
echo %BLUE%%~1%NC%
echo %BLUE%================================%NC%
goto :eof

:print_status
echo %GREEN%[INFO]%NC% %~1
goto :eof

:print_warning
echo %YELLOW%[WARNING]%NC% %~1
goto :eof

:print_error
echo %RED%[ERROR]%NC% %~1
goto :eof

:check_docker
docker info >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker is not running. Please start Docker Desktop first."
    exit /b 1
)
call :print_status "Docker is running"
goto :eof

:start_receptionist
call :print_header "STARTING RECEPTIONIST SERVICE"
call :check_docker
if errorlevel 1 exit /b 1

call :print_status "Starting core dependencies..."

REM Start essential services for receptionist
docker-compose up -d redis rabbitmq api-gateway auth-service patient-service appointment-service department-service receptionist-service

call :print_status "Waiting for services to be ready..."
timeout /t 10 /nobreak >nul

call :print_status "Checking service health..."

REM Check if containers are running
for %%s in (redis api-gateway auth-service patient-service appointment-service department-service receptionist-service) do (
    docker-compose ps %%s | findstr "Up" >nul
    if !errorlevel! equ 0 (
        call :print_status "✓ %%s is running"
    ) else (
        call :print_warning "⚠ %%s may not be ready"
    )
)

call :print_status ""
call :print_status "🎉 Receptionist Service Stack Started!"
call :print_status ""
call :print_status "Available endpoints:"
call :print_status "- Receptionist Dashboard: http://localhost:3000/receptionist/dashboard"
call :print_status "- API Gateway: http://localhost:3100"
call :print_status "- Receptionist Service: http://localhost:3006"
call :print_status "- Auth Service: http://localhost:3001"
call :print_status ""
call :print_status "API Routes (via Gateway):"
call :print_status "- GET  /api/receptionists/profile"
call :print_status "- GET  /api/checkin/queue"
call :print_status "- POST /api/checkin"
call :print_status "- GET  /api/appointments/today"
call :print_status "- GET  /api/patients/search"
call :print_status "- GET  /api/reports/daily"
call :print_status ""
call :print_status "Test commands:"
call :print_status "- node test-receptionist-integration.js"
call :print_status "- node services/receptionist-service/test-receptionist-api.js"
goto end

:init_database
call :print_header "INITIALIZING RECEPTIONIST DATABASE"

if exist "services\receptionist-service\scripts\init-database.js" (
    call :print_status "Running database initialization..."
    cd services\receptionist-service
    node scripts\init-database.js
    cd ..\..
    call :print_status "Database initialization completed"
) else (
    call :print_warning "Database initialization script not found"
    call :print_status "You may need to run it manually later"
)
goto end

:show_logs
call :print_header "RECEPTIONIST SERVICE LOGS"
docker-compose logs -f receptionist-service
goto end

:stop_services
call :print_header "STOPPING RECEPTIONIST SERVICES"
docker-compose stop receptionist-service department-service appointment-service patient-service auth-service api-gateway rabbitmq redis
call :print_status "Services stopped"
goto end

:run_tests
call :print_header "RUNNING RECEPTIONIST INTEGRATION TESTS"

if exist "test-receptionist-integration.js" (
    node test-receptionist-integration.js
) else (
    call :print_error "Test file not found: test-receptionist-integration.js"
    exit /b 1
)
goto end

:help
call :print_header "RECEPTIONIST SERVICE QUICK START"
echo Usage: %0 [COMMAND]
echo.
echo Commands:
echo   start         Start receptionist service and dependencies
echo   init-db       Initialize receptionist database
echo   logs          Show receptionist service logs
echo   stop          Stop receptionist services
echo   test          Run integration tests
echo   help          Show this help message
echo.
echo Examples:
echo   %0 start      # Start receptionist service stack
echo   %0 init-db    # Initialize database schema
echo   %0 logs       # Watch service logs
echo   %0 test       # Test service integration
echo.
echo 💡 Quick Setup:
echo   1. %0 start       # Start services
echo   2. %0 init-db     # Setup database
echo   3. %0 test        # Verify everything works
echo   4. Open: http://localhost:3000/receptionist/dashboard
goto end

:end
pause
