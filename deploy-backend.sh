#!/bin/bash

# Скрипт развертывания backend на production сервере
# Для запуска на сервере 68.183.209.116

echo "🚀 Развертывание LeadVertex Backend API"
echo "👤 Сервер: 68.183.209.116"
echo "🔗 Frontend: 157.230.100.209"
echo ""

# Проверяем что мы в правильной директории
if [[ ! -f "docker-compose.backend.yml" ]]; then
    echo "❌ Ошибка: файл docker-compose.backend.yml не найден"
    echo "📁 Убедитесь что вы в корне проекта leadvertex-clone"
    exit 1
fi

# Проверяем наличие .env файла
if [[ ! -f ".env" ]]; then
    echo "⚠️  Файл .env не найден, копируем из .env.backend"
    cp .env.backend .env
fi

# Останавливаем предыдущие контейнеры если есть
echo "🛑 Остановка предыдущих контейнеров..."
docker-compose -f docker-compose.backend.yml down

# Удаляем старые образы для пересборки
echo "🗑️ Очистка старых образов..."
docker system prune -f

# Создаем необходимые директории
echo "📁 Создание директорий..."
mkdir -p backend/logs
mkdir -p docker/ssl

# Проверяем SSL сертификаты
if [[ ! -f "docker/ssl/moonline.pw.crt" ]]; then
    echo "🔐 SSL сертификаты не найдены, создаем самоподписанные..."
    cd docker/ssl
    chmod +x setup-ssl.sh
    ./setup-ssl.sh
    cd ../..
fi

# Собираем и запускаем backend
echo "🔨 Сборка и запуск backend сервисов..."
docker-compose -f docker-compose.backend.yml up -d --build

# Ждем запуска сервисов
echo "⏳ Ожидание запуска сервисов..."
sleep 30

# Проверяем статус
echo ""
echo "📊 Статус контейнеров:"
docker-compose -f docker-compose.backend.yml ps

# Проверяем здоровье сервисов
echo ""
echo "🏥 Проверка здоровья сервисов:"
echo "Проверка API..."
sleep 10
curl -f http://localhost:8000/api/health || echo "⚠️ API health check failed"

# Показываем логи
echo ""
echo "📋 Логи backend (последние 20 строк):"
docker-compose -f docker-compose.backend.yml logs --tail=20 backend

echo ""
echo "✅ Развертывание backend завершено!"
echo ""
echo "🌐 Backend API доступен по адресам:"
echo "   • http://68.183.209.116:8000/api/"
echo "   • https://api.moonline.pw/api/ (после настройки DNS)"
echo "   • Docs: http://68.183.209.116:8000/docs"
echo ""
echo "🔧 Полезные команды:"
echo "   • Просмотр логов: docker-compose -f docker-compose.backend.yml logs -f"
echo "   • Перезапуск: docker-compose -f docker-compose.backend.yml restart"
echo "   • Остановка: docker-compose -f docker-compose.backend.yml down"
echo "   • Вход в контейнер: docker-compose -f docker-compose.backend.yml exec backend bash"
echo ""
echo "🧪 Тестирование API:"
echo "   curl http://68.183.209.116:8000/api/health"
echo "   curl http://68.183.209.116:8000/docs"
echo ""