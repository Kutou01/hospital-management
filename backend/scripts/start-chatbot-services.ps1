# PowerShell script to start Chatbot Services
Write-Host "🤖 Starting Hospital Management Chatbot Services..." -ForegroundColor Cyan

# Load environment variables
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
}

# Start chatbot services only
Write-Host "📋 Starting chatbot consultation and booking services..." -ForegroundColor Yellow
docker-compose --profile chatbot up -d

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Health checks
Write-Host "🔍 Checking service health..." -ForegroundColor Yellow

# Check consultation service
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3020/health" -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Chatbot Consultation Service: HEALTHY" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Chatbot Consultation Service: UNHEALTHY" -ForegroundColor Red
}

# Check booking service
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3015/health" -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Chatbot Booking Service: HEALTHY" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Chatbot Booking Service: UNHEALTHY" -ForegroundColor Red
}

Write-Host "🎉 Chatbot services startup complete!" -ForegroundColor Green
Write-Host "📊 View logs: docker-compose logs -f chatbot-consultation-service chatbot-booking-service" -ForegroundColor Cyan
Write-Host "🛑 Stop services: docker-compose --profile chatbot down" -ForegroundColor Cyan
