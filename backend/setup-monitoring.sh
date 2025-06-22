#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================"
echo -e "   HOSPITAL MONITORING SETUP"
echo -e "========================================${NC}"
echo

echo -e "${GREEN}[INFO]${NC} Installing monitoring dependencies..."

echo -e "${GREEN}[INFO]${NC} Installing prom-client in root package..."
npm install prom-client@^15.1.0

echo -e "${GREEN}[INFO]${NC} Installing prom-client in shared package..."
cd shared
npm install prom-client@^15.1.0

echo -e "${GREEN}[INFO]${NC} Building shared package..."
npm run build

echo -e "${GREEN}[INFO]${NC} Installing dependencies in API Gateway..."
cd ../api-gateway
npm install

echo -e "${GREEN}[INFO]${NC} Installing dependencies in Auth Service..."
cd ../services/auth-service
npm install

echo -e "${GREEN}[INFO]${NC} Building services..."
cd ../..
npm run build:gateway
npm run build:auth

echo
echo -e "${GREEN}[SUCCESS]${NC} Monitoring setup completed!"
echo
echo "Next steps:"
echo "1. Start monitoring stack: ./docker-management.sh monitoring"
echo "2. Start core services: ./docker-management.sh core"
echo "3. Access Grafana: http://localhost:3001 (admin/admin123)"
echo "4. Access Prometheus: http://localhost:9090"
echo
