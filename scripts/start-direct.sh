#!/bin/bash
# Запуск всех сервисов без PM2 (uvicorn, app, sklad-admin, боты).
# Использовать, если PM2 недоступен (EPERM и т.п.).
# Остановка: pkill -f "uvicorn app.main" ; pkill -f "next start" ; pkill -f "run_bot"

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/rich-garden-backend"
APP="$ROOT/rich-garden-app"
SKLAD="$ROOT/Sklad"
LOG_DIR="${LOG_DIR:-/tmp/rich-garden}"
mkdir -p "$LOG_DIR"

echo "=== Запуск без PM2 ==="

# backend
( cd "$BACKEND" && nohup ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 >> "$LOG_DIR/backend.log" 2>&1 & )
sleep 2
# app :3000
( cd "$APP" && nohup npm run start -- -p 3000 >> "$LOG_DIR/app.log" 2>&1 & )
sleep 1
# sklad-admin :3001
( cd "$SKLAD" && nohup npm run start -- -p 3001 >> "$LOG_DIR/sklad.log" 2>&1 & )
sleep 1
# bots
( cd "$BACKEND" && nohup ./venv/bin/python run_bot.py >> "$LOG_DIR/bot.log" 2>&1 & )
( cd "$BACKEND" && nohup ./venv/bin/python run_bot_admin.py >> "$LOG_DIR/bot-admin.log" 2>&1 & )

echo "Сервисы запущены. Логи: $LOG_DIR/*.log"
echo "Проверка: pgrep -af 'uvicorn|next start|run_bot'"
