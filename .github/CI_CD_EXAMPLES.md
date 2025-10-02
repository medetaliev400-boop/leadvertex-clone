# 🚀 Примеры использования CI/CD

## Быстрый старт

### 1. Первоначальная настройка

```bash
# Клонируем репозиторий
git clone https://github.com/medetaliev400-boop/leadvertex-clone.git
cd leadvertex-clone

# Даем права на выполнение CI/CD менеджера
chmod +x ci-cd-manager.sh

# Настраиваем секреты GitHub (один раз)
./ci-cd-manager.sh setup
```

### 2. Ежедневная работа

```bash
# Проверяем статус серверов
./ci-cd-manager.sh status

# Создаем новую фичу
git checkout -b feature/new-dashboard
# ... работаем над кодом ...
git add .
git commit -m "feat: add new dashboard"
git push origin feature/new-dashboard

# Создаем Pull Request на GitHub
# После мержа в main - автоматический деплой!
```

## 📋 Сценарии использования

### Сценарий 1: Обычная разработка

```bash
# 1. Создаем ветку для новой фичи
git checkout main
git pull origin main
git checkout -b feature/user-authentication

# 2. Разрабатываем фичу
# ... кодинг ...

# 3. Коммитим изменения
git add .
git commit -m "feat: add user authentication system"
git push origin feature/user-authentication

# 4. Создаем PR на GitHub
# - Автоматически запустятся тесты
# - После review и merge - автодеплой
```

### Сценарий 2: Хотфикс на продакшене

```bash
# 1. Создаем hotfix ветку
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-fix

# 2. Исправляем критическую ошибку
# ... быстрый фикс ...

# 3. Быстрый деплой
git add .
git commit -m "hotfix: fix critical security issue"
git push origin hotfix/critical-bug-fix

# 4. Экстренный merge в main
git checkout main
git merge hotfix/critical-bug-fix
git push origin main
# Автоматический деплой запустится в течение 1-2 минут
```

### Сценарий 3: Создание релиза

```bash
# 1. Убеждаемся что main стабилен
git checkout main
git pull origin main
./ci-cd-manager.sh status

# 2. Создаем релиз через GitHub Actions
./ci-cd-manager.sh release
# Или прямо через GitHub UI

# 3. Релиз автоматически деплоится
```

### Сценарий 4: Откат изменений

```bash
# Если что-то пошло не так
./ci-cd-manager.sh rollback

# Или ручной откат конкретного коммита
git revert abc123def
git push origin main
```

## 🔧 Продвинутые сценарии

### Параллельная разработка команды

```bash
# Разработчик A
git checkout -b feature/frontend-redesign
# ... работает над UI ...

# Разработчик B
git checkout -b feature/api-optimization
# ... оптимизирует API ...

# Разработчик C
git checkout -b feature/database-migration
# ... работает с БД ...

# Все создают PR независимо
# CI/CD тестирует каждый PR
# После merge - автоматический деплой
```

### Staging и Production окружения

```bash
# Для staging (если настроено)
git push origin develop  # деплой на staging

# Для production
git push origin main     # деплой на production
```

### Мониторинг и отладка

```bash
# Проверка здоровья серверов
./ci-cd-manager.sh health

# Детальный статус
./ci-cd-manager.sh status

# Просмотр логов деплоя
./ci-cd-manager.sh logs

# Ручной деплой (если CI/CD сломан)
./ci-cd-manager.sh deploy
```

## 🎯 Best Practices

### 1. Именование коммитов

```bash
# Хорошо
git commit -m "feat: add user dashboard"
git commit -m "fix: resolve login timeout issue"
git commit -m "docs: update API documentation"
git commit -m "refactor: optimize database queries"

# Плохо
git commit -m "fix"
git commit -m "updates"
git commit -m "работает"
```

### 2. Именование веток

```bash
# Фичи
feature/user-authentication
feature/dashboard-redesign
feature/api-v2

# Багфиксы
bugfix/login-error
bugfix/memory-leak

# Хотфиксы
hotfix/security-patch
hotfix/critical-crash

# Релизы
release/v1.2.0
release/v2.0.0-beta
```

### 3. Pull Request workflow

```bash
# 1. Создаем PR с хорошим описанием
# 2. Ждем автоматические проверки
# 3. Проводим code review
# 4. Мержим после одобрения
# 5. Автоматический деплой
```

## 🚨 Устранение проблем

### Проблема: Деплой упал

```bash
# 1. Проверяем логи
./ci-cd-manager.sh logs

# 2. Проверяем статус серверов
./ci-cd-manager.sh health

# 3. Если нужно - ручной деплой
./ci-cd-manager.sh deploy

# 4. Если критично - откат
./ci-cd-manager.sh rollback
```

### Проблема: Сервер не отвечает

```bash
# Подключение к серверам по SSH
ssh root@159.89.108.100  # Backend
ssh root@139.59.158.109  # Frontend

# Проверка контейнеров
docker ps
docker-compose ps
docker logs <container_name>

# Перезапуск сервисов
docker-compose restart
```

### Проблема: GitHub Actions не запускается

```bash
# 1. Проверяем секреты в GitHub
./ci-cd-manager.sh setup

# 2. Проверяем права репозитория
# Settings → Actions → General → Workflow permissions

# 3. Ручной запуск workflow
# Actions → Choose workflow → Run workflow
```

## 📊 Мониторинг

### Автоматический мониторинг

- ✅ GitHub Actions проверяет серверы каждые 15 минут
- ✅ Уведомления о падении сервисов
- ✅ Логи всех деплоев

### Ручной мониторинг

```bash
# Быстрая проверка
curl https://moonline.pw/health
curl https://api.moonline.pw/health

# Детальная проверка
./ci-cd-manager.sh health

# Статус контейнеров
ssh root@159.89.108.100 "docker ps"
ssh root@139.59.158.109 "docker ps"
```

---

**💡 Подсказка**: Добавьте этот репозиторий в закладки GitHub для быстрого доступа к CI/CD!

**🔗 Полезные ссылки**:
- [GitHub Actions](https://github.com/medetaliev400-boop/leadvertex-clone/actions)
- [Releases](https://github.com/medetaliev400-boop/leadvertex-clone/releases)
- [Issues](https://github.com/medetaliev400-boop/leadvertex-clone/issues)

---

**Автор**: MiniMax Agent  
**Обновлено**: 2025-10-02