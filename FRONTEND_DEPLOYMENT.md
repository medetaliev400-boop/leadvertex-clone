# Настройка раздельного развертывания Frontend + Backend

## 🏗️ Архитектура

- **Backend сервер**: `68.183.209.116` - только API
- **Frontend сервер**: `157.230.100.209` - только фронтенд

## 🔧 Настройка Backend сервера (68.183.209.116)

### 1. Настройка CORS
Убедитесь что в настройках Django (backend) разрешены запросы с фронтенд сервера:

```python
# backend/settings.py или backend/config/settings.py
CORS_ALLOWED_ORIGINS = [
    "http://157.230.100.209",
    "https://157.230.100.209", 
    "https://moonline.pw",
    "https://www.moonline.pw",
]

CORS_ALLOW_CREDENTIALS = True
```

### 2. Запуск только backend
```bash
# На сервере 68.183.209.116
cd /opt/leadvertex-clone

# Запуск только API без фронтенда
docker-compose -f docker-compose.prod.yml --profile backend up -d
```

## 🚀 Настройка Frontend сервера (157.230.100.209)

### 1. Клонирование проекта
```bash
# На сервере 157.230.100.209
cd /opt
git clone https://github.com/medetaliev400-boop/leadvertex-clone.git
cd leadvertex-clone
```

### 2. Настройка SSL сертификатов
```bash
# Запуск скрипта настройки SSL
cd docker/ssl
./setup-ssl.sh
```

### 3. Развертывание фронтенда
```bash
# Делаем скрипт исполняемым
chmod +x deploy-frontend.sh

# Запускаем развертывание
./deploy-frontend.sh
```

## 🔍 Проверка работы

### Backend (68.183.209.116)
```bash
curl http://68.183.209.116:8000/api/health
```

### Frontend (157.230.100.209)
```bash
curl http://157.230.100.209/health
```

## 🌐 Доступ к приложению

- **Фронтенд**: http://157.230.100.209 или https://moonline.pw
- **API**: http://68.183.209.116:8000/api

## 🔧 Полезные команды

### Frontend сервер
```bash
# Просмотр логов
docker-compose -f docker-compose.frontend.yml logs -f

# Перезапуск
docker-compose -f docker-compose.frontend.yml restart

# Остановка
docker-compose -f docker-compose.frontend.yml down

# Пересборка
docker-compose -f docker-compose.frontend.yml up -d --build
```

### Backend сервер  
```bash
# Просмотр логов
docker-compose -f docker-compose.prod.yml logs -f

# Перезапуск API
docker-compose -f docker-compose.prod.yml restart backend

# Остановка
docker-compose -f docker-compose.prod.yml down
```