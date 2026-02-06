#!/bin/bash
# Полный деплой: сборка app + Sklad, очистка PM2, запуск из ecosystem.
# Запуск на сервере: cd /var/www/rich-garden && bash scripts/deploy.sh
# Требует: npm, node, python venv, pm2. При Permission denied на .next — запускать от root или sudo.

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=============================================="
echo "  Деплой Rich Garden"
echo "=============================================="
echo ""

echo "=== 1. Сборка rich-garden-app ==="
bash "$ROOT/scripts/build-and-reload-app.sh" || true
echo ""

echo "=== 2. Сборка Sklad (sklad-admin) ==="
bash "$ROOT/scripts/build-and-reload-sklad.sh" || true
echo ""

echo "=== 3. Очистка PM2 и запуск из ecosystem ==="
bash "$ROOT/scripts/pm2-clean-restart.sh"
echo ""

echo "=============================================="
echo "  Деплой завершён. Порты: 8000, 3000, 3001"
echo "=============================================="
