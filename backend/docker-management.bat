@echo off
setlocal enabledelayedexpansion

REM Hospital Management Docker Management Script for Windows
REM Tối ưu hóa việc sử dụng RAM và quản lý services

set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "BLUE=[94m"
set "NC=[0m"

:main
if "%1"=="" goto help
if "%1"=="core" goto core
if "%1"=="full" goto full
if "%1"=="stop" goto stop_all
if "%1"=="status" goto status
if "%1"=="cleanup" goto cleanup
if "%1"=="restart-wsl" goto restart_wsl
if "%1"=="memory" goto memory_status
if "%1"=="auto-optimize" goto auto_optimize
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

:core
call :print_header "STARTING CORE SERVICES"
call :print_status "This mode uses moderate RAM (~2.5GB total) - Recommended for development"
call :check_docker
if errorlevel 1 exit /b 1

docker-compose --profile core up -d

call :print_status "Core services started:"
call :print_status "- API Gateway (port 3100)"
call :print_status "- Auth Service (port 3001)"
call :print_status "- Doctor Service (port 3002)"
call :print_status "- Patient Service (port 3003)"
call :print_status "- Appointment Service (port 3004)"
call :print_status "- Redis & RabbitMQ"
goto end

:full
call :print_header "STARTING ALL SERVICES"
call :print_warning "This mode uses high RAM (~4GB+ total)"
call :check_docker
if errorlevel 1 exit /b 1

docker-compose --profile full up -d

call :print_status "All services started"
goto end

:stop_all
call :print_header "STOPPING ALL SERVICES"

docker-compose down

call :print_status "All services stopped"
call :print_status "RAM should be freed up now"
goto end

:status
call :print_header "CURRENT RESOURCE USAGE"
call :check_docker
if errorlevel 1 exit /b 1

echo Docker containers:
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo Docker system info:
docker system df

echo.
echo Memory usage by containers:
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
goto end

:cleanup
call :print_header "CLEANING UP DOCKER RESOURCES"
call :check_docker
if errorlevel 1 exit /b 1

call :print_status "Stopping all containers..."
docker-compose down

call :print_status "Removing unused containers..."
docker container prune -f

call :print_status "Removing unused images..."
docker image prune -f

call :print_status "Removing unused volumes..."
docker volume prune -f

call :print_status "Removing unused networks..."
docker network prune -f

call :print_status "Cleanup completed! RAM usage should be significantly reduced."
goto end

:restart_wsl
call :print_header "RESTARTING WSL TO FREE MEMORY"
call :print_warning "This will stop all Docker containers and restart WSL"

set /p "confirm=Are you sure? (y/N): "
if /i "!confirm!"=="y" (
    call :print_status "Stopping Docker containers..."
    docker-compose down 2>nul
    
    call :print_status "Shutting down WSL..."
    wsl --shutdown
    
    call :print_status "WSL restarted. VmmemWSL memory should be freed."
    call :print_status "You can now restart Docker Desktop and your services."
) else (
    call :print_status "Operation cancelled."
)
goto end

:memory_status
call :print_header "WSL MEMORY STATUS"

echo Checking VmmemWSL memory usage...
powershell -Command "Get-Process VmmemWSL -ErrorAction SilentlyContinue | Select-Object Name, @{Name='Memory(MB)';Expression={[math]::Round($_.WorkingSet64/1MB,2)}}, @{Name='CPU(%)';Expression={$_.CPU}} | Format-Table -AutoSize"

echo.
echo System Memory:
powershell -Command "Get-WmiObject -Class Win32_OperatingSystem | Select-Object @{Name='Total RAM (GB)';Expression={[math]::Round($_.TotalVisibleMemorySize/1MB,2)}}, @{Name='Available RAM (GB)';Expression={[math]::Round($_.FreePhysicalMemory/1MB,2)}} | Format-Table -AutoSize"

echo.
call :print_status "💡 Tips to reduce VmmemWSL memory:"
call :print_status "   1. Run: %0 cleanup"
call :print_status "   2. Run: %0 restart-wsl"
call :print_status "   3. Use: ..\wsl-memory-optimization.bat setup"
goto end

:auto_optimize
call :print_header "AUTO MEMORY OPTIMIZATION"
call :print_status "Starting auto memory optimizer..."

if exist "..\auto-memory-optimizer.ps1" (
    powershell -ExecutionPolicy Bypass -File "..\auto-memory-optimizer.ps1" monitor
) else (
    call :print_error "Auto memory optimizer not found!"
    call :print_status "Please run: ..\wsl-memory-optimization.bat setup"
)
goto end

:help
call :print_header "HOSPITAL MANAGEMENT DOCKER HELPER"
echo Usage: %0 [COMMAND]
echo.
echo Commands:
echo   core          Start core services (~2.5GB RAM) - Recommended
echo   full          Start all services (~4GB+ RAM)
echo   stop          Stop all services
echo   status        Show current resource usage
echo   cleanup       Clean up Docker resources to free RAM
echo   restart-wsl   Restart WSL to free VmmemWSL memory
echo   memory        Show VmmemWSL memory status and tips
echo   auto-optimize Start auto memory monitoring
echo   help          Show this help message
echo.
echo Examples:
echo   %0 core          # Start core services for development
echo   %0 full          # Start all services for full testing
echo   %0 cleanup       # Free up RAM by cleaning Docker resources
echo   %0 restart-wsl   # Force free VmmemWSL memory
echo   %0 memory        # Check VmmemWSL memory usage
echo   %0 auto-optimize # Auto monitor and optimize memory
echo.
echo 💡 Memory Optimization Tools:
echo   ..\wsl-memory-optimization.bat setup    # Setup .wslconfig
echo   ..\auto-memory-optimizer.ps1 monitor    # Auto monitoring
goto end

:end
pause
