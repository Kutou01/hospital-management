@echo off
echo Starting Qodana local analysis...

REM Check if Docker is running
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker is not installed or not running
    echo Please install Docker Desktop and make sure it's running
    pause
    exit /b 1
)

echo Installing dependencies...

REM Install frontend dependencies
echo Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo Error installing frontend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

REM Install backend service dependencies
echo Installing backend service dependencies...
cd backend
for /d %%i in (services\*) do (
    if exist "%%i\package.json" (
        echo Installing dependencies for %%i...
        cd %%i
        call npm install
        cd ..\..
    )
)
cd ..

echo Running Qodana analysis...
docker run --rm -it -v "%cd%":/data/project jetbrains/qodana-js:latest

echo Qodana analysis completed!
echo Check the results in qodana-results folder
pause
