#!/bin/bash

# LeadVertex Clone Management Script
# Comprehensive management script for development and production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default environment
ENVIRONMENT=${ENVIRONMENT:-development}
COMPOSE_FILE="docker-compose.yml"

if [ "$ENVIRONMENT" = "production" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
fi

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
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Help function
show_help() {
    echo "LeadVertex Clone Management Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start           Start all services"
    echo "  stop            Stop all services"
    echo "  restart         Restart all services"
    echo "  build           Build all Docker images"
    echo "  rebuild         Rebuild and restart all services"
    echo "  logs            Show logs for all services"
    echo "  logs-backend    Show backend logs"
    echo "  logs-frontend   Show frontend logs"
    echo "  logs-celery     Show celery worker logs"
    echo "  shell-backend   Open backend shell"
    echo "  shell-db        Open database shell"
    echo "  init-db         Initialize database with sample data"
    echo "  migrate         Run database migrations"
    echo "  backup-db       Backup database"
    echo "  restore-db      Restore database from backup"
    echo "  test            Run tests"
    echo "  clean           Clean up containers and volumes"
    echo "  status          Show services status"
    echo "  update          Update and restart services"
    echo "  monitor         Open monitoring interfaces"
    echo "  production      Switch to production mode"
    echo "  development     Switch to development mode"
    echo ""
    echo "Environment Variables:"
    echo "  ENVIRONMENT     Set to 'production' for production mode (default: development)"
    echo ""
    echo "Examples:"
    echo "  $0 start                    # Start in development mode"
    echo "  ENVIRONMENT=production $0 start  # Start in production mode"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Check if .env file exists
check_env_file() {
    if [ ! -f .env ] && [ "$ENVIRONMENT" = "production" ]; then
        print_warning ".env file not found. Creating from .env.example..."
        if [ -f .env.example ]; then
            cp .env.example .env
            print_warning "Please edit .env file with your production settings"
        else
            print_error ".env.example file not found"
            exit 1
        fi
    fi
}

# Start services
start_services() {
    print_header "Starting LeadVertex Clone ($ENVIRONMENT mode)"
    check_docker
    check_env_file
    
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose -f $COMPOSE_FILE up -d --remove-orphans
    else
        docker-compose -f $COMPOSE_FILE up -d
    fi
    
    print_status "Services started successfully!"
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Initialize database if needed
    if ! docker-compose -f $COMPOSE_FILE exec backend python -c "from app.models.user import User; from app.core.database import SessionLocal; db = SessionLocal(); print(db.query(User).first())" 2>/dev/null; then
        print_status "Initializing database..."
        init_database
    fi
    
    show_access_info
}

# Stop services
stop_services() {
    print_header "Stopping LeadVertex Clone"
    docker-compose -f $COMPOSE_FILE down
    print_status "Services stopped successfully!"
}

# Restart services
restart_services() {
    print_header "Restarting LeadVertex Clone"
    stop_services
    start_services
}

# Build images
build_images() {
    print_header "Building Docker Images"
    docker-compose -f $COMPOSE_FILE build --no-cache
    print_status "Images built successfully!"
}

# Rebuild and restart
rebuild_services() {
    print_header "Rebuilding and Restarting Services"
    build_images
    restart_services
}

# Show logs
show_logs() {
    if [ -n "$2" ]; then
        docker-compose -f $COMPOSE_FILE logs -f "$2"
    else
        docker-compose -f $COMPOSE_FILE logs -f
    fi
}

# Backend shell
backend_shell() {
    print_status "Opening backend shell..."
    docker-compose -f $COMPOSE_FILE exec backend bash
}

# Database shell
database_shell() {
    print_status "Opening database shell..."
    docker-compose -f $COMPOSE_FILE exec postgres psql -U leadvertex -d leadvertex
}

# Initialize database
init_database() {
    print_header "Initializing Database"
    
    # Run migrations
    print_status "Running database migrations..."
    docker-compose -f $COMPOSE_FILE exec backend alembic upgrade head || true
    
    # Create initial data
    print_status "Creating initial data..."
    docker-compose -f $COMPOSE_FILE exec backend python app/scripts/init_data.py
    
    print_status "Database initialized successfully!"
}

# Run migrations
run_migrations() {
    print_header "Running Database Migrations"
    docker-compose -f $COMPOSE_FILE exec backend alembic upgrade head
    print_status "Migrations completed successfully!"
}

# Backup database
backup_database() {
    print_header "Backing Up Database"
    
    mkdir -p backups
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    docker-compose -f $COMPOSE_FILE exec -T postgres pg_dump -U leadvertex leadvertex > "backups/$BACKUP_FILE"
    
    print_status "Database backed up to: backups/$BACKUP_FILE"
}

# Restore database
restore_database() {
    if [ -z "$2" ]; then
        print_error "Please specify backup file: $0 restore-db <backup_file>"
        exit 1
    fi
    
    print_header "Restoring Database"
    print_warning "This will overwrite the current database!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose -f $COMPOSE_FILE exec -T postgres psql -U leadvertex -d leadvertex < "$2"
        print_status "Database restored successfully!"
    else
        print_status "Database restore cancelled."
    fi
}

# Run tests
run_tests() {
    print_header "Running Tests"
    docker-compose -f $COMPOSE_FILE exec backend python -m pytest tests/ -v
}

# Clean up
cleanup() {
    print_header "Cleaning Up"
    print_warning "This will remove all containers, volumes, and images!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose -f $COMPOSE_FILE down -v --rmi all
        docker system prune -f
        print_status "Cleanup completed!"
    else
        print_status "Cleanup cancelled."
    fi
}

# Show status
show_status() {
    print_header "Services Status"
    docker-compose -f $COMPOSE_FILE ps
    
    print_header "System Resources"
    docker system df
}

# Update services
update_services() {
    print_header "Updating Services"
    
    # Pull latest images
    docker-compose -f $COMPOSE_FILE pull
    
    # Rebuild and restart
    rebuild_services
    
    print_status "Services updated successfully!"
}

# Show monitoring interfaces
show_monitoring() {
    print_header "Monitoring Interfaces"
    
    echo "Available monitoring interfaces:"
    echo ""
    echo "🌐 Application:        http://localhost:3000"
    echo "📊 API Documentation: http://localhost:8000/api/docs"
    echo "🌺 Flower (Celery):   http://localhost:5555"
    echo "💾 Database:          localhost:5432"
    echo "🔴 Redis:             localhost:6379"
    echo ""
    
    if command -v open >/dev/null; then
        echo "Opening interfaces..."
        open http://localhost:3000
        open http://localhost:8000/api/docs
        open http://localhost:5555
    fi
}

# Switch to production mode
switch_to_production() {
    print_header "Switching to Production Mode"
    export ENVIRONMENT=production
    COMPOSE_FILE="docker-compose.prod.yml"
    
    # Start with production profile
    docker-compose -f $COMPOSE_FILE --profile production up -d
    
    print_status "Switched to production mode!"
    show_access_info
}

# Switch to development mode
switch_to_development() {
    print_header "Switching to Development Mode"
    export ENVIRONMENT=development
    COMPOSE_FILE="docker-compose.yml"
    
    restart_services
    print_status "Switched to development mode!"
}

# Show access information
show_access_info() {
    print_header "Access Information"
    
    echo "🚀 LeadVertex Clone is running!"
    echo ""
    echo "🌐 Frontend:           http://localhost:3000"
    echo "🔧 Backend API:        http://localhost:8000"
    echo "📚 API Docs:           http://localhost:8000/api/docs"
    echo "🌺 Celery Monitor:     http://localhost:5555"
    echo ""
    echo "👤 Demo Accounts:"
    echo "   Admin:     admin@leadvertex.ru / admin123"
    echo "   Operator:  operator@leadvertex.ru / operator123"
    echo ""
    echo "💡 Management Commands:"
    echo "   View logs:    $0 logs"
    echo "   Stop:         $0 stop"
    echo "   Restart:      $0 restart"
    echo ""
}

# Create necessary directories
create_directories() {
    mkdir -p backups
    mkdir -p logs
}

# Main command handler
main() {
    create_directories
    
    case "${1:-help}" in
        "start")
            start_services
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            restart_services
            ;;
        "build")
            build_images
            ;;
        "rebuild")
            rebuild_services
            ;;
        "logs")
            show_logs "$@"
            ;;
        "logs-backend")
            show_logs "$1" "backend"
            ;;
        "logs-frontend") 
            show_logs "$1" "frontend"
            ;;
        "logs-celery")
            show_logs "$1" "celery-worker"
            ;;
        "shell-backend")
            backend_shell
            ;;
        "shell-db")
            database_shell
            ;;
        "init-db")
            init_database
            ;;
        "migrate")
            run_migrations
            ;;
        "backup-db")
            backup_database
            ;;
        "restore-db")
            restore_database "$@"
            ;;
        "test")
            run_tests
            ;;
        "clean")
            cleanup
            ;;
        "status")
            show_status
            ;;
        "update")
            update_services
            ;;
        "monitor")
            show_monitoring
            ;;
        "production")
            switch_to_production
            ;;
        "development")
            switch_to_development
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"