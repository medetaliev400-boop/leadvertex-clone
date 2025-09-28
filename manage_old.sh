#!/bin/bash

# LeadVertex Clone - Management Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

show_help() {
    echo "LeadVertex Clone - Management Script"
    echo "=================================="
    echo ""
    echo "Usage: ./manage.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start       Start all services"
    echo "  stop        Stop all services"  
    echo "  restart     Restart all services"
    echo "  logs        Show logs (add service name to filter)"
    echo "  status      Show services status"
    echo "  shell       Open backend shell"
    echo "  init-data   Initialize demo data"
    echo "  backup      Backup database"
    echo "  restore     Restore database"
    echo "  update      Update and rebuild services"
    echo "  clean       Clean up containers and volumes"
    echo ""
    echo "Examples:"
    echo "  ./manage.sh start"
    echo "  ./manage.sh logs backend"
    echo "  ./manage.sh shell"
}

case "${1:-help}" in
    start)
        echo "🚀 Starting LeadVertex Clone..."
        docker-compose up -d
        echo "✅ Services started! Frontend: http://localhost:3000"
        ;;
    
    stop)
        echo "🛑 Stopping services..."
        docker-compose down
        echo "✅ Services stopped"
        ;;
    
    restart)
        echo "🔄 Restarting services..."
        docker-compose restart
        echo "✅ Services restarted"
        ;;
    
    logs)
        if [ -n "$2" ]; then
            docker-compose logs -f "$2"
        else
            docker-compose logs -f
        fi
        ;;
    
    status)
        echo "📊 Services Status:"
        docker-compose ps
        ;;
    
    shell)
        echo "🐚 Opening backend shell..."
        docker-compose exec backend bash
        ;;
    
    init-data)
        echo "📊 Initializing demo data..."
        docker-compose exec backend python app/scripts/init_data.py
        echo "✅ Demo data created"
        ;;
    
    backup)
        echo "💾 Creating database backup..."
        mkdir -p backups
        docker-compose exec postgres pg_dump -U leadvertex leadvertex > "backups/backup_$(date +%Y%m%d_%H%M%S).sql"
        echo "✅ Backup created in backups/ directory"
        ;;
    
    restore)
        if [ -z "$2" ]; then
            echo "❌ Please specify backup file: ./manage.sh restore backup_file.sql"
            exit 1
        fi
        echo "🔄 Restoring database from $2..."
        docker-compose exec -T postgres psql -U leadvertex -d leadvertex < "$2"
        echo "✅ Database restored"
        ;;
    
    update)
        echo "🔄 Updating and rebuilding services..."
        docker-compose down
        docker-compose build --no-cache
        docker-compose up -d
        echo "✅ Services updated and restarted"
        ;;
    
    clean)
        echo "🧹 Cleaning up containers and volumes..."
        read -p "This will remove all containers and volumes. Are you sure? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose down -v
            docker system prune -f
            echo "✅ Cleanup completed"
        else
            echo "❌ Cleanup cancelled"
        fi
        ;;
    
    help|*)
        show_help
        ;;
esac