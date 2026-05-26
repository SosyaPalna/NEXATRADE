#!/bin/bash
# ============================================================
# NexaTrade — Deployment Script
# ============================================================
# Run this on your VPS after cloning the repo

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOGS_DIR="$PROJECT_DIR/logs"

echo "🚀 Starting NexaTrade deployment..."
echo "📁 Project directory: $PROJECT_DIR"

# Create logs directory
mkdir -p "$LOGS_DIR"

# Check if .env exists
if [ ! -f "$PROJECT_DIR/backend/.env" ]; then
    echo "⚠️  backend/.env not found! Creating from .env.example..."
    cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/backend/.env"
    echo "❗ Please edit backend/.env and set your real credentials before continuing."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ required. Found: $(node -v)"
    exit 1
fi

echo "📦 Installing backend dependencies..."
cd "$PROJECT_DIR/backend"
npm ci --production

echo "📦 Installing frontend dependencies..."
cd "$PROJECT_DIR/frontend"
npm ci

echo "🔧 Building frontend..."
npm run build

echo "🗄️  Running Prisma generate..."
cd "$PROJECT_DIR/backend"
npx prisma generate

echo "🔄 Running database migrations..."
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations)" ]; then
    npx prisma migrate deploy
else
    echo "⚠️  No migrations found. Running prisma db push instead..."
    npx prisma db push
fi

echo "🚀 Starting application with PM2..."
cd "$PROJECT_DIR"
if command -v pm2 &> /dev/null; then
    pm2 reload ecosystem.config.js --env production || pm2 start ecosystem.config.js --env production
    pm2 save
    echo "✅ Application started with PM2"
else
    echo "⚠️  PM2 not found. Starting with node..."
    nohup node "$PROJECT_DIR/backend/index.js" > "$LOGS_DIR/out.log" 2> "$LOGS_DIR/error.log" &
    echo $! > "$PROJECT_DIR/nexatrade.pid"
    echo "✅ Application started (PID saved to nexatrade.pid)"
fi

echo ""
echo "✅ Deployment complete!"
echo "📊 Health check: curl http://localhost:8000/health"
echo ""
