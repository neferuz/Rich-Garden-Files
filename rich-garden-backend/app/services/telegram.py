
import os
import httpx
import json
import html
from dotenv import load_dotenv

load_dotenv(override=True)

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_GROUP_BOT_TOKEN = os.getenv("TELEGRAM_GROUP_BOT_TOKEN", "7119055260:AAHEJ58S7A7b1niVY_Q20fcJr3KyZLfc7hk")
TELEGRAM_GROUP_ID = os.getenv("TELEGRAM_GROUP_ID", "-5194643570")
HTTPX_TIMEOUT = 30.0

def escape_html(text):
    if not text:
        return ""
    return html.escape(str(text))


def format_number(num):
    return f"{int(num):,}".replace(",", " ")

async def send_order_notification(order: dict, items_detail: str):
    print(f"DEBUG send_order_notification: BOT_TOKEN={TELEGRAM_GROUP_BOT_TOKEN[:20]}..., GROUP_ID={TELEGRAM_GROUP_ID}")
    if not TELEGRAM_GROUP_BOT_TOKEN or not TELEGRAM_GROUP_ID:
        print("ERROR: Telegram group credentials not found")
        print(f"  TELEGRAM_GROUP_BOT_TOKEN: {TELEGRAM_GROUP_BOT_TOKEN}")
        print(f"  TELEGRAM_GROUP_ID: {TELEGRAM_GROUP_ID}")
        return None

    # Construct the message text
    status_map = {
        "new": "🟢 Новый заказ",
        "pending_payment": "⏳ Ожидает оплаты",
        "paid": "💰 Оплачен",
        "processing": "🔨 В сборке",
        "assembly": "🔨 В сборке",
        "shipping": "🚚 В пути",
        "delivery": "🚚 В пути",
        "done": "✅ Завершен",
        "completed": "✅ Завершен",
        "cancelled": "❌ Отменен",
        "canceled": "❌ Отменен"
    }
    
    status_text = status_map.get(order.get("status", "new"), f"❓ {order.get('status', 'new')}")
    
    # Escape all dynamic data
    customer_name = escape_html(order['customer_name'])
    customer_phone = escape_html(order.get('customer_phone') or 'Уточнить')
    address = escape_html(order.get('address') or 'Самовывоз')
    comment = escape_html(order.get('comment') or '')
    payment_method = escape_html(order.get('payment_method') or 'Не указано')
    safe_items_detail = escape_html(items_detail)

    total_formatted = format_number(order['total_price'])

    # Extras formatting
    extras = order.get('extras', {})
    # Убеждаемся, что extras - это словарь
    if not isinstance(extras, dict):
        extras = {}
    extras_text = ""
    
    # helper for mapping english keys to russian
    wow_effects_map = {
        "violin": "Скрипач",
        "brutal": "Брутальный мужчина",
        "angel": "Ангел",
        "sax": "Саксофонист"
    }
    
    addons_map = {
        "balloons": "Шары",
        "sweets": "Сладости",
        "toys": "Игрушки",
        "bunny": "Игрушка-зайчик",
        "bear": "Игрушка-мишка"
    }

    if extras.get('postcard'):
        extras_text += f"\n💌 <b>Открытка:</b> {escape_html(extras['postcard'])}"
    
    if extras.get('wow_effect'):
         wow_label = wow_effects_map.get(extras['wow_effect'], extras['wow_effect'])
         extras_text += f"\n🎭 <b>Вау-эффект:</b> {wow_label}"
    
    if extras.get('addons'):
        addons_list = [addons_map.get(a, a) for a in extras['addons']]
        if addons_list:
             extras_text += f"\n🎁 <b>Дополнения:</b> {', '.join(addons_list)}"

    message = (
        f"<b>Заказ #{order['id']}</b>\n"
        f"📌 <b>Статус:</b> {status_text}\n\n"
        f"👤 <b>Заказчик:</b> {customer_name}\n"
        f"📱 <b>Телефон:</b> {customer_phone}\n"
        f"📍 <b>Адрес:</b> {address}\n"
        f"💰 <b>Сумма:</b> {total_formatted} сум\n"
        f"💳 <b>Оплата:</b> {payment_method}\n"
        f"{extras_text}\n"
        f"📋 <b>Состав заказа:</b>\n{safe_items_detail}\n"
    )

    if comment:
         message += f"\n💭 <b>Комментарий:</b> {comment}\n"
    
    # Inline Keyboard - все статусы
    current_status = order.get("status", "new").lower()
    buttons = []
    
    # Для завершенных/отмененных - без кнопок
    if current_status in ["done", "completed", "завершен", "выполнен", "cancelled", "canceled", "отменен"]:
        buttons = []
    else:
        # Показываем все доступные статусы в зависимости от текущего
        if current_status in ["new", "pending_payment", "paid"]:
            # Для новых заказов - все кнопки
            buttons = [
                [{"text": "🔨 В сборку", "callback_data": f"set_processing_{order['id']}"}],
                [{"text": "🚚 В путь", "callback_data": f"set_shipping_{order['id']}"}],
                [{"text": "✅ Завершить", "callback_data": f"set_done_{order['id']}"}],
                [{"text": "❌ Отменить", "callback_data": f"set_cancelled_{order['id']}"}]
            ]
        elif current_status in ["processing", "assembly"]:
            # Для заказов в сборке
            buttons = [
                [{"text": "🚚 В путь", "callback_data": f"set_shipping_{order['id']}"}],
                [{"text": "✅ Завершить", "callback_data": f"set_done_{order['id']}"}],
                [{"text": "❌ Отменить", "callback_data": f"set_cancelled_{order['id']}"}]
            ]
        elif current_status in ["shipping", "delivery"]:
            # Для заказов в пути
            buttons = [
                [{"text": "✅ Завершить", "callback_data": f"set_done_{order['id']}"}],
                [{"text": "❌ Отменить", "callback_data": f"set_cancelled_{order['id']}"}]
            ]
        else:
            # Для других статусов - все кнопки
            buttons = [
                [{"text": "🔨 В сборку", "callback_data": f"set_processing_{order['id']}"}],
                [{"text": "🚚 В путь", "callback_data": f"set_shipping_{order['id']}"}],
                [{"text": "✅ Завершить", "callback_data": f"set_done_{order['id']}"}],
                [{"text": "❌ Отменить", "callback_data": f"set_cancelled_{order['id']}"}]
            ]
    
    keyboard = {
        "inline_keyboard": buttons
    }

    url = f"https://api.telegram.org/bot{TELEGRAM_GROUP_BOT_TOKEN}/sendMessage"
    
    print(f"DEBUG: Keyboard structure: {json.dumps(keyboard, indent=2, ensure_ascii=False)}")
    print(f"Sending Telegram message to {TELEGRAM_GROUP_ID}") 

    async with httpx.AsyncClient(timeout=HTTPX_TIMEOUT) as client:
        try:
            print(f"DEBUG: Sending message to group {TELEGRAM_GROUP_ID}")
            payload = {
                "chat_id": TELEGRAM_GROUP_ID,
                "text": message,
                "parse_mode": "HTML",
                "reply_markup": keyboard,
                "disable_web_page_preview": True
            }
            print(f"DEBUG: Payload (without text): chat_id={payload['chat_id']}, has_keyboard={bool(payload.get('reply_markup'))}")
            response = await client.post(url, json=payload)
            
            print(f"DEBUG: Telegram API response status: {response.status_code}")
            result = response.json()
            print(f"DEBUG: Telegram API response: {result}")
            
            if response.status_code != 200:
                print(f"ERROR: Telegram API Error: {response.status_code} - {response.text}")
                print(f"ERROR: Full response: {result}")
                return None
                
            if not result.get('ok'):
                print(f"ERROR: Telegram API returned error: {result}")
                return None
                
            message_id = result.get("result", {}).get("message_id")
            print(f"DEBUG: Message sent successfully, message_id: {message_id}")
            return message_id
        except Exception as e:
            print(f"ERROR: Failed to send telegram message: {e}")
            import traceback
            traceback.print_exc()
            return None

async def update_order_status_message(message_id: int, order: dict, items_detail: str):
    if not TELEGRAM_GROUP_BOT_TOKEN or not TELEGRAM_GROUP_ID or not message_id:
        return

    status_map = {
        "new": "🟢 Новый заказ",
        "pending_payment": "⏳ Ожидает оплаты",
        "paid": "💰 Оплачен",
        "processing": "🔨 В сборке",
        "assembly": "🔨 В сборке",
        "shipping": "🚚 В пути",
        "delivery": "🚚 В пути",
        "done": "✅ Завершен",
        "completed": "✅ Завершен",
        "cancelled": "❌ Отменен",
        "canceled": "❌ Отменен"
    }

    status_text = status_map.get(order.get("status", "new"), order.get("status", "new"))
    
    # Escape dynamic data
    customer_name = escape_html(order['customer_name'])
    customer_phone = escape_html(order.get('customer_phone') or 'Уточнить')
    address = escape_html(order.get('address') or 'Самовывоз')
    comment = escape_html(order.get('comment') or '')
    payment_method = escape_html(order.get('payment_method') or 'Не указано')
    safe_items_detail = escape_html(items_detail)

    total_formatted = format_number(order['total_price'])

    # Extras formatting
    extras = order.get('extras', {})
    # Убеждаемся, что extras - это словарь
    if not isinstance(extras, dict):
        extras = {}
    extras_text = ""
    
    # helper for mapping english keys to russian
    wow_effects_map = {
        "violin": "Скрипач",
        "brutal": "Брутальный мужчина",
        "angel": "Ангел",
        "sax": "Саксофонист"
    }
    
    addons_map = {
        "balloons": "Шары",
        "sweets": "Сладости",
        "toys": "Игрушки",
        "bunny": "Игрушка-зайчик",
        "bear": "Игрушка-мишка"
    }

    if extras.get('postcard'):
        extras_text += f"\n💌 <b>Открытка:</b> {escape_html(extras['postcard'])}"
    
    if extras.get('wow_effect'):
         wow_label = wow_effects_map.get(extras['wow_effect'], extras['wow_effect'])
         extras_text += f"\n🎭 <b>Вау-эффект:</b> {wow_label}"
    
    if extras.get('addons'):
        addons_list = [addons_map.get(a, a) for a in extras['addons']]
        if addons_list:
             extras_text += f"\n🎁 <b>Дополнения:</b> {', '.join(addons_list)}"

    message = (
        f"<b>Заказ #{order['id']}</b>\n"
        f"📌 <b>Статус:</b> {status_text}\n\n"
        f"👤 <b>Заказчик:</b> {customer_name}\n"
        f"📱 <b>Телефон:</b> {customer_phone}\n"
        f"📍 <b>Адрес:</b> {address}\n"
        f"💰 <b>Сумма:</b> {total_formatted} сум\n"
        f"💳 <b>Оплата:</b> {payment_method}\n"
        f"{extras_text}\n"
        f"📋 <b>Состав заказа:</b>\n{safe_items_detail}\n"
    )

    if comment:
         message += f"\n💭 <b>Комментарий:</b> {comment}\n"

    # Dynamic keyboard - все статусы
    current_status = order.get("status", "new").lower()
    buttons = []
    
    # Для завершенных/отмененных - без кнопок
    if current_status in ["done", "completed", "завершен", "выполнен", "cancelled", "canceled", "отменен"]:
        buttons = []
    else:
        # Показываем все доступные статусы в зависимости от текущего
        if current_status in ["new", "pending_payment", "paid"]:
            # Для новых заказов - все кнопки
            buttons = [
                [{"text": "🔨 В сборку", "callback_data": f"set_processing_{order['id']}"}],
                [{"text": "🚚 В путь", "callback_data": f"set_shipping_{order['id']}"}],
                [{"text": "✅ Завершить", "callback_data": f"set_done_{order['id']}"}],
                [{"text": "❌ Отменить", "callback_data": f"set_cancelled_{order['id']}"}]
            ]
        elif current_status in ["processing", "assembly"]:
            # Для заказов в сборке
            buttons = [
                [{"text": "🚚 В путь", "callback_data": f"set_shipping_{order['id']}"}],
                [{"text": "✅ Завершить", "callback_data": f"set_done_{order['id']}"}],
                [{"text": "❌ Отменить", "callback_data": f"set_cancelled_{order['id']}"}]
            ]
        elif current_status in ["shipping", "delivery"]:
            # Для заказов в пути
            buttons = [
                [{"text": "✅ Завершить", "callback_data": f"set_done_{order['id']}"}],
                [{"text": "❌ Отменить", "callback_data": f"set_cancelled_{order['id']}"}]
            ]
        else:
            # Для других статусов - все кнопки
            buttons = [
                [{"text": "🔨 В сборку", "callback_data": f"set_processing_{order['id']}"}],
                [{"text": "🚚 В путь", "callback_data": f"set_shipping_{order['id']}"}],
                [{"text": "✅ Завершить", "callback_data": f"set_done_{order['id']}"}],
                [{"text": "❌ Отменить", "callback_data": f"set_cancelled_{order['id']}"}]
            ]

    keyboard = {
         "inline_keyboard": buttons
    }

    url = f"https://api.telegram.org/bot{TELEGRAM_GROUP_BOT_TOKEN}/editMessageText"
    
    async with httpx.AsyncClient(timeout=HTTPX_TIMEOUT) as client:
        try:
            response = await client.post(url, json={
                "chat_id": TELEGRAM_GROUP_ID,
                "message_id": message_id,
                "text": message,
                "parse_mode": "HTML",
                "reply_markup": keyboard,
                "disable_web_page_preview": True
            })
            if response.status_code != 200:
                print(f"Telegram Edit API Error: {response.text}")
        except Exception as e:
            print(f"Failed to edit telegram message: {e}")

async def send_broadcast_message(telegram_id: int, text: str):
    if not TELEGRAM_BOT_TOKEN:
        print("Telegram token not set")
        return False

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"

    async with httpx.AsyncClient(timeout=HTTPX_TIMEOUT) as client:
        try:
            response = await client.post(url, json={
                "chat_id": telegram_id,
                "text": text,
                "parse_mode": "HTML"
            })
            if response.status_code == 200:
                return True
            else:
                print(f"Failed to send to {telegram_id}: {response.text}")
                return False
        except Exception as e:
            print(f"Error sending to {telegram_id}: {e}")
            return False

async def get_chat_photo(telegram_id: int):
    """
    Fetches the profile photo of a Telegram user.
    """
    if not TELEGRAM_BOT_TOKEN:
        return None

    try:
        async with httpx.AsyncClient(timeout=HTTPX_TIMEOUT) as client:
            # 1. Get user profile photos
            photos_url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUserProfilePhotos"
            resp = await client.post(photos_url, json={"user_id": telegram_id, "limit": 1})
            
            if resp.status_code != 200:
                print(f"Failed to get photos for {telegram_id}: {resp.text}")
                return None
            
            data = resp.json()
            if not data.get("ok") or data["result"]["total_count"] == 0:
                return None
            
            # Get the largest photo (last in the array)
            file_id = data["result"]["photos"][0][-1]["file_id"]
            
            # 2. Get file path
            file_url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getFile"
            file_resp = await client.post(file_url, json={"file_id": file_id})
            
            if file_resp.status_code != 200:
                return None
                
            file_data = file_resp.json()
            if not file_data.get("ok"):
                return None
                
            file_path = file_data["result"]["file_path"]
            
            # 3. Construct final download URL
            return f"https://api.telegram.org/file/bot{TELEGRAM_BOT_TOKEN}/{file_path}"
            
    except Exception as e:
        print(f"Error fetching telegram photo: {e}")
        return None

async def send_customer_receipt(telegram_id: int, order: dict, items_detail: str):
    if not TELEGRAM_BOT_TOKEN or not telegram_id:
        return False
        
    # User-friendly formatting
    customer_name = escape_html(order['customer_name'] or 'Клиент')
    total_formatted = format_number(order['total_price'])
    safe_items = escape_html(items_detail)
    address = escape_html(order.get('address') or 'Самовывоз')
    
    # Emojis for status
    status_emoji = "✅" 
    
    message = (
        f"<b>🎉 Спасибо за заказ, {customer_name}!</b>\n\n"
        f"Ваш заказ <b>#{order['id']}</b> принят и передан в работу.\n\n"
        f"📋 <b>Состав заказа:</b>\n{safe_items}\n"
        f"📍 <b>Адрес:</b> {address}\n"
        f"💰 <b>Сумма:</b> {total_formatted} сум\n\n"
        f"Мы оповестим вас об изменении статуса!"
    )
    
    # Button to open Mini App
    # Telegram web app buttons MUST be HTTPS
    # Using production URL: https://24eywa.ru/orders
    
    keyboard = {
        "inline_keyboard": [
            [
                {
                    "text": "🛍 Мои заказы",
                    "web_app": { "url": "https://24eywa.ru/orders" }
                }
            ]
        ]
    }
    
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    
    print(f"DEBUG send_customer_receipt: Using BOT_TOKEN={TELEGRAM_BOT_TOKEN[:20]}... for telegram_id={telegram_id}")
    
    async with httpx.AsyncClient(timeout=HTTPX_TIMEOUT) as client:
        try:
            response = await client.post(url, json={
                "chat_id": telegram_id,
                "text": message,
                "parse_mode": "HTML",
                "reply_markup": keyboard
            })
            print(f"DEBUG send_customer_receipt: Response status={response.status_code}")
            if response.status_code != 200:
                print(f"ERROR send_customer_receipt: {response.text}")
            return True
        except Exception as e:
            print(f"ERROR: Failed to send receipt to {telegram_id}: {e}")
            import traceback
            traceback.print_exc()
            return False
