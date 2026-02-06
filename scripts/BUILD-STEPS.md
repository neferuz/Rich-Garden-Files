# Сборка клиента и Sklad

## Важно: после сборки нужен перезапуск PM2

Next.js отдаёт уже собранные файлы из папки `.next`. Пока процесс PM2 не перезапустить, он продолжит отдавать **старый** билд. Поэтому в скриптах сборки есть шаг «Перезагрузка PM2».

Если билд вы уже сделали, но изменения не видны — **перезапустите оба фронта**:

```bash
cd /var/www/rich-garden
bash scripts/pm2-restart-both.sh
```

В браузере сделайте **жёсткое обновление** (чтобы не подхватывался кэш): **Ctrl+Shift+R** (Windows/Linux) или **Cmd+Shift+R** (Mac).

---

## Быстрый вариант (сборка + перезапуск обоих проектов)

```bash
cd /var/www/rich-garden
bash scripts/build-all.sh
```

Либо по отдельности:

- **Клиент (24eywa.ru):**  
  `bash scripts/build-and-reload-app.sh`

- **Админка (Sklad):**  
  `bash scripts/build-and-reload-sklad.sh`

---

## Если папка `.next` не удаляется (Permission denied)

Папка `.next` могла быть создана пользователем, от которого запущен PM2 (часто `www-data`). Тогда:

**Вариант 1 — запуск от пользователя PM2 (рекомендуется):**

```bash
cd /var/www/rich-garden
sudo -u www-data bash scripts/build-and-reload-app.sh
sudo -u www-data bash scripts/build-and-reload-sklad.sh
```

**Вариант 2 — удалить `.next` от root и собрать от своего пользователя:**

```bash
cd /var/www/rich-garden
sudo rm -rf rich-garden-app/.next Sklad/.next
bash scripts/build-and-reload-app.sh
bash scripts/build-and-reload-sklad.sh
```

Если PM2 крутится от `www-data`, после сборки от root может понадобиться:

```bash
sudo chown -R www-data:www-data /var/www/rich-garden/rich-garden-app/.next
sudo chown -R www-data:www-data /var/www/rich-garden/Sklad/.next
pm2 restart rich-garden-app sklad-admin
```

---

## Имена процессов PM2

- Клиент: `rich-garden-app` (порт 3000)
- Админка: `sklad-admin` (порт 3001; раньше было `Sklad` — больше не используем)

Проверка: `pm2 list`

**Если в PM2 пусто (приложения ни разу не добавляли):** добавьте оба фронта одной командой:
```bash
cd /var/www/rich-garden
bash scripts/pm2-add-both.sh
pm2 save
pm2 startup   # выполните команду, которую выведет pm2 (обычно sudo env ...)
```

**Если `sudo -u www-data pm2 list` выдаёт EACCES** (нет прав на `/var/www/.pm2`), создайте каталог и отдайте www-data:
```bash
sudo mkdir -p /var/www/.pm2
sudo chown -R www-data:www-data /var/www/.pm2
```
Либо используйте PM2 от root: добавьте приложения от root (`bash scripts/pm2-add-both.sh` от root) и перезапускайте от root.

Если скрипт пишет «процесс не найден», посмотрите точные имена в выводе `pm2 list` и перезапустите вручную:
```bash
pm2 restart rich-garden-app
pm2 restart sklad-admin
```

---

## Полный деплой и очистка PM2

**Единый ecosystem** (`ecosystem.config.cjs` в корне) задаёт backend, оба фронта и ботов. Порты: 8000, 3000, 3001.

**Очистка «зависших» PM2 и запуск из ecosystem:**
```bash
cd /var/www/rich-garden
bash scripts/pm2-clean-restart.sh
```

**Полный деплой (сборка + очистка PM2 + старт):**
```bash
cd /var/www/rich-garden
bash scripts/deploy.sh
```

Запускайте эти скрипты **на сервере** (не из Cursor/IDE). При `EPERM` на `~/.pm2/rpc.sock` — часто помогает переподключение по SSH и повторный запуск.
