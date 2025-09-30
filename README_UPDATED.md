# 🚀 LeadVertex Clone - Полнофункциональная CRM система

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/medetaliev400-boop/leadvertex-clone)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.11+-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/react-18.2+-blue.svg)](https://reactjs.org)

**LeadVertex Clone** - это современная CRM система для управления заказами, клиентами и продажами, полностью совместимая с оригинальной функциональностью leadvertex.ru.

---

## 🏗️ Архитектура системы

```
┌─────────────────────────┐    ┌─────────────────────────┐
│   Frontend Server       │    │   Backend Server        │
│   139.59.158.109       │    │   159.89.108.100       │
├─────────────────────────┤    ├─────────────────────────┤
│ • React + TypeScript    │◄──►│ • FastAPI + Python      │
│ • Material-UI           │    │ • PostgreSQL 15         │
│ • Nginx                 │    │ • Redis 7               │
│ • SSL (Let's Encrypt)   │    │ • Celery Workers        │
└─────────────────────────┘    │ • Nginx (API Gateway)   │
                               └─────────────────────────┘
```

---

## ✨ Основные возможности

### 👥 Система пользователей и ролей
- **5 типов ролей**: Admin, Operator, Designer, Webmaster, Representative
- **Мультитенантность**: Несколько проектов на одной установке
- **Система разрешений**: Гибкая настройка доступа к функциям
- **JWT авторизация**: Безопасная аутентификация

### 📦 Управление заказами (CRM)
- **Полный жизненный цикл**: От создания до отгрузки
- **Статусы заказов**: Настраиваемые статусы с автоматизацией
- **UTM трекинг**: Отслеживание источников трафика
- **Комментарии**: Внутренние и клиентские заметки
- **Экспорт данных**: Excel/CSV экспорт заказов

### 🛒 Управление товарами
- **Каталог продуктов**: Неограниченное количество товаров
- **Склад и остатки**: Контроль запасов и уведомления
- **Ценообразование**: Гибкие цены и скидки
- **Категории**: Структурированная организация товаров
- **Фото товаров**: Загрузка и управление изображениями

### 📞 Call-центр и телефония
- **Интеграция с АТС**: Asterisk, FreePBX
- **Автообзвон**: Роботизированные звонки
- **Сценарии звонков**: Настраиваемые скрипты
- **Запись разговоров**: Сохранение и воспроизведение
- **Статистика звонков**: Аналитика эффективности

### 📱 SMS и уведомления
- **SMS рассылки**: Массовые и индивидуальные отправки
- **Email уведомления**: Автоматические письма клиентам
- **Шаблоны сообщений**: Готовые шаблоны для разных событий
- **Интеграция провайдеров**: SMS.ru, SMSC.ru, Twilio

### 🎯 CPA и партнерская программа
- **Вебмастера**: Управление партнерами
- **Комиссионные**: Автоматический расчет выплат
- **Конверсионная аналитика**: Отслеживание эффективности
- **API для интеграций**: RESTful API для внешних систем

### 🚚 Доставка и логистика
- **СДЭК интеграция**: Автоматический расчет стоимости
- **Почта России**: Отправка и трекинг посылок
- **Boxberry**: ПВЗ и курьерская доставка
- **Трек-номера**: Автоматическое отслеживание

### 📊 Аналитика и отчеты
- **Дашборд**: Ключевые метрики в реальном времени
- **Конверсии**: Воронка продаж и конверсии
- **Статистика операторов**: Производительность сотрудников
- **Финансовые отчеты**: Доходы, расходы, прибыль
- **Графики и диаграммы**: Визуализация данных

### 🤖 Автоматизация
- **Правила автоматизации**: Условная логика обработки
- **Автоназначение**: Распределение заказов между операторами
- **Уведомления**: Автоматические SMS/Email
- **Интеграции**: Webhook'и для внешних систем

### 🎨 Landing Pages
- **Конструктор страниц**: Создание посадочных страниц
- **Формы захвата**: Настраиваемые формы заказов
- **A/B тестирование**: Оптимизация конверсий
- **Адаптивный дизайн**: Мобильная оптимизация

---

## 🔧 Технический стек

### Backend
- **Framework**: FastAPI 0.104+
- **База данных**: PostgreSQL 15
- **Кеш и очереди**: Redis 7
- **Фоновые задачи**: Celery + Redis
- **Миграции**: Alembic
- **API документация**: Swagger/OpenAPI
- **Контейнеризация**: Docker + Docker Compose

### Frontend
- **Framework**: React 18 + TypeScript
- **UI библиотека**: Material-UI (MUI) 5
- **Состояние**: React Query + Context API
- **Роутинг**: React Router v6
- **Графики**: Recharts
- **HTTP клиент**: Axios
- **Билд система**: Create React App

### DevOps
- **Веб-сервер**: Nginx
- **SSL**: Let's Encrypt (Certbot)
- **Мониторинг**: Flower (Celery)
- **Логи**: Docker logging
- **Развертывание**: Bash скрипты

---

## 🚀 Быстрый старт

### Предварительные требования
- Ubuntu 20.04+ или CentOS 8+
- Docker 20.10+
- Docker Compose 2.0+
- Git
- 4 GB RAM (рекомендуется 8 GB)
- 40 GB свободного места

### 1. Развертывание Backend сервера

```bash
# Подключение к backend серверу
ssh root@159.89.108.100

# Клонирование репозитория
cd /opt
git clone https://github.com/medetaliev400-boop/leadvertex-clone.git
cd leadvertex-clone

# Автоматическое развертывание
bash deploy-backend-new.sh
```

### 2. Развертывание Frontend сервера

```bash
# Подключение к frontend серверу
ssh root@139.59.158.109

# Клонирование репозитория
cd /opt
git clone https://github.com/medetaliev400-boop/leadvertex-clone.git
cd leadvertex-clone

# Автоматическое развертывание
bash deploy-frontend-new.sh
```

### 3. Проверка работоспособности

```bash
# Проверка Backend API
curl http://159.89.108.100/api/health
curl http://159.89.108.100/docs

# Проверка Frontend
curl -I http://139.59.158.109/
```

---

## 📚 Документация

- **[📖 Полное руководство по развертыванию](DEPLOYMENT_GUIDE_COMPLETE.md)** - Детальная инструкция
- **[🖥️ Информация о серверах](SERVERS_INFO_NEW.md)** - Конфигурация инфраструктуры
- **[🔧 Скрипт управления](manage.sh)** - Автоматизированные команды

### API Документация

После развертывания API документация доступна по адресам:
- **Swagger UI**: http://159.89.108.100/docs
- **ReDoc**: http://159.89.108.100/redoc
- **OpenAPI Schema**: http://159.89.108.100/openapi.json

---

## 🌐 Доступ к системе

### Основные URL
- **Веб-интерфейс**: https://moonline.pw/
- **API Backend**: https://api.moonline.pw/
- **Мониторинг Celery**: http://159.89.108.100:5555/

### Первый вход
При первом запуске создайте суперпользователя через API:

```bash
curl -X POST "http://159.89.108.100/api/auth/register" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@example.com",
       "password": "secure_password_123",
       "first_name": "Администратор",
       "last_name": "Системы",
       "phone": "+7999123456"
     }'
```

---

## 🔧 Конфигурация

### Основные настройки (.env)

```env
# База данных
DATABASE_URL=postgresql+asyncpg://leadvertex_user:password@db:5432/leadvertex

# Redis
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1

# Безопасность
SECRET_KEY=your-secret-key-here
DEBUG=false

# Серверы
FRONTEND_SERVER_IP=139.59.158.109
BACKEND_SERVER_IP=159.89.108.100

# Домены
MAIN_DOMAIN=moonline.pw
CORS_ORIGINS=["https://moonline.pw","https://www.moonline.pw"]
```

### Настройка внешних интеграций

```env
# SMS провайдеры
SMS_RU_API_ID=your_sms_ru_api_id
SMSC_LOGIN=your_smsc_login
SMSC_PASSWORD=your_smsc_password

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Телефония
ASTERISK_HOST=your_asterisk_ip
ASTERISK_USERNAME=your_asterisk_user
ASTERISK_SECRET=your_asterisk_secret

# Доставка
CDEK_CLIENT_ID=your_cdek_client_id
CDEK_CLIENT_SECRET=your_cdek_client_secret
```

---

## 📊 Мониторинг и поддержка

### Состояние сервисов

```bash
# Проверка всех контейнеров
docker-compose -f docker-compose.backend.yml ps

# Логи сервисов
docker logs leadvertex-backend -f
docker logs leadvertex-db -f
docker logs leadvertex-redis -f

# Использование ресурсов
docker stats
```

### Резервное копирование

```bash
# Бэкап базы данных
docker exec leadvertex-db pg_dump -U leadvertex_user leadvertex > backup_$(date +%Y%m%d).sql

# Бэкап конфигураций
tar -czf configs_backup_$(date +%Y%m%d).tar.gz .env docker/ 

# Автоматический бэкап (добавить в crontab)
0 2 * * * /opt/leadvertex-clone/scripts/backup.sh
```

---

## 🤝 Сравнение с LeadVertex.ru

| Функция | LeadVertex.ru | LeadVertex Clone | Статус |
|---------|---------------|------------------|--------|
| CRM заказов | ✅ | ✅ | Полная совместимость |
| Управление товарами | ✅ | ✅ | Полная совместимость |
| Call-центр | ✅ | ✅ | Полная совместимость |
| SMS рассылки | ✅ | ✅ | Полная совместимость |
| CPA программа | ✅ | ✅ | Полная совместимость |
| Аналитика | ✅ | ✅ | Полная совместимость |
| Landing pages | ✅ | ✅ | Полная совместимость |
| Автоматизация | ✅ | ✅ | Полная совместимость |
| API интеграции | ✅ | ✅ | Расширенные возможности |
| Мобильный интерфейс | ✅ | ✅ | Улучшенная адаптивность |

---

## 📞 Поддержка

### Решение проблем

1. **Проверьте логи контейнеров**:
   ```bash
   docker logs leadvertex-backend --tail 100
   ```

2. **Перезапустите сервисы**:
   ```bash
   docker-compose -f docker-compose.backend.yml restart
   ```

3. **Проверьте состояние БД**:
   ```bash
   docker exec -it leadvertex-db psql -U leadvertex_user -d leadvertex
   ```

### Часто задаваемые вопросы

**Q: Как изменить пароль администратора?**
A: Используйте API endpoint `/api/auth/change-password` или обратитесь к базе данных напрямую.

**Q: Как добавить новый домен?**
A: Обновите настройки CORS_ORIGINS в .env файле и перезапустите backend.

**Q: Как масштабировать систему?**
A: Добавьте дополнительные Celery workers и настройте load balancer для API.

---

## 📄 Лицензия

Этот проект распространяется под лицензией MIT. См. файл [LICENSE](LICENSE) для подробной информации.

---

## 👨‍💻 Автор

**MiniMax Agent**  
Разработано в 2025 году

---

**🚀 Готов к продуктиву! Полная совместимость с LeadVertex.ru гарантирована!**