# PowerShell script to start all microservices for development

Write-Host "🏥 Starting Hospital Management Microservices..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "backend")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Function to start a service in a new terminal
function Start-Service {
    param(
        [string]$ServiceName,
        [string]$ServicePath,
        [int]$Port
    )

    Write-Host "🚀 Starting $ServiceName on port $Port..." -ForegroundColor Yellow

    if (Test-Path $ServicePath) {
        # Start the service in a new PowerShell window
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ServicePath'; npm start" -WindowStyle Normal
        Start-Sleep -Seconds 2
        Write-Host "✅ $ServiceName started" -ForegroundColor Green
    } else {
        Write-Host "❌ $ServiceName directory not found: $ServicePath" -ForegroundColor Red
    }
}

# Start API Gateway
Start-Service "API Gateway" "backend/api-gateway" 3100

# Start completed microservices
Start-Service "Medical Records Service" "backend/services/medical-records-service" 3006
Start-Service "Prescription Service" "backend/services/prescription-service" 3007
Start-Service "Billing Service" "backend/services/billing-service" 3008

# Optional: Start basic services if they exist
if (Test-Path "backend/services/auth-service/src") {
    Start-Service "Auth Service" "backend/services/auth-service" 3001
}

if (Test-Path "backend/services/doctor-service/src") {
    Start-Service "Doctor Service" "backend/services/doctor-service" 3002
}

if (Test-Path "backend/services/patient-service/src") {
    Start-Service "Patient Service" "backend/services/patient-service" 3003
}

if (Test-Path "backend/services/appointment-service/src") {
    Start-Service "Appointment Service" "backend/services/appointment-service" 3004
}

Write-Host ""
Write-Host "🎉 All microservices are starting up!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Service URLs:" -ForegroundColor Cyan
Write-Host "   API Gateway:          http://localhost:3000" -ForegroundColor White
Write-Host "   Medical Records:      http://localhost:3006" -ForegroundColor White
Write-Host "   Prescriptions:        http://localhost:3007" -ForegroundColor White
Write-Host "   Billing:              http://localhost:3008" -ForegroundColor White
Write-Host ""
Write-Host "📖 API Documentation:" -ForegroundColor Cyan
Write-Host "   Medical Records:      http://localhost:3006/docs" -ForegroundColor White
Write-Host "   Prescriptions:        http://localhost:3007/docs" -ForegroundColor White
Write-Host "   Billing:              http://localhost:3008/docs" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Health Checks:" -ForegroundColor Cyan
Write-Host "   Medical Records:      http://localhost:3006/health" -ForegroundColor White
Write-Host "   Prescriptions:        http://localhost:3007/health" -ForegroundColor White
Write-Host "   Billing:              http://localhost:3008/health" -ForegroundColor White
Write-Host ""
Write-Host "⏳ Please wait a few seconds for all services to fully start..." -ForegroundColor Yellow
Write-Host "🌐 Then start the frontend with: cd frontend && npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
