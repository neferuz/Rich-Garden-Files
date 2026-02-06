#!/bin/bash
# Сборка фронта (rich-garden-app) и перезагрузка через PM2.
# Запуск на сервере: cd /var/www/rich-garden && bash scripts/build-and-reload-app.sh
# Если папка .next не удаляется (Permission denied): запустите от пользователя PM2
#   sudo -u www-data bash scripts/build-and-reload-app.sh
# или удалите .next с правами root и соберите: sudo rm -rf rich-garden-app/.next && bash scripts/build-and-reload-app.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$ROOT/rich-garden-app"
PM2_NAME="rich-garden-app"

echo "=== 1. Очистка .next ==="
cd "$APP_DIR"
rm -rf .next 2>/dev/null || sudo rm -rf .next

echo "=== 2. Сборка rich-garden-app ==="
npm run build

echo ""
echo "=== 3. Перезагрузка PM2: $PM2_NAME ==="
if pm2 restart "$PM2_NAME" 2>/dev/null; then
    echo "PM2 перезапущен: $PM2_NAME"
else
    echo "ВНИМАНИЕ: PM2 процесс '$PM2_NAME' не найден. Выполните: pm2 list"
    echo "Чтобы только перезапустить оба фронта без сборки: bash scripts/pm2-restart-both.sh"
fi
pm2 list 2>/dev/null | head -20

echo ""
echo "Готово. Если в браузере старый вид — Ctrl+Shift+R (жёсткое обновление)."
