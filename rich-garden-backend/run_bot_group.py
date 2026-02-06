#!/usr/bin/env python3
"""
Групповой бот: обрабатывает callback от кнопок «В сборку», «В путь», «Завершить», «Отменить»
в сообщениях о заказах в группе. Обновляет статус через API и вызывает answerCallbackQuery,
чтобы убрать «загрузку» в Telegram.
"""
import asyncio
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

TELEGRAM_GROUP_BOT_TOKEN = os.getenv("TELEGRAM_GROUP_BOT_TOKEN")
API_URL = os.getenv("API_URL", "http://127.0.0.1:8000/api").rstrip("/")
HTTPX_TIMEOUT = 30.0

if not TELEGRAM_GROUP_BOT_TOKEN:
    print("ERROR: TELEGRAM_GROUP_BOT_TOKEN not found in .env")
    exit(1)


async def answer_callback(callback_id: str, text: str, alert: bool = False):
    url = f"https://api.telegram.org/bot{TELEGRAM_GROUP_BOT_TOKEN}/answerCallbackQuery"
    async with httpx.AsyncClient(timeout=HTTPX_TIMEOUT) as c:
        r = await c.post(url, json={
            "callback_query_id": callback_id,
            "text": text,
            "show_alert": alert,
        })
        if r.status_code != 200:
            print(f"answerCallbackQuery failed: {r.status_code} {r.text}")
        return r


def parse_callback_data(data: str) -> tuple[str | None, str | None]:
    """Parse set_ACTION_orderId -> (action, order_id)."""
    if not data or not data.startswith("set_"):
        return None, None
    parts = data.split("_")
    if len(parts) != 3:
        return None, None
    action, order_id = parts[1], parts[2]
    if action not in ("processing", "shipping", "done", "cancelled"):
        return None, None
    return action, order_id


async def handle_callback(update: dict):
    cq = update.get("callback_query")
    if not cq:
        return

    callback_id = cq["id"]
    data = cq.get("data") or ""

    print(f"[group-bot] callback: {data!r}")

    action, order_id = parse_callback_data(data)
    if not action or not order_id:
        print(f"[group-bot] invalid format, ignoring")
        await answer_callback(callback_id, "Неизвестная кнопка", alert=True)
        return

    status = action  # processing, shipping, done, cancelled
    url = f"{API_URL}/orders/{order_id}/status"

    try:
        async with httpx.AsyncClient(timeout=HTTPX_TIMEOUT) as client:
            r = await client.patch(url, json={"status": status})
        if r.status_code == 200:
            print(f"[group-bot] order {order_id} -> {status} OK")
            await answer_callback(callback_id, f"Статус обновлен: {status}")
        else:
            err = r.text[:200] if r.text else f"HTTP {r.status_code}"
            print(f"[group-bot] order {order_id} -> {status} FAIL: {err}")
            await answer_callback(callback_id, "Ошибка обновления статуса", alert=True)
    except Exception as e:
        print(f"[group-bot] error: {e}")
        await answer_callback(callback_id, "Ошибка бота", alert=True)


async def main():
    offset = 0
    print("[group-bot] polling started (TELEGRAM_GROUP_BOT_TOKEN)")

    try:
        async with httpx.AsyncClient() as c:
            await c.post(
                f"https://api.telegram.org/bot{TELEGRAM_GROUP_BOT_TOKEN}/deleteWebhook",
                json={"drop_pending_updates": True},
            )
        await asyncio.sleep(2)
    except Exception as e:
        print(f"[group-bot] deleteWebhook: {e}")

    async with httpx.AsyncClient(timeout=45.0) as client:
        while True:
            try:
                r = await client.get(
                    f"https://api.telegram.org/bot{TELEGRAM_GROUP_BOT_TOKEN}/getUpdates",
                    params={"offset": offset, "timeout": 30},
                )
                d = r.json()
                if not d.get("ok"):
                    print(f"[group-bot] getUpdates error: {d}")
                    await asyncio.sleep(5)
                    continue

                for u in d.get("result", []):
                    offset = u["update_id"] + 1
                    if "callback_query" in u:
                        await handle_callback(u)
            except httpx.TimeoutException:
                pass
            except asyncio.CancelledError:
                await asyncio.sleep(2)
                continue
            except Exception as e:
                print(f"[group-bot] poll error: {e}")
                await asyncio.sleep(5)


if __name__ == "__main__":
    asyncio.run(main())
