#!/bin/bash

# Hospital Microservices Setup Script
echo "🏥 Setting up Hospital Microservices..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "Node.js $(node --version) is installed"
}

# Create environment file
setup_env() {
    print_status "Setting up environment variables..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_success "Created .env file from .env.example"
        print_warning "Please update the .env file with your configuration"
    else
        print_warning ".env file already exists"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install shared dependencies
    cd shared && npm install && cd ..
    
    # Install API Gateway dependencies
    cd api-gateway && npm install && cd ..
    
    # Install service dependencies
    for service in services/*/; do
        if [ -d "$service" ]; then
            service_name=$(basename "$service")
            print_status "Installing dependencies for $service_name..."
            cd "$service" && npm install && cd ../..
        fi
    done
    
    print_success "All dependencies installed"
}

# Build shared library
build_shared() {
    print_status "Building shared library..."
    cd shared && npm run build && cd ..
    print_success "Shared library built"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p uploads
    mkdir -p data/postgres
    mkdir -p data/redis
    mkdir -p data/rabbitmq
    
    print_success "Directories created"
}

# Setup databases
setup_databases() {
    print_status "Setting up databases..."
    
    # Start only database services
    docker-compose up -d auth-db doctor-db patient-db appointment-db department-db redis rabbitmq
    
    # Wait for databases to be ready
    print_status "Waiting for databases to be ready..."
    sleep 30
    
    # Run migrations
    print_status "Running database migrations..."
    npm run migrate:all
    
    print_success "Databases setup completed"
}

# Start services
start_services() {
    print_status "Starting all services..."
    
    # Build and start all services
    docker-compose up --build -d
    
    print_success "All services started"
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    sleep 10
    
    # Check API Gateway
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        print_success "API Gateway is healthy"
    else
        print_error "API Gateway is not responding"
    fi
    
    # Check Auth Service
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        print_success "Auth Service is healthy"
    else
        print_error "Auth Service is not responding"
    fi
    
    print_status "Health check completed"
}

# Display information
display_info() {
    echo ""
    echo "🎉 Hospital Microservices Setup Complete!"
    echo ""
    echo "📋 Service URLs:"
    echo "  • API Gateway:     http://localhost:3000"
    echo "  • API Docs:        http://localhost:3000/docs"
    echo "  • Auth Service:    http://localhost:3001"
    echo "  • Doctor Service:  http://localhost:3002"
    echo "  • Patient Service: http://localhost:3003"
    echo "  • Frontend:        http://localhost:3100"
    echo ""
    echo "🔧 Management URLs:"
    echo "  • RabbitMQ:        http://localhost:15672 (admin/admin)"
    echo "  • Prometheus:      http://localhost:9090"
    echo "  • Grafana:         http://localhost:3001 (admin/admin)"
    echo ""
    echo "📊 Useful Commands:"
    echo "  • View logs:       npm run logs"
    echo "  • Stop services:   docker-compose down"
    echo "  • Restart:         docker-compose restart"
    echo "  • Clean up:        npm run docker:clean"
    echo ""
}

# Main execution
main() {
    echo "🏥 Hospital Microservices Setup"
    echo "================================"
    
    check_docker
    check_node
    setup_env
    create_directories
    install_dependencies
    build_shared
    setup_databases
    start_services
    health_check
    display_info
}

# Run main function
main "$@"
