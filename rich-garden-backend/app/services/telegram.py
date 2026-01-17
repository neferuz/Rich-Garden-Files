
import os
import httpx
import json
import html
from dotenv import load_dotenv

load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_GROUP_ID = os.getenv("TELEGRAM_GROUP_ID")

def escape_html(text):
    if not text:
        return ""
    return html.escape(str(text))


def format_number(num):
    return f"{int(num):,}".replace(",", " ")

async def send_order_notification(order: dict, items_detail: str):
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_GROUP_ID:
        print("Telegram credentials not found")
        return None

    # Construct the message text
    status_map = {
        "new": "Новый заказ",
        "assembly": "В сборке",
        "delivery": "В пути",
        "completed": "Завершен",
        "canceled": "Отменен"
    }
    
    status_text = status_map.get(order.get("status", "new"), order.get("status", "new"))
    
    # Escape all dynamic data
    customer_name = escape_html(order['customer_name'])
    customer_phone = escape_html(order['customer_phone'])
    address = escape_html(order.get('address') or 'Самовывоз')
    comment = escape_html(order.get('comment') or '')
    payment_method = escape_html(order.get('payment_method') or 'Не указано')
    safe_items_detail = escape_html(items_detail)

    total_formatted = format_number(order['total_price'])

    # Extras formatting
    extras = order.get('extras', {})
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
    
    # Inline Keyboard
    keyboard = {
        "inline_keyboard": [
            [
                {"text": "🔨 В сборку", "callback_data": f"set_assembly_{order['id']}"},
                {"text": "🚚 В путь", "callback_data": f"set_delivery_{order['id']}"}
            ],
            [
                {"text": "✅ Завершить", "callback_data": f"set_completed_{order['id']}"},
                {"text": "❌ Отменить", "callback_data": f"set_canceled_{order['id']}"}
            ],
            [
                {"text": "📜 Открыть в Sklad", "url": f"http://127.0.0.1:3001/orders?order={order['id']}"}
            ]
        ]
    }

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    
    print(f"Sending Telegram message to {TELEGRAM_GROUP_ID}") 

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json={
                "chat_id": TELEGRAM_GROUP_ID,
                "text": message,
                "parse_mode": "HTML",
                "reply_markup": keyboard,
                "disable_web_page_preview": True
            })
            
            if response.status_code != 200:
                print(f"Telegram API Error: {response.text}") 
                
            response.raise_for_status()
            return response.json().get("result", {}).get("message_id")
        except Exception as e:
            print(f"Failed to send telegram message: {e}")
            return None

async def update_order_status_message(message_id: int, order: dict, items_detail: str):
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_GROUP_ID or not message_id:
        return

    status_map = {
        "new": "🟢 Новый заказ",
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
    customer_phone = escape_html(order['customer_phone'])
    address = escape_html(order.get('address') or 'Самовывоз')
    comment = escape_html(order.get('comment') or '')
    payment_method = escape_html(order.get('payment_method') or 'Не указано')
    safe_items_detail = escape_html(items_detail)

    total_formatted = format_number(order['total_price'])

    # Extras formatting
    extras = order.get('extras', {})
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

    # Dynamic keyboard
    current_status = order.get("status", "new")
    buttons = []
    
    if current_status == "new":
        buttons = [
            [{"text": "🔨 В сборку", "callback_data": f"set_assembly_{order['id']}"}],
            [{"text": "❌ Отменить", "callback_data": f"set_canceled_{order['id']}"}]
        ]
    elif current_status in ["processing", "assembly"]:
        buttons = [
            [{"text": "🚚 В путь", "callback_data": f"set_delivery_{order['id']}"}],
            [{"text": "❌ Отменить", "callback_data": f"set_canceled_{order['id']}"}]
        ]
    elif current_status in ["shipping", "delivery"]:
         buttons = [
            [{"text": "✅ Завершить", "callback_data": f"set_completed_{order['id']}"}],
            [{"text": "❌ Отменить", "callback_data": f"set_canceled_{order['id']}"}]
        ]
    
    # Always add 'Open' button
    buttons.append([{"text": "📜 Открыть в Sklad", "url": f"http://127.0.0.1:3001/orders?order={order['id']}"}])

    keyboard = {
         "inline_keyboard": buttons
    }

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/editMessageText"
    
    async with httpx.AsyncClient() as client:
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

