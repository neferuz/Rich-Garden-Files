import os
import httpx
import json
import html
import re
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

async def send_order_notification(order: dict, items_detail: str, image_limit: int = 10, images: list = None):
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
    extras = order.get('extras', {})
    if not isinstance(extras, dict):
        try:
            extras = json.loads(extras) if isinstance(extras, str) else {}
        except:
            extras = {}
    # Format delivery time to be user friendly
    # If date and time are present "YYYY-MM-DD HH:MM", change to "YYYY-MM-DD в HH:MM"
    raw_time = order.get('delivery_time') or extras.get('delivery_time') or 'Как можно быстрее'
    delivery_time = escape_html(raw_time)
    
    try:
        # Try to add 'в' if it looks like "Date Time" pattern
        # Simple heuristic: if it starts with digit, has space in middle, and second part looks like time
        if re.match(r'^\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}', delivery_time) and ' в ' not in delivery_time:
             # ISO date style: 2026-02-07 10:00 -> 2026-02-07 в 10:00
             delivery_time = delivery_time.replace(' ', ' в ', 1)
        elif re.match(r'^\d{2}\.\d{2}\.\d{4}\s+\d{1,2}:\d{2}', delivery_time) and ' в ' not in delivery_time:
             # RU date style: 07.02.2026 10:00 -> 07.02.2026 в 10:00
             delivery_time = delivery_time.replace(' ', ' в ', 1)
    except Exception as e:
        print(f"ERROR: Failed to format delivery time: {e}")
        # delivery_time remains as is, safe fallback

    safe_items_detail = escape_html(items_detail)

    total_formatted = format_number(order['total_price'])

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
         we_val = extras['wow_effect']
         if isinstance(we_val, dict):
             # Handle dict value (e.g. from frontend object)
             wow_label = we_val.get('title') or we_val.get('name') or str(we_val)
         else:
             # Handle string value (hashable)
             wow_label = wow_effects_map.get(we_val, we_val)
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
        f"⏰ <b>Время:</b> {delivery_time}\n"
        f"💰 <b>Сумма:</b> {total_formatted} сум\n"
        f"💳 <b>Оплата:</b> {payment_method}\n"
        f"{extras_text}\n"
        f"📋 <b>Состав заказа:</b>\n{safe_items_detail}\n"
    )

    # ... (previous code)

    # Resolve images first
    valid_images_paths = []
    if images:
        import os
        base_path = os.getcwd()
        # Filter out anything that isn't a string to avoid 'unhashable type: dict'
        clean_images = [img for img in images if isinstance(img, str) and img]
        unique_images = list(set(clean_images))[:10]
        
        print(f"DEBUG: Processing {len(unique_images)} images relative to {base_path}")
        for img_path in unique_images:
            clean_path = img_path.lstrip('/')
            if not clean_path:
                continue
            
            # Check directly first (if path is absolute or relative to CWD)
            candidates = []
            
            # 1. Absolute path check (if it starts with /var/www...) or CWD relative
            if os.path.exists(img_path):
                 candidates.append(img_path)
            
            # 2. Construct paths relative to backend root
            # Assumes CWD is where we launch python, usually backend root or app root
            # Common pattern: clean_path is like "static/uploads/uuid.jpg" or "/static/uploads/uuid.jpg"
            
            # Adjust for potential missing leading parts
            # e.g. if DB has "/static/uploads/foo.jpg" -> we need "app/static/uploads/foo.jpg"
            
            common_roots = [
                base_path,                            # /var/www/.../rich-garden-backend
                os.path.join(base_path, 'app'),       # /var/www/.../rich-garden-backend/app
            ]
            
            for root in common_roots:
                # Try raw join
                candidates.append(os.path.join(root, clean_path))
                
                # Try with 'static' prefix if missing
                if not clean_path.startswith('static'):
                     candidates.append(os.path.join(root, 'static', clean_path))
                
                # Try without 'static' if double (less likely but possible)
                if clean_path.startswith('static/'):
                     candidates.append(os.path.join(root, clean_path.replace('static/', '', 1)))
            
            # Special case for "uploads" direct link
            if clean_path.startswith('uploads/'):
                 candidates.append(os.path.join(base_path, 'app', 'static', clean_path))

            found = False
            for p in candidates:
                if os.path.exists(p) and os.path.isfile(p):
                    valid_images_paths.append(p)
                    print(f"DEBUG: Found image at {p}")
                    found = True
                    break
            
            if not found:
                print(f"DEBUG: Image NOT found. Tried: {candidates}")

    message = (
        f"<b>Заказ #{order['id']}</b>\n"
        f"📌 <b>Статус:</b> {status_text}\n\n"
        f"👤 <b>Заказчик:</b> {customer_name}\n"
        f"📱 <b>Телефон:</b> {customer_phone}\n"
        f"📍 <b>Адрес:</b> {address}\n"
        f"⏰ <b>Время:</b> {delivery_time}\n"
        f"💰 <b>Сумма:</b> {total_formatted} сум\n"
        f"💳 <b>Оплата:</b> {payment_method}\n"
        f"{extras_text}\n"
        f"📋 <b>Состав заказа:</b>\n{safe_items_detail}\n"
    )

    if comment:
         message += f"\n💭 <b>Комментарий:</b> {comment}\n"
    
    # Inline Keyboard
    current_status = order.get("status", "new").lower()
    buttons = []
    
    if current_status in ["done", "completed", "завершен", "выполнен", "cancelled", "canceled", "отменен"]:
        buttons = []
    else:
        if current_status in ["new", "pending_payment", "paid"]:
            buttons = [
                [{"text": "🔨 В сборку", "callback_data": f"set_processing_{order['id']}"}],
                [{"text": "🚚 В путь", "callback_data": f"set_shipping_{order['id']}"}],
                [{"text": "✅ Завершить", "callback_data": f"set_done_{order['id']}"}],
                [{"text": "❌ Отменить", "callback_data": f"set_cancelled_{order['id']}"}]
            ]
        elif current_status in ["processing", "assembly"]:
            buttons = [
                [{"text": "🚚 В путь", "callback_data": f"set_shipping_{order['id']}"}],
                [{"text": "✅ Завершить", "callback_data": f"set_done_{order['id']}"}],
                [{"text": "❌ Отменить", "callback_data": f"set_cancelled_{order['id']}"}]
            ]
        elif current_status in ["shipping", "delivery"]:
            buttons = [
                [{"text": "✅ Завершить", "callback_data": f"set_done_{order['id']}"}],
                [{"text": "❌ Отменить", "callback_data": f"set_cancelled_{order['id']}"}]
            ]
        else:
            buttons = [
                [{"text": "🔨 В сборку", "callback_data": f"set_processing_{order['id']}"}],
                [{"text": "🚚 В путь", "callback_data": f"set_shipping_{order['id']}"}],
                [{"text": "✅ Завершить", "callback_data": f"set_done_{order['id']}"}],
                [{"text": "❌ Отменить", "callback_data": f"set_cancelled_{order['id']}"}]
            ]
    
    keyboard = {
        "inline_keyboard": buttons
    }

    print(f"DEBUG: Keyboard structure: {json.dumps(keyboard, indent=2, ensure_ascii=False)}")
    print(f"Sending Telegram message to {TELEGRAM_GROUP_ID}") 

    async with httpx.AsyncClient(timeout=HTTPX_TIMEOUT) as client:
        try:
            # STRATEGY: "Collage Mode"
            # 1. If multiple images -> Send MediaGroup (Collage). Attach Caption (Order Info) to the FIRST photo of the group.
            #    Then send a small separate message with Buttons ("Control Panel").
            # 2. If single image -> Send Photo with Caption and Buttons (Perfect One Message).
            
            sent_message_id = None
            
            if len(valid_images_paths) == 1:
                # Case 1: Single Photo (Perfect)
                path = valid_images_paths[0]
                url_photo = f"https://api.telegram.org/bot{TELEGRAM_GROUP_BOT_TOKEN}/sendPhoto"
                print(f"DEBUG: Sending Single Photo Message: {path}")
                import mimetypes
                filename = os.path.basename(path)
                mime, _ = mimetypes.guess_type(path)
                
                # Full text in caption check
                caption_text = message
                use_fallback_text = len(message) > 1000
                
                if not use_fallback_text:
                    with open(path, 'rb') as f:
                        file_content = f.read()
                    payload = { "chat_id": TELEGRAM_GROUP_ID, "caption": caption_text, "parse_mode": "HTML", "reply_markup": json.dumps(keyboard) }
                    files = { "photo": (filename, file_content, mime or "image/jpeg") }
                    
                    response = await client.post(url_photo, data=payload, files=files)
                    if response.status_code == 200 and response.json().get("ok"):
                        sent_message_id = response.json()["result"]["message_id"]
                    else:
                        use_fallback_text = True # Retry with fallback
                
                if use_fallback_text:
                    # Fallback: Photo then Text
                     path = valid_images_paths[0]
                     with open(path, 'rb') as f:
                         await client.post(url_photo, data={"chat_id": TELEGRAM_GROUP_ID}, files={"photo": (filename, f.read(), mime)})
                     url_msg = f"https://api.telegram.org/bot{TELEGRAM_GROUP_BOT_TOKEN}/sendMessage"
                     resp = await client.post(url_msg, json={"chat_id": TELEGRAM_GROUP_ID, "text": message, "parse_mode": "HTML", "reply_markup": keyboard})
                     if resp.status_code == 200: sent_message_id = resp.json().get("result", {}).get("message_id")

            elif len(valid_images_paths) > 1:
                # Case 2: Link (Multiple Photos) -> Collage (Just Photos) + Text Card (Text + Buttons)
                # Since Telegram does NOT support Buttons on MediaGroups, we keep the Text and Buttons together.
                # Result:
                # [ Album of Photos ]
                # [ Text Order Details + Buttons ]
                
                print(f"DEBUG: Sending Collage with {len(valid_images_paths)} photos and separate Text Card")
                media_group = []
                files_payload = []
                import mimetypes
                
                for idx, path in enumerate(valid_images_paths):
                    field = f"p{idx}"
                    media_item = {
                        "type": "photo", 
                        "media": f"attach://{field}"
                    }
                    media_group.append(media_item)
                    
                    with open(path, 'rb') as f:
                        c = f.read()
                    files_payload.append((field, (os.path.basename(path), c, mimetypes.guess_type(path)[0])))
                
                url_media = f"https://api.telegram.org/bot{TELEGRAM_GROUP_BOT_TOKEN}/sendMediaGroup"
                await client.post(url_media, data={"chat_id": TELEGRAM_GROUP_ID, "media": json.dumps(media_group)}, files=files_payload)
                
                # Send Main Text Card with Buttons (so content and controls are combined)
                url_msg = f"https://api.telegram.org/bot{TELEGRAM_GROUP_BOT_TOKEN}/sendMessage"
                payload = {
                    "chat_id": TELEGRAM_GROUP_ID,
                    "text": message,
                    "parse_mode": "HTML",
                    "reply_markup": keyboard,
                    "disable_web_page_preview": True
                }
                
                response = await client.post(url_msg, json=payload)
                if response.status_code == 200 and response.json().get("ok"):
                    sent_message_id = response.json()["result"]["message_id"]

            else:
                # Case 3: Text Only
                url_msg = f"https://api.telegram.org/bot{TELEGRAM_GROUP_BOT_TOKEN}/sendMessage"
                payload = {
                    "chat_id": TELEGRAM_GROUP_ID,
                    "text": message,
                    "parse_mode": "HTML",
                    "reply_markup": keyboard,
                    "disable_web_page_preview": True
                }
                response = await client.post(url_msg, json=payload)
                if response.status_code == 200 and response.json().get("ok"):
                    sent_message_id = response.json()["result"]["message_id"]

            return sent_message_id

            return sent_message_id

        except Exception as e:
            print(f"ERROR: Failed to send telegram message: {e}")
            import traceback
            traceback.print_exc()
            return None

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
    extras = order.get('extras', {})
    if not isinstance(extras, dict):
        try:
            extras = json.loads(extras) if isinstance(extras, str) else {}
        except:
            extras = {}
    raw_time = order.get('delivery_time') or extras.get('delivery_time') or 'Как можно быстрее'
    delivery_time = escape_html(raw_time)
    
    try:
        if re.match(r'^\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}', delivery_time) and ' в ' not in delivery_time:
             delivery_time = delivery_time.replace(' ', ' в ', 1)
        elif re.match(r'^\d{2}\.\d{2}\.\d{4}\s+\d{1,2}:\d{2}', delivery_time) and ' в ' not in delivery_time:
             delivery_time = delivery_time.replace(' ', ' в ', 1)
    except Exception as e:
        print(f"ERROR: Failed to format delivery time in update: {e}")

    safe_items_detail = escape_html(items_detail)

    total_formatted = format_number(order['total_price'])

    # Extras formatting
    # ... (wow effects logic)

    message = (
        f"<b>Заказ #{order['id']}</b>\n"
        f"📌 <b>Статус:</b> {status_text}\n\n"
        f"👤 <b>Заказчик:</b> {customer_name}\n"
        f"📱 <b>Телефон:</b> {customer_phone}\n"
        f"📍 <b>Адрес:</b> {address}\n"
        f"⏰ <b>Время:</b> {delivery_time}\n"
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

    
    # Try updating caption first (if it was a photo message)
    url_caption = f"https://api.telegram.org/bot{TELEGRAM_GROUP_BOT_TOKEN}/editMessageCaption"
    
    success = False
    
    async with httpx.AsyncClient(timeout=HTTPX_TIMEOUT) as client:
        try:
            print(f"DEBUG: Attempting editMessageCaption for {message_id}")
            resp_cap = await client.post(url_caption, json={
                "chat_id": TELEGRAM_GROUP_ID,
                "message_id": message_id,
                "caption": message,
                "parse_mode": "HTML",
                "reply_markup": keyboard
            })
            
            res_cap = resp_cap.json()
            if resp_cap.status_code == 200 and res_cap.get("ok"):
                success = True
                print("DEBUG: Successfully edited caption")
            else:
                # If failed, check if it's because message has no caption (i.e. it's a text message)
                # or "message is not modified"
                desc = res_cap.get("description", "")
                if "not modified" in desc:
                    # Content same, technically success
                    success = True
                    print("DEBUG: Caption not modified (same content)")
                elif "message is not generally modified" in desc:
                    success = True
                else: 
                     # Only fallback if error implies it's not a caption-able message
                     print(f"DEBUG: editMessageCaption failed: {desc}. Trying editMessageText.")
                     
                     url_text = f"https://api.telegram.org/bot{TELEGRAM_GROUP_BOT_TOKEN}/editMessageText"
                     resp_text = await client.post(url_text, json={
                        "chat_id": TELEGRAM_GROUP_ID,
                        "message_id": message_id,
                        "text": message,
                        "parse_mode": "HTML",
                        "reply_markup": keyboard,
                        "disable_web_page_preview": True
                     })
                     res_text = resp_text.json()
                     if resp_text.status_code == 200 and res_text.get("ok"):
                         success = True
                         print("DEBUG: Successfully edited text")
                     else:
                         print(f"ERROR: Both edits failed. Text edit error: {res_text}")

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

async def fetch_photo_with_token(client, token, telegram_id):
    try:
        # 1. Get user profile photos
        photos_url = f"https://api.telegram.org/bot{token}/getUserProfilePhotos"
        resp = await client.post(photos_url, json={"user_id": telegram_id, "limit": 1})
        data = resp.json()
        
        file_id = None
        if data.get("ok") and data["result"]["total_count"] > 0:
            file_id = data["result"]["photos"][0][-1]["file_id"]
        else:
            # Try fallback: getChat
            chat_resp = await client.post(f"https://api.telegram.org/bot{token}/getChat", json={"chat_id": telegram_id})
            chat_data = chat_resp.json()
            if chat_data.get("ok") and chat_data["result"].get("photo"):
                file_id = chat_data["result"]["photo"]["big_file_id"]
        
        if not file_id:
            return None

        # 2. Get file path
        file_url = f"https://api.telegram.org/bot{token}/getFile"
        file_resp = await client.post(file_url, json={"file_id": file_id})
        file_data = file_resp.json()
        if not file_data.get("ok"):
            return None
        file_path = file_data["result"]["file_path"]
        
        # 3. Download
        download_url = f"https://api.telegram.org/file/bot{token}/{file_path}"
        photo_resp = await client.get(download_url)
        if photo_resp.status_code != 200:
            return None
            
        # 4. Save locally
        import uuid
        os.makedirs("app/static/uploads/avatars", exist_ok=True)
        filename = f"avatar_{telegram_id}_{uuid.uuid4().hex[:8]}.jpg"
        save_path = f"app/static/uploads/avatars/{filename}"
        with open(save_path, "wb") as f:
            f.write(photo_resp.content)
            
        return f"/static/uploads/avatars/{filename}"
    except Exception as e:
        print(f"Error in fetch_photo_with_token: {e}")
        return None

async def get_chat_photo(telegram_id: int):
    """
    Fetches the profile photo of a Telegram user and saves it locally.
    """
    admin_token = os.getenv("TELEGRAM_BOT_TOKEN_ADMIN")
    group_token = os.getenv("TELEGRAM_GROUP_BOT_TOKEN")
    
    tokens = [t for t in [admin_token, TELEGRAM_BOT_TOKEN, group_token] if t]
    
    async with httpx.AsyncClient(timeout=HTTPX_TIMEOUT) as client:
        for token in tokens:
            photo_url = await fetch_photo_with_token(client, token, telegram_id)
            if photo_url:
                return photo_url
                
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
