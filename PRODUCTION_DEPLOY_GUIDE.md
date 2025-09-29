# 🚀 Полное руководство по развертыванию LeadVertex Clone в Production

## 📋 Обзор архитектуры

**Backend сервер** (`64.225.109.252`):
- PostgreSQL 15
- Redis 7
- FastAPI приложение
- Celery workers
- Nginx (API proxy)

**Frontend сервер** (`206.189.60.238`):
- React приложение
- Nginx (статика + proxy к API)
- SSL сертификаты

---

## 🔧 Шаг 1: Подготовка серверов

### Backend сервер (64.225.109.252)

```bash
# Подключаемся к серверу
ssh root@64.225.109.252

# Обновляем систему
apt update && apt upgrade -y

# Устанавливаем Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Устанавливаем Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Устанавливаем дополнительные утилиты
apt install -y git curl htop nano jq

# Создаем пользователя для приложения (опционально)
useradd -m -s /bin/bash leadvertex
usermod -aG docker leadvertex
```

### Frontend сервер (206.189.60.238)

```bash
# Подключаемся к серверу
ssh root@206.189.60.238

# Обновляем систему
apt update && apt upgrade -y

# Устанавливаем Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Устанавливаем Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Устанавливаем Node.js (для сборки фронтенда)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs git curl htop nano

# Создаем пользователя для приложения (опционально)
useradd -m -s /bin/bash leadvertex
usermod -aG docker leadvertex
```

---

## 🏗️ Шаг 2: Клонирование проекта

### На ОБОИХ серверах:

```bash
# Переключаемся на пользователя leadvertex (или остаемся root)
su - leadvertex  # или оставайтесь root

# Клонируем репозиторий
cd /opt
git clone https://github.com/medetaliev400-boop/leadvertex-clone.git
cd leadvertex-clone

# Проверяем версию (должна быть актуальная)
git log --oneline -n 3
```

---

## 🗄️ Шаг 3: Развертывание Backend сервера

### 3.1. Создание .env файла

```bash
# На backend сервере (64.225.109.252)
cd /opt/leadvertex-clone

# Создаем .env на основе примера
cp .env.example .env

# Редактируем файл (все данные уже настроены!)
nano .env
```

**Содержимое .env должно быть:**
```env
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
FRONTEND_SERVER_IP=206.189.60.238
BACKEND_SERVER_IP=64.225.109.252
FRONTEND_DOMAIN=https://moonline.pw,https://*.moonline.pw
BACKEND_URL=https://api.moonline.pw

# Flower Monitoring
FLOWER_PASSWORD=admin123
```

### 3.2. Создание SSL сертификатов

```bash
# Создаем SSL сертификаты для API
cd docker/ssl
bash setup-ssl.sh

# Проверяем создание сертификатов
ls -la *.crt *.key

# Должны быть файлы:
# api.moonline.pw.crt (644)
# api.moonline.pw.key (600)
```

### 3.3. Запуск backend контейнеров

```bash
# Возвращаемся в корень проекта
cd /opt/leadvertex-clone

# Запускаем в production режиме
docker-compose -f docker-compose.prod.yml up -d postgres redis

# Ждем запуска баз данных
sleep 30

# Запускаем backend приложения
docker-compose -f docker-compose.prod.yml up -d backend celery-worker celery-beat

# Запускаем Nginx для API (с SSL)
docker-compose -f docker-compose.prod.yml --profile production up -d nginx

# Проверяем статус всех контейнеров
docker-compose -f docker-compose.prod.yml ps
```

### 3.4. Проверка backend

```bash
# Проверяем логи
docker-compose -f docker-compose.prod.yml logs backend

# Тестируем API локально
curl -f http://localhost:8000/health
curl -f http://localhost:8000/api/docs

# Тестируем через Nginx
curl -k https://localhost/health
```

---

## 🎨 Шаг 4: Развертывание Frontend сервера

### 4.1. Подготовка фронтенда

```bash
# На frontend сервере (206.189.60.238)
cd /opt/leadvertex-clone

# Создаем .env для фронтенда
cat > .env << 'EOF'
# Backend URL
REACT_APP_API_URL=https://api.moonline.pw
BACKEND_URL=https://api.moonline.pw

# Домены
MAIN_DOMAIN=moonline.pw
WILDCARD_DOMAIN=*.moonline.pw
EOF
```

### 4.2. Сборка фронтенда

```bash
# Переходим в папку фронтенда
cd frontend

# Устанавливаем зависимости
npm install

# Собираем production версию
REACT_APP_API_URL=https://api.moonline.pw npm run build

# Проверяем сборку
ls -la build/
```

### 4.3. Создание SSL сертификатов для фронтенда

```bash
# Возвращаемся в корень проекта
cd /opt/leadvertex-clone

# Создаем директории
mkdir -p docker/ssl
mkdir -p nginx

# Генерируем сертификаты для основного домена
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout docker/ssl/moonline.pw.key \
    -out docker/ssl/moonline.pw.crt \
    -subj "/C=RU/ST=Moscow/L=Moscow/O=LeadVertex/CN=moonline.pw"

# Генерируем wildcard сертификат для поддоменов
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout docker/ssl/wildcard.moonline.pw.key \
    -out docker/ssl/wildcard.moonline.pw.crt \
    -subj "/C=RU/ST=Moscow/L=Moscow/O=LeadVertex/CN=*.moonline.pw"

# Устанавливаем правильные права
chmod 600 docker/ssl/*.key
chmod 644 docker/ssl/*.crt

# Проверяем сертификаты
ls -la docker/ssl/
```

### 4.4. Настройка Nginx для фронтенда

```bash
# Копируем конфигурацию nginx
cp deploy/nginx/frontend-nginx.conf nginx/default.conf

# Редактируем конфигурацию под наши нужды
nano nginx/default.conf
```

**Обновляем конфигурацию:**
```nginx
# Замените ${BACKEND_URL} на реальный URL
sed -i 's|${BACKEND_URL}|https://api.moonline.pw|g' nginx/default.conf
```

### 4.5. Создание Docker контейнера для фронтенда

```bash
# Создаем простой Dockerfile для статики
cat > Dockerfile.frontend << 'EOF'
FROM nginx:alpine

# Копируем конфиг nginx
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Копируем собранное приложение
COPY frontend/build /usr/share/nginx/html

# Копируем SSL сертификаты
COPY docker/ssl /etc/nginx/ssl

# Открываем порты
EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
EOF

# Собираем образ
docker build -f Dockerfile.frontend -t leadvertex-frontend .

# Запускаем контейнер
docker run -d \
    --name leadvertex-frontend \
    --restart unless-stopped \
    -p 80:80 \
    -p 443:443 \
    leadvertex-frontend

# Проверяем запуск
docker ps | grep leadvertex-frontend
docker logs leadvertex-frontend
```

---

## 🌐 Шаг 5: Настройка DNS

### Через Beget API (автоматически)

```bash
# На backend сервере создаем скрипт для DNS
cat > setup_dns.py << 'EOF'
import asyncio
import sys
import os
sys.path.append('/opt/leadvertex-clone/deploy')

from beget_dns import BegetDNSManager

async def setup_dns():
    # Настройки (уже в конфиге)
    os.environ['BEGET_LOGIN'] = 'aex020w5'
    os.environ['BEGET_PASSWORD'] = '46B*bRc4JATXztr'
    os.environ['MAIN_DOMAIN'] = 'moonline.pw'
    os.environ['FRONTEND_SERVER_IP'] = '206.189.60.238'
    
    dns_manager = BegetDNSManager()
    
    # Создаем основные записи
    await dns_manager.create_subdomain('', '206.189.60.238')  # moonline.pw
    await dns_manager.create_subdomain('www', '206.189.60.238')  # www.moonline.pw
    await dns_manager.create_subdomain('api', '64.225.109.252')  # api.moonline.pw
    
    print("DNS записи созданы!")

if __name__ == "__main__":
    asyncio.run(setup_dns())
EOF

# Запускаем настройку DNS
cd /opt/leadvertex-clone
python3 setup_dns.py
```

### Ручная настройка DNS (альтернатива)

В панели Beget создайте A-записи:
```
moonline.pw → 206.189.60.238
www.moonline.pw → 206.189.60.238
api.moonline.pw → 64.225.109.252
*.moonline.pw → 206.189.60.238
```

---

## 🔍 Шаг 6: Финальная проверка

### Проверка backend

```bash
# На backend сервере
curl -f http://localhost:8000/health
curl -k https://localhost/health

# Проверка с внешнего адреса (через несколько минут после DNS)
curl -f http://api.moonline.pw/health
```

### Проверка frontend

```bash
# На frontend сервере
curl -f http://localhost
curl -k https://localhost

# Проверка с внешнего адреса
curl -f http://moonline.pw
```

### Проверка работы системы

```bash
# Тестируем API документацию
curl -f https://api.moonline.pw/api/docs

# Тестируем фронтенд
curl -f https://moonline.pw

# Проверяем поддомены (после создания проектов)
curl -f https://test.moonline.pw
```

---

## 📊 Шаг 7: Мониторинг и логи

### Backend логи

```bash
# Смотрим логи всех сервисов
docker-compose -f docker-compose.prod.yml logs -f

# Логи конкретных сервисов
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f postgres
docker-compose -f docker-compose.prod.yml logs -f redis
```

### Frontend логи

```bash
# Логи nginx фронтенда
docker logs -f leadvertex-frontend

# Логи nginx на backend
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### Проверка ресурсов

```bash
# Использование ресурсов контейнерами
docker stats

# Место на диске
df -h

# Использование памяти
free -h
```

---

## 🔄 Автоматизированные скрипты запуска

### Backend (64.225.109.252)

```bash
cat > /opt/leadvertex-clone/start-backend.sh << 'EOF'
#!/bin/bash
cd /opt/leadvertex-clone

echo "🚀 Запуск Backend сервера..."

# Создаем .env если не существует
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Создан .env файл"
fi

# Создаем SSL если не существуют
if [ ! -f docker/ssl/api.moonline.pw.crt ]; then
    cd docker/ssl
    bash setup-ssl.sh
    cd ../..
    echo "✅ Созданы SSL сертификаты"
fi

# Запускаем сервисы поэтапно
echo "📦 Запускаем базы данных..."
docker-compose -f docker-compose.prod.yml up -d postgres redis
sleep 15

echo "🔧 Запускаем backend приложения..."
docker-compose -f docker-compose.prod.yml up -d backend celery-worker celery-beat
sleep 10

echo "🌐 Запускаем Nginx..."
docker-compose -f docker-compose.prod.yml --profile production up -d nginx

echo "✅ Backend сервер запущен!"
echo "🔍 Проверка: curl -f http://localhost:8000/health"

# Показываем статус
docker-compose -f docker-compose.prod.yml ps
EOF

chmod +x /opt/leadvertex-clone/start-backend.sh
```

### Frontend (206.189.60.238)

```bash
cat > /opt/leadvertex-clone/start-frontend.sh << 'EOF'
#!/bin/bash
cd /opt/leadvertex-clone

echo "🚀 Запуск Frontend сервера..."

# Создаем .env если не существует
if [ ! -f .env ]; then
    cat > .env << 'ENVEOF'
REACT_APP_API_URL=https://api.moonline.pw
BACKEND_URL=https://api.moonline.pw
MAIN_DOMAIN=moonline.pw
WILDCARD_DOMAIN=*.moonline.pw
ENVEOF
    echo "✅ Создан .env файл"
fi

# Собираем фронтенд если не собран
if [ ! -d frontend/build ]; then
    echo "🔨 Собираем фронтенд..."
    cd frontend
    npm install
    REACT_APP_API_URL=https://api.moonline.pw npm run build
    cd ..
    echo "✅ Фронтенд собран"
fi

# Создаем SSL если не существуют
mkdir -p docker/ssl nginx
if [ ! -f docker/ssl/moonline.pw.crt ]; then
    echo "🔒 Создаем SSL сертификаты..."
    
    # Основной домен
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout docker/ssl/moonline.pw.key \
        -out docker/ssl/moonline.pw.crt \
        -subj "/C=RU/ST=Moscow/L=Moscow/O=LeadVertex/CN=moonline.pw"
    
    # Wildcard домен
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout docker/ssl/wildcard.moonline.pw.key \
        -out docker/ssl/wildcard.moonline.pw.crt \
        -subj "/C=RU/ST=Moscow/L=Moscow/O=LeadVertex/CN=*.moonline.pw"
    
    chmod 600 docker/ssl/*.key
    chmod 644 docker/ssl/*.crt
    echo "✅ SSL сертификаты созданы"
fi

# Подготавливаем nginx конфигурацию
cp deploy/nginx/frontend-nginx.conf nginx/default.conf
sed -i 's|${BACKEND_URL}|https://api.moonline.pw|g' nginx/default.conf

# Останавливаем старый контейнер если есть
docker stop leadvertex-frontend 2>/dev/null || true
docker rm leadvertex-frontend 2>/dev/null || true

# Создаем Dockerfile если не существует
if [ ! -f Dockerfile.frontend ]; then
    cat > Dockerfile.frontend << 'DOCKEREOF'
FROM nginx:alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY frontend/build /usr/share/nginx/html
COPY docker/ssl /etc/nginx/ssl
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
DOCKEREOF
fi

# Собираем и запускаем
echo "🐳 Собираем Docker образ..."
docker build -f Dockerfile.frontend -t leadvertex-frontend .

echo "🌐 Запускаем Frontend..."
docker run -d \
    --name leadvertex-frontend \
    --restart unless-stopped \
    -p 80:80 \
    -p 443:443 \
    leadvertex-frontend

echo "✅ Frontend сервер запущен!"
echo "🔍 Проверка: curl -f http://localhost"

# Показываем статус
docker ps | grep leadvertex-frontend
EOF

chmod +x /opt/leadvertex-clone/start-frontend.sh
```

---

## 🚀 Финальный запуск

### На Backend сервере:

```bash
ssh root@64.225.109.252
cd /opt/leadvertex-clone
./start-backend.sh
```

### На Frontend сервере:

```bash
ssh root@206.189.60.238
cd /opt/leadvertex-clone
./start-frontend.sh
```

### Проверка результата:

```bash
# Ждем 2-3 минуты для распространения DNS
sleep 180

# Проверяем доступность
curl -f https://api.moonline.pw/health
curl -f https://moonline.pw

# Если все работает:
echo "🎉 Система успешно развернута!"
echo "📱 Frontend: https://moonline.pw"
echo "🔧 Backend API: https://api.moonline.pw"
echo "📚 API Docs: https://api.moonline.pw/api/docs"
```

---

## ⚡ Быстрые команды для перезапуска

### Перезапуск Backend:
```bash
ssh root@64.225.109.252
cd /opt/leadvertex-clone
docker-compose -f docker-compose.prod.yml restart
```

### Перезапуск Frontend:
```bash
ssh root@206.189.60.238
docker restart leadvertex-frontend
```

### Обновление кода:
```bash
# На обоих серверах
cd /opt/leadvertex-clone
git pull origin main
# Затем перезапуск сервисов
```

---

## 🔧 Troubleshooting

### Проблемы с Backend:
```bash
# Логи
docker-compose -f docker-compose.prod.yml logs backend

# Проверка портов
netstat -tlnp | grep :8000
netstat -tlnp | grep :5432

# Перезапуск
docker-compose -f docker-compose.prod.yml restart backend
```

### Проблемы с Frontend:
```bash
# Логи
docker logs leadvertex-frontend

# Проверка портов  
netstat -tlnp | grep :80
netstat -tlnp | grep :443

# Перезапуск
docker restart leadvertex-frontend
```

### Проблемы с SSL:
```bash
# Проверка сертификатов
openssl x509 -in docker/ssl/moonline.pw.crt -text -noout
openssl x509 -in docker/ssl/api.moonline.pw.crt -text -noout

# Пересоздание
rm docker/ssl/*.crt docker/ssl/*.key
cd docker/ssl && bash setup-ssl.sh
```

---

**✅ Готово! Система полностью развернута и работает.**