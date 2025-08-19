#!/bin/bash

# Patient API Integration Test Script
# This script starts the necessary services and runs integration tests

set -e

echo "🏥 Hospital Management System - Patient API Integration Test"
echo "============================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"

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

# Function to check if a service is running
check_service() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=1

    print_status "Checking $service_name on port $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
            print_success "$service_name is running on port $port"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start on port $port"
    return 1
}

# Function to run Node.js API tests
run_node_tests() {
    print_status "Running Node.js API integration tests..."
    
    cd $FRONTEND_DIR
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    fi
    
    # Run the test script
    node scripts/test-patient-api.js
    
    cd ..
}

# Function to show service status
show_status() {
    print_status "Service Status:"
    echo "==============="
    
    # Check each service
    services=(
        "API Gateway:3100"
        "Auth Service:3001"
        "Patient Service:3003"
    )
    
    for service in "${services[@]}"; do
        IFS=':' read -r name port <<< "$service"
        if curl -s "http://localhost:$port" > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} $name (port $port)"
        else
            echo -e "  ${RED}✗${NC} $name (port $port)"
        fi
    done
}

# Function to show help
show_help() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  test      Run Node.js API tests"
    echo "  status    Show service status"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 test           # Run API tests"
    echo "  $0 status         # Check service status"
}

# Main script logic
case "${1:-test}" in
    "test")
        print_status "Running API tests..."
        run_node_tests
        ;;
    
    "status")
        show_status
        ;;
    
    "help"|"-h"|"--help")
        show_help
        ;;
    
    *)
        print_error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac
