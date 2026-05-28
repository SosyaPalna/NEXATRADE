#!/bin/bash
# ============================================================
# NexaTrade — Critical Security Fixes Script
# Run this ON THE SERVER as root
# ============================================================
set -e

PROJECT_DIR="/var/www/nexatrade"
NGINX_CONF="/etc/nginx/sites-available/nexatrade"
NGINX_ENABLED="/etc/nginx/sites-enabled/nexatrade"

echo "🔒 NexaTrade Security Fix Script"
echo "================================="

# 1. Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root (sudo)"
    exit 1
fi

# 2. Backup current nginx config
if [ -f "$NGINX_CONF" ]; then
    cp "$NGINX_CONF" "$NGINX_CONF.bak.$(date +%Y%m%d_%H%M%S)"
    echo "✅ Nginx config backed up"
fi

# 3. Copy new nginx config (assumes nginx.conf is in project root)
if [ -f "$PROJECT_DIR/nginx.conf" ]; then
    cp "$PROJECT_DIR/nginx.conf" "$NGINX_CONF"
    echo "✅ New nginx.conf installed"
else
    echo "⚠️  $PROJECT_DIR/nginx.conf not found. Please upload it first."
    exit 1
fi

# Ensure symlink exists
if [ ! -L "$NGINX_ENABLED" ]; then
    ln -sf "$NGINX_CONF" "$NGINX_ENABLED"
    echo "✅ Nginx symlink created"
fi

# Remove default site if exists
if [ -L /etc/nginx/sites-enabled/default ]; then
    rm -f /etc/nginx/sites-enabled/default
    echo "✅ Default nginx site removed"
fi

# 4. Check and remove .git from web root (CRITICAL)
if [ -d "$PROJECT_DIR/.git" ]; then
    echo "🚨 Found .git directory in web root!"
    echo "   Options:"
    echo "   1) Delete .git completely (safe if you don't need git on server)"
    echo "   2) Keep .git but block via nginx (already in new config)"
    read -p "   Delete .git folder? [y/N]: " answer
    if [[ "$answer" =~ ^[Yy]$ ]]; then
        rm -rf "$PROJECT_DIR/.git"
        echo "✅ .git directory removed"
    else
        echo "⚠️  Keeping .git — ensure nginx blocks it (already configured)"
    fi
fi

# 5. Check for .env files in web root
for f in "$PROJECT_DIR/.env" "$PROJECT_DIR/.env.local" "$PROJECT_DIR/.env.production" "$PROJECT_DIR/.env.development"; do
    if [ -f "$f" ]; then
        echo "🚨 Found env file in web root: $f"
        echo "   Move it to $PROJECT_DIR/backend/.env or delete if not needed"
    fi
done

# 6. Test nginx syntax
echo "🔧 Testing nginx configuration..."
if nginx -t; then
    echo "✅ Nginx config is valid"
else
    echo "❌ Nginx config test failed! Restoring backup..."
    cp "$NGINX_CONF.bak."* "$NGINX_CONF"
    nginx -t
    exit 1
fi

# 7. Reload nginx
echo "🔄 Reloading nginx..."
systemctl reload nginx
echo "✅ Nginx reloaded"

# 8. Install express-rate-limit if not present
cd "$PROJECT_DIR/backend"
if ! npm list express-rate-limit >/dev/null 2>&1; then
    echo "📦 Installing express-rate-limit..."
    npm install express-rate-limit
fi

# 9. Restart backend
echo "🔄 Restarting backend..."
cd "$PROJECT_DIR"
if command -v pm2 &> /dev/null; then
    pm2 reload nexatrade-backend || pm2 restart nexatrade-backend
    echo "✅ Backend restarted via PM2"
else
    echo "⚠️  PM2 not found. Please restart backend manually."
fi

# 10. Quick verification
echo ""
echo "🔍 Running quick checks..."
echo "   Checking .git access (should return 404):"
curl -s -o /dev/null -w "%{http_code}" https://nexatrade.ru/.git/config || echo " (check manually)"

echo ""
echo "================================="
echo "✅ Security fixes applied!"
echo ""
echo "Next steps:"
echo "  1. Verify site loads: https://nexatrade.ru"
echo "  2. Run SafeScan again to confirm fixes"
echo "  3. Consider adding CAPTCHA to login/register forms"
echo ""
