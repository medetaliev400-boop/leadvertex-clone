# 🚀 Полное руководство по развертыванию LeadVertex Clone

## 📋 Архитектура системы

**Frontend сервер**: `139.59.158.109`
- React приложение
- Nginx (статика + reverse proxy)
- SSL сертификаты
- Порты: 80, 443

**Backend сервер**: `159.89.108.100`
- FastAPI приложение (порт 8000)
- PostgreSQL 15 база данных (порт 5432)
- Redis кеш (порт 6379)
- Celery workers + beat
- Nginx API gateway
- SSL сертификаты

---

## 🔧 Шаг 1: Подготовка серверов

### 1.1. Подготовка Backend сервера (159.89.108.100)

```bash
# Подключаемся к backend серверу
ssh root@159.89.108.100

# Обновляем систему
apt update && apt upgrade -y

# Устанавливаем Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Устанавливаем Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Проверяем установку
docker --version
docker-compose --version

# Устанавливаем утилиты
apt install -y git curl htop nano jq ufw

# Настраиваем firewall
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 8000/tcp  # FastAPI (для отладки)
ufw --force enable

# Создаем рабочую директорию
mkdir -p /opt
cd /opt
```

### 1.2. Подготовка Frontend сервера (139.59.158.109)

```bash
# Подключаемся к frontend серверу
ssh root@139.59.158.109

# Обновляем систему
apt update && apt upgrade -y

# Устанавливаем Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Устанавливаем Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Устанавливаем Node.js (для сборки)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Проверяем установку
docker --version
docker-compose --version
node --version
npm --version

# Устанавливаем утилиты
apt install -y git curl htop nano jq ufw

# Настраиваем firewall
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable

# Создаем рабочую директорию
mkdir -p /opt
cd /opt
```

---

## 📦 Шаг 2: Клонирование проекта

### 2.1. На ОБОИХ серверах выполните:

```bash
# Клонируем репозиторий
cd /opt
git clone https://github.com/medetaliev400-boop/leadvertex-clone.git
cd leadvertex-clone

# Проверяем актуальную версию
git log --oneline -n 3
git status
```

---

## 🗄️ Шаг 3: Развертывание Backend сервера (159.89.108.100)

### 3.1. Создание .env файла

```bash
# На backend сервере
cd /opt/leadvertex-clone

# Создаем .env файл
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
FRONTEND_SERVER_IP=139.59.158.109
BACKEND_SERVER_IP=159.89.108.100
FRONTEND_DOMAIN=https://moonline.pw,https://*.moonline.pw
BACKEND_URL=https://api.moonline.pw

# CORS Settings
CORS_ORIGINS=["https://moonline.pw","https://www.moonline.pw","https://*.moonline.pw","http://139.59.158.109","https://139.59.158.109"]

# Flower Monitoring
FLOWER_PASSWORD=admin123
EOF

# Проверяем создание файла
cat .env
```

### 3.2. Создание SSL сертификатов

```bash
# Переходим в директорию SSL
cd /opt/leadvertex-clone/docker/ssl

# Создаем SSL сертификаты вручную (самоподписанные для начала)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout api.moonline.pw.key \
    -out api.moonline.pw.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=api.moonline.pw"

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout moonline.pw.key \
    -out moonline.pw.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=moonline.pw"

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout wildcard.moonline.pw.key \
    -out wildcard.moonline.pw.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=*.moonline.pw"

# Устанавливаем правильные права
chmod 644 *.crt
chmod 600 *.key

# Проверяем файлы
ls -la *.crt *.key

# Возвращаемся в корень проекта
cd /opt/leadvertex-clone
```

### 3.3. Обновление конфигураций

```bash
# Обновляем nginx конфигурацию для нового backend IP
sed -i 's/68\.183\.209\.116/159.89.108.100/g' docker/nginx/conf.d/default.conf

# Обновляем docker-compose для нового backend IP
sed -i 's/68\.183\.209\.116/159.89.108.100/g' docker-compose.backend.yml

# Проверяем изменения
grep "159.89.108.100" docker/nginx/conf.d/default.conf docker-compose.backend.yml
```

### 3.4. Запуск Backend системы

```bash
# Запускаем базы данных
docker-compose -f docker-compose.backend.yml up -d postgres redis

# Ждем инициализации БД (важно!)
echo "Ожидание инициализации PostgreSQL..."
sleep 30

# Проверяем статус БД
docker-compose -f docker-compose.backend.yml logs postgres

# Запускаем основные сервисы
docker-compose -f docker-compose.backend.yml up -d backend celery-worker celery-beat

# Ждем запуска backend
sleep 20

# Запускаем Nginx
docker-compose -f docker-compose.backend.yml up -d nginx-api

# Проверяем статус всех сервисов
docker-compose -f docker-compose.backend.yml ps
```

### 3.5. Проверка Backend

```bash
# Проверяем логи всех сервисов
docker-compose -f docker-compose.backend.yml logs --tail=50

# Тестируем API локально
curl -f http://localhost:8000/health
echo "Backend health check completed"

# Тестируем через Nginx
curl -k https://localhost/health
echo "Nginx health check completed"

# Проверяем подключение к БД
docker-compose -f docker-compose.backend.yml exec backend python -c "
from app.core.database import engine
print('✅ Database connection successful')
"

# Проверяем Redis
docker-compose -f docker-compose.backend.yml exec redis redis-cli ping
echo "✅ Redis connection successful"
```

---

## 🎨 Шаг 4: Развертывание Frontend сервера (139.59.158.109)

### 4.1. Создание .env файла

```bash
# На frontend сервере
cd /opt/leadvertex-clone

# Создаем .env файл для фронтенда
cat > .env << 'EOF'
# Backend Configuration
REACT_APP_API_URL=https://api.moonline.pw
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

# Проверяем файл
cat .env
```

### 4.2. Создание SSL сертификатов для Frontend

```bash
# Переходим в директорию SSL
cd /opt/leadvertex-clone/docker/ssl

# Создаем SSL сертификаты для фронтенда
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout moonline.pw.key \
    -out moonline.pw.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=moonline.pw"

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout wildcard.moonline.pw.key \
    -out wildcard.moonline.pw.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=*.moonline.pw"

# Устанавливаем права
chmod 644 *.crt
chmod 600 *.key

# Возвращаемся в корень
cd /opt/leadvertex-clone
```

### 4.3. Создание Docker Compose для Frontend

```bash
# Создаем frontend-only docker-compose файл
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
```

### 4.4. Создание Nginx конфигурации для Frontend

```bash
# Создаем директорию для конфигурации
mkdir -p docker/nginx

# Создаем конфигурацию для frontend nginx
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
```

### 4.5. Обновление Frontend конфигурации

```bash
# Обновляем API URL в package.json и других конфигах
sed -i 's/68\.183\.209\.116/159.89.108.100/g' frontend/package.json
sed -i 's/157\.230\.100\.209/139.59.158.109/g' frontend/package.json

# Создаем .env для frontend сборки
cat > frontend/.env << 'EOF'
REACT_APP_API_URL=https://159.89.108.100:8000
GENERATE_SOURCEMAP=false
EOF
```

### 4.6. Запуск Frontend системы

```bash
# Возвращаемся в корень проекта
cd /opt/leadvertex-clone

# Собираем и запускаем фронтенд
docker-compose -f docker-compose.frontend.yml up --build -d

# Проверяем статус
docker-compose -f docker-compose.frontend.yml ps

# Проверяем логи
docker-compose -f docker-compose.frontend.yml logs --tail=50
```

### 4.7. Проверка Frontend

```bash
# Тестируем фронтенд локально
curl -f http://localhost/health
echo "Frontend health check completed"

# Тестируем HTTPS
curl -k https://localhost/health
echo "Frontend HTTPS check completed"

# Проверяем подключение к backend API
curl -k https://localhost/api/health
echo "API proxy check completed"
```

---

## 🌐 Шаг 5: Настройка DNS и финальная проверка

### 5.1. Настройка DNS записей

**В панели управления доменом `moonline.pw` создайте:**

```dns
# A записи
moonline.pw         A    139.59.158.109
www.moonline.pw     A    139.59.158.109
api.moonline.pw     A    159.89.108.100
*.moonline.pw       A    139.59.158.109

# CNAME записи (альтернативно)
www                CNAME moonline.pw
api                CNAME moonline.pw
```

### 5.2. Финальная проверка системы

```bash
# Проверяем backend API
curl -f http://159.89.108.100:8000/health
curl -f https://api.moonline.pw/health

# Проверяем frontend
curl -f http://139.59.158.109/health
curl -f https://moonline.pw/health

# Проверяем интеграцию frontend -> backend
curl -f https://moonline.pw/api/health
```

---

## 🔧 Управление системой

### Backend сервер (159.89.108.100)

```bash
# Перезапуск всех сервисов
cd /opt/leadvertex-clone
docker-compose -f docker-compose.backend.yml restart

# Просмотр логов
docker-compose -f docker-compose.backend.yml logs -f

# Остановка системы
docker-compose -f docker-compose.backend.yml down

# Полная пересборка
docker-compose -f docker-compose.backend.yml down
docker-compose -f docker-compose.backend.yml up --build -d

# Просмотр статуса
docker-compose -f docker-compose.backend.yml ps

# Вход в backend контейнер
docker-compose -f docker-compose.backend.yml exec backend bash

# Проверка базы данных
docker-compose -f docker-compose.backend.yml exec postgres psql -U leadvertex -d leadvertex

# Перезапуск только backend
docker-compose -f docker-compose.backend.yml restart backend

# Миграции базы данных
docker-compose -f docker-compose.backend.yml exec backend alembic upgrade head
```

### Frontend сервер (139.59.158.109)

```bash
# Перезапуск фронтенда
cd /opt/leadvertex-clone
docker-compose -f docker-compose.frontend.yml restart

# Просмотр логов
docker-compose -f docker-compose.frontend.yml logs -f

# Пересборка фронтенда
docker-compose -f docker-compose.frontend.yml down
docker-compose -f docker-compose.frontend.yml up --build -d

# Просмотр статуса
docker-compose -f docker-compose.frontend.yml ps

# Очистка кеша и пересборка
docker system prune -f
docker-compose -f docker-compose.frontend.yml up --build --force-recreate -d
```

---

## 📊 Мониторинг и логи

### Основные команды мониторинга

```bash
# Backend мониторинг
ssh root@159.89.108.100
cd /opt/leadvertex-clone
docker-compose -f docker-compose.backend.yml logs --tail=100 -f

# Frontend мониторинг
ssh root@139.59.158.109
cd /opt/leadvertex-clone
docker-compose -f docker-compose.frontend.yml logs --tail=100 -f

# Проверка ресурсов
docker stats
htop

# Проверка дискового пространства
df -h
docker system df

# Очистка неиспользуемых ресурсов
docker system prune -a -f
```

### Полезные URL для проверки

- **Frontend**: https://moonline.pw/
- **Backend API**: https://159.89.108.100:8000/docs
- **API Health**: https://159.89.108.100:8000/health
- **Frontend Health**: https://moonline.pw/health
- **API через Frontend**: https://moonline.pw/api/health

---

## 🆘 Устранение неполадок

### Проблемы с Backend

```bash
# Перезапуск базы данных
docker-compose -f docker-compose.backend.yml restart postgres

# Пересоздание базы данных (ОСТОРОЖНО!)
docker-compose -f docker-compose.backend.yml down -v
docker-compose -f docker-compose.backend.yml up -d postgres
sleep 30
docker-compose -f docker-compose.backend.yml up -d

# Проверка подключения к БД
docker-compose -f docker-compose.backend.yml exec backend python -c "
from app.core.database import engine
print('DB OK')
"

# Перезапуск Redis
docker-compose -f docker-compose.backend.yml restart redis

# Проверка Celery
docker-compose -f docker-compose.backend.yml exec backend python -c "
from app.celery_app import celery_app
print('Celery OK')
"
```

### Проблемы с Frontend

```bash
# Пересборка с очисткой кеша
docker-compose -f docker-compose.frontend.yml down
docker system prune -f
docker-compose -f docker-compose.frontend.yml up --build --force-recreate -d

# Проверка файлов сборки
docker-compose -f docker-compose.frontend.yml exec nginx-frontend ls -la /usr/share/nginx/html/

# Проверка nginx конфигурации
docker-compose -f docker-compose.frontend.yml exec nginx-frontend nginx -t
```

### Проблемы с сетью

```bash
# Проверка портов
netstat -tulpn | grep -E ":(80|443|8000|5432|6379)"

# Проверка firewall
ufw status

# Тест подключения между серверами
# На frontend сервере:
curl -f http://159.89.108.100:8000/health

# На backend сервере:
curl -f http://139.59.158.109/health
```

---

## ✅ Проверочный чек-лист

### Backend сервер (159.89.108.100)
- [ ] Docker и Docker Compose установлены
- [ ] Репозиторий склонирован
- [ ] .env файл создан с правильными настройками
- [ ] SSL сертификаты созданы
- [ ] PostgreSQL запущен и инициализирован
- [ ] Redis запущен
- [ ] Backend FastAPI отвечает на /health
- [ ] Celery worker и beat работают
- [ ] Nginx API gateway настроен

### Frontend сервер (139.59.158.109)
- [ ] Docker и Docker Compose установлены
- [ ] Node.js установлен
- [ ] Репозиторий склонирован
- [ ] .env файл создан
- [ ] SSL сертификаты созданы
- [ ] Frontend собран и запущен
- [ ] Nginx frontend настроен
- [ ] Проксирование на backend работает

### Общая проверка
- [ ] DNS записи настроены
- [ ] https://moonline.pw/ открывается
- [ ] https://moonline.pw/api/health возвращает OK
- [ ] CORS настроен правильно
- [ ] SSL сертификаты работают

---

**🎉 Готово! Система развернута на разделенной архитектуре.**

**Frontend**: `139.59.158.109` → https://moonline.pw/  
**Backend**: `159.89.108.100` → https://159.89.108.100:8000/docs