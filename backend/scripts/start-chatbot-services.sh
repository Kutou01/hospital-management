#!/bin/bash

# Start Chatbot Services
echo "🤖 Starting Hospital Management Chatbot Services..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Start chatbot services only
echo "📋 Starting chatbot consultation and booking services..."
docker-compose --profile chatbot up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Health checks
echo "🔍 Checking service health..."

# Check consultation service
if curl -f http://localhost:3020/health > /dev/null 2>&1; then
    echo "✅ Chatbot Consultation Service: HEALTHY"
else
    echo "❌ Chatbot Consultation Service: UNHEALTHY"
fi

# Check booking service
if curl -f http://localhost:3015/health > /dev/null 2>&1; then
    echo "✅ Chatbot Booking Service: HEALTHY"
else
    echo "❌ Chatbot Booking Service: UNHEALTHY"
fi

echo "🎉 Chatbot services startup complete!"
echo "📊 View logs: docker-compose logs -f chatbot-consultation-service chatbot-booking-service"
echo "🛑 Stop services: docker-compose --profile chatbot down"
