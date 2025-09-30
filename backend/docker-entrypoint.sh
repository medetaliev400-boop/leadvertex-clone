#!/bin/bash
set -e

echo "🚀 Starting LeadVertex Backend (FastAPI)..."

# Wait for database
echo "⏳ Waiting for database..."
while ! pg_isready -h db -p 5432 -U leadvertex_user; do
    echo "Database is unavailable - sleeping"
    sleep 1
done
echo "✅ Database is ready!"

# Wait for Redis
echo "⏳ Waiting for Redis..."
while ! redis-cli -h redis ping; do
    echo "Redis is unavailable - sleeping"
    sleep 1
done
echo "✅ Redis is ready!"

# Run database migrations with Alembic
echo "🔄 Running database migrations..."
alembic upgrade head || echo "⚠️ Migration failed or no migrations found"

# Create directories if they don't exist
mkdir -p /app/uploads /app/logs /app/static /app/media

echo "🎉 Backend initialization completed!"

# Execute the main command
exec "$@"