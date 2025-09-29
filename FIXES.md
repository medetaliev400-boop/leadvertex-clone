# Исправления критических ошибок развертывания

## 🔧 Исправленные проблемы

### 1. ❌ Ошибка импорта Decimal из SQLAlchemy

**Проблема**: 
```
ImportError: cannot import name 'Decimal' from sqlalchemy
```

**Причина**: В SQLAlchemy нет типа `Decimal`, должен быть `DECIMAL` или `Numeric`

**Исправлено**:
- ✅ `/backend/app/models/cpa.py` - заменен `Decimal` на `DECIMAL`
- ✅ `/backend/app/models/order.py` - заменен `Decimal` на `DECIMAL` 
- ✅ `/backend/app/models/user.py` - заменен `Decimal` на `DECIMAL`

### 2. ❌ Отсутствующие SSL сертификаты и папки

**Проблема**:
```
cp: cannot create ... 'ssl/api.moonline.pw.key': No such file or directory
cannot load certificate "/etc/nginx/ssl/api.moonline.pw.crt"
```

**Исправлено**:
- ✅ Создана структура папок `docker/nginx/conf.d` и `docker/ssl`
- ✅ Добавлен скрипт `docker/ssl/setup-ssl.sh` для создания сертификатов
- ✅ Обновлен `docker-compose.prod.yml` с правильным монтированием SSL папки

### 3. ❌ Устаревший синтаксис HTTP/2 в Nginx

**Проблема**:
```
the "listen ... http2" directive is deprecated
```

**Исправлено**:
- ✅ Заменен `listen 443 ssl http2;` на `listen 443 ssl; http2 on;`
- ✅ Обновлены все конфигурационные файлы nginx

### 4. ❌ Конфликт server_name в Nginx

**Проблема**:
```
conflicting server name "api.moonline.pw" on 0.0.0.0:80
```

**Исправлено**:
- ✅ Убран конфликт server_name на порту 80
- ✅ Один server блок для HTTP → HTTPS редиректа
- ✅ Правильная структура upstream и proxy настроек

### 5. ❌ Дублирование CORS заголовков

**Проблема**: 
```
Два Access-Control-Allow-Origin заголовка для одного блока
```

**Исправлено**:
- ✅ Убрано дублирование CORS заголовков в `/uploads/` блоке
- ✅ Добавлены корректные CORS методы и заголовки

### 6. ❌ Неправильные права доступа к сертификатам

**Исправлено**:
- ✅ Сертификаты (.crt): права 644
- ✅ Приватные ключи (.key): права 600
- ✅ Добавлены инструкции по настройке в скрипт

## 🚀 Развертывание после исправлений

### Для разработки:

```bash
# 1. Создать SSL сертификаты
cd docker/ssl
bash setup-ssl.sh

# 2. Запуск с разработческими сертификатами
docker-compose -f docker-compose.yml --profile production up -d
```

### Для продакшена:

```bash
# 1. Получить реальные SSL сертификаты (Let's Encrypt)
sudo certbot certonly --nginx -d moonline.pw -d www.moonline.pw
sudo certbot certonly --nginx -d api.moonline.pw
sudo certbot certonly --nginx -d '*.moonline.pw' -d moonline.pw

# 2. Скопировать сертификаты
cp /etc/letsencrypt/live/moonline.pw/fullchain.pem docker/ssl/moonline.pw.crt
cp /etc/letsencrypt/live/moonline.pw/privkey.pem docker/ssl/moonline.pw.key
cp /etc/letsencrypt/live/api.moonline.pw/fullchain.pem docker/ssl/api.moonline.pw.crt
cp /etc/letsencrypt/live/api.moonline.pw/privkey.pem docker/ssl/api.moonline.pw.key
cp /etc/letsencrypt/live/moonline.pw/fullchain.pem docker/ssl/wildcard.moonline.pw.crt
cp /etc/letsencrypt/live/moonline.pw/privkey.pem docker/ssl/wildcard.moonline.pw.key

# 3. Установить правильные права
chmod 644 docker/ssl/*.crt
chmod 600 docker/ssl/*.key

# 4. Запуск продакшена
docker-compose -f docker-compose.prod.yml --profile production up -d
```

## 📝 Дополнительные улучшения

### Добавлены в конфигурацию Nginx:
- ✅ WebSocket поддержка с правильными заголовками
- ✅ Правильные таймауты для proxy
- ✅ Оптимизированное gzip сжатие с дополнительными типами файлов
- ✅ Расширенные типы статических файлов (woff, woff2, ttf, eot)
- ✅ Улучшенные заголовки безопасности
- ✅ Правильное кеширование с immutable флагом

### Структура файлов:
```
docker/
├── nginx/
│   ├── nginx.conf          # Основная конфигурация Nginx
│   └── conf.d/
│       └── default.conf    # Конфигурация виртуальных хостов
└── ssl/
    ├── setup-ssl.sh        # Скрипт создания сертификатов
    ├── .gitkeep            # Инструкции по сертификатам
    └── [сертификаты после создания]
```

## ✅ Проверка после исправлений

```bash
# Проверка синтаксиса Nginx
docker run --rm -v $(pwd)/docker/nginx:/etc/nginx nginx:alpine nginx -t

# Проверка правильности импортов Python
docker-compose -f docker-compose.prod.yml run --rm backend python -c "from app.models.cpa import CPAProgram; print('✅ Models import OK')"

# Проверка SSL сертификатов
openssl x509 -in docker/ssl/moonline.pw.crt -text -noout

# Проверка запуска контейнеров
docker-compose -f docker-compose.prod.yml --profile production up -d
docker-compose -f docker-compose.prod.yml ps
```

Все критические проблемы развертывания исправлены! 🎉