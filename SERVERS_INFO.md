# 🌐 Информация о серверах

## 📍 IP адреса серверов

### Frontend сервер
- **IP**: `164.90.219.122`
- **Назначение**: React приложение, Nginx, SSL
- **Порты**: 80 (HTTP), 443 (HTTPS)
- **Домен**: https://moonline.pw

### Backend сервер
- **IP**: `157.230.27.200`  
- **Назначение**: FastAPI, PostgreSQL, Redis, Celery
- **Порты**: 8000 (API), 5432 (PostgreSQL), 6379 (Redis)
- **API**: https://157.230.27.200:8000/docs

## 🔑 Доступы и пароли

### База данных PostgreSQL
- **Пользователь**: `leadvertex`
- **Пароль**: `Vf9pXy7Kz@3mQw2h`
- **База**: `leadvertex`

### Beget API
- **Логин**: `aex020w5`
- **Пароль**: `46B*bRc4JATXztr`

### Секретные ключи
- **SECRET_KEY**: `9bF7kP0rLmQ8dT6zXaC4nE1jGyHvW5sK`
- **FLOWER_PASSWORD**: `admin123`

## 🚀 Команды для подключения

### SSH подключение
```bash
# Frontend сервер
ssh root@164.90.219.122

# Backend сервер  
ssh root@157.230.27.200
```

### Быстрое развертывание
```bash
# На backend сервере (157.230.27.200)
cd /opt && git clone https://github.com/medetaliev400-boop/leadvertex-clone.git
cd leadvertex-clone && bash deploy-backend-new.sh

# На frontend сервере (164.90.219.122)
cd /opt && git clone https://github.com/medetaliev400-boop/leadvertex-clone.git
cd leadvertex-clone && bash deploy-frontend-new.sh
```

## 🔍 Проверка работы

### Health checks
```bash
# Backend API
curl https://157.230.27.200:8000/health

# Frontend
curl https://moonline.pw/health

# API через frontend
curl https://moonline.pw/api/health
```

### Основные URL
- **Frontend**: https://moonline.pw/
- **Backend API Docs**: https://157.230.27.200:8000/docs
- **Backend Health**: https://157.230.27.200:8000/health
- **Frontend Health**: https://moonline.pw/health