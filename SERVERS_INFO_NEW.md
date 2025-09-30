# 🖥️ Информация о серверах LeadVertex Clone

## 🌐 Архитектура развертывания

### Frontend сервер
- **IP адрес**: `139.59.158.109`
- **Роль**: Веб-интерфейс (React + TypeScript + Material-UI)
- **Домены**: 
  - `moonline.pw` (основной)
  - `www.moonline.pw`
- **Порты**: 80 (HTTP), 443 (HTTPS)
- **Технологии**: React 18, TypeScript, Material-UI, Nginx

### Backend сервер
- **IP адрес**: `159.89.108.100`
- **Роль**: API сервер и база данных
- **Домены**:
  - `api.moonline.pw` (API endpoint)
- **Порты**: 80, 443, 8000 (API), 5432 (PostgreSQL), 6379 (Redis)
- **Технологии**: FastAPI, PostgreSQL, Redis, Celery, Nginx

## 🔧 Системные требования

### Минимальные требования
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Диск**: 40 GB SSD
- **ОС**: Ubuntu 20.04+ или CentOS 8+

### Рекомендуемые требования
- **CPU**: 4 cores
- **RAM**: 8 GB
- **Диск**: 100 GB SSD
- **ОС**: Ubuntu 22.04 LTS

## 📋 Конфигурация сервисов

### Frontend (139.59.158.109)
```
Сервисы:
├── nginx-frontend     (Веб-сервер)
├── leadvertex-frontend (React приложение)
└── certbot           (SSL сертификаты)

Порты:
├── 80  → HTTP
├── 443 → HTTPS
└── 22  → SSH
```

### Backend (159.89.108.100)
```
Сервисы:
├── nginx-api          (Reverse proxy)
├── leadvertex-backend (FastAPI)
├── leadvertex-db      (PostgreSQL 15)
├── leadvertex-redis   (Redis 7)
├── celery-worker      (Фоновые задачи)
├── celery-beat        (Планировщик)
└── flower            (Мониторинг Celery)

Порты:
├── 80   → HTTP
├── 443  → HTTPS
├── 8000 → FastAPI
├── 5432 → PostgreSQL
├── 6379 → Redis
├── 5555 → Flower
└── 22   → SSH
```

## 🌍 DNS записи

```dns
# A записи
@           A    139.59.158.109
www         A    139.59.158.109
api         A    159.89.108.100

# CNAME записи (альтернативно)
# www       CNAME @
# api       CNAME backend.moonline.pw.
```

## 🔐 Доступы и пароли

### SSH доступ
```bash
# Frontend сервер
ssh root@139.59.158.109
# Пароль: SBA12store

# Backend сервер  
ssh root@159.89.108.100
# Пароль: SBA12store
```

### База данных
```
Host: db (внутри Docker сети)
Database: leadvertex
User: leadvertex_user
Password: Vf9pXy7Kz@3mQw2h
Port: 5432
```

### Redis
```
Host: redis (внутри Docker сети)
Port: 6379
Databases:
├── 0 → Cache
├── 1 → Celery Broker
└── 2 → Celery Results
```

### API ключи и секреты
```
SECRET_KEY: 9bF7kP0rLmQ8dT6zXaC4nE1jGyHvW5sK
BEGET_LOGIN: aex020w5
BEGET_PASSWORD: 46B*bRc4JATXztr
FLOWER_PASSWORD: admin123
```

## 📊 Мониторинг

### Здоровье системы
```bash
# Backend API health
curl http://159.89.108.100/api/health

# Frontend доступность
curl -I http://139.59.158.109/

# Celery мониторинг
http://159.89.108.100:5555/
```

### Логи
```bash
# Backend логи
docker logs leadvertex-backend -f
docker logs leadvertex-db -f
docker logs leadvertex-redis -f

# Frontend логи
docker logs leadvertex-frontend -f
docker logs nginx-frontend -f
```

### Ресурсы
```bash
# Использование ресурсов
docker stats
htop
df -h
free -h
```

## 🚀 Быстрые команды

### Развертывание
```bash
# Frontend сервер (139.59.158.109)
cd /opt
git clone https://github.com/medetaliev400-boop/leadvertex-clone.git
cd leadvertex-clone
bash deploy-frontend-new.sh

# Backend сервер (159.89.108.100)
cd /opt
git clone https://github.com/medetaliev400-boop/leadvertex-clone.git
cd leadvertex-clone
bash deploy-backend-new.sh
```

### Обновление
```bash
# На обоих серверах
cd /opt/leadvertex-clone
git pull
docker-compose down
docker-compose up -d --build
```

### Перезапуск
```bash
# Backend
docker-compose -f docker-compose.backend.yml restart

# Frontend
docker-compose -f docker-compose.frontend.yml restart
```

## ⚠️ Важные заметки

1. **Безопасность**: Все пароли должны быть изменены в продакшене
2. **Резервное копирование**: Настройте автоматический бэкап базы данных
3. **SSL сертификаты**: Обновляются автоматически через Let's Encrypt
4. **Логи**: Ротация логов настроена, но следите за размером дисков
5. **Мониторинг**: Используйте внешние сервисы для мониторинга доступности

---

**Обновлено**: 30.09.2025  
**Версия**: 2.0  
**Автор**: MiniMax Agent