#!/bin/bash

# Hospital Management Docker Management Script
# Tối ưu hóa việc sử dụng RAM và quản lý services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to check Docker status
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop first."
        exit 1
    fi
    print_status "Docker is running"
}

# Function to show current resource usage
show_resource_usage() {
    print_header "CURRENT RESOURCE USAGE"
    
    echo "Docker containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo -e "\nDocker system info:"
    docker system df
    
    echo -e "\nMemory usage by containers:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
}

# Function to start core services
start_core() {
    print_header "STARTING CORE SERVICES"
    print_status "This mode uses moderate RAM (~2.5GB total) - Recommended for development"
    
    docker-compose --profile core up -d
    
    print_status "Core services started:"
    print_status "- API Gateway (port 3100)"
    print_status "- Auth Service (port 3001)"
    print_status "- Doctor Service (port 3002)"
    print_status "- Patient Service (port 3003)"
    print_status "- Appointment Service (port 3004)"
    print_status "- Redis & RabbitMQ"
}

# Function to start all services
start_full() {
    print_header "STARTING ALL SERVICES"
    print_warning "This mode uses high RAM (~4GB+ total)"

    docker-compose --profile full up -d

    print_status "All services started"
}

# Function to start monitoring stack
start_monitoring() {
    print_header "STARTING MONITORING STACK"
    print_status "Starting Prometheus + Grafana monitoring"

    docker-compose --profile monitoring up -d

    print_status "Monitoring stack started:"
    print_status "- Prometheus (port 9090): http://localhost:9090"
    print_status "- Grafana (port 3001): http://localhost:3001"
    print_status "- Node Exporter (port 9100): http://localhost:9100"
    print_status ""
    print_status "Grafana Login: admin / admin123"
    print_status "Prometheus targets: http://localhost:9090/targets"
}

# Function to stop all services
stop_all() {
    print_header "STOPPING ALL SERVICES"
    
    docker-compose down
    
    print_status "All services stopped"
    print_status "RAM should be freed up now"
}

# Function to clean up Docker resources
cleanup() {
    print_header "CLEANING UP DOCKER RESOURCES"
    
    print_status "Stopping all containers..."
    docker-compose down
    
    print_status "Removing unused containers..."
    docker container prune -f
    
    print_status "Removing unused images..."
    docker image prune -f
    
    print_status "Removing unused volumes..."
    docker volume prune -f
    
    print_status "Removing unused networks..."
    docker network prune -f
    
    print_status "Cleanup completed! RAM usage should be significantly reduced."
}

# Function to restart WSL (to free up VmmemWSL memory)
restart_wsl() {
    print_header "RESTARTING WSL TO FREE MEMORY"
    print_warning "This will stop all Docker containers and restart WSL"
    
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Stopping Docker containers..."
        docker-compose down 2>/dev/null || true
        
        print_status "Shutting down WSL..."
        wsl --shutdown
        
        print_status "WSL restarted. VmmemWSL memory should be freed."
        print_status "You can now restart Docker Desktop and your services."
    else
        print_status "Operation cancelled."
    fi
}

# Function to show help
show_help() {
    print_header "HOSPITAL MANAGEMENT DOCKER HELPER"
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  core          Start core services (~2.5GB RAM) - Recommended"
    echo "  full          Start all services (~4GB+ RAM)"
    echo "  monitoring    Start monitoring stack (Prometheus + Grafana)"
    echo "  stop          Stop all services"
    echo "  status        Show current resource usage"
    echo "  cleanup       Clean up Docker resources to free RAM"
    echo "  restart-wsl   Restart WSL to free VmmemWSL memory"
    echo "  help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 core          # Start core services for development"
    echo "  $0 full          # Start all services for full testing"
    echo "  $0 cleanup       # Free up RAM by cleaning Docker resources"
    echo "  $0 restart-wsl   # Force free VmmemWSL memory"
}

# Main script logic
case "${1:-help}" in
    "core")
        check_docker
        start_core
        ;;
    "full")
        check_docker
        start_full
        ;;
    "monitoring")
        check_docker
        start_monitoring
        ;;
    "stop")
        stop_all
        ;;
    "status")
        check_docker
        show_resource_usage
        ;;
    "cleanup")
        check_docker
        cleanup
        ;;
    "restart-wsl")
        restart_wsl
        ;;
    "help"|*)
        show_help
        ;;
esac
