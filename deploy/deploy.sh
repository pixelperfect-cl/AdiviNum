#!/bin/bash
# ==============================================
# AdiviNum — Cloudways Deploy Script
# ==============================================
# Usage: cd ~/adivinum && bash deploy/deploy.sh
# ==============================================

set -e

echo "🚀 AdiviNum Deploy Started"
echo "=========================="

# Load NVM so we use Node 20+
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

APP_DIR=~/adivinum
PUBLIC_HTML=~/applications/rversgpswt/public_html

cd $APP_DIR
mkdir -p $APP_DIR/logs

# 1. Pull latest code
echo ""
echo "📥 [1/8] Pulling latest code..."
git pull origin main

# 2. Install dependencies
echo ""
echo "📦 [2/8] Installing dependencies..."
npm install --production=false

# 3. Prisma generate + migrate
echo ""
echo "🔧 [3/8] Generating Prisma client & running migrations..."
cd apps/server
npx prisma generate --schema=prisma/schema.prisma
npx prisma migrate deploy --schema=prisma/schema.prisma
cd $APP_DIR

# 4. Build shared (must be first — others depend on it)
echo ""
echo "📦 [4/8] Building shared package..."
cd packages/shared && npm run build
cd $APP_DIR

# 5. Build web app
echo ""
echo "🌐 [5/8] Building web app..."
cd apps/web && npm run build
cd $APP_DIR

# 6. Build admin panel
echo ""
echo "👑 [6/8] Building admin panel..."
cd apps/admin && npm run build
cd $APP_DIR

# 7. Build server
echo ""
echo "🏗️ [7/8] Building server..."
cd apps/server && npm run build
cd $APP_DIR

# 8. Deploy to public_html
echo ""
echo "🚀 [8/8] Deploying to public_html..."

# Web frontend → public_html/ (all built files including static assets from public/)
mkdir -p $PUBLIC_HTML/assets
cp -r apps/web/dist/* $PUBLIC_HTML/

# Admin panel → public_html/admin/
mkdir -p $PUBLIC_HTML/admin
cp -r apps/admin/dist/* $PUBLIC_HTML/admin/

# Server backend — no longer copying to public_html/backend
# Server runs directly from $APP_DIR/apps/server (has node_modules, .env, prisma)

# Restart Node server
echo ""
echo "🔄 Restarting server..."
OLD_PID=$(ps aux | grep 'node.*dist/main' | grep -v grep | awk '{print $2}')
if [ -n "$OLD_PID" ]; then
    kill $OLD_PID
    sleep 2
fi

cd $APP_DIR/apps/server
nohup node dist/main > $APP_DIR/logs/server.log 2>&1 &
cd $APP_DIR

# Health check
echo ""
echo "🏥 Running health check..."
sleep 5
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")

if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ Deploy successful! Server is healthy."
else
    echo "⚠️ Warning: Health check returned $HTTP_CODE"
    echo "   Check: ps aux | grep node"
    echo "   Logs: tail -50 $APP_DIR/logs/server.log"
fi

echo ""
echo "=========================="
echo "🎮 AdiviNum v1.0.7-BETA is live!"
echo "=========================="
