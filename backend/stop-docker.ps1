# Hospital Management - Stop Docker Services Script

Write-Host "🏥 Hospital Management - Stopping Docker Services" -ForegroundColor Red
Write-Host "=================================================" -ForegroundColor Red

# Check if Docker is running
Write-Host "🔍 Checking Docker status..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running." -ForegroundColor Red
    exit 1
}

# Check if docker-compose.yml exists
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "❌ docker-compose.yml not found. Please run this script from the backend directory." -ForegroundColor Red
    exit 1
}

Write-Host "🛑 Stopping all Docker services..." -ForegroundColor Yellow
docker-compose down --remove-orphans

Write-Host "🧹 Cleaning up unused Docker resources..." -ForegroundColor Yellow
docker system prune -f

Write-Host ""
Write-Host "✅ All Docker services have been stopped and cleaned up!" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 To start services again, run:" -ForegroundColor Cyan
Write-Host "  .\start-api-gateway-docker.ps1" -ForegroundColor White
