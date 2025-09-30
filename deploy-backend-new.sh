#!/bin/bash

# Скрипт для развертывания Backend на сервере 157.230.27.200
# Автор: MiniMax Agent

set -e  # Останавливать выполнение при ошибке

echo "🚀 Начинаем развертывание Backend на сервере 157.230.27.200"

# Проверяем что мы в правильной директории
if [ ! -f "docker-compose.backend.yml" ]; then
    echo "❌ Ошибка: docker-compose.backend.yml не найден"
    echo "Убедитесь что вы в директории /opt/leadvertex-clone"
    exit 1
fi

echo "📋 Шаг 1: Создание .env файла..."
cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=postgresql+asyncpg://leadvertex:Vf9pXy7Kz@3mQw2h@postgres/leadvertex
DATABASE_URL_SYNC=postgresql://leadvertex:Vf9pXy7Kz@3mQw2h@postgres/leadvertex
POSTGRES_PASSWORD=Vf9pXy7Kz@3mQw2h

# Redis Configuration  
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2

# Security Configuration
SECRET_KEY=9bF7kP0rLmQ8dT6zXaC4nE1jGyHvW5sK
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Application Settings
DEBUG=false
TESTING=false
PROJECT_NAME=LeadVertex Clone
PROJECT_VERSION=1.0.0

# File Upload Settings
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# Beget API Configuration
BEGET_LOGIN=aex020w5
BEGET_PASSWORD=46B*bRc4JATXztr
MAIN_DOMAIN=moonline.pw

# Server Configuration
FRONTEND_SERVER_IP=164.90.219.122
BACKEND_SERVER_IP=157.230.27.200
FRONTEND_DOMAIN=https://moonline.pw,https://*.moonline.pw
BACKEND_URL=https://api.moonline.pw

# CORS Settings
CORS_ORIGINS=["https://moonline.pw","https://www.moonline.pw","https://*.moonline.pw","http://164.90.219.122","https://164.90.219.122"]

# Flower Monitoring
FLOWER_PASSWORD=admin123
EOF

echo "✅ .env файл создан"

echo "🔐 Шаг 2: Создание SSL сертификатов..."
cd docker/ssl

# Создаем SSL сертификаты (самоподписанные)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout api.moonline.pw.key \
    -out api.moonline.pw.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=api.moonline.pw" 2>/dev/null

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout moonline.pw.key \
    -out moonline.pw.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=moonline.pw" 2>/dev/null

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout wildcard.moonline.pw.key \
    -out wildcard.moonline.pw.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=*.moonline.pw" 2>/dev/null

# Устанавливаем права
chmod 644 *.crt
chmod 600 *.key

echo "✅ SSL сертификаты созданы"

# Возвращаемся в корень проекта
cd ../..

echo "🐳 Шаг 3: Остановка старых контейнеров..."
docker-compose -f docker-compose.backend.yml down || true

echo "📦 Шаг 4: Запуск базы данных и Redis..."
docker-compose -f docker-compose.backend.yml up -d postgres redis

echo "⏳ Ожидание инициализации PostgreSQL (30 секунд)..."
sleep 30

echo "📦 Шаг 5: Запуск основных сервисов..."
docker-compose -f docker-compose.backend.yml up -d backend celery-worker celery-beat

echo "⏳ Ожидание запуска backend (20 секунд)..."
sleep 20

echo "📦 Шаг 6: Запуск Nginx..."
docker-compose -f docker-compose.backend.yml up -d nginx-api

echo "📊 Шаг 7: Проверка статуса всех сервисов..."
docker-compose -f docker-compose.backend.yml ps

echo ""
echo "🔍 Тестирование сервисов..."

# Проверяем API
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend API работает"
else
    echo "❌ Backend API не отвечает"
fi

# Проверяем Nginx
if curl -k https://localhost/health > /dev/null 2>&1; then
    echo "✅ Nginx работает"
else
    echo "❌ Nginx не отвечает"
fi

echo ""
echo "🎉 Развертывание Backend завершено!"
echo ""
echo "📊 Полезные команды:"
echo "docker-compose -f docker-compose.backend.yml ps      # Статус сервисов"
echo "docker-compose -f docker-compose.backend.yml logs -f # Просмотр логов"
echo "curl http://localhost:8000/health                    # Тест API"
echo "curl -k https://localhost/health                     # Тест Nginx"
echo ""
echo "🌐 API доступен на:"
echo "- http://157.230.27.200:8000/docs (Swagger)"
echo "- http://157.230.27.200:8000/health (Health check)"