#!/bin/bash
# Запуск миграции payme_receipt_id (PostgreSQL / MySQL).
# Выполнять на сервере: cd /var/www/rich-garden && bash scripts/run-payme-migration.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/rich-garden-backend"
cd "$BACKEND"

if [ -d "venv" ] && [ -f "venv/bin/activate" ]; then
  echo "Активация venv..."
  source venv/bin/activate
fi

echo "Запуск миграции payme_receipt_id..."
python migrate_add_payme_receipt_id.py
echo "Готово."
