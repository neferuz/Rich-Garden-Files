
import asyncio
import httpx
import os
import json
from dotenv import load_dotenv

# Load env vars
load_dotenv()
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
API_URL = "http://127.0.0.1:8000/api"

if not TELEGRAM_BOT_TOKEN:
    print("Error: TELEGRAM_BOT_TOKEN not found in .env")
    exit(1)

async def handle_callback(update):
    callback_query = update.get('callback_query')
    if not callback_query:
        return

    callback_id = callback_query['id']
    data = callback_query.get('data')
    message = callback_query.get('message')
    
    if not data:
        return

    print(f"Received callback: {data}")

    # Parse action and order_id
    # Formats: set_assembly_12, set_delivery_12, set_completed_12, set_canceled_12
    try:
        parts = data.split('_')
        # parts could be ['set', 'assembly', '12']
        action = parts[1]
        order_id = parts[2]
        
        status_update = ""
        if action == "assembly":
            status_update = "processing" # Match backend schema
        elif action == "delivery":
            status_update = "delivery" # If backend specifically handles 'delivery', looking at router it expects 'shipping' or similar?
            # Wait, verify OrderUpdateStatus schema and Sklad code.
            # Sklad uses: 'processing', 'shipping', 'done', 'cancelled'
            status_update = "shipping" 
        elif action == "completed":
            status_update = "done"
        elif action == "canceled":
            status_update = "cancelled"
            
        if status_update:
            # Call Backend API
            async with httpx.AsyncClient() as client:
                print(f"Updating order {order_id} to {status_update}...")
                response = await client.put(f"{API_URL}/orders/{order_id}/status", json={"status": status_update})
                
                if response.status_code == 200:
                    print(f"Order {order_id} updated successfully.")
                    # Answer callback query to stop loading animation
                    await answer_callback(callback_id, f"Статус обновлен: {status_update}")
                else:
                    print(f"Failed to update order: {response.text}")
                    await answer_callback(callback_id, "Ошибка обновления статуса", alert=True)

    except Exception as e:
        print(f"Error processing callback: {e}")
        await answer_callback(callback_id, "Ошибка бота", alert=True)

async def answer_callback(callback_id, text, alert=False):
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/answerCallbackQuery"
    async with httpx.AsyncClient() as client:
        await client.post(url, json={
            "callback_query_id": callback_id,
            "text": text,
            "show_alert": alert
        })

async def main():
    offset = 0
    print("Bot polling started...")
    
    async with httpx.AsyncClient() as client:
        while True:
            try:
                url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates?offset={offset}&timeout=30"
                response = await client.get(url, timeout=40)
                data = response.json()
                
                if data.get("ok"):
                    for update in data.get("result", []):
                        offset = update["update_id"] + 1
                        await handle_callback(update)
                else:
                    print(f"Telegram Error: {data}")
                    await asyncio.sleep(5)
                    
            except Exception as e:
                print(f"Polling error: {e}")
                await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(main())
