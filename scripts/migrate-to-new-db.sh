#!/bin/bash
# Создать нового пользователя БД + новую БД, перенести туда все данные,
# обновить .env с новым паролем.
#
# Запуск на сервере (нужен sudo):
#   cd /var/www/rich-garden
#   bash scripts/migrate-to-new-db.sh 'твой_новый_пароль'
#
# Сначала должен работать доступ под postgres (если был сбой — см. fix-postgres-password.sh).

set -e
NEW_PASSWORD="$1"
BACKEND_DIR="$(cd "$(dirname "$0")/../rich-garden-backend" && pwd)"
ENV_FILE="$BACKEND_DIR/.env"
OLD_DB="rich_garden"
NEW_DB="rich_garden_new"
NEW_USER="rich_garden"
DUMP_FILE="/tmp/rich_garden_dump_$$.sql"

if [ -z "$NEW_PASSWORD" ]; then
  echo "Использование: bash scripts/migrate-to-new-db.sh 'твой_новый_пароль'"
  echo "Пример:       bash scripts/migrate-to-new-db.sh 'MySecret123'"
  exit 1
fi

echo "=== 1. Проверка доступа postgres ==="
sudo -u postgres psql -c '\q' || { echo "Ошибка: нет доступа к postgres. Сначала выполни: bash scripts/fix-postgres-password.sh"; exit 1; }

echo "=== 2. Создание пользователя $NEW_USER ==="
sudo -u postgres psql -c "CREATE USER $NEW_USER WITH PASSWORD '$NEW_PASSWORD';" 2>/dev/null \
  || sudo -u postgres psql -c "ALTER USER $NEW_USER WITH PASSWORD '$NEW_PASSWORD';"

echo "=== 3. Создание базы $NEW_DB ==="
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $NEW_DB;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE $NEW_DB OWNER $NEW_USER;"

echo "=== 4. Дамп старой БД $OLD_DB -> $DUMP_FILE ==="
sudo -u postgres pg_dump "$OLD_DB" > "$DUMP_FILE"

echo "=== 5. Восстановление в $NEW_DB ==="
sudo -u postgres psql -d "$NEW_DB" -f "$DUMP_FILE" -q

echo "=== 6. Права для $NEW_USER ==="
sudo -u postgres psql -d "$NEW_DB" -c "
  GRANT ALL ON SCHEMA public TO $NEW_USER;
  GRANT ALL ON ALL TABLES IN SCHEMA public TO $NEW_USER;
  GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO $NEW_USER;
  GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO $NEW_USER;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $NEW_USER;
"

echo "=== 7. Обновление .env ==="
NEW_URL="postgresql://${NEW_USER}:${NEW_PASSWORD}@127.0.0.1:5432/${NEW_DB}"
grep -v '^DATABASE_URL=' "$ENV_FILE" > "${ENV_FILE}.tmp" 2>/dev/null || true
echo "DATABASE_URL=$NEW_URL" >> "${ENV_FILE}.tmp"
mv "${ENV_FILE}.tmp" "$ENV_FILE"
echo "В .env записано: DATABASE_URL=postgresql://${NEW_USER}:****@127.0.0.1:5432/${NEW_DB}"

echo "=== 8. Удаление дампа ==="
rm -f "$DUMP_FILE"

echo "=== 9. Перезапуск бэкенда ==="
pm2 restart rich-garden-backend
sleep 2
pm2 list | grep rich-garden-backend || true

echo ""
echo "Готово. Новая БД: $NEW_DB, пользователь: $NEW_USER, пароль сохранён в .env."
echo "Старая БД $OLD_DB не удалена (резервная копия)."
