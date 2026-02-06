#!/bin/bash
# Перезапуск бэкенда в PM2.
# Запуск: cd /var/www/rich-garden && bash scripts/restart-backend.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Перезапуск бэкенда (PM2) ==="
if pm2 describe rich-garden-backend &>/dev/null; then
    pm2 restart rich-garden-backend
    echo "Бэкенд перезапущен: rich-garden-backend"
else
    echo "Бэкенд не найден в PM2. Добавь: bash scripts/pm2-add-backend.sh"
fi
echo ""
pm2 list 2>/dev/null | head -20
echo "Готово."
