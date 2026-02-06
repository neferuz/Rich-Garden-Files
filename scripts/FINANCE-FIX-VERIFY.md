# Проверка «Финансы» — только оплаченные заказы

## Что должно быть

- На странице **Финансы** в доход и в список транзакций попадают **только заказы со статусом paid** (реально оплаченные: Payme, Click, наличные).
- Неоплаченные заказы (new, pending_payment и т.п.) **не показываются** и **не считаются** в доходе.

## Если ничего не меняется — сделай по шагам

### 0. Перезагрузи nginx (если меняли конфиг)

Если в конфиге admin.24eywa.ru для `/api` добавлен `proxy_cache off`:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 1. Перезапусти бэкенд (обязательно)

Код фильтра `?status=paid` живёт в бэкенде. Без перезапуска старый процесс продолжит отдавать все заказы.

```bash
cd /var/www/rich-garden
bash scripts/restart-backend.sh
```

Если бэкенда нет в PM2: `bash scripts/pm2-add-backend.sh` (один раз), затем снова `restart-backend.sh`.

### 2. Пересобери и перезапусти админку (Sklad)

Страница Финансы должна вызывать `getOrdersPaidOnly()` (запрос с `?status=paid`). Это в новом билде.

```bash
cd /var/www/rich-garden
bash scripts/build-and-reload-sklad.sh
```

### 3. Жёсткое обновление в браузере

Открой **Финансы**, нажми **Ctrl+Shift+R** (или Cmd+Shift+R на Mac), чтобы не подхватывался старый JS.

### 4. Проверка в DevTools

1. Открой https://admin.24eywa.ru/finance
2. F12 → вкладка **Network** (Сеть)
3. Обнови страницу
4. Найди запрос к **orders** (должен быть `orders?status=paid`)
5. Открой ответ: в списке должны быть **только заказы со статусом paid**
6. В заголовках ответа должно быть: **X-Orders-Filter: paid** (значит бэкенд применил фильтр)

### 5. Проверка с сервера (curl)

```bash
# Только оплаченные (для финансов)
curl -sI "https://admin.24eywa.ru/api/orders?status=paid" | grep -i "x-orders-filter\|cache-control"

# Должно быть: X-Orders-Filter: paid и Cache-Control: no-store
```

Если заголовка `X-Orders-Filter: paid` нет — бэкенд не перезапущен или запрос идёт без `?status=paid` (старый фронт).

## Итог

- **Бэкенд** — перезапуск после любых правок в коде.
- **Админка** — сборка + перезапуск PM2 Sklad.
- **Браузер** — жёсткое обновление (Ctrl+Shift+R).
