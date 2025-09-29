#!/bin/bash
# Скрипт развертывания на Backend сервере

echo "🚀 Начинаем развертывание Backend сервера..."

# 1. Подготовка окружения
echo "📝 Создаем .env файл..."
cat > .env << EOF
# Database
POSTGRES_PASSWORD=Vf9pXy7Kz@3mQw2h
SECRET_KEY=9bF7kP0rLmQ8dT6zXaC4nE1jGyHvW5sK

# Frontend domain (для CORS)
FRONTEND_DOMAIN=https://moonline.pw,https://*.moonline.pw

# Backend URL
BACKEND_URL=https://api.moonline.pw

# Flower monitoring
FLOWER_PASSWORD=admin123

# Debug mode (false для production)
DEBUG=false

# Beget API Configuration
BEGET_LOGIN=aex020w5
BEGET_PASSWORD=46B*bRc4JATXztr
MAIN_DOMAIN=moonline.pw

# Server Configuration
FRONTEND_SERVER_IP=206.189.60.238
BACKEND_SERVER_IP=64.225.109.252
EOF

# 2. Создаем директории
mkdir -p logs
mkdir -p ssl
mkdir -p nginx

# 3. Копируем обновленный main.py
echo "📁 Обновляем backend код..."
cp deploy/backend_main_updated.py backend/app/main.py

# 4. Копируем nginx конфигурацию
cp deploy/nginx/backend-nginx.conf nginx/

# 5. Запускаем контейнеры
echo "🐳 Запускаем Docker контейнеры..."
docker-compose -f deploy/backend-server.yml up -d

# 6. Ждем запуска сервисов
echo "⏳ Ожидаем запуска сервисов..."
sleep 30

# 7. Проверяем статус
echo "✅ Проверяем статус сервисов..."
docker-compose -f deploy/backend-server.yml ps

# 8. Тестируем API
echo "🧪 Тестируем API..."
curl -f http://localhost:8000/health || echo "❌ API не отвечает"

echo "✅ Backend сервер развернут!"
echo "📋 Следующие шаги:"
echo "   1. Настройте SSL сертификаты в ./ssl/"
echo "   2. Обновите домен в nginx/backend-nginx.conf"
echo "   3. Настройте DNS: api.moonline.pw -> IP этого сервера"
echo "   4. Перезапустите nginx: docker-compose -f deploy/backend-server.yml restart nginx"