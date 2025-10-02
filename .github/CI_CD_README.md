# CI/CD Пиплайн для LeadVertex Clone

Автоматическая система развертывания приложения на продакшен сервера.

## 🚀 Обзор

Наш CI/CD пиплайн автоматически развертывает приложение на два отдельных сервера:

- **Backend Server**: `159.89.108.100` - API, база данных, Redis
- **Frontend Server**: `139.59.158.109` - React приложение, Nginx

## 🌊 Поток работы (Workflow)

### 1. Development Workflow

```
Feature Branch → Pull Request → Code Review → Merge to Main → Auto Deploy
```

### 2. Автоматические действия

- **При push в main/master**: Полный деплой на продакшен
- **При push в другие ветки**: Только тестирование и проверки
- **При открытии PR**: Автоматические тесты
- **Каждые 15 минут**: Проверка здоровья серверов

## 🛠️ GitHub Actions Workflows

### 1. `deploy.yml` - Основной деплой

Запускается при push/merge в main/master ветку.

**Этапы:**
1. **Test** - Проверка кода и сборка
2. **Deploy Backend** - Деплой на 159.89.108.100
3. **Deploy Frontend** - Деплой на 139.59.158.109
4. **Notify** - Уведомление о результате

### 2. `development.yml` - Тестирование веток

Запускается при push в feature ветки и PR.

**Проверки:**
- Линтинг frontend кода
- Сборка frontend приложения
- Проверка синтаксиса backend кода

### 3. `health-check.yml` - Мониторинг

Запускается каждые 15 минут автоматически.

**Проверки:**
- Статус Backend API
- Статус Frontend приложения
- Работа домена moonline.pw
- Проксирование API

## 🔐 Настройка секретов

В настройках GitHub репозитория (Settings > Secrets and variables > Actions) нужно добавить:

```
SERVER_PASSWORD - Пароль для SSH подключения к серверам
```

### Как добавить секрет:

1. Перейдите в репозиторий на GitHub
2. Settings → Secrets and variables → Actions
3. Нажмите "New repository secret"
4. Name: `SERVER_PASSWORD`
5. Secret: `SBA12store`
6. Нажмите "Add secret"

## 📝 Как работать с системой

### Разработка новой фичи

```bash
# 1. Создайте новую ветку
git checkout -b feature/new-feature

# 2. Внесите изменения
# ... работа над кодом ...

# 3. Отправьте в репозиторий
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# 4. Создайте Pull Request
# Автоматически запустятся тесты

# 5. После ревью и мерджа в main
# Автоматически запустится деплой
```

### Хотфикс на продакшен

```bash
# 1. Прямой push в main (только для критических исправлений!)
git checkout main
git pull origin main

# 2. Внесите исправления
# ... hotfix ...

git add .
git commit -m "hotfix: fix critical issue"
git push origin main

# Автоматически запустится деплой
```

## 🔍 Мониторинг и отладка

### Просмотр статуса деплоя

1. Перейдите в репозиторий на GitHub
2. Вкладка "Actions"
3. Выберите последний workflow run

### Ручной запуск проверки здоровья

1. Actions → "Health Check Servers"
2. Кнопка "Run workflow"

### Проверка серверов вручную

```bash
# Backend
curl http://159.89.108.100:8000/health
curl -k https://159.89.108.100/health

# Frontend
curl http://139.59.158.109/health
curl -k https://139.59.158.109/health

# Domain
curl -k https://moonline.pw/health

# API Proxy
curl -k https://139.59.158.109/api/health
```

## 📈 Преимущества CI/CD

✅ **Автоматический деплой** - На push в main обновляется весь стек

✅ **Надежность** - Проверки перед деплоем

✅ **Мониторинг** - Автоматическая проверка здоровья

✅ **Откат** - Легко откатиться на предыдущую версию

✅ **Параллельный деплой** - Backend и Frontend деплоятся одновременно

## 🐛 Устранение неполадок

### Деплой падает

1. Проверьте логи в GitHub Actions
2. Проверьте доступность серверов
3. Проверьте правильность секретов

### Исправление через SSH

```bash
# Подключение к Backend
ssh root@159.89.108.100
cd /opt/leadvertex-clone
./deploy-backend-new.sh

# Подключение к Frontend
ssh root@139.59.158.109
cd /opt/leadvertex-clone
./deploy-frontend-new.sh
```

### Откат на предыдущую версию

```bash
# Откат коммита
git revert HEAD
git push origin main

# Или жесткий reset (осторожно!)
git reset --hard HEAD~1
git push --force origin main
```

---

**Автор**: MiniMax Agent  
**Обновлено**: 2025-10-02