# Production Backend Deployment Guide

## 🏗️ Архитектура Production Backend

**Backend сервер**: `68.183.209.116`
- FastAPI на порту 8000
- PostgreSQL база данных
- Redis кеш  
- Nginx reverse proxy
- Celery для фоновых задач
- SSL сертификаты

## 🚀 Быстрое развертывание

### 1. Подготовка сервера
```bash
# На сервере 68.183.209.116
cd /opt

# Клонируем проект (если еще не клонировали)
git clone https://github.com/medetaliev400-boop/leadvertex-clone.git
cd leadvertex-clone

# Обновляем до последней версии
git pull origin main
```

### 2. Запуск одной командой
```bash
# Делаем скрипт исполняемым
chmod +x deploy-backend.sh

# Запускаем автоматическое развертывание
./deploy-backend.sh
```

### 3. Готово! 🎉
Backend будет доступен:
- **API**: http://68.183.209.116:8000/api/
- **Admin**: http://68.183.209.116:8000/admin/
- **Health**: http://68.183.209.116:8000/health

## ⚙️ Детальная настройка (если нужно)

### Переменные окружения
Скопируйте `.env.backend` в `.env` и настройте:
```bash
cp .env.backend .env
nano .env
```

### Основные переменные:
```env
POSTGRES_PASSWORD=Vf9pXy7Kz@3mQw2h
SECRET_KEY=9bF7kP0rLmQ8dT6zXaC4nE1jGyHvW5sK
DEBUG=False
```

### SSL сертификаты
```bash
# Автоматическая настройка SSL
cd docker/ssl
chmod +x setup-ssl.sh
./setup-ssl.sh
```

## 🐳 Docker сервисы

### Запущенные контейнеры:
- `leadvertex-db` - PostgreSQL 15
- `leadvertex-redis` - Redis 7
- `leadvertex-backend` - FastAPI
- `leadvertex-nginx-api` - Nginx proxy
- `leadvertex-celery-worker` - Celery worker
- `leadvertex-celery-beat` - Celery scheduler

### Управление сервисами:
```bash
# Просмотр статуса
docker-compose -f docker-compose.backend.yml ps

# Просмотр логов
docker-compose -f docker-compose.backend.yml logs -f backend

# Перезапуск сервиса
docker-compose -f docker-compose.backend.yml restart backend

# Остановка всех сервисов
docker-compose -f docker-compose.backend.yml down

# Полная пересборка
docker-compose -f docker-compose.backend.yml up -d --build
```

## 🔧 Управление FastAPI

### Вход в контейнер FastAPI:
```bash
docker-compose -f docker-compose.backend.yml exec backend bash
```

### Команды в контейнере:
```bash
# Миграции базы данных (Alembic)
alembic upgrade head

# Создание новой миграции
alembic revision --autogenerate -m "description"

# Запуск Python shell
python -c "from app.main import app; print('FastAPI app loaded')"

# Просмотр логов приложения
tail -f /app/logs/app.log

# Проверка конфигурации
python -c "from app.core.config import settings; print(settings.DATABASE_URL)"
```

## 📊 Мониторинг

### Проверка здоровья:
```bash
# API health check
curl http://68.183.209.116:8000/api/health

# Nginx status
curl http://68.183.209.116/health

# Database connection
docker-compose -f docker-compose.backend.yml exec backend python -c "from app.database import engine; print('DB connected')"
```

### Просмотр логов:
```bash
# Все логи
docker-compose -f docker-compose.backend.yml logs

# Только backend
docker-compose -f docker-compose.backend.yml logs backend

# В реальном времени
docker-compose -f docker-compose.backend.yml logs -f

# Последние 100 строк
docker-compose -f docker-compose.backend.yml logs --tail=100
```

## 🔒 Безопасность

### Настройки FastAPI:
- Настроенные CORS для фронтенда
- SSL сертификаты
- Security headers в Nginx
- Валидация данных через Pydantic
- JWT аутентификация

### Firewall (рекомендуется):
```bash
# Открываем только нужные порты
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 8000/tcp  # API (временно для разработки)
ufw enable
```

## 📱 API Endpoints

### Основные эндпоинты:
- `GET /api/health` - Проверка здоровья
- `POST /api/auth/login` - Авторизация
- `GET /api/orders/` - Список заказов
- `GET /api/products/` - Список товаров
- `GET /api/statistics/` - Статистика
- `GET /api/users/me` - Профиль пользователя

### Документация API:
- Swagger UI: http://68.183.209.116:8000/docs
- ReDoc: http://68.183.209.116:8000/redoc
- OpenAPI JSON: http://68.183.209.116:8000/openapi.json

## 🆘 Устранение неполадок

### Проблемы с базой данных:
```bash
# Перезапуск БД
docker-compose -f docker-compose.backend.yml restart db

# Проверка подключения
docker-compose -f docker-compose.backend.yml exec backend python manage.py dbshell
```

### Проблемы с Redis:
```bash
# Перезапуск Redis
docker-compose -f docker-compose.backend.yml restart redis

# Проверка Redis
docker-compose -f docker-compose.backend.yml exec redis redis-cli ping
```

### Проблемы с Celery:
```bash
# Перезапуск worker
docker-compose -f docker-compose.backend.yml restart celery-worker

# Просмотр задач
docker-compose -f docker-compose.backend.yml exec backend python -c "
from app.celery_app import celery_app
print('Active tasks:', celery_app.control.inspect().active())
"
```

### Очистка системы:
```bash
# Остановка всех контейнеров
docker-compose -f docker-compose.backend.yml down

# Очистка неиспользуемых ресурсов
docker system prune -f

# Очистка volumes (ОСТОРОЖНО - удалит данные!)
docker volume prune
```

## 🔄 Обновление

### Обновление кода:
```bash
cd /opt/leadvertex-clone
git pull origin main
docker-compose -f docker-compose.backend.yml up -d --build
```

### Backup базы данных:
```bash
# Создание backup
docker-compose -f docker-compose.backend.yml exec db pg_dump -U leadvertex_user leadvertex > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление backup
docker-compose -f docker-compose.backend.yml exec -T db psql -U leadvertex_user leadvertex < backup_file.sql
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `docker-compose -f docker-compose.backend.yml logs`
2. Проверьте статус: `docker-compose -f docker-compose.backend.yml ps`
3. Проверьте health: `curl http://68.183.209.116:8000/api/health`

## 🔗 Связь с фронтендом

Backend настроен для работы с фронтендом на `157.230.100.209`:
- CORS разрешения настроены
- API endpoints доступны
- SSL и безопасность настроены