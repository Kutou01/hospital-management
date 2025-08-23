#!/bin/bash

# Script để chạy Playwright auth test
# Run this script to test auth flow end-to-end

echo "🎭 Playwright Auth Test Runner"
echo "=============================="

# Check if required dependencies are installed
echo "📦 Checking dependencies..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install Playwright if not already installed
if ! npm list playwright &> /dev/null; then
    echo "📥 Installing Playwright..."
    npm install playwright
    echo "🔽 Installing browser binaries..."
    npx playwright install chromium
fi

# Check if frontend is running
echo "🌐 Checking if frontend is running..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is running on port 3000"
    FRONTEND_RUNNING=true
else
    echo "❌ Frontend is not running on port 3000"
    FRONTEND_RUNNING=false
fi

# Check if auth service is running
echo "🔐 Checking if auth service is running..."
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Auth service is running on port 3001"
    AUTH_RUNNING=true
else
    echo "❌ Auth service is not running on port 3001"
    AUTH_RUNNING=false
fi

# Recommendations if services not running
if [ "$FRONTEND_RUNNING" = false ] || [ "$AUTH_RUNNING" = false ]; then
    echo ""
    echo "⚠️  Some services are not running. Please start them:"
    echo ""
    
    if [ "$FRONTEND_RUNNING" = false ]; then
        echo "📱 Frontend:"
        echo "   cd frontend && npm run dev"
    fi
    
    if [ "$AUTH_RUNNING" = false ]; then
        echo "🔐 Auth Service:"
        echo "   cd backend/services/auth-service && npm run dev"
        echo "   # OR"
        echo "   docker-compose up auth-service"
    fi
    
    echo ""
    echo "After starting services, run this script again."
    exit 1
fi

echo ""
echo "🚀 All services are running! Starting Playwright tests..."
echo ""

# Set environment variables
export FRONTEND_URL="http://localhost:3000"
export AUTH_SERVICE_URL="http://localhost:3001"
export HEADLESS="false"  # Set to true for headless mode

# Run the test
node test-auth-with-playwright.js

echo ""
echo "🎭 Playwright test completed!"
echo ""
echo "💡 Tips:"
echo "   - Set HEADLESS=true to run in headless mode"
echo "   - Modify test-auth-with-playwright.js to customize test scenarios"
echo "   - Check browser console for additional debugging info"
