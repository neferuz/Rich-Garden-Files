#!/bin/bash
# Fix PostgreSQL password for user "postgres" to match .env (root).
# Run on server in SSH: cd /var/www/rich-garden && bash scripts/fix-postgres-password.sh
# Requires: sudo access.

set -e
echo "=== Fix Postgres password (match .env) ==="
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'root';" || { echo "Failed. Run this script on the server with sudo."; exit 1; }
echo "Password set. Restarting backend..."
pm2 restart rich-garden-backend
sleep 2
pm2 list | grep rich-garden-backend || true
echo "=== Done ==="
