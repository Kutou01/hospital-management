#!/bin/bash

# Hospital Microservices Development Script
echo "🏥 Starting Hospital Microservices in Development Mode..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from .env.example..."
    cp .env.example .env
    print_warning "Please update .env file with your configuration and run again."
    exit 1
fi

# Start infrastructure services
start_infrastructure() {
    print_status "Starting infrastructure services..."
    
    docker-compose up -d auth-db doctor-db patient-db appointment-db department-db redis rabbitmq prometheus grafana
    
    print_status "Waiting for infrastructure to be ready..."
    sleep 15
    
    print_success "Infrastructure services started"
}

# Build shared library
build_shared() {
    print_status "Building shared library..."
    cd shared && npm run build && cd ..
    print_success "Shared library built"
}

# Start services in development mode
start_dev_services() {
    print_status "Starting services in development mode..."
    
    # Start services with hot reload
    npm run dev &
    
    print_success "Development services started"
}

# Wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for API Gateway
    while ! curl -f http://localhost:3000/health > /dev/null 2>&1; do
        print_status "Waiting for API Gateway..."
        sleep 5
    done
    print_success "API Gateway is ready"
    
    # Wait for Auth Service
    while ! curl -f http://localhost:3001/health > /dev/null 2>&1; do
        print_status "Waiting for Auth Service..."
        sleep 5
    done
    print_success "Auth Service is ready"
}

# Display development information
display_dev_info() {
    echo ""
    echo "🚀 Development Environment Ready!"
    echo "================================"
    echo ""
    echo "📋 Service URLs:"
    echo "  • API Gateway:     http://localhost:3000"
    echo "  • API Docs:        http://localhost:3000/docs"
    echo "  • Auth Service:    http://localhost:3001"
    echo "  • Doctor Service:  http://localhost:3002"
    echo "  • Patient Service: http://localhost:3003"
    echo ""
    echo "🔧 Development Tools:"
    echo "  • RabbitMQ:        http://localhost:15672 (admin/admin)"
    echo "  • Prometheus:      http://localhost:9090"
    echo "  • Grafana:         http://localhost:3001 (admin/admin)"
    echo ""
    echo "📊 Development Commands:"
    echo "  • View logs:       npm run logs"
    echo "  • Test services:   npm test"
    echo "  • Lint code:       npm run lint"
    echo "  • Format code:     npm run format"
    echo ""
    echo "🔄 Hot reload is enabled for all services"
    echo "Press Ctrl+C to stop all services"
    echo ""
}

# Cleanup function
cleanup() {
    print_status "Stopping development services..."
    
    # Kill background processes
    jobs -p | xargs -r kill
    
    # Stop infrastructure
    docker-compose down
    
    print_success "Development environment stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    start_infrastructure
    build_shared
    start_dev_services
    wait_for_services
    display_dev_info
    
    # Keep script running
    while true; do
        sleep 1
    done
}

# Run main function
main "$@"
