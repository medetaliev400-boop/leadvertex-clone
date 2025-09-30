# 🚀 LeadVertex Clone

Система управления лидами и проектами с CPA партнерками.

## 🏗️ Архитектура системы

**Frontend сервер**: `164.90.219.122`
- React приложение с TypeScript
- Nginx reverse proxy
- SSL сертификаты

**Backend сервер**: `157.230.27.200`
- FastAPI приложение
- PostgreSQL 15 база данных
- Redis кеш
- Celery workers + beat
- Nginx API gateway

## 🚀 Быстрое развертывание

### Автоматическое развертывание

1. **На Backend сервере (157.230.27.200)**:
```bash
cd /opt
git clone https://github.com/medetaliev400-boop/leadvertex-clone.git
cd leadvertex-clone
bash deploy-backend-new.sh
```

2. **На Frontend сервере (164.90.219.122)**:
```bash
cd /opt
git clone https://github.com/medetaliev400-boop/leadvertex-clone.git
cd leadvertex-clone
bash deploy-frontend-new.sh
```

### Управление системой

```bash
# Универсальный менеджер
bash manage.sh

# Или отдельные команды:

# Backend управление
docker-compose -f docker-compose.backend.yml ps      # статус
docker-compose -f docker-compose.backend.yml logs -f # логи
docker-compose -f docker-compose.backend.yml restart # перезапуск

# Frontend управление
docker-compose -f docker-compose.frontend.yml ps      # статус
docker-compose -f docker-compose.frontend.yml logs -f # логи
docker-compose -f docker-compose.frontend.yml restart # перезапуск
```

## 🌐 Доступ к системе

- **Frontend**: https://moonline.pw/ или http://164.90.219.122/
- **Backend API**: https://157.230.27.200:8000/docs
- **Health Check**: 
  - Frontend: https://moonline.pw/health
  - Backend: https://157.230.27.200:8000/health

## 📚 Документация

**Полная документация развертывания**: [`FULL_DEPLOYMENT_GUIDE.md`](FULL_DEPLOYMENT_GUIDE.md)

## 🔧 Разработка

```bash
# Backend разработка
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend разработка
cd frontend
npm install
npm start
```

## 🔍 Проверка работоспособности

```bash
# Проверка backend
curl https://157.230.27.200:8000/health

# Проверка frontend
curl https://moonline.pw/health

# Проверка API через frontend
curl https://moonline.pw/api/health
```

## 🛠️ Технический стек

### Backend
- **FastAPI** - основной фреймворк
- **PostgreSQL 15** - основная база данных
- **Redis 7** - кеш и брокер сообщений
- **Celery** - фоновые задачи
- **Alembic** - миграции БД
- **Nginx** - reverse proxy

### Frontend
- **React 18** - UI фреймворк
- **TypeScript** - типизированный JavaScript
- **Tailwind CSS** - CSS фреймворк
- **React Router** - маршрутизация
- **Axios** - HTTP клиент
- **Nginx** - статический файл-сервер

### DevOps
- **Docker** & **Docker Compose** - контейнеризация
- **GitHub Actions** - CI/CD (планируется)
- **SSL/TLS** - безопасность
- **UFW** - firewall

## 📊 Мониторинг

### Логи системы
```bash
# Все логи backend
docker-compose -f docker-compose.backend.yml logs --tail=100 -f

# Все логи frontend
docker-compose -f docker-compose.frontend.yml logs --tail=100 -f

# Логи конкретного сервиса
docker-compose -f docker-compose.backend.yml logs backend -f
```

### Метрики
```bash
# Статистика контейнеров
docker stats

# Использование диска
df -h && docker system df

# Сетевые подключения
netstat -tulpn | grep -E ":(80|443|8000|5432|6379)"
```

## 🔐 Безопасность

- SSL сертификаты на обоих серверах
- Firewall настроен (UFW)
- CORS правильно сконфигурирован
- Безопасные заголовки в Nginx
- JWT аутентификация в API
- Валидация данных через Pydantic

## 🆘 Поддержка

При проблемах с развертыванием:

1. Проверьте логи: `docker-compose logs`
2. Проверьте статус: `docker-compose ps`
3. Перезапустите сервисы: `docker-compose restart`
4. Обратитесь к [`FULL_DEPLOYMENT_GUIDE.md`](FULL_DEPLOYMENT_GUIDE.md)