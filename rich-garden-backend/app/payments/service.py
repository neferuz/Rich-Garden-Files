
import hashlib
import time
import requests
from sqlalchemy.orm import Session
from app.orders.models import Order
from app.payments.config import (
    CLICK_SERVICE_ID, CLICK_MERCHANT_ID, CLICK_SECRET_KEY, CLICK_MERCHANT_USER_ID,
    PAYME_MERCHANT_ID, PAYME_KEY, PAYME_API_URL, PAYME_RECEIPTS_API_URL
)
import base64
import json
from urllib.parse import urlencode

CLICK_API_URL = "https://api.click.uz/v2/merchant/invoice/create"

def generate_click_checkout_url(order: Order, return_url: str) -> str:
    """
    Генерирует URL для оплаты через Click Checkout (Redirect метод).
    Согласно документации: https://my.click.uz/services/pay?service_id={ID}&merchant_id={ID}&amount={SUM}&transaction_param={ORDER_ID}&return_url={URL}
    
    Для мини-приложений Telegram Click может требовать сумму без десятичных знаков.
    Используем целое число если сумма целая, иначе формат с двумя знаками.
    """
    amount = float(order.total_price or 0)
    # Для целых сумм используем целое число (лучше работает в Telegram Mini App)
    # Для дробных - формат с двумя знаками после запятой
    if amount == int(amount):
        amount_str = str(int(amount))
    else:
        amount_str = f"{amount:.2f}"
    
    params = {
        "service_id": CLICK_SERVICE_ID,
        "merchant_id": CLICK_MERCHANT_ID,
        "amount": amount_str,
        "transaction_param": str(order.id),
        "return_url": return_url,
    }
    url = "https://my.click.uz/services/pay?" + urlencode(params)
    print(f"DEBUG generate_click_checkout_url: order_id={order.id}, amount={amount}, amount_str={amount_str}, url={url}")
    return url

def generate_auth_headers():
    timestamp = str(int(time.time()))
    # Согласно документации Click API, digest должен быть в lowercase (не uppercase!)
    digest = hashlib.sha1((timestamp + CLICK_SECRET_KEY).encode("utf-8")).hexdigest()
    return {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Auth": f"{CLICK_MERCHANT_USER_ID}:{digest}:{timestamp}"
    }

def _normalize_click_phone(phone: str) -> str:
    """Нормализует телефон до формата 9989XXXXXXXX для Click."""
    clean = "".join(filter(str.isdigit, phone or ""))
    if not clean:
        return ""
    if not clean.startswith("998"):
        clean = "998" + clean[-9:]
    return clean


def create_click_invoice(order: Order, return_url: str, phone_override: str | None = None):
    """
    Выставление счёта Click по номеру телефона.
    Номер берётся из заказа (customer_phone с чекаута) или из phone_override (fallback).
    Click отправляет счёт в приложение Click на этот номер.
    Payload: service_id, amount, phone_number, merchant_trans_id.
    merchant_id, currency, back_url не передаём. Auth без изменений.
    """
    url = CLICK_API_URL
    amount_raw = float(order.total_price or 0)
    amount = round(amount_raw, 2)
    if amount <= 0:
        return {
            "error": "Сумма заказа должна быть больше нуля",
            "status": "error",
        }
    raw_phone = phone_override or (order.customer_phone or "")
    phone = _normalize_click_phone(raw_phone)
    if not phone:
        return {
            "error": "Для оплаты через Click у заказа должен быть указан номер телефона",
            "status": "error",
        }

    # Тело запроса согласно документации Click API:
    # service_id должен быть integer, amount - float, phone_number - string, merchant_trans_id - string
    # merchant_user_id только в Auth заголовке, в payload нет.
    # Счёт по номеру: service_id, amount, phone_number, merchant_trans_id. Без merchant_id, currency, back_url.
    payload = {
        "service_id": int(CLICK_SERVICE_ID),  # Должен быть integer согласно документации
        "amount": float(amount),  # Должен быть float согласно документации
        "phone_number": phone,
        "merchant_trans_id": str(order.id),
    }
    headers = generate_auth_headers()

    print(f"DEBUG Click Request URL: {url}")
    print(f"DEBUG Click Payload: {json.dumps(payload, indent=2)}")
    print(f"DEBUG Click Headers: {json.dumps({k: v for k, v in headers.items() if k != 'Auth'}, indent=2)}")
    print(f"DEBUG Click Auth header (first 50 chars): {headers['Auth'][:50]}...")

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.exceptions.RequestException as e:
        print(f"ERROR Click API request failed: {e}")
        return {"error": f"Ошибка подключения к Click API: {e}", "status": "error"}

    print(f"DEBUG Click Response Status: {response.status_code}")
    print(f"DEBUG Click Response Text: {response.text}")
    print(f"DEBUG Click Response Headers: {dict(response.headers)}")
    
    try:
        json_response = response.json()
        print(f"DEBUG Click Response JSON: {json.dumps(json_response, indent=2, ensure_ascii=False)}")
    except ValueError:
        print(f"ERROR Click Invalid JSON: {response.text}")
        return {"error": f"Invalid response from Click: {response.text}", "status": "error"}

    # Check for functional error codes in success response
    # ВАЖНО: Click API может возвращать успешный ответ БЕЗ error_code, только с invoice_id
    print(f"DEBUG Click Response structure: has error_code={('error_code' in json_response)}, has invoice_id={('invoice_id' in json_response)}, keys={list(json_response.keys())}")
    
    if "error_code" in json_response:
        error_code = json_response["error_code"]
        error_note = json_response.get("error_note", "")
        print(f"DEBUG Click error_code: {error_code}, error_note: {error_note}")
        
        if error_code == 0:
            invoice_id = json_response.get("invoice_id")
            print(f"DEBUG Click SUCCESS - invoice_id: {invoice_id}")
            print(f"DEBUG Click invoice response keys: {list(json_response.keys())}")
            
            # При успешном создании счета через phone_number, Click автоматически отправляет SMS
            # и счет появляется в приложении Click. payment_url обычно не возвращается для phone_number.
            pay_url = json_response.get("payment_url") or json_response.get("pay_url")
            if not pay_url:
                for k, v in json_response.items():
                    if k in ("payment_url", "pay_url", "invoice_url", "promo_url", "redirect_url", "link", "url") and isinstance(v, str) and v.startswith("http"):
                        pay_url = v
                        print(f"DEBUG Click pay_url from API key {k!r}: {pay_url[:80]}...")
                        break
            if not pay_url:
                # Если payment_url не вернулся, это нормально для phone_number - счет отправлен в приложение Click
                # ВАЖНО: Для открытия приложения Click используем универсальный формат my.click.uz/services/pay
                # Этот формат автоматически открывает приложение если оно установлено, иначе открывает веб-страницу
                # Используем тот же формат суммы, что и в generate_click_checkout_url
                if amount == int(amount):
                    amount_str = str(int(amount))
                else:
                    amount_str = f"{amount:.2f}"
                params = {
                    "service_id": CLICK_SERVICE_ID,
                    "merchant_id": CLICK_MERCHANT_ID,
                    "amount": amount_str,
                    "transaction_param": str(order.id),  # Используем order.id для связи с invoice_id
                    "return_url": return_url,
                }
                pay_url = "https://my.click.uz/services/pay?" + urlencode(params)
                print(f"DEBUG Click payment_url создан для открытия приложения: {pay_url}")
                print(f"DEBUG Click ВАЖНО: invoice_id={invoice_id} означает что счет создан и отправлен в приложение Click")
                print(f"DEBUG Click Этот URL откроет приложение Click (если установлено) или веб-страницу оплаты")
            
            print(f"DEBUG Click invoice created successfully. Invoice ID: {invoice_id}")
            print(f"DEBUG Click SMS should be sent to phone: {phone}")
            print(f"DEBUG Click Invoice should appear in Click app for user with phone: {phone}")
            print(f"DEBUG Click RETURNING: invoice_id={invoice_id}, fallback_pay_link=False (счет успешно создан)")
            
            # ВАЖНО: Если invoice_id есть, значит счет успешно создан через API
            # fallback_pay_link должен быть False, даже если payment_url - это fallback URL
            result = {
                "status": "success",
                "invoice_id": invoice_id,
                "payment_url": pay_url,
                "phone_number": phone,
                "message": "Счет создан и отправлен в приложение Click. Проверьте SMS и приложение Click.",
                "fallback_pay_link": False,  # Счет создан успешно, это НЕ fallback
                "data": json_response
            }
            print(f"DEBUG Click Final result: {json.dumps({k: v for k, v in result.items() if k != 'data'}, indent=2, ensure_ascii=False)}")
            return result
        else:
            error_msg = json_response.get("error_note", f"Error Code: {error_code}")
            print(f"ERROR Click API Error: {error_msg} (Code: {error_code})")
            print(f"ERROR Full response: {json.dumps(json_response, indent=2, ensure_ascii=False)}")

            # «Клиент не является пользователем Click» — номер не привязан к Click.
            # Fallback: даём ссылку на оплату my.click.uz/services/pay (оплата картой без приложения).
            # ВАЖНО: Проверяем точное совпадение текста ошибки, так как -500 может означать разные вещи
            error_msg_lower = (error_msg or "").lower()
            not_click_user = (
                "не является пользователем click" in error_msg_lower or 
                "not a click user" in error_msg_lower or
                "клиент не является пользователем" in error_msg_lower or
                "пользователь не найден" in error_msg_lower
            )
            
            print(f"DEBUG Click error analysis: error_code={error_code}, error_msg={error_msg!r}, not_click_user={not_click_user}")
            
            # Обработка специфичных ошибок
            # ВАЖНО: -500 может означать разные вещи, не только отсутствие аккаунта
            # Проверяем текст ошибки перед возвратом ошибки
            if error_code == -500:
                print("ERROR Click API returned -500. Possible causes:")
                print("  1. Invalid credentials (service_id, merchant_id, secret_key)")
                print("  2. Account not activated in Click merchant panel")
                print("  3. Account blocked")
                print("  4. Service not configured for SMS sending")
                print("  5. Phone number format incorrect")
                print("  6. User is not a Click user (but this should be detected by not_click_user check)")
                
                # Если это точно не ошибка "не является пользователем", возвращаем ошибку
                # Иначе обработаем ниже как not_click_user
                if not not_click_user:
                    return {
                        "error": f"Ошибка Click API (-500): {error_msg}. Проверьте настройки в личном кабинете Click.",
                        "error_code": error_code,
                        "status": "error",
                        "suggestion": "Проверьте настройки service_id в личном кабинете Click и убедитесь, что сервис активирован для отправки SMS"
                    }
                # Если это ошибка "не является пользователем", продолжаем обработку ниже
            
            if not_click_user:
                # Используем тот же формат суммы, что и в generate_click_checkout_url
                if amount == int(amount):
                    amount_str = str(int(amount))
                else:
                    amount_str = f"{amount:.2f}"
                params = {
                    "service_id": CLICK_SERVICE_ID,
                    "merchant_id": CLICK_MERCHANT_ID,
                    "amount": amount_str,
                    "transaction_param": str(order.id),
                    "return_url": return_url,
                }
                pay_url = "https://my.click.uz/services/pay?" + urlencode(params)
                print(f"DEBUG Click ПОДТВЕРЖДЕНО: номер {phone} не является пользователем Click (error_code={error_code}, error_msg={error_msg!r})")
                return {
                    "status": "success",
                    "invoice_id": None,
                    "payment_url": pay_url,
                    "fallback_pay_link": True,
                    "fallback_message": "По этому номеру нет аккаунта Click. Откройте ссылку — оплата картой на сайте Click.",
                    "data": json_response,
                }
            
            # Если ошибка не связана с отсутствием аккаунта, возвращаем ошибку
            print(f"DEBUG Click Неизвестная ошибка от Click API: error_code={error_code}, error_msg={error_msg!r}")
            return {"error": error_msg, "error_code": error_code, "status": "error"}
    
    # Если в ответе нет error_code, но есть invoice_id - это тоже успех
    if "invoice_id" in json_response:
        invoice_id = json_response.get("invoice_id")
        print(f"DEBUG Click SUCCESS (no error_code but has invoice_id): invoice_id={invoice_id}")
        # Создаем fallback URL если нет payment_url
        pay_url = json_response.get("payment_url") or json_response.get("pay_url")
        if not pay_url:
            if amount == int(amount):
                amount_str = str(int(amount))
            else:
                amount_str = f"{amount:.2f}"
            params = {
                "service_id": CLICK_SERVICE_ID,
                "merchant_id": CLICK_MERCHANT_ID,
                "amount": amount_str,
                "transaction_param": str(order.id),
                "return_url": return_url,
            }
            pay_url = "https://my.click.uz/services/pay?" + urlencode(params)
        
        return {
            "status": "success",
            "invoice_id": invoice_id,
            "payment_url": pay_url,
            "phone_number": phone,
            "message": "Счет создан и отправлен в приложение Click. Проверьте SMS и приложение Click.",
            "fallback_pay_link": False,
            "data": json_response
        }
    
    # Неожиданный формат ответа
    print(f"DEBUG Click Unexpected response format: {json.dumps(json_response, indent=2, ensure_ascii=False)}")
    return json_response

def _click_amount_variants(raw: str) -> list[str]:
    """
    Варианты строки amount для подписи — Click может слать 90000, 90000.0, 90000.00.
    ВАЖНО: amount должен быть одинаковым везде (15000 ≠ 15000.0 может сломать подпись).
    Проверяем все варианты для совместимости.
    """
    out = [raw] if raw else []
    try:
        f = float(raw)
        # Добавляем варианты: исходный, целое число, с двумя знаками
        out.append(str(int(f)))  # 15000
        out.append(f"{f:.1f}")   # 15000.0
        out.append(f"{f:.2f}")   # 15000.00
    except (TypeError, ValueError):
        pass
    return list(dict.fromkeys(out))


def verify_click_signature(data: dict, for_complete: bool = False) -> bool:
    """
    Verifies the signature from Click callback.
    
    Prepare (action=0):
    md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + amount + action + sign_time)
    
    Complete (action=1):
    md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + merchant_prepare_id + amount + action + sign_time)
    
    ВАЖНО: В Complete ОБЯЗАТЕЛЕН merchant_prepare_id в подписи!
    ВАЖНО: amount должен быть одинаковым везде (15000 ≠ 15000.0 может сломать подпись)
    """
    try:
        click_trans_id = str(data.get("click_trans_id") or "")
        service_id = str(data.get("service_id") or "")
        merchant_trans_id = str(data.get("merchant_trans_id") or "")
        action = str(data.get("action") or "")
        sign_time = str(data.get("sign_time") or "")
        merchant_prepare_id = str(data.get("merchant_prepare_id") or "")
        raw_amount = str(data.get("amount") or "")
        incoming_sign = (data.get("sign_string") or "").strip().lower()

        if for_complete:
            if not merchant_prepare_id:
                print(f"ERROR: Complete требует merchant_prepare_id, но он отсутствует!")
                return False
            print(
                "DEBUG Complete sign formula: md5(click_trans_id+service_id+SECRET+merchant_trans_id+merchant_prepare_id+amount+action+sign_time) "
                f"mti={merchant_trans_id!r} mpi={merchant_prepare_id!r} amount={raw_amount!r} action={action!r} sign_time={sign_time!r}"
            )
        else:
            print(
                "DEBUG Prepare sign formula: md5(click_trans_id+service_id+SECRET+merchant_trans_id+amount+action+sign_time) "
                f"mti={merchant_trans_id!r} amount={raw_amount!r} action={action!r} sign_time={sign_time!r}"
            )

        amount_variants = _click_amount_variants(raw_amount)
        if not amount_variants:
            amount_variants = [raw_amount]

        for amount in amount_variants:
            if for_complete:
                sign_string = f"{click_trans_id}{service_id}{CLICK_SECRET_KEY}{merchant_trans_id}{merchant_prepare_id}{amount}{action}{sign_time}"
            else:
                sign_string = f"{click_trans_id}{service_id}{CLICK_SECRET_KEY}{merchant_trans_id}{amount}{action}{sign_time}"
            calculated = hashlib.md5(sign_string.encode("utf-8")).hexdigest().lower()
            if calculated == incoming_sign:
                if for_complete:
                    print(f"DEBUG Complete signature OK (amount variant {amount!r})")
                return True

        preview = f"{click_trans_id}{service_id}<SECRET>{merchant_trans_id}"
        if for_complete:
            preview += f"{merchant_prepare_id}"
        preview += f"{raw_amount}{action}{sign_time}"
        print(
            f"Click sign mismatch for_complete={for_complete} mti={merchant_trans_id!r} mpi={merchant_prepare_id!r} "
            f"amount_variants={amount_variants} action={action!r} computed={calculated} incoming={incoming_sign!r} "
            f"preview={preview}"
        )
        return False
    except Exception as e:
        print(f"Click signature verification failed: {e}")
        return False

def create_payme_receipt(order: Order):
    """
    Subscribe API: receipts.create
    Официальный формат: amount (тийины), account.order_id.
    Документация Payme Business для Mini App.
    """
    amount_tiyin = int(float(order.total_price) * 100)

    # Официальный формат Subscribe API (Payme Business)
    params = {
        "amount": amount_tiyin,
        "account": {
            "order_id": str(order.id)
        }
    }

    rpc_payload = {
        "jsonrpc": "2.0",
        "id": int(time.time()),
        "method": "receipts.create",
        "params": params
    }

    # Subscribe API: X-Auth (merchant_id:KEY)
    headers = {
        "X-Auth": f"{PAYME_MERCHANT_ID}:{PAYME_KEY}",
        "Content-Type": "application/json"
    }

    try:
        print(f"DEBUG: Creating Payme receipt for Order {order.id} (Subscribe API)")
        print(f"DEBUG: Payme Receipts API URL: {PAYME_RECEIPTS_API_URL}")
        print(f"DEBUG: Payload: {json.dumps(rpc_payload, indent=2, ensure_ascii=False)}")
        
        response = requests.post(
            PAYME_RECEIPTS_API_URL,
            json=rpc_payload,
            headers=headers,
            timeout=30
        )
        
        print(f"DEBUG: Payme Response Status: {response.status_code}")
        print(f"DEBUG: Payme Response Headers: {dict(response.headers)}")
        
        try:
            json_response = response.json()
            print(f"DEBUG: Payme Response JSON: {json.dumps(json_response, indent=2, ensure_ascii=False)}")
        except ValueError:
            print(f"ERROR: Payme Invalid JSON response: {response.text}")
            return {
                "error": f"Invalid response from Payme API: {response.text[:200]}",
                "status": "error",
                "error_code": None
            }
        
        if "error" in json_response:
            error_data = json_response['error']
            error_code = error_data.get('code') if isinstance(error_data, dict) else None
            error_message = error_data.get('message') if isinstance(error_data, dict) else str(error_data)
            
            print(f"ERROR: Payme API Error - Code: {error_code}, Message: {error_message}")
            
            # Обработка специфичных ошибок
            if error_code == -31001:
                # Сервер недоступен - может быть временная проблема или касса не активирована
                return {
                    "error": "Сервис Payme временно недоступен. Возможные причины: касса не активирована для Subscribe API или временные проблемы на стороне Payme. Попробуйте позже или выберите другой способ оплаты.",
                    "status": "error",
                    "error_code": error_code,
                    "error_type": "service_unavailable"
                }
            elif error_code == -31601:
                # Касса не активирована
                return {
                    "error": "Касса не активирована для Subscribe API. Обратитесь в поддержку Payme для активации.",
                    "status": "error",
                    "error_code": error_code,
                    "error_type": "not_activated"
                }
            elif error_code == -32504:
                # Ошибка авторизации
                return {
                    "error": "Ошибка авторизации в Payme. Проверьте настройки merchant_id и ключа.",
                    "status": "error",
                    "error_code": error_code,
                    "error_type": "auth_error"
                }
            elif error_code == -32601:
                # Method not found
                return {
                    "error": "Метод не найден. Проверьте правильность endpoint API.",
                    "status": "error",
                    "error_code": error_code,
                    "error_type": "method_not_found"
                }
            else:
                # Общая ошибка
                return {
                    "error": f"Ошибка Payme API: {error_message} (код: {error_code})",
                    "status": "error",
                    "error_code": error_code,
                    "error_type": "api_error"
                }
        
        # Проверяем наличие result
        if "result" not in json_response:
            print(f"ERROR: Payme response missing 'result' field: {json_response}")
            return {
                "error": "Неожиданный формат ответа от Payme API",
                "status": "error",
                "error_code": None
            }
        
        receipt = json_response.get('result', {}).get('receipt')
        if not receipt:
            print(f"ERROR: Payme response missing 'receipt' in result: {json_response}")
            return {
                "error": "Ответ Payme не содержит данных о чеке",
                "status": "error",
                "error_code": None
            }
        
        receipt_id = receipt.get('id') or receipt.get('_id')
        if not receipt_id:
            print(f"ERROR: Payme receipt missing 'id' or '_id': {receipt}")
            return {
                "error": "Ответ Payme не содержит ID чека",
                "status": "error",
                "error_code": None
            }
        
        print(f"DEBUG: Payme receipt created successfully: {receipt_id}")
        return {
            "status": "success",
            "receipt_id": receipt_id
        }
        
    except requests.exceptions.Timeout:
        print(f"ERROR: Payme API request timeout")
        return {
            "error": "Превышено время ожидания ответа от Payme. Попробуйте позже.",
            "status": "error",
            "error_code": "timeout"
        }
    except requests.exceptions.ConnectionError as e:
        print(f"ERROR: Payme API connection error: {e}")
        return {
            "error": "Не удалось подключиться к серверу Payme. Проверьте интернет-соединение или попробуйте позже.",
            "status": "error",
            "error_code": "connection_error"
        }
    except Exception as e:
        print(f"ERROR: Unexpected error creating Payme receipt: {e}")
        import traceback
        print(f"ERROR: Traceback: {traceback.format_exc()}")
        return {
            "error": f"Неожиданная ошибка при создании чека Payme: {str(e)}",
            "status": "error",
            "error_code": None
        }

def send_payme_receipt(receipt_id: str, phone: str):
    """
    Subscribe API: receipts.send
    Отправка чека пользователю — Payme показывает экран оплаты в приложении.
    """
    clean_phone = ''.join(filter(str.isdigit, phone))
    if not clean_phone.startswith('998'):
        clean_phone = '998' + clean_phone[-9:]

    rpc_payload = {
        "jsonrpc": "2.0",
        "id": int(time.time()),
        "method": "receipts.send",
        "params": {
            "id": receipt_id,
            "phone": clean_phone
        }
    }

    headers = {
        "X-Auth": f"{PAYME_MERCHANT_ID}:{PAYME_KEY}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(
            PAYME_RECEIPTS_API_URL,
            json=rpc_payload,
            headers=headers,
            timeout=30
        )
        return response.json()
    except Exception as e:
        return {"error": str(e), "status": "error"}

def check_payme_receipt(receipt_id: str):
    """
    Subscribe API: receipts.get
    Проверка статуса чека. state = 4 — оплата успешна.
    """
    rpc_payload = {
        "jsonrpc": "2.0",
        "id": int(time.time()),
        "method": "receipts.get",
        "params": {
            "id": receipt_id
        }
    }

    headers = {
        "X-Auth": f"{PAYME_MERCHANT_ID}:{PAYME_KEY}",
        "Content-Type": "application/json"
    }

    try:
        print(f"DEBUG: Checking Payme receipt status for {receipt_id}")
        response = requests.post(
            PAYME_RECEIPTS_API_URL,
            json=rpc_payload,
            headers=headers,
            timeout=15
        )
        json_response = response.json()
        print(f"DEBUG: Payme receipt check response: {json_response}")
        
        if "error" in json_response:
            return {"error": json_response['error'], "status": "error"}
        
        receipt = json_response.get('result', {}).get('receipt', {})
        state = receipt.get('state', -1)
        
        return {
            "status": "success",
            "receipt_id": receipt_id,
            "state": state,
            "paid": state == 4,  # state = 4 означает успешную оплату
            "receipt": receipt
        }
    except Exception as e:
        print(f"ERROR: Payme receipt check failed: {e}")
        return {"error": str(e), "status": "error"}
