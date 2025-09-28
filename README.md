# 🚀 LeadVertex Clone - Full CRM System

Полнофункциональный клон системы LeadVertex.ru с расширенными возможностями для управления заказами, CRM, телефонии и автоматизации.

## ⚡ Быстрый запуск

```bash
# Клонировать репозиторий
git clone <repository-url>
cd leadvertex-clone

# Запустить в development режиме
./manage.sh start

# Или в production режиме
ENVIRONMENT=production ./manage.sh start
```

**Доступ к системе:**
- 🌐 **Frontend**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:8000
- 📚 **API Документация**: http://localhost:8000/api/docs
- 🌺 **Мониторинг Celery**: http://localhost:5555

**Демо аккаунты:**
- 👤 **Админ**: `admin@leadvertex.ru` / `admin123`
- 👨‍💼 **Оператор**: `operator@leadvertex.ru` / `operator123`

## 🏗️ Архитектура системы

### Backend (Python + FastAPI)
- **FastAPI** - современный веб-фреймворк с автоматической документацией
- **SQLAlchemy 2.0** - асинхронный ORM с поддержкой сложных запросов
- **PostgreSQL** - надежная реляционная база данных
- **Redis** - кэширование и очереди сообщений
- **Celery** - фоновые задачи и периодические процессы
- **Alembic** - управление миграциями базы данных

### Frontend (React + TypeScript)
- **React 18** - стабильная версия для продакшена
- **TypeScript** - типизированный JavaScript
- **Material-UI** - современный UI фреймворк
- **React Query** - управление состоянием сервера
- **React Router** - маршрутизация

### Инфраструктура
- **Docker** - контейнеризация всех сервисов
- **Nginx** - реверс-прокси для продакшена
- **Flower** - мониторинг Celery задач

## 🎯 Основные модули

### 📊 CRM система
- Управление заказами с настраиваемыми статусами
- Автоматическое назначение операторов
- История изменений и комментарии
- Фильтрация и поиск по заказам
- Экспорт данных в Excel

### 📞 Телефония и робо-прозвон
- Интеграция с Twilio и другими провайдерами
- Автоматический робо-прозвон
- Логирование всех звонков
- Статистика по звонкам
- Повторные звонки по расписанию

### 🎯 CPA-сеть
- Партнерская программа с webmaster'ами
- Отслеживание кликов и конверсий
- Система выплат и холдов
- Лендинг страницы
- Детальная аналитика

### 📦 Складской учет
- Управление товарами и остатками
- Автоматическое резервирование
- Уведомления о низких остатках
- История движения товаров
- Интеграция с заказами

### 📈 Аналитика и отчетность
- Dashboard с ключевыми метриками
- Конверсия по источникам трафика
- Производительность операторов
- Финансовые отчеты
- Экспорт отчетов

### 🔧 Автоматизация
- Правила автоматических действий
- SMS уведомления клиентам
- Email рассылки
- Интеграция с доставкой
- Webhook уведомления

## 📋 API совместимость

Система полностью совместима с оригинальным API LeadVertex:

```bash
# Получить информацию о проекте
GET /api/admin/getProjectInfo.html?token=YOUR_API_KEY

# Получить список статусов
GET /api/admin/getStatusList.html?token=YOUR_API_KEY

# Добавить заказ
POST /api/admin/addOrder.html?token=YOUR_API_KEY
```

Полная документация API доступна по адресу: http://localhost:8000/api/docs

## 🛠️ Команды управления

### Основные команды
```bash
./manage.sh start           # Запустить все сервисы
./manage.sh stop            # Остановить все сервисы
./manage.sh restart         # Перезапустить сервисы
./manage.sh status          # Показать статус сервисов
./manage.sh logs            # Показать логи всех сервисов
```

### Разработка
```bash
./manage.sh build           # Собрать Docker образы
./manage.sh rebuild         # Пересобрать и перезапустить
./manage.sh shell-backend   # Открыть shell backend'а
./manage.sh shell-db        # Открыть PostgreSQL консоль
./manage.sh test            # Запустить тесты
```

### База данных
```bash
./manage.sh init-db         # Инициализировать БД с демо данными
./manage.sh migrate         # Применить миграции
./manage.sh backup-db       # Создать бэкап БД
./manage.sh restore-db file.sql  # Восстановить из бэкапа
```

### Продакшен
```bash
ENVIRONMENT=production ./manage.sh start    # Продакшен режим
./manage.sh production      # Переключиться в продакшен
./manage.sh monitor         # Открыть интерфейсы мониторинга
./manage.sh clean          # Очистить контейнеры и volumes
```

## 🔧 Настройка для продакшена

### 1. Создание .env файла
```bash
cp .env.example .env
# Отредактируйте .env с вашими настройками
```

### 2. Обязательные переменные
```env
# Безопасность
SECRET_KEY=your-super-secret-key-change-in-production
DEBUG=false

# База данных
DATABASE_URL=postgresql+asyncpg://user:password@host/database
POSTGRES_PASSWORD=secure-password

# Redis (если внешний)
REDIS_URL=redis://your-redis-host:6379/0

# Twilio (для телефонии)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_phone_number

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### 3. Запуск в продакшене
```bash
# С Nginx и SSL
ENVIRONMENT=production ./manage.sh start

# Или с docker-compose напрямую
docker-compose -f docker-compose.prod.yml --profile production up -d
```

## 🔗 Интеграции

### SMS провайдеры
- SMS.ru
- SMSC.ru
- Twilio SMS

### Email провайдеры
- SMTP (Gmail, Yandex, etc.)
- SendGrid (планируется)

### Телефония
- Twilio Voice
- Asterisk PBX
- API для других провайдеров

### Доставка
- СДЭК
- Почта России
- Boxberry
- DPD (планируется)

### Платежи
- Stripe
- ЮKassa (планируется)
- Robokassa (планируется)

## 📊 Мониторинг и логирование

### Доступные интерфейсы
- **Flower**: http://localhost:5555 - мониторинг Celery задач
- **API Docs**: http://localhost:8000/api/docs - документация API
- **Health Check**: http://localhost:8000/health - проверка здоровья системы

### Логи
```bash
./manage.sh logs-backend    # Логи API сервера
./manage.sh logs-frontend   # Логи frontend
./manage.sh logs-celery     # Логи фоновых задач
```

### Метрики
- Производительность операторов
- Конверсия по источникам
- Время отклика API
- Нагрузка на сервер

## 🧪 Тестирование

### Запуск тестов
```bash
./manage.sh test            # Все тесты
./manage.sh shell-backend   # Для ручного тестирования
python -m pytest tests/unit/     # Unit тесты
python -m pytest tests/integration/  # Integration тесты
```

### Типы тестов
- **Unit тесты** - тестирование отдельных компонентов
- **Integration тесты** - тестирование интеграций
- **API тесты** - тестирование REST API
- **E2E тесты** - end-to-end тестирование

## 📚 Дополнительная документация

- [API Reference](docs/api.md) - подробное описание API
- [Database Schema](docs/database.md) - схема базы данных
- [Deployment Guide](docs/deployment.md) - руководство по развертыванию
- [Contributing](docs/contributing.md) - руководство для разработчиков

## 🤝 Поддержка и развитие

### Сообщить об ошибке
1. Создайте Issue в GitHub
2. Опишите проблему подробно
3. Приложите логи и скриншоты

### Предложить функцию
1. Создайте Feature Request
2. Опишите желаемую функциональность
3. Обоснуйте необходимость

## 📄 Лицензия

MIT License - см. файл [LICENSE](LICENSE)

## 🔧 Технические требования

### Минимальные
- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM
- 10GB свободного места

### Рекомендуемые
- Docker 24.0+
- Docker Compose 2.20+
- 8GB+ RAM
- 50GB+ свободного места
- SSD диск

## 🚀 Roadmap

### Версия 1.1
- [ ] Интеграция с ЮKassa
- [ ] Расширенная аналитика
- [ ] Mobile приложение
- [ ] WebSocket real-time уведомления

### Версия 1.2
- [ ] Multi-tenancy поддержка
- [ ] Расширенные права доступа
- [ ] API v2
- [ ] GraphQL support

---

**🎉 Готово! Ваш полнофункциональный клон LeadVertex готов к использованию!**

Для получения поддержки обращайтесь через GitHub Issues или документацию.