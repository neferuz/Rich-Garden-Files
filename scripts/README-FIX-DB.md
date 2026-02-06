# Исправление ошибки «password authentication failed» (PostgreSQL)

Бэкенд падает при старте из‑за неверного пароля PostgreSQL. В `.env` указано: `postgres` / `root`.

---

## Вариант 1: Новая БД + перенос данных + свой пароль

Создаётся пользователь `rich_garden`, новая БД `rich_garden_new`, туда копируются все данные из старой БД, в `.env` сохраняется новый пароль.

**На сервере** (нужен `sudo`):

```bash
cd /var/www/rich-garden
bash scripts/migrate-to-new-db.sh 'твой_новый_пароль'
```

Пример:

```bash
bash scripts/migrate-to-new-db.sh 'MySecret123'
```

**Важно:** сначала должен быть доступ под `postgres`. Если его нет, до миграции выполни `bash scripts/fix-postgres-password.sh`.

В пароле не используй символ `'` (одинарная кавычка).

---

## Вариант 2: Просто починить старый пароль

Поставить пароль `postgres` в `root` (как в текущем `.env`) и перезапустить бэк:

```bash
cd /var/www/rich-garden
bash scripts/fix-postgres-password.sh
```

Если `sudo` запросит пароль — введи пароль пользователя сервера.

---

## Вариант 3: Подставить свой пароль в .env вручную

Пропиши в `rich-garden-backend/.env` фактический пароль PostgreSQL:

```env
DATABASE_URL=postgresql://postgres:ВАШ_ПАРОЛЬ@127.0.0.1:5432/rich_garden
```

Затем:

```bash
pm2 restart rich-garden-backend
```
