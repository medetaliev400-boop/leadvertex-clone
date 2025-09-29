#!/bin/bash
# Скрипт развертывания на Frontend сервере

echo "🚀 Начинаем развертывание Frontend сервера..."

# 1. Подготовка окружения
echo "📝 Создаем .env файл..."
cat > .env << EOF
# Backend URL (адрес вашего Backend сервера)
BACKEND_URL=https://api.moonline.pw

# React App API URL для сборки
REACT_APP_API_URL=https://api.moonline.pw

# Домены
MAIN_DOMAIN=moonline.pw
WILDCARD_DOMAIN=*.moonline.pw
EOF

# 2. Создаем директории
mkdir -p ssl
mkdir -p nginx

# 3. Обновляем nginx конфигурацию с правильными доменами
echo "📁 Настраиваем nginx..."
cp deploy/nginx/frontend-nginx.conf nginx/

# Используем предопределенный домен
DOMAIN=moonline.pw
echo "Настраиваем для домена: $DOMAIN"
sed -i "s/moonline.pw/$DOMAIN/g" nginx/frontend-nginx.conf
sed -i "s/\${BACKEND_URL}/https:\/\/api.$DOMAIN/g" nginx/frontend-nginx.conf

# 4. Обновляем Docker Compose
sed -i "s/moonline.pw/$DOMAIN/g" deploy/frontend-server.yml
sed -i "s/\${BACKEND_URL}/https:\/\/api.$DOMAIN/g" deploy/frontend-server.yml

# 5. Собираем frontend с правильным API URL
echo "🔨 Собираем frontend..."
cd frontend
REACT_APP_API_URL=https://api.$DOMAIN npm run build
cd ..

# 6. Запускаем контейнеры
echo "🐳 Запускаем Docker контейнеры..."
docker-compose -f deploy/frontend-server.yml up -d --build

# 7. Ждем запуска
echo "⏳ Ожидаем запуска сервисов..."
sleep 20

# 8. Проверяем статус
echo "✅ Проверяем статус сервисов..."
docker-compose -f deploy/frontend-server.yml ps

# 9. Тестируем фронтенд
echo "🧪 Тестируем frontend..."
curl -f http://localhost:80 || echo "❌ Frontend не отвечает"

echo "✅ Frontend сервер развернут!"
echo "📋 Следующие шаги:"
echo "   1. Настройте SSL сертификаты:"
echo "      - Основной: ./ssl/$DOMAIN.crt и ./ssl/$DOMAIN.key"
echo "      - Wildcard: ./ssl/wildcard.$DOMAIN.crt и ./ssl/wildcard.$DOMAIN.key"
echo "   2. Настройте DNS записи:"
echo "      - $DOMAIN -> IP этого сервера"
echo "      - *.$DOMAIN -> IP этого сервера (wildcard)"
echo "   3. Перезапустите после настройки SSL:"
echo "      docker-compose -f deploy/frontend-server.yml restart"