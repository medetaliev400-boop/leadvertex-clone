# 🌐 Информация о серверах

## 📍 IP адреса серверов

### Frontend сервер
- **IP**: `139.59.158.109`
- **Назначение**: React приложение, Nginx, SSL
- **Порты**: 80 (HTTP), 443 (HTTPS)
- **Домен**: https://moonline.pw

### Backend сервер
- **IP**: `159.89.108.100`  
- **Назначение**: FastAPI, PostgreSQL, Redis, Celery
- **Порты**: 8000 (API), 5432 (PostgreSQL), 6379 (Redis)
- **API**: https://159.89.108.100:8000/docs

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
ssh root@139.59.158.109

# Backend сервер  
ssh root@159.89.108.100
```

### Быстрое развертывание
```bash
# На backend сервере (159.89.108.100)
cd /opt && git clone https://github.com/medetaliev400-boop/leadvertex-clone.git
cd leadvertex-clone && bash deploy-backend-new.sh

# На frontend сервере (139.59.158.109)
cd /opt && git clone https://github.com/medetaliev400-boop/leadvertex-clone.git
cd leadvertex-clone && bash deploy-frontend-new.sh
```

## 🔍 Проверка работы

### Health checks
```bash
# Backend API
curl https://159.89.108.100:8000/health

# Frontend
curl https://moonline.pw/health

# API через frontend
curl https://moonline.pw/api/health
```

### Основные URL
- **Frontend**: https://moonline.pw/
- **Backend API Docs**: https://159.89.108.100:8000/docs
- **Backend Health**: https://159.89.108.100:8000/health
- **Frontend Health**: https://moonline.pw/health