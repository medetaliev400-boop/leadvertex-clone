#!/bin/bash
# Скрипт для создания нового проекта с поддоменом

echo "🎯 Создание нового проекта с поддоменом"

# Проверяем параметры
if [ $# -ne 2 ]; then
    echo "Использование: $0 <название_проекта> <поддомен>"
    echo "Пример: $0 'Мой магазин' myshop"
    exit 1
fi

PROJECT_NAME="$1"
SUBDOMAIN="$2"
DOMAIN=${MAIN_DOMAIN:-"moonline.pw"}
BACKEND_URL=${BACKEND_URL:-"https://api.moonline.pw"}

echo "📋 Параметры проекта:"
echo "   Название: $PROJECT_NAME"
echo "   Поддомен: $SUBDOMAIN"
echo "   Полный адрес: https://$SUBDOMAIN.$DOMAIN"

# 1. Проверяем доступность поддомена
echo "🔍 Проверяем доступность поддомена..."
if nslookup "$SUBDOMAIN.$DOMAIN" >/dev/null 2>&1; then
    echo "❌ Поддомен $SUBDOMAIN.$DOMAIN уже существует!"
    exit 1
fi

# 2. Создаем проект через API
echo "🚀 Создаем проект через API..."
PROJECT_DATA=$(cat <<EOF
{
  "name": "$PROJECT_NAME",
  "subdomain": "$SUBDOMAIN",
  "settings": {
    "theme": "default",
    "language": "ru",
    "currency": "RUB"
  }
}
EOF
)

# Отправляем запрос на создание проекта
RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/admin/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d "$PROJECT_DATA")

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при создании проекта через API"
    exit 1
fi

# Извлекаем PROJECT_ID из ответа
PROJECT_ID=$(echo "$RESPONSE" | jq -r '.id')

if [ "$PROJECT_ID" == "null" ]; then
    echo "❌ Не удалось получить ID проекта"
    echo "Ответ API: $RESPONSE"
    exit 1
fi

echo "✅ Проект создан с ID: $PROJECT_ID"

# 3. Создаем поддомен через API
echo "🌐 Создаем поддомен через API..."
SUBDOMAIN_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/admin/projects/$PROJECT_ID/subdomain" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d "{\"subdomain\": \"$SUBDOMAIN\"}")

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при создании поддомена"
    exit 1
fi

echo "✅ Поддомен создан!"

# 4. Ждем распространения DNS
echo "⏳ Ожидаем распространения DNS (может занять до 10 минут)..."
ATTEMPTS=0
MAX_ATTEMPTS=60

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    if nslookup "$SUBDOMAIN.$DOMAIN" >/dev/null 2>&1; then
        echo "✅ DNS запись распространилась!"
        break
    fi
    
    ATTEMPTS=$((ATTEMPTS + 1))
    echo "   Попытка $ATTEMPTS/$MAX_ATTEMPTS..."
    sleep 10
done

if [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; then
    echo "⚠️ DNS запись еще не распространилась, но проект создан"
    echo "   Попробуйте через несколько минут"
fi

# 5. Проверяем работу поддомена
echo "🧪 Проверяем работу поддомена..."
sleep 5

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$SUBDOMAIN.$DOMAIN" || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Поддомен работает корректно!"
elif [ "$HTTP_STATUS" = "000" ]; then
    echo "⚠️ Поддомен пока недоступен (DNS еще не распространился)"
else
    echo "⚠️ Поддомен возвращает код: $HTTP_STATUS"
fi

# 6. Выводим итоговую информацию
echo ""
echo "🎉 Проект '$PROJECT_NAME' успешно создан!"
echo ""
echo "📋 Информация о проекте:"
echo "   ID проекта: $PROJECT_ID"
echo "   Поддомен: $SUBDOMAIN"
echo "   Публичный URL: https://$SUBDOMAIN.$DOMAIN"
echo "   Админ URL: https://$DOMAIN/projects/$PROJECT_ID"
echo "   API endpoint: $BACKEND_URL/api/admin/projects/$PROJECT_ID"
echo ""
echo "📝 Следующие шаги:"
echo "   1. Настройте проект в админ-панели"
echo "   2. Добавьте товары и настройте платежи"
echo "   3. Поделитесь ссылкой с клиентами: https://$SUBDOMAIN.$DOMAIN"
echo ""

# 7. Опционально - открываем в браузере (если установлен)
if command -v xdg-open >/dev/null 2>&1; then
    echo "🌐 Открываем проект в браузере..."
    xdg-open "https://$SUBDOMAIN.$DOMAIN"
elif command -v open >/dev/null 2>&1; then
    echo "🌐 Открываем проект в браузере..."
    open "https://$SUBDOMAIN.$DOMAIN"
fi

echo "✅ Готово!"