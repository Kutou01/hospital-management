#!/bin/bash

# Bash script to start all microservices for development

echo "🏥 Starting Hospital Management Microservices..."

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Function to start a service in background
start_service() {
    local service_name=$1
    local service_path=$2
    local port=$3

    echo "🚀 Starting $service_name on port $port..."

    if [ -d "$service_path" ]; then
        cd "$service_path"
        npm start &
        cd - > /dev/null
        sleep 2
        echo "✅ $service_name started"
    else
        echo "❌ $service_name directory not found: $service_path"
    fi
}

# Start API Gateway
start_service "API Gateway" "backend/api-gateway" 3100

# Start completed microservices
start_service "Medical Records Service" "backend/services/medical-records-service" 3006
start_service "Prescription Service" "backend/services/prescription-service" 3007
start_service "Billing Service" "backend/services/billing-service" 3008

# Optional: Start basic services if they exist
if [ -d "backend/services/auth-service/src" ]; then
    start_service "Auth Service" "backend/services/auth-service" 3001
fi

if [ -d "backend/services/doctor-service/src" ]; then
    start_service "Doctor Service" "backend/services/doctor-service" 3002
fi

if [ -d "backend/services/patient-service/src" ]; then
    start_service "Patient Service" "backend/services/patient-service" 3003
fi

if [ -d "backend/services/appointment-service/src" ]; then
    start_service "Appointment Service" "backend/services/appointment-service" 3004
fi

echo ""
echo "🎉 All microservices are starting up!"
echo ""
echo "📋 Service URLs:"
echo "   API Gateway:          http://localhost:3000"
echo "   Medical Records:      http://localhost:3006"
echo "   Prescriptions:        http://localhost:3007"
echo "   Billing:              http://localhost:3008"
echo ""
echo "📖 API Documentation:"
echo "   Medical Records:      http://localhost:3006/docs"
echo "   Prescriptions:        http://localhost:3007/docs"
echo "   Billing:              http://localhost:3008/docs"
echo ""
echo "🔍 Health Checks:"
echo "   Medical Records:      http://localhost:3006/health"
echo "   Prescriptions:        http://localhost:3007/health"
echo "   Billing:              http://localhost:3008/health"
echo ""
echo "⏳ Please wait a few seconds for all services to fully start..."
echo "🌐 Then start the frontend with: cd frontend && npm run dev"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user input to stop
trap 'echo "🛑 Stopping all services..."; jobs -p | xargs kill; exit' INT
wait
