#!/bin/bash
# Добавить бэкенд в PM2 через ecosystem.config.cjs.
# Запуск: cd /var/www/rich-garden && bash scripts/pm2-add-backend.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$ROOT/rich-garden-backend"
ECOSYSTEM="$BACKEND_DIR/ecosystem.config.cjs"

if [ ! -f "$ECOSYSTEM" ]; then
    echo "Ошибка: не найден $ECOSYSTEM"
    exit 1
fi

if pm2 describe rich-garden-backend &>/dev/null; then
    echo "Бэкенд уже в PM2. Перезапуск: bash scripts/restart-backend.sh"
    pm2 restart rich-garden-backend
    pm2 list
    exit 0
fi

echo "=== Добавление бэкенда в PM2 ==="
cd "$BACKEND_DIR"
pm2 start ecosystem.config.cjs
cd "$ROOT"
echo ""
echo "Бэкенд добавлен. Сохрани: pm2 save"
pm2 list
