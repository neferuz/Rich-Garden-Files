#!/bin/bash
# Только перезапуск обоих фронтов (без сборки). Используйте после сборки, если новый билд не подхватился.
# Запуск: cd /var/www/rich-garden && bash scripts/pm2-restart-both.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Перезапуск PM2: rich-garden-app и sklad-admin ==="
pm2 restart rich-garden-app 2>/dev/null || { echo "Процесс 'rich-garden-app' не найден."; }
pm2 restart sklad-admin 2>/dev/null || { echo "Процесс 'sklad-admin' не найден."; }

echo ""
echo "Текущие процессы PM2:"
pm2 list

echo ""
echo "Готово. Если в браузере всё ещё старый вид — сделайте жёсткое обновление: Ctrl+Shift+R (или Cmd+Shift+R на Mac)."
