# Setup Windows Scheduled Task for Payment Sync
# Tự động đồng bộ thanh toán mỗi 5 phút trên Windows

Write-Host "🏥 Hospital Management - Payment Sync Windows Task Setup" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green

# Kiểm tra quyền admin
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script requires Administrator privileges." -ForegroundColor Red
    Write-Host "   Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    exit 1
}

# Lấy thông tin project
$ProjectDir = Get-Location
$NodePath = Get-Command node -ErrorAction SilentlyContinue
$NpmPath = Get-Command npm -ErrorAction SilentlyContinue

if (-not $NodePath) {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

if (-not $NpmPath) {
    Write-Host "❌ npm not found. Please install npm first." -ForegroundColor Red
    exit 1
}

Write-Host "📍 Project directory: $ProjectDir" -ForegroundColor Cyan
Write-Host "📍 Node.js path: $($NodePath.Source)" -ForegroundColor Cyan
Write-Host "📍 npm path: $($NpmPath.Source)" -ForegroundColor Cyan

# Tạo script wrapper
$WrapperScript = "$ProjectDir\scripts\payment-sync-wrapper.ps1"
Write-Host "📝 Creating wrapper script: $WrapperScript" -ForegroundColor Yellow

$WrapperContent = @"
# Hospital Payment Sync Wrapper Script
# Generated automatically by setup-windows-task.ps1

# Set working directory
Set-Location "$ProjectDir"

# Load environment variables from .env files
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if (`$_ -match "^([^#][^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable(`$matches[1], `$matches[2], "Process")
        }
    }
}

if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if (`$_ -match "^([^#][^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable(`$matches[1], `$matches[2], "Process")
        }
    }
}

# Log start
`$LogFile = "$ProjectDir\logs\payment-sync.log"
`$LogDir = Split-Path `$LogFile -Parent
if (-not (Test-Path `$LogDir)) {
    New-Item -ItemType Directory -Path `$LogDir -Force | Out-Null
}

`$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path `$LogFile -Value "`$Timestamp : Starting payment sync job"

try {
    # Run the sync script
    & "$($NodePath.Source)" "scripts/sync-payments.js" 2>&1 | Add-Content -Path `$LogFile
    
    `$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path `$LogFile -Value "`$Timestamp : Payment sync job completed successfully"
} catch {
    `$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path `$LogFile -Value "`$Timestamp : Payment sync job failed: `$(`$_.Exception.Message)"
}
"@

$WrapperContent | Out-File -FilePath $WrapperScript -Encoding UTF8
Write-Host "✅ Wrapper script created" -ForegroundColor Green

# Tạo thư mục logs
$LogDir = "$ProjectDir\logs"
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
    Write-Host "✅ Log directory created: $LogDir" -ForegroundColor Green
}

# Xóa task cũ nếu tồn tại
$TaskName = "Hospital-Payment-Sync"
$ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

if ($ExistingTask) {
    Write-Host "⚠️  Removing existing scheduled task..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

# Tạo scheduled task mới
Write-Host "📅 Creating scheduled task: $TaskName" -ForegroundColor Yellow

# Tạo action
$Action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File `"$WrapperScript`""

# Tạo trigger (mỗi 5 phút)
$Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 365)

# Tạo settings
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable

# Tạo principal (chạy với quyền system)
$Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

# Đăng ký task
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal -Description "Automatically sync payment status from PayOS every 5 minutes"

Write-Host "✅ Scheduled task created successfully" -ForegroundColor Green

# Kiểm tra task
$CreatedTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($CreatedTask) {
    Write-Host "✅ Task verification successful" -ForegroundColor Green
} else {
    Write-Host "❌ Task verification failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Payment sync scheduled task setup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "   - Task name: $TaskName" -ForegroundColor White
Write-Host "   - Frequency: Every 5 minutes" -ForegroundColor White
Write-Host "   - Script: $WrapperScript" -ForegroundColor White
Write-Host "   - Log file: $ProjectDir\logs\payment-sync.log" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Management commands:" -ForegroundColor Cyan
Write-Host "   - View task: Get-ScheduledTask -TaskName '$TaskName'" -ForegroundColor White
Write-Host "   - Start task: Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor White
Write-Host "   - Stop task: Stop-ScheduledTask -TaskName '$TaskName'" -ForegroundColor White
Write-Host "   - Remove task: Unregister-ScheduledTask -TaskName '$TaskName'" -ForegroundColor White
Write-Host "   - View logs: Get-Content '$ProjectDir\logs\payment-sync.log' -Tail 20" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Note: Make sure your .env file contains the correct PayOS credentials" -ForegroundColor Yellow
