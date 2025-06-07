# Hospital Management - API Gateway Docker Startup Script
# This script starts only the API Gateway and its dependencies using Docker

Write-Host "🏥 Hospital Management - API Gateway Docker Setup" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Check if Docker is running
Write-Host "🔍 Checking Docker status..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if docker-compose.yml exists
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "❌ docker-compose.yml not found. Please run this script from the backend directory." -ForegroundColor Red
    exit 1
}

# Check if .env file exists for API Gateway
if (-not (Test-Path "api-gateway/.env")) {
    Write-Host "❌ API Gateway .env file not found at api-gateway/.env" -ForegroundColor Red
    Write-Host "Please create the .env file with your Supabase configuration." -ForegroundColor Yellow
    exit 1
}

Write-Host "🧹 Cleaning up any existing containers..." -ForegroundColor Yellow
docker-compose down --remove-orphans

Write-Host "🏗️  Building and starting API Gateway services..." -ForegroundColor Yellow
Write-Host "Services to start:" -ForegroundColor Cyan
Write-Host "  - API Gateway (port 3100)" -ForegroundColor Cyan
Write-Host "  - Doctor Service (port 3002)" -ForegroundColor Cyan
Write-Host "  - Redis (port 6379)" -ForegroundColor Cyan
Write-Host "  - RabbitMQ (port 5672, management 15672)" -ForegroundColor Cyan
Write-Host "  - Doctor Database (port 5432)" -ForegroundColor Cyan

# Start only the required services for API Gateway
docker-compose up -d --build api-gateway doctor-service redis rabbitmq doctor-db

# Wait a moment for services to start
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service status
Write-Host "🔍 Checking service status..." -ForegroundColor Yellow
$services = @("api-gateway", "doctor-service", "redis", "rabbitmq", "doctor-db")

foreach ($service in $services) {
    $status = docker-compose ps $service --format "table {{.State}}" | Select-Object -Skip 1
    if ($status -eq "running") {
        Write-Host "✅ $service is running" -ForegroundColor Green
    } else {
        Write-Host "❌ $service is not running" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 API Gateway Docker setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Service URLs:" -ForegroundColor Cyan
Write-Host "  🌐 API Gateway:     http://localhost:3100" -ForegroundColor White
Write-Host "  📚 API Docs:        http://localhost:3100/docs" -ForegroundColor White
Write-Host "  ❤️  Health Check:    http://localhost:3100/health" -ForegroundColor White
Write-Host "  🔧 Service Status:  http://localhost:3100/services" -ForegroundColor White
Write-Host "  👨‍⚕️ Doctor API:      http://localhost:3100/api/doctors" -ForegroundColor White
Write-Host "  🐰 RabbitMQ UI:     http://localhost:15672 (admin/admin)" -ForegroundColor White
Write-Host "  🗄️  PostgreSQL:     localhost:5432 (postgres/password)" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Useful Commands:" -ForegroundColor Cyan
Write-Host "  View logs:          docker-compose logs -f api-gateway" -ForegroundColor White
Write-Host "  Stop services:      docker-compose down" -ForegroundColor White
Write-Host "  Restart API GW:     docker-compose restart api-gateway" -ForegroundColor White
Write-Host "  View all services:  docker-compose ps" -ForegroundColor White
Write-Host ""
Write-Host "🏥 Running in DOCTOR-ONLY MODE for development" -ForegroundColor Yellow
Write-Host "Other services are disabled and will return 503 status" -ForegroundColor Yellow
