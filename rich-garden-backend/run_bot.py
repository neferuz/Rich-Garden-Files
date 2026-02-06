import asyncio
import httpx
import os
import json
from dotenv import load_dotenv

# Load env vars
load_dotenv()
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
API_URL = "http://127.0.0.1:8000/api"
MINI_APP_URL = "https://24eywa.ru"

if not TELEGRAM_BOT_TOKEN:
    print("Error: TELEGRAM_BOT_TOKEN not found in .env")
    exit(1)

HTTPX_TIMEOUT = 30.0

async def send_message(chat_id, text, reply_markup=None):
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    async with httpx.AsyncClient(timeout=HTTPX_TIMEOUT) as client:
        await client.post(url, json={
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "HTML",
            "reply_markup": reply_markup
        })

async def send_welcome_message(chat_id):
    welcome_text = """🌸 <b>Привет! Добро пожаловать в Rich Garden!</b> 🌸

Мы рады видеть вас в нашем цветочном магазине!

Для продолжения, пожалуйста, отправьте свой номер телефона."""
    
    keyboard = {
        "keyboard": [[{
            "text": "📱 Отправить номер телефона",
            "request_contact": True
        }]],
        "resize_keyboard": True,
        "one_time_keyboard": True
    }
    
    await send_message(chat_id, welcome_text, keyboard)

async def handle_phone_number(chat_id, phone_number, user_id, username):
    # Format phone number
    clean_phone = ''.join(filter(str.isdigit, phone_number))
    if not clean_phone.startswith('998'):
        clean_phone = '998' + clean_phone[-9:]
    
    # Save phone to backend
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{API_URL}/user/{user_id}/phone", json={
                "phone_number": clean_phone
            })
            
            if response.status_code == 200:
                confirmation_text = f"""✅ <b>Спасибо! Ваш номер телефона:</b> {clean_phone}

Теперь вы можете запустить приложение:"""
                
                keyboard = {
                    "inline_keyboard": [[{
                        "text": "🚀 Запустить приложение",
                        "web_app": {"url": MINI_APP_URL}
                    }]]
                }
                
                await send_message(chat_id, confirmation_text, keyboard)
            else:
                await send_message(chat_id, "❌ Ошибка при сохранении номера. Попробуйте еще раз.")
    except Exception as e:
        print(f"Error saving phone: {e}")
        await send_message(chat_id, "❌ Ошибка при сохранении номера. Попробуйте еще раз.")

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
    try:
        parts = data.split('_')
        action = parts[1]
        order_id = parts[2]
        
        status_update = ""
        if action == "assembly":
            status_update = "processing"
        elif action == "delivery":
            status_update = "shipping"
        elif action == "completed":
            status_update = "done"
        elif action == "canceled":
            status_update = "cancelled"
            
        if status_update:
            async with httpx.AsyncClient(timeout=HTTPX_TIMEOUT) as client:
                print(f"Updating order {order_id} to {status_update}...")
                response = await client.put(f"{API_URL}/orders/{order_id}/status", json={"status": status_update})
                
                if response.status_code == 200:
                    print(f"Order {order_id} updated successfully.")
                    await answer_callback(callback_id, f"Статус обновлен: {status_update}")
                else:
                    print(f"Failed to update order: {response.text}")
                    await answer_callback(callback_id, "Ошибка обновления статуса", alert=True)

    except Exception as e:
        print(f"Error processing callback: {e}")
        await answer_callback(callback_id, "Ошибка бота", alert=True)

async def answer_callback(callback_id, text, alert=False):
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/answerCallbackQuery"
    async with httpx.AsyncClient(timeout=HTTPX_TIMEOUT) as client:
        await client.post(url, json={
            "callback_query_id": callback_id,
            "text": text,
            "show_alert": alert
        })

async def handle_message(update):
    message = update.get('message')
    if not message:
        return
    
    chat_id = message['chat']['id']
    user_id = message.get('from', {}).get('id')
    username = message.get('from', {}).get('username', '')
    text = message.get('text', '')
    contact = message.get('contact')
    
    print(f"Received message from {user_id} (@{username}): {text}")
    
    # Handle /start command
    if text.startswith('/start'):
        payload = text[7:].strip() if len(text) > 6 else ''
        if payload == 'payment_done':
            print(f"Handling /start payment_done for user {user_id}")
            done_text = """✅ <b>Вы вернулись после оплаты</b>

Проверьте статус заказа в приложении:"""
            keyboard = {
                "inline_keyboard": [[{
                    "text": "📋 Мои заказы",
                    "web_app": {"url": f"{MINI_APP_URL}/orders"}
                }]]
            }
            await send_message(chat_id, done_text, keyboard)
            return
        print(f"Handling /start command for user {user_id}")
        await send_welcome_message(chat_id)
        return
    
    # Handle phone number from contact
    if contact:
        phone_number = contact.get('phone_number', '')
        if phone_number:
            await handle_phone_number(chat_id, phone_number, user_id, username)
            return
    
    # Handle phone number as text
    if text and any(char.isdigit() for char in text):
        # Check if it looks like a phone number
        digits = ''.join(filter(str.isdigit, text))
        if len(digits) >= 9:
            await handle_phone_number(chat_id, text, user_id, username)
            return

async def main():
    offset = 0
    print("Bot polling started...")
    
    # Delete webhook first to avoid conflicts
    try:
        async with httpx.AsyncClient() as client:
            delete_url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/deleteWebhook"
            await client.post(delete_url, json={"drop_pending_updates": True})
            print("Webhook deleted")
            await asyncio.sleep(2)
    except Exception as e:
        print(f"Error deleting webhook: {e}")
    
    async with httpx.AsyncClient(timeout=45.0) as client:
        while True:
            try:
                url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates?offset={offset}&timeout=30"
                response = await client.get(url, timeout=40)
                data = response.json()
                
                if data.get("ok"):
                    updates = data.get("result", [])
                    if updates:
                        print(f"Received {len(updates)} update(s)")
                    for update in updates:
                        offset = update["update_id"] + 1
                        
                        # Handle messages
                        if 'message' in update:
                            await handle_message(update)
                        
                        # Handle callbacks
                        if 'callback_query' in update:
                            await handle_callback(update)
                            
                else:
                    print(f"Telegram Error: {data}")
                    await asyncio.sleep(5)
                    
            except httpx.TimeoutException:
                print("Timeout - retrying...")
                await asyncio.sleep(5)
            except asyncio.CancelledError:
                print("Cancelled - restarting...")
                await asyncio.sleep(2)
                continue
            except Exception as e:
                print(f"Polling error: {e}")
                import traceback
                traceback.print_exc()
                await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(main())
