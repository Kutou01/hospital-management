#!/bin/bash

# Hospital Microservices Setup with Supabase Integration
echo "🏥 Setting up Hospital Microservices with Supabase..."

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

# Check if Supabase credentials are provided
check_supabase_config() {
    print_status "Checking Supabase configuration..."
    
    if [ -z "$SUPABASE_URL" ] || [ "$SUPABASE_URL" = "your-supabase-project-url" ]; then
        print_error "SUPABASE_URL is not configured in .env file"
        print_warning "Please update .env file with your Supabase project URL"
        return 1
    fi
    
    if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ] || [ "$SUPABASE_SERVICE_ROLE_KEY" = "your-supabase-service-role-key" ]; then
        print_error "SUPABASE_SERVICE_ROLE_KEY is not configured in .env file"
        print_warning "Please update .env file with your Supabase service role key"
        return 1
    fi
    
    print_success "Supabase configuration found"
    return 0
}

# Setup Supabase tables if they don't exist
setup_supabase_tables() {
    print_status "Setting up Supabase tables..."
    
    # Create a Node.js script to setup tables
    cat > setup-supabase-tables.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupTables() {
  console.log('🔧 Setting up Supabase tables...');
  
  try {
    // Check if users table exists
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (usersError && usersError.code === 'PGRST116') {
      console.log('❌ Users table not found in Supabase');
      console.log('📋 Please create the following tables in your Supabase dashboard:');
      console.log('');
      console.log('1. Users table:');
      console.log('   - user_id (text, primary key)');
      console.log('   - email (text, unique)');
      console.log('   - password_hash (text)');
      console.log('   - role (text)');
      console.log('   - full_name (text)');
      console.log('   - phone_number (text, nullable)');
      console.log('   - is_active (boolean, default: true)');
      console.log('   - email_verified (boolean, default: false)');
      console.log('   - phone_verified (boolean, default: false)');
      console.log('   - created_at (timestamp, default: now())');
      console.log('   - updated_at (timestamp, default: now())');
      console.log('   - last_login (timestamp, nullable)');
      console.log('   - profile_id (text, nullable)');
      console.log('');
      console.log('2. Sessions table:');
      console.log('   - id (text, primary key)');
      console.log('   - user_id (text, foreign key to users.user_id)');
      console.log('   - token (text)');
      console.log('   - refresh_token (text)');
      console.log('   - expires_at (timestamp)');
      console.log('   - ip_address (text, nullable)');
      console.log('   - user_agent (text, nullable)');
      console.log('   - device_info (json, nullable)');
      console.log('   - is_active (boolean, default: true)');
      console.log('   - created_at (timestamp, default: now())');
      console.log('   - updated_at (timestamp, default: now())');
      console.log('');
      console.log('3. Doctors table (if not exists):');
      console.log('   - doctor_id (text, primary key)');
      console.log('   - user_id (text, foreign key to users.user_id)');
      console.log('   - specialization (text)');
      console.log('   - license_number (text)');
      console.log('   - department_id (text, nullable)');
      console.log('   - experience_years (integer)');
      console.log('   - consultation_fee (numeric)');
      console.log('   - bio (text, nullable)');
      console.log('   - created_at (timestamp, default: now())');
      console.log('   - updated_at (timestamp, default: now())');
      console.log('');
      console.log('4. Patients table (if not exists):');
      console.log('   - patient_id (text, primary key)');
      console.log('   - user_id (text, foreign key to users.user_id)');
      console.log('   - date_of_birth (date)');
      console.log('   - gender (text)');
      console.log('   - blood_type (text, nullable)');
      console.log('   - emergency_contact_name (text, nullable)');
      console.log('   - emergency_contact_phone (text, nullable)');
      console.log('   - medical_history (text, nullable)');
      console.log('   - allergies (text, nullable)');
      console.log('   - created_at (timestamp, default: now())');
      console.log('   - updated_at (timestamp, default: now())');
      console.log('');
      console.log('5. Appointments table (if not exists):');
      console.log('   - appointment_id (text, primary key)');
      console.log('   - patient_id (text, foreign key to patients.patient_id)');
      console.log('   - doctor_id (text, foreign key to doctors.doctor_id)');
      console.log('   - appointment_date (timestamp)');
      console.log('   - duration_minutes (integer, default: 30)');
      console.log('   - status (text, default: "scheduled")');
      console.log('   - reason (text, nullable)');
      console.log('   - notes (text, nullable)');
      console.log('   - created_at (timestamp, default: now())');
      console.log('   - updated_at (timestamp, default: now())');
      console.log('');
      console.log('🔗 After creating tables, run this script again to verify setup.');
      process.exit(1);
    } else {
      console.log('✅ Users table found in Supabase');
      
      // Check if we have any users
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      console.log(`📊 Found ${count} users in database`);
      
      if (count === 0) {
        console.log('🔧 Creating default admin user...');
        
        const bcrypt = require('bcrypt');
        const passwordHash = await bcrypt.hash('admin123', 12);
        
        const { data, error } = await supabase
          .from('users')
          .insert([
            {
              user_id: 'USR001',
              email: 'admin@hospital.com',
              password_hash: passwordHash,
              role: 'admin',
              full_name: 'Hospital Administrator',
              phone_number: '+84123456789',
              is_active: true,
              email_verified: true
            }
          ]);
        
        if (error) {
          console.error('❌ Error creating admin user:', error);
        } else {
          console.log('✅ Default admin user created');
          console.log('📧 Email: admin@hospital.com');
          console.log('🔑 Password: admin123');
        }
      }
    }
    
    console.log('✅ Supabase setup completed');
  } catch (error) {
    console.error('❌ Error setting up Supabase:', error);
    process.exit(1);
  }
}

setupTables();
EOF

    # Run the setup script
    node setup-supabase-tables.js
    
    # Clean up
    rm setup-supabase-tables.js
    
    print_success "Supabase tables setup completed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install shared dependencies
    cd shared && npm install && npm run build && cd ..
    
    # Install auth service dependencies
    cd services/auth-service && npm install && cd ../..
    
    # Install API gateway dependencies
    cd api-gateway && npm install && cd ..
    
    print_success "Dependencies installed"
}

# Start infrastructure (minimal for Supabase setup)
start_infrastructure() {
    print_status "Starting minimal infrastructure..."
    
    # Only start Redis and RabbitMQ (Supabase handles database)
    docker-compose up -d redis rabbitmq
    
    print_status "Waiting for infrastructure to be ready..."
    sleep 10
    
    print_success "Infrastructure started"
}

# Start services
start_services() {
    print_status "Starting microservices..."
    
    # Start auth service
    cd services/auth-service && npm run dev &
    AUTH_PID=$!
    cd ../..
    
    # Wait a bit for auth service to start
    sleep 5
    
    # Start API gateway
    cd api-gateway && npm run dev &
    GATEWAY_PID=$!
    cd ..
    
    print_success "Services started"
    
    # Store PIDs for cleanup
    echo $AUTH_PID > .auth-service.pid
    echo $GATEWAY_PID > .api-gateway.pid
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    sleep 10
    
    # Check API Gateway
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        print_success "API Gateway is healthy"
    else
        print_warning "API Gateway is not responding yet"
    fi
    
    # Check Auth Service
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        print_success "Auth Service is healthy"
    else
        print_warning "Auth Service is not responding yet"
    fi
}

# Display information
display_info() {
    echo ""
    echo "🎉 Hospital Microservices with Supabase Setup Complete!"
    echo ""
    echo "📋 Service URLs:"
    echo "  • API Gateway:     http://localhost:3000"
    echo "  • API Docs:        http://localhost:3000/docs"
    echo "  • Auth Service:    http://localhost:3001"
    echo ""
    echo "🗄️ Database:"
    echo "  • Supabase:        ${SUPABASE_URL}"
    echo "  • Dashboard:       ${SUPABASE_URL/supabase.co/supabase.co}/project/_/editor"
    echo ""
    echo "🔧 Management URLs:"
    echo "  • RabbitMQ:        http://localhost:15672 (admin/admin)"
    echo ""
    echo "🧪 Test Login:"
    echo "  • Email:           admin@hospital.com"
    echo "  • Password:        admin123"
    echo ""
    echo "📊 Test API:"
    echo "  curl -X POST http://localhost:3000/api/auth/login \\"
    echo "    -H \"Content-Type: application/json\" \\"
    echo "    -d '{\"email\":\"admin@hospital.com\",\"password\":\"admin123\"}'"
    echo ""
    echo "🛑 To stop services:"
    echo "  kill \$(cat .auth-service.pid .api-gateway.pid) && docker-compose down"
    echo ""
}

# Cleanup function
cleanup() {
    print_status "Stopping services..."
    
    # Kill background processes
    if [ -f .auth-service.pid ]; then
        kill $(cat .auth-service.pid) 2>/dev/null
        rm .auth-service.pid
    fi
    
    if [ -f .api-gateway.pid ]; then
        kill $(cat .api-gateway.pid) 2>/dev/null
        rm .api-gateway.pid
    fi
    
    # Stop Docker services
    docker-compose down
    
    print_success "Services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    echo "🏥 Hospital Microservices + Supabase Setup"
    echo "=========================================="
    
    # Load environment variables
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
    else
        print_error ".env file not found. Please copy .env.example to .env and configure it."
        exit 1
    fi
    
    check_supabase_config || exit 1
    install_dependencies
    setup_supabase_tables
    start_infrastructure
    start_services
    health_check
    display_info
    
    # Keep script running
    print_status "Services are running. Press Ctrl+C to stop."
    while true; do
        sleep 1
    done
}

# Run main function
main "$@"
