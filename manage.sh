#!/bin/bash

# Универсальный скрипт управления LeadVertex Clone
# Автор: MiniMax Agent

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода заголовков
print_header() {
    echo -e "${BLUE}$1${NC}"
}

# Функция для вывода успешных сообщений
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Функция для вывода предупреждений
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Функция для вывода ошибок
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Показать меню
show_menu() {
    print_header "🚀 LeadVertex Clone - Менеджер развертывания"
    echo "============================================="
    echo ""
    echo "BACKEND СЕРВЕР (157.230.27.200):"
    echo "  1) Развернуть Backend полностью"
    echo "  2) Перезапустить Backend сервисы"
    echo "  3) Показать логи Backend"
    echo "  4) Показать статус Backend"
    echo "  5) Остановить Backend"
    echo ""
    echo "FRONTEND СЕРВЕР (164.90.219.122):"
    echo "  6) Развернуть Frontend полностью"
    echo "  7) Перезапустить Frontend сервисы"
    echo "  8) Показать логи Frontend"
    echo "  9) Показать статус Frontend"
    echo "  10) Остановить Frontend"
    echo ""
    echo "ОБЩИЕ КОМАНДЫ:"
    echo "  11) Проверить здоровье всей системы"
    echo "  12) Очистить Docker ресурсы"
    echo "  13) Обновить код из Git"
    echo "  14) Показать документацию"
    echo ""
    echo "  0) Выход"
    echo ""
}

# Функция развертывания Backend
deploy_backend() {
    print_header "🚀 Развертывание Backend..."
    
    if [ ! -f "docker-compose.backend.yml" ]; then
        print_error "docker-compose.backend.yml не найден!"
        return 1
    fi
    
    ./deploy-backend-new.sh
}

# Функция развертывания Frontend
deploy_frontend() {
    print_header "🚀 Развертывание Frontend..."
    
    if [ ! -d "frontend" ]; then
        print_error "Директория frontend не найдена!"
        return 1
    fi
    
    ./deploy-frontend-new.sh
}

# Функция перезапуска Backend
restart_backend() {
    print_header "🔄 Перезапуск Backend сервисов..."
    docker-compose -f docker-compose.backend.yml restart
    print_success "Backend сервисы перезапущены"
}

# Функция перезапуска Frontend
restart_frontend() {
    print_header "🔄 Перезапуск Frontend сервисов..."
    if [ -f "docker-compose.frontend.yml" ]; then
        docker-compose -f docker-compose.frontend.yml restart
        print_success "Frontend сервисы перезапущены"
    else
        print_error "docker-compose.frontend.yml не найден"
    fi
}

# Функция показа логов Backend
show_backend_logs() {
    print_header "📋 Логи Backend сервисов..."
    docker-compose -f docker-compose.backend.yml logs --tail=100 -f
}

# Функция показа логов Frontend
show_frontend_logs() {
    print_header "📋 Логи Frontend сервисов..."
    if [ -f "docker-compose.frontend.yml" ]; then
        docker-compose -f docker-compose.frontend.yml logs --tail=100 -f
    else
        print_error "docker-compose.frontend.yml не найден"
    fi
}

# Функция показа статуса Backend
show_backend_status() {
    print_header "📊 Статус Backend сервисов..."
    docker-compose -f docker-compose.backend.yml ps
}

# Функция показа статуса Frontend
show_frontend_status() {
    print_header "📊 Статус Frontend сервисов..."
    if [ -f "docker-compose.frontend.yml" ]; then
        docker-compose -f docker-compose.frontend.yml ps
    else
        print_warning "docker-compose.frontend.yml не найден"
    fi
}

# Функция остановки Backend
stop_backend() {
    print_header "🛑 Остановка Backend сервисов..."
    docker-compose -f docker-compose.backend.yml down
    print_success "Backend сервисы остановлены"
}

# Функция остановки Frontend
stop_frontend() {
    print_header "🛑 Остановка Frontend сервисов..."
    if [ -f "docker-compose.frontend.yml" ]; then
        docker-compose -f docker-compose.frontend.yml down
        print_success "Frontend сервисы остановлены"
    else
        print_warning "docker-compose.frontend.yml не найден"
    fi
}

# Функция проверки здоровья системы
health_check() {
    print_header "🔍 Проверка здоровья системы..."
    
    echo ""
    echo "Backend проверки:"
    
    # Проверяем Backend API
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        print_success "Backend API: OK"
    else
        print_error "Backend API: НЕДОСТУПЕН"
    fi
    
    # Проверяем Backend Nginx
    if curl -k https://localhost/health > /dev/null 2>&1; then
        print_success "Backend Nginx: OK"
    else
        print_error "Backend Nginx: НЕДОСТУПЕН"
    fi
    
    echo ""
    echo "Frontend проверки:"
    
    # Проверяем Frontend
    if curl -f http://localhost/health > /dev/null 2>&1; then
        print_success "Frontend HTTP: OK"
    else
        print_error "Frontend HTTP: НЕДОСТУПЕН"
    fi
    
    # Проверяем Frontend HTTPS
    if curl -k https://localhost/health > /dev/null 2>&1; then
        print_success "Frontend HTTPS: OK"
    else
        print_error "Frontend HTTPS: НЕДОСТУПЕН"
    fi
    
    # Проверяем API проксирование
    if curl -k https://localhost/api/health > /dev/null 2>&1; then
        print_success "API Proxy: OK"
    else
        print_warning "API Proxy: НЕ РАБОТАЕТ (возможно backend недоступен)"
    fi
    
    echo ""
    echo "Docker статистика:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
}

# Функция очистки Docker ресурсов
clean_docker() {
    print_header "🧹 Очистка Docker ресурсов..."
    
    echo "Остановка всех контейнеров..."
    docker-compose -f docker-compose.backend.yml down 2>/dev/null || true
    [ -f "docker-compose.frontend.yml" ] && docker-compose -f docker-compose.frontend.yml down 2>/dev/null || true
    
    echo "Очистка неиспользуемых ресурсов..."
    docker system prune -f
    
    print_success "Docker ресурсы очищены"
}

# Функция обновления кода
update_code() {
    print_header "📥 Обновление кода из Git..."
    
    git fetch origin
    git pull origin main
    
    print_success "Код обновлен"
    print_warning "Не забудьте перезапустить сервисы после обновления"
}

# Функция показа документации
show_docs() {
    print_header "📚 Документация развертывания"
    
    if [ -f "FULL_DEPLOYMENT_GUIDE.md" ]; then
        echo "Полная документация находится в файле: FULL_DEPLOYMENT_GUIDE.md"
        echo ""
        echo "Основные URL после развертывания:"
        echo "- Frontend: https://moonline.pw/"
        echo "- Backend API: https://157.230.27.200:8000/docs"
        echo "- Health Check Backend: https://157.230.27.200:8000/health"
        echo "- Health Check Frontend: https://moonline.pw/health"
        echo ""
        echo "IP адреса серверов:"
        echo "- Frontend сервер: 164.90.219.122"
        echo "- Backend сервер: 157.230.27.200"
    else
        print_error "Файл документации не найден"
    fi
}

# Основной цикл
main() {
    while true; do
        show_menu
        read -p "Выберите действие: " choice
        
        case $choice in
            1)
                deploy_backend
                ;;
            2)
                restart_backend
                ;;
            3)
                show_backend_logs
                ;;
            4)
                show_backend_status
                ;;
            5)
                stop_backend
                ;;
            6)
                deploy_frontend
                ;;
            7)
                restart_frontend
                ;;
            8)
                show_frontend_logs
                ;;
            9)
                show_frontend_status
                ;;
            10)
                stop_frontend
                ;;
            11)
                health_check
                ;;
            12)
                clean_docker
                ;;
            13)
                update_code
                ;;
            14)
                show_docs
                ;;
            0)
                print_success "Выход из программы"
                exit 0
                ;;
            *)
                print_error "Неверный выбор. Попробуйте снова."
                ;;
        esac
        
        echo ""
        read -p "Нажмите Enter для продолжения..."
        clear
    done
}

# Проверяем что мы в правильной директории
if [ ! -f "docker-compose.backend.yml" ] && [ ! -d "frontend" ]; then
    print_error "Запустите скрипт из директории leadvertex-clone"
    exit 1
fi

# Запускаем основной цикл
main