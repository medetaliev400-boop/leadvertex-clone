# 🚀 LeadVertex Clone - Полное руководство по развертыванию

## 📋 Обзор системы

**LeadVertex Clone** - это полнофункциональная CRM система для управления заказами, аналогичная leadvertex.ru.

### 🖥️ Архитектура серверов

- **Frontend сервер**: `139.59.158.109` (React + TypeScript + Material-UI)
- **Backend сервер**: `159.89.108.100` (FastAPI + PostgreSQL + Redis + Celery)
- **Домен**: `moonline.pw`

### 🎯 Основные функции

✅ **Система пользователей**: Роли (Admin, Operator, Designer, Webmaster, Representative)  
✅ **Управление проектами**: Мультитенантность с тарифными планами  
✅ **CRM заказов**: Полный жизненный цикл от создания до отгрузки  
✅ **Управление товарами**: Каталог, остатки, ценообразование  
✅ **Call-центр**: Телефония, автообзвон, сценарии  
✅ **Аналитика**: Отчеты, статистика, конверсии  
✅ **Интеграции**: CPA сети, доставка (CDEK, Почта России)  
✅ **Автоматизация**: Правила, уведомления, робокол  
✅ **Landing pages**: Создание посадочных страниц  
✅ **UTM трекинг**: Отслеживание источников трафика  

---

## 🛠️ Подготовка серверов

### Backend сервер (159.89.108.100)

```bash
# Подключение к серверу
ssh root@159.89.108.100

# Обновление системы
apt update && apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Установка Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Установка дополнительных пакетов
apt install -y git curl wget htop nano ufw

# Настройка файрвола
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8000/tcp
ufw --force enable
```

### Frontend сервер (139.59.158.109)

```bash
# Подключение к серверу
ssh root@139.59.158.109

# Обновление системы
apt update && apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Установка Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Установка дополнительных пакетов
apt install -y git curl wget htop nano ufw

# Настройка файрвола
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

---

## 🗄️ Развертывание Backend сервера

### 1. Клонирование репозитория

```bash
cd /opt
git clone https://github.com/medetaliev400-boop/leadvertex-clone.git
cd leadvertex-clone
```

### 2. Настройка переменных окружения

```bash
# Копирование образца конфигурации
cp .env.backend .env

# Редактирование конфигурации
nano .env
```

**Содержимое .env:**

```env
# Database Configuration
POSTGRES_DB=leadvertex
POSTGRES_USER=leadvertex_user
POSTGRES_PASSWORD=Vf9pXy7Kz@3mQw2h

# Database Connection URLs
DATABASE_URL=postgresql+asyncpg://leadvertex_user:Vf9pXy7Kz%403mQw2h@db:5432/leadvertex
DATABASE_URL_SYNC=postgresql://leadvertex_user:Vf9pXy7Kz%403mQw2h@db:5432/leadvertex

# Redis Configuration
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2

# Security
SECRET_KEY=9bF7kP0rLmQ8dT6zXaC4nE1jGyHvW5sK
DEBUG=false
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Application Settings
PROJECT_NAME=LeadVertex Clone
PROJECT_VERSION=1.0.0
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# BEGET API Configuration
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

# Monitoring
FLOWER_PASSWORD=admin123
```

### 3. Запуск Backend

```bash
# Запуск автоматического скрипта
bash deploy-backend-new.sh

# Или ручной запуск
docker-compose -f docker-compose.backend.yml up -d

# Проверка статуса
docker-compose -f docker-compose.backend.yml ps

# Проверка логов
docker logs leadvertex-backend --tail 50
```

### 4. Проверка работоспособности

```bash
# Проверка API
curl -I http://localhost:8000/docs
curl http://localhost:8000/api/health

# Проверка через внешний IP
curl -I http://159.89.108.100/docs
```

---

## 🎨 Развертывание Frontend сервера

### 1. Клонирование репозитория

```bash
cd /opt
git clone https://github.com/medetaliev400-boop/leadvertex-clone.git
cd leadvertex-clone
```

### 2. Настройка переменных окружения

```bash
# Создание production конфигурации
cp frontend/.env.production frontend/.env

# Редактирование при необходимости
nano frontend/.env
```

**Содержимое frontend/.env:**

```env
# API Configuration
REACT_APP_API_URL=https://159.89.108.100:8000
REACT_APP_API_BASE_URL=https://159.89.108.100:8000/api

# App Configuration
REACT_APP_APP_NAME=LeadVertex
REACT_APP_VERSION=1.0.0

# Build Configuration
NODE_ENV=production
GENERATE_SOURCEMAP=false
```

### 3. Запуск Frontend

```bash
# Запуск автоматического скрипта
bash deploy-frontend-new.sh

# Или ручной запуск
docker-compose -f docker-compose.frontend.yml up -d

# Проверка статуса
docker-compose -f docker-compose.frontend.yml ps
```

### 4. Проверка работоспособности

```bash
# Проверка через браузер
# http://139.59.158.109/
# https://moonline.pw/

# Проверка через curl
curl -I http://139.59.158.109/
```

---

## 🔧 Мониторинг и управление

### Backend мониторинг

```bash
# Логи всех сервисов
docker-compose -f docker-compose.backend.yml logs -f

# Конкретные сервисы
docker logs leadvertex-backend -f
docker logs leadvertex-celery-worker -f
docker logs leadvertex-celery-beat -f
docker logs leadvertex-db -f
docker logs leadvertex-redis -f
docker logs leadvertex-nginx-api -f

# Статус контейнеров
docker-compose -f docker-compose.backend.yml ps

# Использование ресурсов
docker stats
```

### Frontend мониторинг

```bash
# Логи
docker-compose -f docker-compose.frontend.yml logs -f

# Статус
docker-compose -f docker-compose.frontend.yml ps
```

### Команды управления

```bash
# Перезапуск сервисов
docker-compose -f docker-compose.backend.yml restart
docker-compose -f docker-compose.frontend.yml restart

# Обновление из Git
git pull
docker-compose -f docker-compose.backend.yml down
docker-compose -f docker-compose.backend.yml up -d --build

# Остановка всех сервисов
docker-compose -f docker-compose.backend.yml down
docker-compose -f docker-compose.frontend.yml down

# Полная очистка (ВНИМАНИЕ: удаляет данные!)
docker-compose -f docker-compose.backend.yml down -v
docker system prune -f
```

---

## 🌐 Настройка DNS и SSL

### 1. DNS записи

В панели управления доменом `moonline.pw` создайте записи:

```
A    @           139.59.158.109
A    www         139.59.158.109
A    api         159.89.108.100
AAAA @           [IPv6 если есть]
AAAA www         [IPv6 если есть]
AAAA api         [IPv6 если есть]
```

### 2. SSL сертификаты

**Автоматическая установка Let's Encrypt:**

```bash
# На frontend сервере
docker exec leadvertex-nginx-frontend certbot --nginx -d moonline.pw -d www.moonline.pw

# На backend сервере
docker exec leadvertex-nginx-api certbot --nginx -d api.moonline.pw
```

**Ручная установка (если есть сертификаты):**

```bash
# Копирование сертификатов
mkdir -p docker/ssl
cp your-cert.crt docker/ssl/moonline.pw.crt
cp your-key.key docker/ssl/moonline.pw.key

# Перезапуск Nginx
docker-compose restart nginx-frontend
docker-compose restart nginx-api
```

---

## 📈 Проверка функциональности

### ✅ Backend API Endpoints

```bash
# Документация API
http://159.89.108.100/docs
https://api.moonline.pw/docs

# Health Check
http://159.89.108.100/api/health
https://api.moonline.pw/api/health

# Основные API группы:
# /api/auth          - Авторизация
# /api/projects      - Управление проектами
# /api/orders        - Управление заказами
# /api/products      - Управление товарами
# /api/users         - Управление пользователями
# /api/telephony     - Телефония
# /api/statistics    - Аналитика
# /api/cpa           - CPA интеграции
# /api/automation    - Автоматизация
```

### ✅ Frontend Pages

```bash
# Основной сайт
http://139.59.158.109/
https://moonline.pw/

# Страницы системы:
# /login             - Авторизация
# /dashboard         - Главная панель
# /orders            - Управление заказами
# /order-statuses    - Статусы заказов
# /products          - Управление товарами
# /projects          - Управление проектами
# /statistics        - Аналитика и отчеты
# /telephony         - Call-центр
# /cpa               - CPA партнеры
```

---

## 🔧 Решение проблем

### 🚨 Backend не запускается

```bash
# Проверка логов
docker logs leadvertex-backend --tail 100

# Проблемы с базой данных
docker exec -it leadvertex-db psql -U leadvertex_user -d leadvertex

# Очистка базы данных (если нужно)
docker-compose -f docker-compose.backend.yml down -v
docker-compose -f docker-compose.backend.yml up -d

# Проблемы с миграциями
docker exec -it leadvertex-backend alembic upgrade head
```

### 🚨 Frontend не загружается

```bash
# Проверка логов
docker logs leadvertex-frontend --tail 100

# Проверка сборки
docker exec -it leadvertex-frontend npm run build

# Проблемы с API соединением
# Проверить настройки REACT_APP_API_URL в .env
```

### 🚨 Проблемы с CORS

```bash
# Проверить настройки CORS_ORIGINS в backend/.env
# Добавить домен frontend сервера в список разрешенных
```

---

## 📊 Мониторинг производительности

### System monitoring

```bash
# Мониторинг ресурсов
htop
df -h
free -h
iostat 1

# Docker статистика
docker stats --no-stream

# Логи системы
journalctl -u docker -f
```

### Application monitoring

```bash
# Backend health
curl http://159.89.108.100/api/health

# Database connections
docker exec leadvertex-db psql -U leadvertex_user -d leadvertex -c "SELECT count(*) FROM pg_stat_activity;"

# Redis info
docker exec leadvertex-redis redis-cli info

# Celery monitoring
# http://159.89.108.100:5555/ (Flower)
```

---

## 🎯 Заключение

**LeadVertex Clone успешно развернут!** 🎉

### 📌 Основные URL

- **Frontend**: https://moonline.pw/
- **Backend API**: https://api.moonline.pw/docs
- **Celery Monitoring**: http://159.89.108.100:5555/

### 📌 Данные для входа

```
Первый суперпользователь будет создан при первом запуске.
Используйте регистрацию через /register endpoint или
создайте через Django admin.
```

### 📌 Дальнейшая настройка

1. **Создать первого администратора**
2. **Настроить проекты и пользователей**
3. **Настроить интеграции (SMS, Email, Телефония)**
4. **Создать продукты и статусы заказов**
5. **Настроить автоматизацию и уведомления**

### 🆘 Поддержка

Для решения проблем:
1. Проверьте логи контейнеров
2. Убедитесь что все сервисы запущены
3. Проверьте сетевые подключения
4. Обратитесь к данному руководству

**Удачной работы с LeadVertex Clone!** 🚀