#!/bin/bash

# Hospital Management - Doctor Service Only Development Script
# This script starts only the doctor service and its dependencies

echo "🏥 Starting Hospital Management - Doctor Service Only Mode"
echo "================================================="

# Check if Docker is running
echo "🔍 Checking Docker status..."
if ! docker version > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi
echo "✅ Docker is running"

# Stop any existing containers
echo "🛑 Stopping any existing containers..."
docker-compose -f docker-compose.doctor-only.yml down

# Clean up old volumes if needed (optional)
read -p "Do you want to clean up old database volumes? (y/N): " clean_volumes
if [[ $clean_volumes == "y" || $clean_volumes == "Y" ]]; then
    echo "🧹 Cleaning up volumes..."
    docker volume rm backend_doctor_data 2>/dev/null || true
    docker volume rm backend_redis_data 2>/dev/null || true
    docker volume rm backend_rabbitmq_data 2>/dev/null || true
fi

# Build and start services
echo "🔨 Building and starting Doctor Service..."
docker-compose -f docker-compose.doctor-only.yml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

# Function to check HTTP service
check_http_service() {
    local name=$1
    local url=$2
    if curl -s "$url" > /dev/null 2>&1; then
        echo "✅ $name is healthy"
    else
        echo "❌ $name is not responding"
    fi
}

# Function to check port
check_port() {
    local name=$1
    local port=$2
    if nc -z localhost "$port" 2>/dev/null; then
        echo "✅ $name is running on port $port"
    else
        echo "❌ $name is not responding on port $port"
    fi
}

check_http_service "API Gateway" "http://localhost:3000/health"
check_http_service "Doctor Service" "http://localhost:3002/health"
check_port "Redis" "6379"
check_port "RabbitMQ Management" "15672"

echo ""
echo "🎉 Doctor Service Setup Complete!"
echo "================================================="
echo "📋 Available Services:"
echo "  🌐 API Gateway:        http://localhost:3000"
echo "  👨‍⚕️ Doctor API:         http://localhost:3000/api/doctors"
echo "  📖 API Documentation:  http://localhost:3000/docs"
echo "  🔧 Service Status:     http://localhost:3000/services"
echo "  🏥 Doctor Service:     http://localhost:3002"
echo "  🐰 RabbitMQ Management: http://localhost:15672 (admin/admin)"
echo "  🗄️  PostgreSQL:        localhost:5432 (postgres/password)"

echo ""
echo "📝 Development Notes:"
echo "  • Only Doctor Service is active"
echo "  • Other services return 503 Service Unavailable"
echo "  • Database: doctor_db on PostgreSQL"
echo "  • Redis cache available for testing"

echo ""
echo "🛠️  Useful Commands:"
echo "  • View logs:     docker-compose -f docker-compose.doctor-only.yml logs -f"
echo "  • Stop services: docker-compose -f docker-compose.doctor-only.yml down"
echo "  • Restart:       docker-compose -f docker-compose.doctor-only.yml restart"

echo ""
read -p "Press Enter to view live logs (Ctrl+C to exit logs)..."

# Show live logs
docker-compose -f docker-compose.doctor-only.yml logs -f
