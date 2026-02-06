#!/bin/bash
# Добавить оба фронта в PM2 (если ещё не добавлены). Запускать из каталога /var/www/rich-garden.
# После этого: pm2 save && pm2 startup — чтобы пережили перезагрузку.

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$ROOT/rich-garden-app"
SKLAD_DIR="$ROOT/Sklad"

echo "=== Добавление приложений в PM2 (текущий пользователь: $(whoami)) ==="
echo ""

# Клиент
if ! pm2 describe rich-garden-app &>/dev/null; then
    echo "Добавляю rich-garden-app..."
    cd "$APP_DIR"
    pm2 start npm --name "rich-garden-app" -- start -- -p 3000
    cd "$ROOT"
    echo "  OK: rich-garden-app добавлен."
else
    echo "rich-garden-app уже в PM2."
fi

echo ""

# Админка :3001 (никогда не добавляем Sklad на 3000)
if ! pm2 describe sklad-admin &>/dev/null; then
    echo "Добавляю sklad-admin (порт 3001)..."
    cd "$SKLAD_DIR"
    pm2 start npm --name "sklad-admin" -- start -- -p 3001
    cd "$ROOT"
    echo "  OK: sklad-admin добавлен."
else
    echo "sklad-admin уже в PM2."
fi

echo ""
echo "Текущий список:"
pm2 list

echo ""
echo "Сохраните список и включите автозапуск при перезагрузке сервера:"
echo "  pm2 save"
echo "  pm2 startup"
echo ""
echo "Перезапуск обоих: bash scripts/pm2-restart-both.sh"
