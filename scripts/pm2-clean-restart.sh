#!/bin/bash
# Полная очистка PM2 и запуск из единого ecosystem.
# Убивает все daemon'ы и процессы PM2, затем стартует backend, app, sklad-admin, боты.
# Запуск на сервере: cd /var/www/rich-garden && bash scripts/pm2-clean-restart.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ECOSYSTEM="$ROOT/ecosystem.config.cjs"

echo "=============================================="
echo "  Очистка PM2 и перезапуск из ecosystem"
echo "=============================================="
echo ""

echo "=== 1. Остановка всех процессов PM2 ==="
pkill -f "PM2 v6.*God Daemon" 2>/dev/null || true
pkill -f "ProcessContainerFork" 2>/dev/null || true
sleep 2
pm2 kill 2>/dev/null || true
rm -f /root/.pm2/rpc.sock /root/.pm2/pub.sock 2>/dev/null || true
echo "  PM2 остановлен."
echo ""

echo "=== 2. Запуск из $ECOSYSTEM ==="
cd "$ROOT"
pm2 start ecosystem.config.cjs
echo ""

echo "=== 3. Сохранение списка (pm2 save) ==="
pm2 save
echo ""

echo "=== 4. Текущий список процессов ==="
pm2 list
echo ""

echo "=============================================="
echo "  Готово. Порты: backend 8000, app 3000, admin 3001"
echo "=============================================="
