#!/bin/bash

# Скрипт для развертывания Frontend на сервере 139.59.158.109
# Автор: MiniMax Agent

set -e  # Останавливать выполнение при ошибке

echo "🚀 Начинаем развертывание Frontend на сервере 139.59.158.109"

# Проверяем что мы в правильной директории
if [ ! -d "frontend" ]; then
    echo "❌ Ошибка: директория frontend не найдена"
    echo "Убедитесь что вы в директории /opt/leadvertex-clone"
    exit 1
fi

echo "📋 Шаг 1: Создание .env файла для фронтенда..."
cat > .env << 'EOF'
# Backend Configuration
REACT_APP_API_URL=https://159.89.108.100:8000
BACKEND_URL=https://159.89.108.100:8000

# Server Configuration
FRONTEND_SERVER_IP=139.59.158.109
BACKEND_SERVER_IP=159.89.108.100

# Domain Configuration
MAIN_DOMAIN=moonline.pw
WILDCARD_DOMAIN=*.moonline.pw

# Build Configuration
NODE_ENV=production
GENERATE_SOURCEMAP=false
EOF

echo "✅ .env файл создан"

echo "📋 Шаг 2: Создание .env файла для frontend сборки..."
cat > frontend/.env << 'EOF'
REACT_APP_API_URL=https://159.89.108.100:8000
GENERATE_SOURCEMAP=false
EOF

echo "✅ Frontend .env файл создан"

echo "🔐 Шаг 3: Создание SSL сертификатов..."
cd docker/ssl

# Создаем SSL сертификаты для фронтенда
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

# Возвращаемся в корень
cd ../..

echo "📝 Шаг 4: Создание Docker Compose для Frontend..."
cat > docker-compose.frontend.yml << 'EOF'
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: leadvertex-frontend
    environment:
      - REACT_APP_API_URL=https://159.89.108.100:8000
    volumes:
      - frontend_build:/app/build
    depends_on:
      - nginx-frontend

  nginx-frontend:
    image: nginx:alpine
    container_name: leadvertex-nginx-frontend
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/frontend.conf:/etc/nginx/conf.d/default.conf
      - ./docker/ssl:/etc/nginx/ssl:ro
      - frontend_build:/usr/share/nginx/html:ro
    restart: unless-stopped

volumes:
  frontend_build:
EOF

echo "✅ docker-compose.frontend.yml создан"

echo "📝 Шаг 5: Создание Nginx конфигурации для Frontend..."
mkdir -p docker/nginx

cat > docker/nginx/frontend.conf << 'EOF'
# Upstream backend API
upstream backend_api {
    server 159.89.108.100:8000;
    keepalive 32;
}

# Main frontend server
server {
    listen 80;
    listen 443 ssl http2;
    server_name moonline.pw www.moonline.pw 139.59.158.109;

    # SSL configuration
    ssl_certificate /etc/nginx/ssl/moonline.pw.crt;
    ssl_certificate_key /etc/nginx/ssl/moonline.pw.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;

    # Frontend static files
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    }

    # Proxy API requests to backend server
    location /api/ {
        proxy_pass http://backend_api/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "https://moonline.pw" always;
        add_header Access-Control-Allow-Credentials true always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check
    location /health {
        access_log off;
        return 200 'Frontend OK';
        add_header Content-Type text/plain;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /usr/share/nginx/html;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options nosniff always;
    }
}

# Subdomain support (*.moonline.pw)
server {
    listen 80;
    listen 443 ssl http2;
    server_name *.moonline.pw;

    # Wildcard SSL certificate
    ssl_certificate /etc/nginx/ssl/wildcard.moonline.pw.crt;
    ssl_certificate_key /etc/nginx/ssl/wildcard.moonline.pw.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;

    # Extract subdomain
    set $subdomain "";
    if ($host ~* "^(.+)\.moonline\.pw$") {
        set $subdomain $1;
    }

    # Frontend for subdomains
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
        
        # Project-specific headers
        add_header X-Project-Subdomain $subdomain always;
        add_header X-Project-Type "project" always;
        add_header X-Frame-Options SAMEORIGIN always;
        add_header X-Content-Type-Options nosniff always;
    }

    # API proxy with subdomain context
    location /api/ {
        proxy_pass http://backend_api/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Project-Domain $host;
        proxy_set_header X-Project-Subdomain $subdomain;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Redirect admin access to main domain
    location /admin {
        return 301 https://moonline.pw$request_uri;
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name moonline.pw www.moonline.pw *.moonline.pw 139.59.158.109;
    return 301 https://$server_name$request_uri;
}
EOF

echo "✅ Nginx конфигурация создана"

echo "🐳 Шаг 6: Остановка старых контейнеров..."
docker-compose -f docker-compose.frontend.yml down || true

echo "📦 Шаг 7: Сборка и запуск фронтенда..."
docker-compose -f docker-compose.frontend.yml up --build -d

echo "⏳ Ожидание запуска фронтенда (30 секунд)..."
sleep 30

echo "📊 Шаг 8: Проверка статуса сервисов..."
docker-compose -f docker-compose.frontend.yml ps

echo ""
echo "🔍 Тестирование сервисов..."

# Проверяем фронтенд
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Frontend работает"
else
    echo "❌ Frontend не отвечает"
fi

# Проверяем HTTPS
if curl -k https://localhost/health > /dev/null 2>&1; then
    echo "✅ Frontend HTTPS работает"
else
    echo "❌ Frontend HTTPS не отвечает"
fi

# Проверяем проксирование API
if curl -k https://localhost/api/health > /dev/null 2>&1; then
    echo "✅ API проксирование работает"
else
    echo "⚠️  API проксирование не отвечает (возможно backend не запущен)"
fi

echo ""
echo "🎉 Развертывание Frontend завершено!"
echo ""
echo "📊 Полезные команды:"
echo "docker-compose -f docker-compose.frontend.yml ps      # Статус сервисов"
echo "docker-compose -f docker-compose.frontend.yml logs -f # Просмотр логов"
echo "curl http://localhost/health                          # Тест Frontend"
echo "curl -k https://localhost/api/health                  # Тест API proxy"
echo ""
echo "🌐 Frontend доступен на:"
echo "- http://139.59.158.109/ (HTTP)"
echo "- https://139.59.158.109/ (HTTPS)"
echo "- https://moonline.pw/ (после настройки DNS)"