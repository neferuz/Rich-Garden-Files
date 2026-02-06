#!/bin/bash
# Сборка клиента (rich-garden-app) и админки (Sklad), перезагрузка PM2.
# Запуск: cd /var/www/rich-garden && bash scripts/build-all.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=============================================="
echo "  Сборка клиента и Sklad"
echo "=============================================="
echo ""

bash "$ROOT/scripts/build-and-reload-app.sh"
echo ""
bash "$ROOT/scripts/build-and-reload-sklad.sh"

echo ""
echo "=============================================="
echo "  Готово: клиент и Sklad собраны и перезапущены."
echo "=============================================="
