#!/bin/bash

# Auth Service Test Setup Script
# This script builds and tests the Auth Service

set -e  # Exit on any error

echo "🚀 Auth Service Test Setup"
echo "=========================="

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

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the auth-service directory."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found. Please create it with Supabase configuration."
    exit 1
fi

print_status "Checking environment variables..."
if grep -q "SUPABASE_URL=" .env && grep -q "SUPABASE_SERVICE_ROLE_KEY=" .env && grep -q "SUPABASE_ANON_KEY=" .env; then
    print_success "Environment variables configured"
else
    print_error "Missing required environment variables in .env file"
    print_warning "Required variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY"
    exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_success "Dependencies installed"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Build the project
print_status "Building TypeScript project..."
npm run build
if [ $? -eq 0 ]; then
    print_success "Build completed"
else
    print_error "Build failed"
    exit 1
fi

# Check if service is already running
print_status "Checking if service is already running..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    print_warning "Service is already running on port 3001"
    print_status "Stopping existing service..."
    pkill -f "node.*auth-service" || true
    sleep 2
fi

# Start the service in background
print_status "Starting Auth Service..."
npm start &
SERVICE_PID=$!

# Wait for service to start
print_status "Waiting for service to start..."
for i in {1..30}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        print_success "Service started successfully"
        break
    fi
    if [ $i -eq 30 ]; then
        print_error "Service failed to start within 30 seconds"
        kill $SERVICE_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

# Run tests
print_status "Running tests..."
if command -v node > /dev/null 2>&1; then
    node test-auth-service.js
    TEST_RESULT=$?
else
    print_error "Node.js not found"
    TEST_RESULT=1
fi

# Cleanup
print_status "Stopping service..."
kill $SERVICE_PID 2>/dev/null || true

# Final result
if [ $TEST_RESULT -eq 0 ]; then
    print_success "All tests passed! Auth Service is working correctly."
    echo ""
    echo "🎉 Auth Service is ready for use!"
    echo ""
    echo "To start the service manually:"
    echo "  npm run dev    # Development mode"
    echo "  npm start      # Production mode"
    echo ""
    echo "Service endpoints:"
    echo "  Health Check: http://localhost:3001/health"
    echo "  API Docs:     http://localhost:3001/docs"
    echo "  Auth API:     http://localhost:3001/api/auth"
else
    print_error "Tests failed. Please check the output above."
    exit 1
fi
