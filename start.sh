#!/bin/bash

# LeadVertex Clone - Quick Start Script
# This script helps you get the application running quickly

set -e

echo "🚀 LeadVertex Clone - Quick Start"
echo "=================================="

# Check requirements
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Please install Docker first."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required but not installed. Please install Docker Compose first."; exit 1; }

echo "✅ Requirements check passed"

# Create environment files if they don't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend environment file..."
    cp backend/.env.example backend/.env
fi

if [ ! -f frontend/.env ]; then
    echo "📝 Creating frontend environment file..."
    cp frontend/.env.example frontend/.env
fi

echo "🐳 Starting services with Docker Compose..."
docker-compose up -d

echo "⏳ Waiting for services to start (this may take a few minutes)..."
sleep 30

# Check if backend is ready
echo "🔍 Checking backend health..."
for i in {1..30}; do
    if curl -s http://localhost:8000/health >/dev/null 2>&1; then
        echo "✅ Backend is ready!"
        break
    fi
    echo "⏳ Waiting for backend... ($i/30)"
    sleep 10
done

# Initialize database with demo data
echo "📊 Creating initial demo data..."
docker-compose exec -T backend python app/scripts/init_data.py

echo ""
echo "🎉 LeadVertex Clone is ready!"
echo "================================"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend:    http://localhost:3000"
echo "   API Docs:    http://localhost:8000/api/docs"
echo "   Flower:      http://localhost:5555"
echo ""
echo "👤 Demo Accounts:"
echo "   Admin:       admin@leadvertex.ru / admin123"
echo "   Operator:    operator@leadvertex.ru / operator123"
echo ""
echo "🔧 Management Commands:"
echo "   View logs:   docker-compose logs -f"
echo "   Stop:        docker-compose down"
echo "   Restart:     docker-compose restart"
echo ""
echo "📚 For more information, see README.md"