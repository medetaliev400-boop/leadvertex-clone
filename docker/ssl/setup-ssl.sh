#!/bin/bash

# Скрипт для настройки SSL сертификатов
# Замените yourdomain.com на ваш реальный домен

DOMAIN="yourdomain.com"
SSL_DIR="/workspace/leadvertex-clone/docker/ssl"

echo "🔐 Настройка SSL сертификатов для домена: $DOMAIN"

# Создаем папку для сертификатов если её нет
mkdir -p "$SSL_DIR"

# Функция для проверки и создания самоподписанных сертификатов (для разработки)
create_self_signed_cert() {
    local cert_name="$1"
    local domain="$2"
    
    if [[ ! -f "$SSL_DIR/$cert_name.crt" || ! -f "$SSL_DIR/$cert_name.key" ]]; then
        echo "📋 Создаем самоподписанный сертификат для $domain"
        
        # Создаем приватный ключ
        openssl genrsa -out "$SSL_DIR/$cert_name.key" 2048
        
        # Создаем сертификат
        openssl req -new -x509 -key "$SSL_DIR/$cert_name.key" \
            -out "$SSL_DIR/$cert_name.crt" \
            -days 365 \
            -subj "/CN=$domain" \
            -addext "subjectAltName=DNS:$domain,DNS:www.$domain"
        
        echo "✅ Сертификат создан: $cert_name"
    else
        echo "✅ Сертификат уже существует: $cert_name"
    fi
}

# Функция для создания wildcard сертификата
create_wildcard_cert() {
    local cert_name="wildcard.$DOMAIN"
    
    if [[ ! -f "$SSL_DIR/$cert_name.crt" || ! -f "$SSL_DIR/$cert_name.key" ]]; then
        echo "📋 Создаем wildcard сертификат для *.$DOMAIN"
        
        # Создаем приватный ключ
        openssl genrsa -out "$SSL_DIR/$cert_name.key" 2048
        
        # Создаем сертификат
        openssl req -new -x509 -key "$SSL_DIR/$cert_name.key" \
            -out "$SSL_DIR/$cert_name.crt" \
            -days 365 \
            -subj "/CN=*.$DOMAIN" \
            -addext "subjectAltName=DNS:*.$DOMAIN,DNS:$DOMAIN"
        
        echo "✅ Wildcard сертификат создан: $cert_name"
    else
        echo "✅ Wildcard сертификат уже существует: $cert_name"
    fi
}

# Создаем сертификаты
create_self_signed_cert "$DOMAIN" "$DOMAIN"
create_self_signed_cert "api.$DOMAIN" "api.$DOMAIN"
create_wildcard_cert

# Устанавливаем правильные права доступа
echo "🔒 Устанавливаем права доступа к сертификатам"
chmod 644 "$SSL_DIR"/*.crt
chmod 600 "$SSL_DIR"/*.key

echo "📁 Содержимое папки SSL:"
ls -la "$SSL_DIR"

echo ""
echo "🎉 SSL сертификаты настроены!"
echo ""
echo "⚠️  ВАЖНО: Это самоподписанные сертификаты только для разработки!"
echo "📝 Для продакшена используйте сертификаты от Let's Encrypt или другого CA"
echo ""
echo "💡 Команды для получения реальных сертификатов:"
echo "   # Let's Encrypt (certbot)"
echo "   sudo certbot certonly --nginx -d $DOMAIN -d www.$DOMAIN"
echo "   sudo certbot certonly --nginx -d api.$DOMAIN"  
echo "   sudo certbot certonly --nginx -d '*.$DOMAIN' -d $DOMAIN"
echo ""
echo "📋 После получения реальных сертификатов скопируйте их в docker/ssl/"
echo "   cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem docker/ssl/$DOMAIN.crt"
echo "   cp /etc/letsencrypt/live/$DOMAIN/privkey.pem docker/ssl/$DOMAIN.key"