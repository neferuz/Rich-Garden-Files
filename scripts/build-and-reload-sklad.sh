#!/bin/bash
# Сборка админки (Sklad) и перезагрузка через PM2.
# Запуск на сервере: cd /var/www/rich-garden && bash scripts/build-and-reload-sklad.sh
# Если .next не удаляется: sudo -u www-data bash scripts/build-and-reload-sklad.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SKLAD_DIR="$ROOT/Sklad"
PM2_NAME="sklad-admin"

echo "=== 1. Очистка .next ==="
cd "$SKLAD_DIR"
rm -rf .next 2>/dev/null || sudo rm -rf .next

echo "=== 2. Сборка Sklad (админка) ==="
npm run build

echo ""
echo "=== 3. Перезагрузка PM2: $PM2_NAME ==="
if pm2 restart "$PM2_NAME" 2>/dev/null; then
    echo "PM2 перезапущен: $PM2_NAME"
else
    echo "ВНИМАНИЕ: PM2 процесс '$PM2_NAME' не найден. Выполните: pm2 list"
    echo "Или: bash scripts/pm2-restart-both.sh либо bash scripts/pm2-clean-restart.sh"
fi
pm2 list 2>/dev/null | head -20

echo ""
echo "Готово. Если в браузере старый вид — Ctrl+Shift+R (жёсткое обновление)."
