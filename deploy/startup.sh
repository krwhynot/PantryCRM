#!/bin/bash
set -e

echo "🚀 Starting Next.js application..."

# Environment validation
required_vars=(
    "DATABASE_URL"
    "JWT_SECRET"
    "NODE_ENV"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: Required environment variable $var is not set"
        exit 1
    fi
done

echo "✅ Environment variables validated"

# Run database migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy --schema=./prisma/schema.prisma || {
    echo "⚠️  Migration failed, but continuing (may be using managed database)"
}

# Optimize for production
if [ "$NODE_ENV" = "production" ]; then
    echo "🔧 Optimizing for production..."
    # Clear any development caches
    rm -rf .next/cache/webpack
fi

# Set process limits for Azure B1 tier
if [ -n "$WEBSITE_INSTANCE_ID" ]; then
    echo "☁️  Running on Azure App Service"
    # Azure B1 has 1.75GB RAM, set Node to use max 1.5GB
    export NODE_OPTIONS="--max-old-space-size=1536"
fi

# Start the application
echo "🌟 Starting server on port ${PORT:-3000}..."
exec node server.js