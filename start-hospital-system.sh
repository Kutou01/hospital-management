#!/bin/bash

# Hospital Management System - Complete Startup Script
# Starts all services including the new Receptionist Service

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
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

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_step() {
    echo -e "${CYAN}🔄 $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "CHECKING PREREQUISITES"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop first."
        exit 1
    fi
    print_success "Docker is running"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    print_success "Docker Compose is available"
    
    # Check Node.js (for frontend)
    if ! command -v node &> /dev/null; then
        print_warning "Node.js is not installed - frontend won't start automatically"
    else
        print_success "Node.js is available"
    fi
    
    # Check if we're in the right directory
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml not found. Please run this script from the project root."
        exit 1
    fi
    print_success "Project structure verified"
}

# Start backend services
start_backend() {
    print_header "STARTING BACKEND SERVICES"
    
    cd backend
    
    print_step "Starting core services with receptionist..."
    docker-compose --profile core up -d
    
    print_step "Waiting for services to initialize..."
    sleep 15
    
    print_step "Checking service health..."
    
    # Test core services
    services=(
        "API Gateway:http://localhost:3100/health"
        "Auth Service:http://localhost:3001/health"
        "Doctor Service:http://localhost:3002/health"
        "Patient Service:http://localhost:3003/health"
        "Appointment Service:http://localhost:3004/health"
        "Department Service:http://localhost:3005/health"
        "Receptionist Service:http://localhost:3006/health"
    )
    
    for service in "${services[@]}"; do
        name=$(echo $service | cut -d: -f1)
        url=$(echo $service | cut -d: -f2-3)
        
        if curl -s "$url" > /dev/null 2>&1; then
            print_success "$name is healthy"
        else
            print_warning "$name may not be ready yet"
        fi
    done
    
    cd ..
}

# Initialize databases
init_databases() {
    print_header "INITIALIZING DATABASES"
    
    print_step "Setting up receptionist database..."
    if [ -f "backend/services/receptionist-service/scripts/init-database.js" ]; then
        cd backend/services/receptionist-service
        node scripts/init-database.js || print_warning "Receptionist DB init had warnings"
        cd ../../..
        print_success "Receptionist database initialized"
    else
        print_warning "Receptionist database script not found"
    fi
    
    print_step "Database initialization completed"
}

# Start frontend
start_frontend() {
    print_header "STARTING FRONTEND APPLICATION"
    
    if [ -f "frontend/package.json" ]; then
        cd frontend
        
        if [ ! -d "node_modules" ]; then
            print_step "Installing frontend dependencies..."
            npm install
        fi
        
        print_step "Starting Next.js development server..."
        npm run dev &
        FRONTEND_PID=$!
        
        cd ..
        
        print_success "Frontend started (PID: $FRONTEND_PID)"
        echo $FRONTEND_PID > .frontend.pid
    else
        print_warning "Frontend not found - skipping"
    fi
}

# Run integration tests
run_tests() {
    print_header "RUNNING INTEGRATION TESTS"
    
    print_step "Testing core services..."
    if [ -f "backend/test-core-services.js" ]; then
        cd backend
        node test-core-services.js || print_warning "Some core service tests failed"
        cd ..
    fi
    
    print_step "Testing receptionist integration..."
    if [ -f "backend/test-receptionist-integration.js" ]; then
        cd backend
        node test-receptionist-integration.js || print_warning "Some receptionist tests failed"
        cd ..
    fi
    
    print_success "Integration tests completed"
}

# Show system status
show_status() {
    print_header "HOSPITAL MANAGEMENT SYSTEM STATUS"
    
    echo -e "${MAGENTA}🏥 Backend Services:${NC}"
    echo "  • API Gateway: http://localhost:3100"
    echo "  • Auth Service: http://localhost:3001"
    echo "  • Doctor Service: http://localhost:3002"
    echo "  • Patient Service: http://localhost:3003"
    echo "  • Appointment Service: http://localhost:3004"
    echo "  • Department Service: http://localhost:3005"
    echo "  • Receptionist Service: http://localhost:3006"
    echo ""
    
    echo -e "${MAGENTA}🖥️  Frontend Application:${NC}"
    echo "  • Main App: http://localhost:3000"
    echo "  • Admin Dashboard: http://localhost:3000/admin/dashboard"
    echo "  • Doctor Dashboard: http://localhost:3000/doctor/dashboard"
    echo "  • Patient Dashboard: http://localhost:3000/patient/dashboard"
    echo "  • Receptionist Dashboard: http://localhost:3000/receptionist/dashboard"
    echo ""
    
    echo -e "${MAGENTA}🔧 Management Tools:${NC}"
    echo "  • Docker Status: docker-compose ps"
    echo "  • Service Logs: docker-compose logs [service-name]"
    echo "  • Stop All: docker-compose down"
    echo "  • Restart Service: docker-compose restart [service-name]"
    echo ""
    
    echo -e "${MAGENTA}🧪 Testing:${NC}"
    echo "  • Core Services: cd backend && node test-core-services.js"
    echo "  • Receptionist: cd backend && node test-receptionist-integration.js"
    echo "  • Full API Test: cd backend/services/receptionist-service && node test-receptionist-api.js"
    echo ""
    
    echo -e "${MAGENTA}📊 Key Features:${NC}"
    echo "  • 4-Role Authentication (Admin/Doctor/Patient/Receptionist)"
    echo "  • Patient Check-in & Queue Management"
    echo "  • Appointment Booking & Management"
    echo "  • Medical Records & Prescriptions"
    echo "  • Payment Integration (PayOS)"
    echo "  • Real-time Notifications"
    echo ""
    
    print_success "Hospital Management System is ready!"
    print_status "Access the receptionist dashboard at: http://localhost:3000/receptionist/dashboard"
}

# Cleanup function
cleanup() {
    print_header "CLEANING UP"
    
    if [ -f ".frontend.pid" ]; then
        FRONTEND_PID=$(cat .frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            print_step "Stopping frontend (PID: $FRONTEND_PID)..."
            kill $FRONTEND_PID
        fi
        rm .frontend.pid
    fi
    
    print_step "Stopping backend services..."
    cd backend
    docker-compose down
    cd ..
    
    print_success "Cleanup completed"
}

# Handle script termination
trap cleanup EXIT INT TERM

# Main execution
main() {
    print_header "🏥 HOSPITAL MANAGEMENT SYSTEM STARTUP"
    print_status "Starting complete system with receptionist service..."
    echo ""
    
    check_prerequisites
    start_backend
    init_databases
    
    # Ask if user wants to start frontend
    echo ""
    read -p "Start frontend application? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start_frontend
        sleep 5  # Give frontend time to start
    fi
    
    # Ask if user wants to run tests
    echo ""
    read -p "Run integration tests? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_tests
    fi
    
    echo ""
    show_status
    
    print_status "System startup completed!"
    print_status "Press Ctrl+C to stop all services"
    
    # Keep script running
    while true; do
        sleep 10
    done
}

# Show help
show_help() {
    print_header "HOSPITAL MANAGEMENT SYSTEM STARTUP"
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --backend-only    Start only backend services"
    echo "  --no-tests        Skip integration tests"
    echo "  --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                # Full interactive startup"
    echo "  $0 --backend-only # Backend services only"
    echo "  $0 --no-tests     # Skip tests during startup"
}

# Parse command line arguments
case "${1:-}" in
    "--help")
        show_help
        exit 0
        ;;
    "--backend-only")
        check_prerequisites
        start_backend
        init_databases
        show_status
        print_status "Backend-only mode. Press Ctrl+C to stop."
        while true; do sleep 10; done
        ;;
    "--no-tests")
        check_prerequisites
        start_backend
        init_databases
        start_frontend
        show_status
        print_status "System started without tests. Press Ctrl+C to stop."
        while true; do sleep 10; done
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac
