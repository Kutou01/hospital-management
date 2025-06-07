#!/bin/bash

# Hospital Management - API Gateway Docker Startup Script
# This script starts only the API Gateway and its dependencies using Docker

echo "🏥 Hospital Management - API Gateway Docker Setup"
echo "================================================="

# Check if Docker is running
echo "🔍 Checking Docker status..."
if ! docker version > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi
echo "✅ Docker is running"

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found. Please run this script from the backend directory."
    exit 1
fi

# Check if .env file exists for API Gateway
if [ ! -f "api-gateway/.env" ]; then
    echo "❌ API Gateway .env file not found at api-gateway/.env"
    echo "Please create the .env file with your Supabase configuration."
    exit 1
fi

echo "🧹 Cleaning up any existing containers..."
docker-compose down --remove-orphans

echo "🏗️  Building and starting API Gateway services..."
echo "Services to start:"
echo "  - API Gateway (port 3100)"
echo "  - Doctor Service (port 3002)"
echo "  - Redis (port 6379)"
echo "  - RabbitMQ (port 5672, management 15672)"
echo "  - Doctor Database (port 5432)"

# Start only the required services for API Gateway
docker-compose up -d --build api-gateway doctor-service redis rabbitmq doctor-db

# Wait a moment for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check service status
echo "🔍 Checking service status..."
services=("api-gateway" "doctor-service" "redis" "rabbitmq" "doctor-db")

for service in "${services[@]}"; do
    status=$(docker-compose ps $service --format "table {{.State}}" | tail -n +2)
    if [ "$status" = "running" ]; then
        echo "✅ $service is running"
    else
        echo "❌ $service is not running"
    fi
done

echo ""
echo "🎉 API Gateway Docker setup complete!"
echo ""
echo "📋 Service URLs:"
echo "  🌐 API Gateway:     http://localhost:3100"
echo "  📚 API Docs:        http://localhost:3100/docs"
echo "  ❤️  Health Check:    http://localhost:3100/health"
echo "  🔧 Service Status:  http://localhost:3100/services"
echo "  👨‍⚕️ Doctor API:      http://localhost:3100/api/doctors"
echo "  🐰 RabbitMQ UI:     http://localhost:15672 (admin/admin)"
echo "  🗄️  PostgreSQL:     localhost:5432 (postgres/password)"
echo ""
echo "🔧 Useful Commands:"
echo "  View logs:          docker-compose logs -f api-gateway"
echo "  Stop services:      docker-compose down"
echo "  Restart API GW:     docker-compose restart api-gateway"
echo "  View all services:  docker-compose ps"
echo ""
echo "🏥 Running in DOCTOR-ONLY MODE for development"
echo "Other services are disabled and will return 503 status"
