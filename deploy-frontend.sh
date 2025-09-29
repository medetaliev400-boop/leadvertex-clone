#!/bin/bash

# Скрипт развертывания фронтенда на отдельном сервере
# Для запуска на сервере 157.230.100.209

echo "🚀 Развертывание LeadVertex Frontend"
echo "👤 Сервер: 157.230.100.209"
echo "🔗 Backend API: 68.183.209.116:8000"
echo ""

# Проверяем что мы в правильной директории
if [[ ! -f "docker-compose.frontend.yml" ]]; then
    echo "❌ Ошибка: файл docker-compose.frontend.yml не найден"
    echo "📁 Убедитесь что вы в корне проекта leadvertex-clone"
    exit 1
fi

# Останавливаем предыдущие контейнеры если есть
echo "🛑 Остановка предыдущих контейнеров..."
docker-compose -f docker-compose.frontend.yml down

# Удаляем старые образы для пересборки
echo "🗑️ Очистка старых образов..."
docker system prune -f

# Собираем и запускаем фронтенд
echo "🔨 Сборка и запуск фронтенда..."
docker-compose -f docker-compose.frontend.yml up -d --build

# Проверяем статус
echo ""
echo "📊 Статус контейнеров:"
docker-compose -f docker-compose.frontend.yml ps

# Показываем логи
echo ""
echo "📋 Логи сборки (последние 20 строк):"
docker-compose -f docker-compose.frontend.yml logs --tail=20

echo ""
echo "✅ Развертывание завершено!"
echo ""
echo "🌐 Фронтенд доступен по адресам:"
echo "   • http://157.230.100.209"
echo "   • https://moonline.pw (после настройки DNS)"
echo ""
echo "🔧 Полезные команды:"
echo "   • Просмотр логов: docker-compose -f docker-compose.frontend.yml logs -f"
echo "   • Перезапуск: docker-compose -f docker-compose.frontend.yml restart"
echo "   • Остановка: docker-compose -f docker-compose.frontend.yml down"
echo ""