@echo off
title Hospital Management System Launcher
color 0A

echo.
echo ========================================
echo   HOSPITAL MANAGEMENT SYSTEM LAUNCHER
echo ========================================
echo.

echo [1/3] Checking system requirements...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    pause
    exit /b 1
)

echo [2/3] Starting Chatbot Service...
cd backend\services\chatbot-service
start "Hospital Chatbot Service" cmd /k "echo Starting Chatbot Service... && node simple-chatbot-server.js"

echo [3/3] Starting Frontend Application...
cd ..\..\..\frontend
start "Hospital Frontend" cmd /k "echo Starting Frontend... && npm run dev"

echo.
echo ========================================
echo   SYSTEM STARTED SUCCESSFULLY!
echo ========================================
echo.
echo Frontend:     http://localhost:3000
echo Chatbot API:  http://localhost:3020
echo.
echo Press any key to open the application...
pause >nul

start http://localhost:3000

echo.
echo System is running in background windows.
echo Close this window when you want to stop the system.
echo.
pause
