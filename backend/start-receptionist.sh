#!/bin/bash

# Quick start script for Receptionist Service
# This script starts receptionist service and its dependencies

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop first."
        exit 1
    fi
    print_status "Docker is running"
}

# Start receptionist service and dependencies
start_receptionist() {
    print_header "STARTING RECEPTIONIST SERVICE"
    
    print_status "Starting core dependencies..."
    
    # Start essential services for receptionist
    docker-compose up -d \
        redis \
        rabbitmq \
        api-gateway \
        auth-service \
        patient-service \
        appointment-service \
        department-service \
        receptionist-service
    
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Check service health
    print_status "Checking service health..."
    
    services=(
        "redis:6379"
        "api-gateway:3100"
        "auth-service:3001"
        "patient-service:3003"
        "appointment-service:3004"
        "department-service:3005"
        "receptionist-service:3006"
    )
    
    for service in "${services[@]}"; do
        name=$(echo $service | cut -d: -f1)
        port=$(echo $service | cut -d: -f2)
        
        if docker-compose ps $name | grep -q "Up"; then
            print_status "✓ $name is running"
        else
            print_warning "⚠ $name may not be ready"
        fi
    done
    
    print_status ""
    print_status "🎉 Receptionist Service Stack Started!"
    print_status ""
    print_status "Available endpoints:"
    print_status "- Receptionist Dashboard: http://localhost:3000/receptionist/dashboard"
    print_status "- API Gateway: http://localhost:3100"
    print_status "- Receptionist Service: http://localhost:3006"
    print_status "- Auth Service: http://localhost:3001"
    print_status ""
    print_status "API Routes (via Gateway):"
    print_status "- GET  /api/receptionists/profile"
    print_status "- GET  /api/checkin/queue"
    print_status "- POST /api/checkin"
    print_status "- GET  /api/appointments/today"
    print_status "- GET  /api/patients/search"
    print_status "- GET  /api/reports/daily"
    print_status ""
    print_status "Test commands:"
    print_status "- node test-receptionist-integration.js"
    print_status "- node services/receptionist-service/test-receptionist-api.js"
}

# Initialize database
init_database() {
    print_header "INITIALIZING RECEPTIONIST DATABASE"
    
    if [ -f "services/receptionist-service/scripts/init-database.js" ]; then
        print_status "Running database initialization..."
        cd services/receptionist-service
        node scripts/init-database.js
        cd ../..
        print_status "Database initialization completed"
    else
        print_warning "Database initialization script not found"
        print_status "You may need to run it manually later"
    fi
}

# Show logs
show_logs() {
    print_header "RECEPTIONIST SERVICE LOGS"
    docker-compose logs -f receptionist-service
}

# Stop services
stop_services() {
    print_header "STOPPING RECEPTIONIST SERVICES"
    docker-compose stop \
        receptionist-service \
        department-service \
        appointment-service \
        patient-service \
        auth-service \
        api-gateway \
        rabbitmq \
        redis
    print_status "Services stopped"
}

# Show help
show_help() {
    print_header "RECEPTIONIST SERVICE QUICK START"
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start         Start receptionist service and dependencies"
    echo "  init-db       Initialize receptionist database"
    echo "  logs          Show receptionist service logs"
    echo "  stop          Stop receptionist services"
    echo "  test          Run integration tests"
    echo "  help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start      # Start receptionist service stack"
    echo "  $0 init-db    # Initialize database schema"
    echo "  $0 logs       # Watch service logs"
    echo "  $0 test       # Test service integration"
}

# Run tests
run_tests() {
    print_header "RUNNING RECEPTIONIST INTEGRATION TESTS"
    
    if [ -f "test-receptionist-integration.js" ]; then
        node test-receptionist-integration.js
    else
        print_error "Test file not found: test-receptionist-integration.js"
        exit 1
    fi
}

# Main script logic
case "${1:-help}" in
    "start")
        check_docker
        start_receptionist
        ;;
    "init-db")
        init_database
        ;;
    "logs")
        show_logs
        ;;
    "stop")
        stop_services
        ;;
    "test")
        run_tests
        ;;
    "help"|*)
        show_help
        ;;
esac
