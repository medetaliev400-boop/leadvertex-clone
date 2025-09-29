# 📋 Полная инструкция по развертыванию LeadVertex Clone на двух серверах

## 🏗️ Архитектура системы

```
┌─────────────────────┐    ┌─────────────────────┐
│   Frontend Server   │    │   Backend Server    │
│                     │    │                     │
│ moonline.pw      │◄──►│ api.moonline.pw  │
│ *.moonline.pw    │    │                     │
│                     │    │ PostgreSQL + Redis  │
│ Nginx + React       │    │ FastAPI + Celery    │
└─────────────────────┘    └─────────────────────┘
```

## 🚀 Пошаговое развертывание

### 1. Подготовка серверов

**Требования к серверам:**
- Ubuntu 20.04+ или CentOS 7+
- Docker и Docker Compose
- Минимум 2GB RAM для каждого сервера
- Открытые порты: 80, 443

**Установка Docker на оба сервера:**
```bash
# Ubuntu
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Настройка Backend сервера

```bash
# Клонируем проект на backend сервер
git clone https://github.com/medetaliev400-boop/leadvertex-clone.git
cd leadvertex-clone

# Запускаем скрипт развертывания
chmod +x deploy/deploy-backend.sh
./deploy/deploy-backend.sh

# Редактируем .env файл
nano .env
```

**Настройте .env для backend:**
```env
POSTGRES_PASSWORD=ваш_надежный_пароль
SECRET_KEY=ваш_супер_секретный_ключ_32_символа
FRONTEND_DOMAIN=https://moonline.pw,https://*.moonline.pw
BACKEND_URL=https://api.moonline.pw
DEBUG=false
```

### 3. Настройка Frontend сервера

```bash
# Клонируем проект на frontend сервер
git clone https://github.com/medetaliev400-boop/leadvertex-clone.git
cd leadvertex-clone

# Запускаем скрипт развертывания
chmod +x deploy/deploy-frontend.sh
./deploy/deploy-frontend.sh
```

### 4. Настройка DNS на Beget

**4.1 Заходим в панель управления Beget:**
1. Логинимся в beget.com
2. Переходим в раздел "Домены и поддомены"

**4.2 Настраиваем основные домены:**
```
Тип    | Имя              | Значение
-------|------------------|------------------
A      | moonline.pw   | IP_FRONTEND_SERVER
A      | www              | IP_FRONTEND_SERVER  
A      | api              | IP_BACKEND_SERVER
A      | *                | IP_FRONTEND_SERVER (wildcard)
```

**4.3 Создаем wildcard запись для поддоменов:**
- В панели Beget выберите домен
- Добавьте A-запись: `*` → IP вашего Frontend сервера
- Это позволит всем поддоменам указывать на Frontend

### 5. Настройка SSL сертификатов

**5.1 Для Backend (api.moonline.pw):**
```bash
# На backend сервере
mkdir -p ssl

# Установка certbot
sudo apt install certbot

# Получение сертификата
sudo certbot certonly --standalone -d api.moonline.pw

# Копирование сертификатов
sudo cp /etc/letsencrypt/live/api.moonline.pw/fullchain.pem ssl/api.moonline.pw.crt
sudo cp /etc/letsencrypt/live/api.moonline.pw/privkey.pem ssl/api.moonline.pw.key
sudo chown $USER:$USER ssl/*
```

**5.2 Для Frontend (wildcard сертификат):**
```bash
# На frontend сервере
mkdir -p ssl

# Получение wildcard сертификата (требует DNS validation)
sudo certbot certonly --manual --preferred-challenges dns -d moonline.pw -d *.moonline.pw

# Копирование сертификатов
sudo cp /etc/letsencrypt/live/moonline.pw/fullchain.pem ssl/moonline.pw.crt
sudo cp /etc/letsencrypt/live/moonline.pw/privkey.pem ssl/moonline.pw.key
sudo cp /etc/letsencrypt/live/moonline.pw/fullchain.pem ssl/wildcard.moonline.pw.crt
sudo cp /etc/letsencrypt/live/moonline.pw/privkey.pem ssl/wildcard.moonline.pw.key
sudo chown $USER:$USER ssl/*
```

### 6. Автоматическое создание поддоменов

**6.1 Система работает следующим образом:**

1. **Администратор создает проект** через админ-панель
2. **Система автоматически:**
   - Создает запись в БД: `project_id ↔ subdomain`
   - Вызывает API для создания DNS записи
   - Возвращает URLs проекта

**6.2 Настройка API для Beget:**

Создайте файл для интеграции с API Beget:

```python
# backend/app/services/beget_dns.py
import httpx
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class BegetDNSManager:
    def __init__(self):
        self.api_url = "https://api.beget.com/v1/dns"
        self.login = settings.BEGET_LOGIN
        self.password = settings.BEGET_PASSWORD
        
    async def create_subdomain(self, subdomain: str, ip: str) -> bool:
        """Создать A-запись для поддомена"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_url}/changeRecords",
                    data={
                        "login": self.login,
                        "passwd": self.password,
                        "input_format": "json",
                        "input_data": json.dumps({
                            "fqdn": f"{subdomain}.moonline.pw",
                            "records": [
                                {
                                    "type": "A",
                                    "value": ip,
                                    "priority": 0
                                }
                            ]
                        })
                    }
                )
                
                if response.status_code == 200:
                    logger.info(f"Subdomain {subdomain} created successfully")
                    return True
                else:
                    logger.error(f"Failed to create subdomain: {response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error creating subdomain: {str(e)}")
            return False
```

**6.3 Обновите .env на backend сервере:**
```env
# Добавьте данные для Beget API
BEGET_LOGIN=ваш_логин_beget
BEGET_PASSWORD=ваш_пароль_beget
FRONTEND_SERVER_IP=IP_вашего_frontend_сервера
```

### 7. Проверка работы системы

**7.1 Тестируем основные домены:**
```bash
# Проверяем backend API
curl https://api.moonline.pw/health

# Проверяем frontend
curl https://moonline.pw

# Проверяем создание поддомена через API
curl -X POST "https://api.moonline.pw/api/admin/projects/1/subdomain" \
  -H "Content-Type: application/json" \
  -d '{"subdomain": "testproject"}'
```

**7.2 Проверяем поддомен:**
```bash
# Ждем распространения DNS (до 10 минут)
curl https://testproject.moonline.pw
```

### 8. Мониторинг и логи

**8.1 Просмотр логов:**
```bash
# Backend сервер
docker-compose -f deploy/backend-server.yml logs -f backend

# Frontend сервер  
docker-compose -f deploy/frontend-server.yml logs -f frontend
```

**8.2 Мониторинг Celery (опционально):**
```bash
# На backend сервере включить Flower
docker-compose -f deploy/backend-server.yml --profile monitoring up -d flower

# Доступен на api.moonline.pw:5555
```

## 🔧 Troubleshooting

### Проблема: Поддомен не работает
1. Проверьте DNS: `nslookup subdomain.moonline.pw`
2. Проверьте логи nginx: `docker logs leadvertex_frontend`
3. Убедитесь, что wildcard запись настроена в DNS

### Проблема: CORS ошибки
1. Проверьте настройки CORS в backend/app/main.py
2. Убедитесь, что FRONTEND_DOMAIN правильно указан в .env

### Проблема: SSL сертификаты
1. Проверьте права доступа к файлам в папке ssl/
2. Убедитесь, что пути в nginx.conf правильные
3. Перезапустите контейнеры после изменения сертификатов

## ✅ Готовая система

После выполнения всех шагов у вас будет:

1. **Главная админ-панель:** https://moonline.pw
2. **API бэкенд:** https://api.moonline.pw  
3. **Автоматические поддомены:** https://project1.moonline.pw
4. **Мониторинг:** https://api.moonline.pw:5555

Создание нового проекта автоматически создаст поддомен через API Beget!