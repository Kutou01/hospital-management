@echo off
title Hospital System Status Check
color 0B

echo.
echo ========================================
echo   HOSPITAL SYSTEM STATUS CHECK
echo ========================================
echo.

echo [1] Checking Node.js processes...
tasklist /fi "imagename eq node.exe" 2>nul | find /i "node.exe" >nul
if errorlevel 1 (
    echo   Status: NO Node.js processes running
) else (
    echo   Status: Node.js processes are running
    tasklist /fi "imagename eq node.exe"
)

echo.
echo [2] Checking port 3000 (Frontend)...
netstat -ano | findstr :3000 >nul
if errorlevel 1 (
    echo   Status: Port 3000 is FREE
) else (
    echo   Status: Port 3000 is IN USE (Frontend running)
)

echo.
echo [3] Checking port 3020 (Chatbot)...
netstat -ano | findstr :3020 >nul
if errorlevel 1 (
    echo   Status: Port 3020 is FREE
) else (
    echo   Status: Port 3020 is IN USE (Chatbot running)
)

echo.
echo [4] Testing Frontend connection...
curl -s http://localhost:3000 >nul 2>&1
if errorlevel 1 (
    echo   Status: Frontend NOT accessible
) else (
    echo   Status: Frontend is accessible
)

echo.
echo [5] Testing Chatbot API connection...
curl -s http://localhost:3020/health >nul 2>&1
if errorlevel 1 (
    echo   Status: Chatbot API NOT accessible
) else (
    echo   Status: Chatbot API is accessible
)

echo.
echo ========================================
echo   STATUS CHECK COMPLETE
echo ========================================
echo.
pause
