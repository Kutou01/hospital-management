@echo off
title Stop Hospital Management System
color 0C

echo.
echo ========================================
echo   STOPPING HOSPITAL MANAGEMENT SYSTEM
echo ========================================
echo.

echo Stopping all Node.js processes...
taskkill /f /im node.exe >nul 2>&1

echo Stopping Next.js development server...
taskkill /f /im "next-server" >nul 2>&1

echo.
echo ========================================
echo   SYSTEM STOPPED SUCCESSFULLY!
echo ========================================
echo.
echo All services have been terminated.
echo.
pause
