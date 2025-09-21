#!/bin/bash

# Deployment script for evento application
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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
    
    print_status "Docker and Docker Compose are installed."
}

# Check if .env file exists
check_env() {
    if [ ! -f .env ]; then
        print_error ".env file not found. Please copy env.example to .env and configure it."
        exit 1
    fi
    print_status ".env file found."
}

# Build and start services
deploy() {
    local environment=${1:-development}
    
    print_status "Starting deployment for $environment environment..."
    
    if [ "$environment" = "production" ]; then
        print_status "Building and starting production services..."
        docker-compose -f docker-compose.prod.yml up --build -d
    else
        print_status "Building and starting development services..."
        docker-compose up --build -d
    fi
    
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_status "Services are running successfully!"
        print_status "Main app: http://localhost:3000"
        print_status "Portal app: http://localhost:3001"
        print_status "Nginx: http://localhost:80"
    else
        print_error "Some services failed to start. Check logs with: docker-compose logs"
        exit 1
    fi
}

# Stop services
stop() {
    print_status "Stopping all services..."
    docker-compose down
    print_status "Services stopped."
}

# Show logs
logs() {
    local service=${1:-}
    if [ -n "$service" ]; then
        docker-compose logs -f "$service"
    else
        docker-compose logs -f
    fi
}

# Show status
status() {
    print_status "Service status:"
    docker-compose ps
}

# Clean up
cleanup() {
    print_warning "This will remove all containers, networks, and volumes. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Cleaning up..."
        docker-compose down -v --remove-orphans
        docker system prune -f
        print_status "Cleanup completed."
    else
        print_status "Cleanup cancelled."
    fi
}

# Main script logic
case "${1:-deploy}" in
    "deploy")
        check_docker
        check_env
        deploy "${2:-development}"
        ;;
    "stop")
        stop
        ;;
    "logs")
        logs "$2"
        ;;
    "status")
        status
        ;;
    "cleanup")
        cleanup
        ;;
    "restart")
        stop
        sleep 2
        check_docker
        check_env
        deploy "${2:-development}"
        ;;
    *)
        echo "Usage: $0 {deploy|stop|logs|status|cleanup|restart} [environment]"
        echo ""
        echo "Commands:"
        echo "  deploy   - Deploy the application (default: development)"
        echo "  stop     - Stop all services"
        echo "  logs     - Show logs (optionally for specific service)"
        echo "  status   - Show service status"
        echo "  cleanup  - Remove all containers and volumes"
        echo "  restart  - Restart all services"
        echo ""
        echo "Environments:"
        echo "  development - Use docker-compose.yml (default)"
        echo "  production  - Use docker-compose.prod.yml"
        echo ""
        echo "Examples:"
        echo "  $0 deploy production"
        echo "  $0 logs evento"
        echo "  $0 restart development"
        exit 1
        ;;
esac

