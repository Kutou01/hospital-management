# Hospital Management - Doctor Service Only Development Script
Write-Host "🏥 Starting Hospital Management - Doctor Service Only Mode" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan

# Check if Docker is running
Write-Host "🔍 Checking Docker status..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Stop any existing containers
Write-Host "🛑 Stopping any existing containers..." -ForegroundColor Yellow
docker-compose down

# Clean up old volumes if needed (optional)
$cleanVolumes = Read-Host "Do you want to clean up old database volumes? (y/N)"
if ($cleanVolumes -eq "y" -or $cleanVolumes -eq "Y") {
    Write-Host "🧹 Cleaning up volumes..." -ForegroundColor Yellow
    docker volume rm backend_doctor_data -ErrorAction SilentlyContinue
    docker volume rm backend_redis_data -ErrorAction SilentlyContinue
    docker volume rm backend_rabbitmq_data -ErrorAction SilentlyContinue
}

# Build and start services
Write-Host "🔨 Building and starting Doctor Service..." -ForegroundColor Yellow
docker-compose up --build -d

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check service health
Write-Host "🔍 Checking service health..." -ForegroundColor Yellow

$services = @(
    @{Name="API Gateway"; URL="http://localhost:3000/health"; Port=3000},
    @{Name="Doctor Service"; URL="http://localhost:3002/health"; Port=3002},
    @{Name="Redis"; Port=6379},
    @{Name="RabbitMQ Management"; URL="http://localhost:15672"; Port=15672},
    @{Name="PostgreSQL"; Port=5432}
)

foreach ($service in $services) {
    try {
        if ($service.URL) {
            # HTTP health check
            $response = Invoke-WebRequest -Uri $service.URL -TimeoutSec 5 -ErrorAction Stop
            Write-Host "✅ $($service.Name) is healthy" -ForegroundColor Green
        } else {
            # Simple port check
            $connection = Test-NetConnection -ComputerName localhost -Port $service.Port -WarningAction SilentlyContinue
            if ($connection.TcpTestSucceeded) {
                Write-Host "✅ $($service.Name) is running on port $($service.Port)" -ForegroundColor Green
            } else {
                Write-Host "❌ $($service.Name) is not responding on port $($service.Port)" -ForegroundColor Red
            }
        }
    } catch {
        Write-Host "❌ $($service.Name) is not responding" -ForegroundColor Red
    }
}

Write-Host "`n🎉 Doctor Service Setup Complete!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "📋 Available Services:" -ForegroundColor White
Write-Host "  🌐 API Gateway:        http://localhost:3000" -ForegroundColor Cyan
Write-Host "  👨‍⚕️ Doctor API:         http://localhost:3000/api/doctors" -ForegroundColor Cyan
Write-Host "  📖 API Documentation:  http://localhost:3000/docs" -ForegroundColor Cyan
Write-Host "  🔧 Service Status:     http://localhost:3000/services" -ForegroundColor Cyan
Write-Host "  🏥 Doctor Service:     http://localhost:3002" -ForegroundColor Cyan
Write-Host "  🐰 RabbitMQ Management: http://localhost:15672 (admin/admin)" -ForegroundColor Cyan
Write-Host "  🗄️  PostgreSQL:        localhost:5432 (postgres/password)" -ForegroundColor Cyan

Write-Host "`n📝 Development Notes:" -ForegroundColor White
Write-Host "  • Only Doctor Service is active" -ForegroundColor Yellow
Write-Host "  • Other services are commented out in docker-compose.yml" -ForegroundColor Yellow
Write-Host "  • Database: doctor_db on PostgreSQL" -ForegroundColor Yellow
Write-Host "  • Redis cache available for testing" -ForegroundColor Yellow

Write-Host "`n🛠️  Useful Commands:" -ForegroundColor White
Write-Host "  • View logs:     docker-compose logs -f" -ForegroundColor Gray
Write-Host "  • Stop services: docker-compose down" -ForegroundColor Gray
Write-Host "  • Restart:       docker-compose restart" -ForegroundColor Gray

Write-Host "`nPress any key to view live logs (Ctrl+C to exit logs)..." -ForegroundColor White
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Show live logs
docker-compose logs -f
