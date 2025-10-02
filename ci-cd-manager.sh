#!/bin/bash

# Менеджер CI/CD для LeadVertex Clone
# Автор: MiniMax Agent

set -e

echo "🔄 LeadVertex Clone - CI/CD Manager"
echo "====================================="

function show_help() {
    echo "Использование: $0 [команда]"
    echo ""
    echo "Команды:"
    echo "  status      - Проверить статус серверов"
    echo "  deploy      - Запустить деплой вручную (если CI/CD не работает)"
    echo "  logs        - Показать логи GitHub Actions"
    echo "  setup       - Настроить секреты GitHub"
    echo "  health      - Проверить здоровье серверов"
    echo "  rollback    - Откатить на предыдущую версию"
    echo "  release     - Создать новый релиз"
    echo "  help        - Показать эту справку"
    echo ""
    echo "Примеры:"
    echo "  $0 status   # Проверить статус"
    echo "  $0 deploy   # Запустить деплой"
    echo "  $0 health   # Проверить серверы"
}

function check_status() {
    echo "📊 Проверка статуса серверов..."
    echo ""
    
    echo "🔍 Backend Server (159.89.108.100):"
    if curl -f -s --max-time 10 "http://159.89.108.100:8000/health" > /dev/null; then
        echo "  ✅ API работает"
    else
        echo "  ❌ API не отвечает"
    fi
    
    if curl -k -f -s --max-time 10 "https://159.89.108.100/health" > /dev/null; then
        echo "  ✅ HTTPS работает"
    else
        echo "  ❌ HTTPS не работает"
    fi
    
    echo ""
    echo "🔍 Frontend Server (139.59.158.109):"
    if curl -f -s --max-time 10 "http://139.59.158.109/health" > /dev/null; then
        echo "  ✅ Frontend работает"
    else
        echo "  ❌ Frontend не отвечает"
    fi
    
    if curl -k -f -s --max-time 10 "https://139.59.158.109/health" > /dev/null; then
        echo "  ✅ HTTPS работает"
    else
        echo "  ❌ HTTPS не работает"
    fi
    
    echo ""
    echo "🔍 Domain (moonline.pw):"
    if curl -k -f -s --max-time 10 "https://moonline.pw/health" > /dev/null; then
        echo "  ✅ Домен работает"
    else
        echo "  ⚠️  Домен не настроен или не работает"
    fi
    
    echo ""
    echo "🔍 API Proxy:"
    if curl -k -f -s --max-time 10 "https://139.59.158.109/api/health" > /dev/null; then
        echo "  ✅ API проксирование работает"
    else
        echo "  ⚠️  API проксирование не работает"
    fi
}

function manual_deploy() {
    echo "🚀 Запуск ручного деплоя..."
    echo ""
    echo "⚠️  Внимание: Ручной деплой следует использовать только если GitHub Actions не работает!"
    echo "📝 Обычно деплой происходит автоматически при push в main ветку."
    echo ""
    
    read -p "Продолжить ручной деплой? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Деплой отменен"
        exit 1
    fi
    
    echo "🔧 Выберите что деплоить:"
    echo "1) Backend только (159.89.108.100)"
    echo "2) Frontend только (139.59.158.109)"
    echo "3) Оба сервера"
    echo ""
    read -p "Выберите вариант (1-3): " choice
    
    case $choice in
        1)
            echo "🚀 Деплой Backend..."
            ssh root@159.89.108.100 "cd /opt/leadvertex-clone && git pull && ./deploy-backend-new.sh"
            ;;
        2)
            echo "🚀 Деплой Frontend..."
            ssh root@139.59.158.109 "cd /opt/leadvertex-clone && git pull && ./deploy-frontend-new.sh"
            ;;
        3)
            echo "🚀 Деплой Backend и Frontend..."
            echo "📦 Деплой Backend..."
            ssh root@159.89.108.100 "cd /opt/leadvertex-clone && git pull && ./deploy-backend-new.sh" &
            echo "📦 Деплой Frontend..."
            ssh root@139.59.158.109 "cd /opt/leadvertex-clone && git pull && ./deploy-frontend-new.sh" &
            wait
            echo "✅ Деплой завершен!"
            ;;
        *)
            echo "❌ Неверный выбор"
            exit 1
            ;;
    esac
    
    echo "✅ Деплой завершен! Проверьте статус командой: $0 status"
}

function show_logs() {
    echo "📋 Для просмотра логов GitHub Actions:"
    echo ""
    echo "1. Перейдите в репозиторий на GitHub"
    echo "2. Откройте вкладку 'Actions'"
    echo "3. Выберите последний workflow run"
    echo ""
    echo "🔗 Прямая ссылка: https://github.com/medetaliev400-boop/leadvertex-clone/actions"
}

function setup_secrets() {
    echo "🔐 Настройка секретов GitHub..."
    echo ""
    echo "Для работы CI/CD нужно добавить секрет SERVER_PASSWORD в GitHub:"
    echo ""
    echo "1. Перейдите в репозиторий: https://github.com/medetaliev400-boop/leadvertex-clone"
    echo "2. Settings → Secrets and variables → Actions"
    echo "3. Нажмите 'New repository secret'"
    echo "4. Name: SERVER_PASSWORD"
    echo "5. Secret: SBA12store"
    echo "6. Нажмите 'Add secret'"
    echo ""
    echo "📝 После добавления секрета CI/CD будет работать автоматически!"
}

function health_check() {
    echo "🏥 Детальная проверка здоровья серверов..."
    echo ""
    
    # Backend health
    echo "🔍 Backend Server (159.89.108.100):"
    echo "  📡 API Health:"
    curl -s "http://159.89.108.100:8000/health" | jq . 2>/dev/null || echo "    ❌ API не отвечает или не JSON"
    
    echo "  📊 API Docs:"
    if curl -f -s --max-time 5 "http://159.89.108.100:8000/docs" > /dev/null; then
        echo "    ✅ Swagger доступен"
    else
        echo "    ❌ Swagger недоступен"
    fi
    
    # Frontend health
    echo ""
    echo "🔍 Frontend Server (139.59.158.109):"
    echo "  🌐 Frontend Health:"
    curl -s "http://139.59.158.109/health" 2>/dev/null || echo "    ❌ Frontend не отвечает"
    
    # Docker статус через SSH
    echo ""
    echo "🐳 Docker контейнеры:"
    echo "  Backend:"
    ssh -o ConnectTimeout=10 root@159.89.108.100 "docker-compose -f /opt/leadvertex-clone/docker-compose.backend.yml ps" 2>/dev/null || echo "    ❌ Не удалось подключиться к Backend серверу"
    
    echo "  Frontend:"
    ssh -o ConnectTimeout=10 root@139.59.158.109 "docker-compose -f /opt/leadvertex-clone/docker-compose.frontend.yml ps" 2>/dev/null || echo "    ❌ Не удалось подключиться к Frontend серверу"
}

function rollback() {
    echo "⏪ Откат на предыдущую версию..."
    echo ""
    echo "⚠️  ВНИМАНИЕ: Это действие откатит код на предыдущий коммит!"
    echo ""
    
    # Показываем последние коммиты
    echo "📋 Последние коммиты:"
    git log --oneline -5
    echo ""
    
    read -p "Подтвердите откат (введите 'ROLLBACK'): " confirm
    
    if [ "$confirm" != "ROLLBACK" ]; then
        echo "❌ Откат отменен"
        exit 1
    fi
    
    echo "⏪ Выполняется откат..."
    git revert HEAD --no-edit
    git push origin main
    
    echo "✅ Откат выполнен! GitHub Actions автоматически запустит деплой."
}

function create_release() {
    echo "🏷️ Создание нового релиза..."
    echo ""
    
    read -p "Введите версию релиза (например, v1.0.0): " version
    read -p "Описание релиза: " description
    
    if [[ ! "$version" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo "❌ Неверный формат версии. Используйте v1.0.0"
        exit 1
    fi
    
    echo "🚀 Создание релиза $version..."
    echo "📝 Описание: $description"
    echo ""
    echo "📋 Для создания релиза:"
    echo "1. Перейдите в GitHub Actions"
    echo "2. Выберите workflow 'Create Release'"
    echo "3. Нажмите 'Run workflow'"
    echo "4. Введите версию: $version"
    echo "5. Введите описание: $description"
    echo ""
    echo "🔗 Прямая ссылка: https://github.com/medetaliev400-boop/leadvertex-clone/actions/workflows/release.yml"
}

# Основная логика
case "${1:-help}" in
    "status")
        check_status
        ;;
    "deploy")
        manual_deploy
        ;;
    "logs")
        show_logs
        ;;
    "setup")
        setup_secrets
        ;;
    "health")
        health_check
        ;;
    "rollback")
        rollback
        ;;
    "release")
        create_release
        ;;
    "help"|*)
        show_help
        ;;
esac