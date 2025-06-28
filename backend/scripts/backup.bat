@echo off
echo 🏥 Hospital Management System - Quick Backup
echo ==========================================

cd /d "%~dp0"

echo 📊 Starting backup process...
node run-backup.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Backup completed successfully!
    echo 📁 Check the 'backups' folder for your backup files.
) else (
    echo.
    echo ❌ Backup failed! Check the error messages above.
)

echo.
echo Press any key to exit...
pause >nul
