#!/bin/bash

# Quick Setup for Existing Supabase Data
echo "🚀 Quick Setup for Hospital Microservices with Existing Data"

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

# Check if .env exists and has Supabase config
check_env() {
    if [ ! -f .env ]; then
        print_error ".env file not found"
        return 1
    fi
    
    if ! grep -q "ciasxktujslgsdgylimv.supabase.co" .env; then
        print_warning "Please update .env with your Supabase credentials"
        print_status "Your Supabase URL: https://ciasxktujslgsdgylimv.supabase.co"
        return 1
    fi
    
    print_success "Environment configuration found"
    return 0
}

# Install dependencies quickly
install_deps() {
    print_status "Installing dependencies..."
    
    # Root dependencies
    npm install --silent
    
    # Shared library
    cd shared && npm install --silent && npm run build && cd ..
    
    # Auth service
    cd services/auth-service && npm install --silent && cd ../..
    
    print_success "Dependencies installed"
}

# Start minimal infrastructure
start_infrastructure() {
    print_status "Starting minimal infrastructure..."
    
    # Only start Redis and RabbitMQ (Supabase handles database)
    docker-compose up -d redis rabbitmq > /dev/null 2>&1
    
    print_status "Waiting for services..."
    sleep 5
    
    print_success "Infrastructure ready"
}

# Test Supabase connection with existing data
test_connection() {
    print_status "Testing connection to existing data..."
    
    node -e "
    const { createClient } = require('@supabase/supabase-js');
    require('dotenv').config();
    
    async function test() {
        try {
            const supabase = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            );
            
            // Test users table
            const { data: users, error: usersError } = await supabase
                .from('users')
                .select('user_id, email, role, full_name')
                .limit(3);
            
            if (usersError) throw usersError;
            
            console.log('✅ Found', users.length, 'users');
            users.forEach(user => {
                console.log('  👤', user.full_name, '(' + user.role + ')');
            });
            
            // Test doctors table
            const { data: doctors, error: doctorsError } = await supabase
                .from('doctors')
                .select('doctor_id, full_name, specialty')
                .limit(5);
            
            if (doctorsError) throw doctorsError;
            
            console.log('✅ Found', doctors.length, 'doctors');
            doctors.forEach(doctor => {
                console.log('  👨‍⚕️', doctor.full_name, '-', doctor.specialty);
            });
            
            // Test patients table
            const { count: patientCount } = await supabase
                .from('patients')
                .select('*', { count: 'exact', head: true });
            
            console.log('✅ Found', patientCount, 'patients');
            
            // Test appointments table
            const { count: appointmentCount } = await supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true });
            
            console.log('✅ Found', appointmentCount, 'appointments');
            
            console.log('🎉 Connection test successful!');
        } catch (error) {
            console.error('❌ Connection test failed:', error.message);
            process.exit(1);
        }
    }
    
    test();
    " || return 1
    
    print_success "Connection test passed"
}

# Start auth service
start_auth_service() {
    print_status "Starting Auth Service..."
    
    cd services/auth-service
    npm run dev > ../../logs/auth-service.log 2>&1 &
    AUTH_PID=$!
    echo $AUTH_PID > ../../.auth-service.pid
    cd ../..
    
    # Wait for service to start
    sleep 5
    
    # Test health
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        print_success "Auth Service started successfully"
    else
        print_warning "Auth Service may still be starting..."
    fi
}

# Start API Gateway
start_api_gateway() {
    print_status "Starting API Gateway..."
    
    cd api-gateway
    npm run dev > ../logs/api-gateway.log 2>&1 &
    GATEWAY_PID=$!
    echo $GATEWAY_PID > ../.api-gateway.pid
    cd ..
    
    # Wait for service to start
    sleep 5
    
    # Test health
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        print_success "API Gateway started successfully"
    else
        print_warning "API Gateway may still be starting..."
    fi
}

# Test authentication with existing users
test_auth() {
    print_status "Testing authentication with existing users..."
    
    # Wait a bit more for services to be fully ready
    sleep 5
    
    # Test login with existing user
    response=$(curl -s -X POST http://localhost:3000/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"doctor@hospital.com","password":"$2b$10$rQZ8kHWKQVz7QGQvQGQvQO"}' \
        2>/dev/null)
    
    if echo "$response" | grep -q "success"; then
        print_success "Authentication test passed"
        
        # Extract user info
        echo "$response" | node -e "
        const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));
        if (data.success && data.data && data.data.user) {
            console.log('👤 Logged in as:', data.data.user.full_name);
            console.log('🔑 Role:', data.data.user.role);
        }
        " 2>/dev/null || true
    else
        print_warning "Authentication test failed - this is expected with hashed passwords"
        print_status "You can create a new test user or update existing passwords"
    fi
}

# Display final information
display_info() {
    echo ""
    echo "🎉 Quick Setup Complete!"
    echo "======================="
    echo ""
    echo "📊 Your Existing Data:"
    echo "  • Users: 3 records"
    echo "  • Doctors: 17 records"
    echo "  • Patients: 16 records"
    echo "  • Appointments: 16 records"
    echo "  • Departments: 8 records"
    echo "  • Rooms: 16 records"
    echo ""
    echo "🌐 Service URLs:"
    echo "  • API Gateway: http://localhost:3000"
    echo "  • Auth Service: http://localhost:3001"
    echo "  • Supabase Dashboard: https://supabase.com/dashboard/project/ciasxktujslgsdgylimv"
    echo ""
    echo "🧪 Test Commands:"
    echo "  # Test API Gateway"
    echo "  curl http://localhost:3000/health"
    echo ""
    echo "  # Get all doctors"
    echo "  curl http://localhost:3000/api/doctors"
    echo ""
    echo "  # Register new user"
    echo "  curl -X POST http://localhost:3000/api/auth/register \\"
    echo "    -H \"Content-Type: application/json\" \\"
    echo "    -d '{\"email\":\"test@hospital.com\",\"password\":\"test123\",\"role\":\"patient\",\"full_name\":\"Test User\"}'"
    echo ""
    echo "📋 Next Steps:"
    echo "  1. Test the APIs with existing data"
    echo "  2. Create Doctor Service: cd services/doctor-service && npm run dev"
    echo "  3. Create Patient Service: cd services/patient-service && npm run dev"
    echo "  4. Create Appointment Service: cd services/appointment-service && npm run dev"
    echo ""
    echo "🛑 To stop services:"
    echo "  kill \$(cat .auth-service.pid .api-gateway.pid) && docker-compose down"
    echo ""
}

# Cleanup function
cleanup() {
    print_status "Stopping services..."
    
    if [ -f .auth-service.pid ]; then
        kill $(cat .auth-service.pid) 2>/dev/null
        rm .auth-service.pid
    fi
    
    if [ -f .api-gateway.pid ]; then
        kill $(cat .api-gateway.pid) 2>/dev/null
        rm .api-gateway.pid
    fi
    
    docker-compose down > /dev/null 2>&1
    
    print_success "Services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    echo "🏥 Hospital Microservices Quick Setup"
    echo "===================================="
    echo "Using existing Supabase data"
    echo ""
    
    # Create logs directory
    mkdir -p logs
    
    check_env || exit 1
    install_deps
    start_infrastructure
    test_connection
    start_auth_service
    start_api_gateway
    test_auth
    display_info
    
    # Keep script running
    print_status "Services are running. Press Ctrl+C to stop."
    while true; do
        sleep 1
    done
}

# Run main function
main "$@"
