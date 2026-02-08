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


async def handle_callback(update: dict):
    cq = update.get("callback_query")
    if not cq:
        return

    data = cq.get("data") or ""
    print(f"[group-bot] callback: {data!r}")

    # Parse callback data: "set_STATUS_ORDERID" -> (STATUS, ORDERID)
    parts = data.split("_")
    if len(parts) != 3 or parts[0] != "set":
        print(f"[group-bot] invalid format: {data}")
        await answer_callback(cq["id"], "Неверный формат кнопки", alert=True)
        return

    action = parts[1]
    order_id = parts[2]
    
    # Map action to status if they differ, or use action as status
    # In your buttons: callback_data=f"set_{new_status}_{order.id}"
    # So action IS the new status.
    status = action 

    url = f"{API_URL}/orders/{order_id}/status"
    print(f"[group-bot] Updating order {order_id} to {status} via {url}")

    try:
        async with httpx.AsyncClient(timeout=HTTPX_TIMEOUT) as client:
            r = await client.patch(url, json={"status": status})
            
        if r.status_code == 200:
            print(f"[group-bot] order {order_id} -> {status} OK")
            # Show a simple toast (not alert)
            await answer_callback(cq["id"], f"Статус обновлен: {status}")
        else:
            err_text = r.text[:100] if r.text else f"Code {r.status_code}"
            print(f"[group-bot] FAIL: {r.status_code} {err_text}")
            # Show ALERT with error details
            await answer_callback(cq["id"], f"Ошибка {r.status_code}: {err_text}", alert=True)

    except Exception as e:
        print(f"[group-bot] Network/Code error: {e}")
        await answer_callback(cq["id"], f"Сбой бота: {str(e)}", alert=True)


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
