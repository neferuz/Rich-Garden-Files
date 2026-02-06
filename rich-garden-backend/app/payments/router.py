import json
import os
import traceback
from urllib.parse import parse_qs

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.orders.models import Order
from app.payments.schemas import ClickInvoiceCreate, PaymeReceiptCreate
from app.users import repository as user_repo
from app.payments.service import (
    create_click_invoice, verify_click_signature,
    generate_click_checkout_url,
    create_payme_receipt, send_payme_receipt, check_payme_receipt
)
from app.payments.payme_merchant import (
    generate_payme_checkout_url, generate_payme_auth,
    check_perform_transaction, create_transaction,
    perform_transaction, check_transaction, cancel_transaction
)
from app.orders.service import notify_new_order

router = APIRouter(prefix="/payments", tags=["payments"])

# Click official IP addresses for security 'protection'
CLICK_ALLOWED_IPS = [
    "213.230.106.115", 
    "3.120.138.118", 
    "3.120.138.169", 
    "3.120.138.181"
]

async def verify_click_ip(request: Request):
    """Checks if the request comes from a trusted Click IP."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    else:
        client_ip = request.client.host
    
    # In development/local it might be 127.0.0.1 or localhost, we allow it for testing
    if client_ip in ["127.0.0.1", "localhost", "::1"]:
        return True
        
    if client_ip not in CLICK_ALLOWED_IPS:
        print(f"SECURITY WARNING: Unauthorized IP attempt to Click callback: {client_ip}")
        # Note: You can return False here to strictly block unknown IPs
        # return False 
    return True

def _normalize_phone(s: str | None) -> str | None:
    if not s:
        return None
    digits = "".join(filter(str.isdigit, s))
    return digits if len(digits) >= 9 else None


def _phone_for_click(order: Order, db: Session) -> str | None:
    """Номер для Click: из заказа или из привязанного пользователя (fallback)."""
    raw = (order.customer_phone or "").strip()
    if raw and _normalize_phone(raw):
        return _normalize_phone(raw)
    if order.user_id:
        user = user_repo.get_by_id(db, order.user_id)
        if user and _normalize_phone(user.phone_number):
            return _normalize_phone(user.phone_number)
    return None


@router.post("/create-click-invoice")
def create_click_invoice_endpoint(data: ClickInvoiceCreate, db: Session = Depends(get_db)):
    """
    Создает Click invoice через API (отправляет счет в приложение Click по номеру телефона)
    и возвращает payment_url для редиректа.
    """
    order = db.query(Order).filter(Order.id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Обновляем статус заказа
    order.status = "pending_payment"
    db.commit()

    # Определяем номер телефона для Click
    phone_for_click = data.phone_number or _phone_for_click(order, db)
    print(f"DEBUG Click endpoint: order_id={order.id}, phone_from_data={data.phone_number}, phone_from_order={_phone_for_click(order, db)}, phone_final={phone_for_click}")
    
    # ВАЖНО: ВСЕГДА пытаемся создать счет через Click API для отправки SMS
    # Даже если нет номера или API вернет ошибку, мы попробуем отправить счет
    invoice_result = None
    if phone_for_click:
        # Создаем счет через Click API (отправляет SMS и счет в приложение)
        invoice_result = create_click_invoice(order, data.return_url, phone_for_click)
        print(f"DEBUG Click API call result: status={invoice_result.get('status')}, invoice_id={invoice_result.get('invoice_id')}, fallback_pay_link={invoice_result.get('fallback_pay_link')}")
    else:
        print(f"DEBUG Click: No phone number found, will use direct URL")
        invoice_result = {"status": "error", "error": "Номер телефона не указан"}
    
    # Генерируем URL для оплаты (всегда нужен)
    payment_url = generate_click_checkout_url(order, data.return_url)
    
    # Если счет успешно создан через API
    if invoice_result and invoice_result.get("status") == "success" and invoice_result.get("invoice_id"):
        invoice_id = invoice_result.get("invoice_id")
        print(f"DEBUG Click ✅ Счет успешно создан через API: invoice_id={invoice_id}, SMS отправлена на {invoice_result.get('phone_number')}")
        
        # Используем payment_url из API если есть
        api_payment_url = invoice_result.get("payment_url")
        if api_payment_url:
            payment_url = api_payment_url
            print(f"DEBUG Click используем payment_url из API: {payment_url[:100]}...")
        else:
            # Если payment_url нет, но invoice_id есть - счет создан в приложении
            # Используем deep link для открытия приложения Click
            # Формат может быть разным, пробуем универсальный
            payment_url = f"https://click.uz/pay?invoice_id={invoice_id}"
            print(f"DEBUG Click создан deep link для приложения (нет payment_url от API): {payment_url}")
        
        return {
            "status": "success",
            "payment_url": payment_url,
            "invoice_id": invoice_id,
            "order_id": order.id,
            "amount": float(order.total_price or 0),
            "phone_number": invoice_result.get("phone_number"),
            "message": "Счет создан и отправлен в приложение Click. Проверьте SMS и приложение Click.",
            "fallback_pay_link": False  # Счет создан успешно, SMS отправлена
        }
    
    # Если не удалось создать счет через API, используем fallback URL
    # Но все равно возвращаем success, чтобы пользователь мог оплатить
    print(f"DEBUG Click ⚠️ Не удалось создать счет через API, используем fallback URL. Ошибка: {invoice_result.get('error') if invoice_result else 'Нет номера телефона'}")
    
    return {
        "status": "success",
        "payment_url": payment_url,
        "order_id": order.id,
        "amount": float(order.total_price or 0),
        "fallback_pay_link": True,
        "error": invoice_result.get("error") if invoice_result else "Номер телефона не указан",
        "message": "Откройте ссылку для оплаты картой на сайте Click."
    }

@router.post("/create-payme-invoice")
def create_payme_invoice_endpoint(data: ClickInvoiceCreate, db: Session = Depends(get_db)):
    """
    Создание платежа через Payme Merchant API (web, редирект).
    Возвращает URL для редиректа пользователя на Payme Checkout.
    Payme сам вызовет наши методы для обработки платежа.
    """
    order = db.query(Order).filter(Order.id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = "pending_payment"
    db.commit()
    
    # Генерируем URL для редиректа на Payme Checkout
    # Формат: https://checkout.payme.uz/{merchant_id}/{order_id}/{amount_tiyin}
    # Функция сама конвертирует сумму в тийины
    amount_sums = float(order.total_price or 0)
    checkout_url = generate_payme_checkout_url(order.id, int(amount_sums), data.return_url)
    
    print(f"DEBUG: Payme checkout URL generated for order {order.id}: {checkout_url}")
    
    return {
        "status": "success",
        "order_id": order.id,
        "amount": float(order.total_price or 0),
        "payment_url": checkout_url
    }


@router.post("/create-payme-receipt")
def create_payme_receipt_endpoint(data: PaymeReceiptCreate, db: Session = Depends(get_db)):
    """
    Subscribe API: создание чека для Mini App.
    receipts.create → receipts.send → заказ pending_payment.
    Фронт показывает «Ожидание оплаты» и опрашивает GET /payme-receipt-status/{receipt_id}.
    """
    order = db.query(Order).filter(Order.id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status == "paid":
        raise HTTPException(status_code=400, detail="Order already paid")

    # receipts.create
    result = create_payme_receipt(order)
    if result.get("status") != "success":
        error_msg = result.get("error", "Unknown error")
        error_code = result.get("error_code")
        error_type = result.get("error_type")
        raise HTTPException(
            status_code=400,
            detail={
                "error": error_msg,
                "error_code": error_code,
                "error_type": error_type,
            }
        )

    receipt_id = result["receipt_id"]
    order.status = "pending_payment"
    order.payme_receipt_id = receipt_id
    db.commit()

    # receipts.send — отправить чек на телефон (Payme покажет экран оплаты в приложении)
    phone = data.phone_number or _phone_for_click(order, db) or (order.customer_phone or "").strip()
    if phone:
        send_payme_receipt(receipt_id, phone)

    return {
        "status": "success",
        "receipt_id": receipt_id,
        "order_id": order.id,
        "amount": float(order.total_price or 0),
        "message": "Чек создан. Оплатите в приложении Payme.",
    }


@router.get("/payme-receipt-status/{receipt_id}")
async def payme_receipt_status_endpoint(receipt_id: str, db: Session = Depends(get_db)):
    """
    Subscribe API: проверка статуса чека. state = 4 — оплата успешна.
    При state=4 заказ помечается paid и вызывается notify_new_order.
    """
    result = check_payme_receipt(receipt_id)
    if result.get("status") != "success":
        return {
            "status": "error",
            "paid": False,
            "error": result.get("error"),
        }

    state = result.get("state", -1)
    paid = result.get("paid", False)  # state == 4

    if paid:
        order = db.query(Order).filter(Order.payme_receipt_id == receipt_id).first()
        if order and order.status != "paid":
            order.status = "paid"
            db.commit()
            try:
                await notify_new_order(db, order)
            except Exception as e:
                print(f"ERROR: notify_new_order failed: {e}")

    return {
        "status": "success",
        "receipt_id": receipt_id,
        "state": state,
        "paid": paid,
    }


async def verify_payme_auth(request: Request):
    """Проверяет Basic Auth заголовок от Payme"""
    auth_header = request.headers.get("Authorization", "")
    
    if not auth_header.startswith("Basic "):
        print(f"SECURITY WARNING: Payme request without Basic Auth: {auth_header[:50]}")
        return False
    
    expected_auth = generate_payme_auth()
    if auth_header != expected_auth:
        print(f"SECURITY WARNING: Payme auth mismatch")
        return False
    
    return True


@router.post("/payme")
async def payme_merchant_api(request: Request, db: Session = Depends(get_db)):
    """
    Endpoint для приема запросов от Payme Merchant API.
    
    Payme вызывает этот endpoint методами:
    - CheckPerformTransaction
    - CreateTransaction
    - PerformTransaction
    - CheckTransaction
    - CancelTransaction
    """
    # Проверка авторизации
    if not await verify_payme_auth(request):
        return JSONResponse(
            status_code=401,
            content={
                "error": {
                    "code": -32504,
                    "message": "Ошибка авторизации"
                }
            }
        )
    
    try:
        data = await request.json()
    except Exception as e:
        print(f"ERROR: Payme request parse error: {e}")
        return JSONResponse(
            status_code=400,
            content={
                "error": {
                    "code": -32700,
                    "message": "Ошибка парсинга JSON"
                }
            }
        )
    
    method = data.get("method")
    params = data.get("params", {})
    request_id = data.get("id")
    
    print(f"DEBUG: Payme request - method: {method}, id: {request_id}")
    print(f"DEBUG: Payme params: {json.dumps(params, indent=2, ensure_ascii=False)}")
    
    # Обработка методов
    if method == "CheckPerformTransaction":
        result = check_perform_transaction(params, db)
    elif method == "CreateTransaction":
        result = create_transaction(params, db)
    elif method == "PerformTransaction":
        result = perform_transaction(params, db)
    elif method == "CheckTransaction":
        result = check_transaction(params, db)
    elif method == "CancelTransaction":
        result = cancel_transaction(params, db)
    else:
        result = {
            "error": {
                "code": -32601,
                "message": f"Метод не найден: {method}"
            }
        }
    
    # Формируем ответ в формате JSON-RPC 2.0
    response = {
        "jsonrpc": "2.0",
        "id": request_id
    }
    response.update(result)
    
    print(f"DEBUG: Payme response: {json.dumps(response, indent=2, ensure_ascii=False)}")
    
    return JSONResponse(content=response)

async def _click_body_to_dict(request: Request):
    """Parse Click callback body (form or json) into a plain dict. Click обычно шлёт form-urlencoded."""
    try:
        ct = (request.headers.get("content-type") or "").lower()
        if "application/json" in ct:
            data = await request.json()
        else:
            form = await request.form()
            data = {k: (v[0] if isinstance(v, list) and v else v) for k, v in form.items()}
        # Лог для отладки подписи (sign_string не печатаем целиком)
        keys = list(data.keys())
        msg = f"Click callback ct={ct[:50]!r} keys={keys}"
        for k in ["click_trans_id", "service_id", "merchant_trans_id", "merchant_prepare_id", "amount", "action", "sign_time"]:
            if k in data:
                v = data[k]
                msg += f" {k}={repr(v)[:40]!r}"
        print(f"DEBUG {msg}")
        return data
    except Exception as e:
        print(f"Click callback body parse error: {e}")
        return {}


async def _click_result_read_and_log(request: Request) -> dict:
    """
    Читает body один раз, логирует весь POST /click/result (headers + payload),
    возвращает распарсенный dict. Click шлёт form-urlencoded или JSON.
    """
    raw = await request.body()
    headers = dict(request.headers)
    ct = (headers.get("content-type") or "").lower()

    print("=== Click RESULT full request ===")
    print("Headers:", json.dumps(headers, ensure_ascii=False, indent=2))
    try:
        body_preview = raw.decode("utf-8", errors="replace")
    except Exception:
        body_preview = "<binary>"
    print("Body (raw, max 2500 chars):", body_preview[:2500])

    if "application/json" in ct:
        try:
            data = json.loads(raw)
        except Exception as e:
            print(f"Click RESULT JSON parse error: {e}")
            data = {}
    else:
        try:
            decoded = raw.decode("utf-8", errors="replace")
            parsed = parse_qs(decoded, keep_blank_values=True)
            data = {k: (v[0] if isinstance(v, list) and v else v) for k, v in parsed.items()}
        except Exception as e:
            print(f"Click RESULT form parse error: {e}")
            data = {}

    # Логируем payload (sign_string — только последние 4 символа)
    logged = {k: (v[:-4] + "****" if k == "sign_string" and isinstance(v, str) and len(v) > 4 else v) for k, v in data.items()}
    print("Parsed payload:", json.dumps(logged, ensure_ascii=False, indent=2))
    return data


def _click_debug_minimal() -> bool:
    return os.getenv("CLICK_DEBUG_MINIMAL", "").strip().lower() in ("1", "true", "yes")


def _check_return(out: dict):
    """Check всегда JSON."""
    return JSONResponse(content=out, media_type="application/json")


@router.post("/click/check")
async def click_check(request: Request, db: Session = Depends(get_db)):
    """
    Check availability of order to pay (Step 1 of Click callback).
    """
    try:
        data = await _click_body_to_dict(request)
    except Exception as e:
        print(f"Click CHECK read/parse exception: {e}\n{traceback.format_exc()}")
        return _check_return({"error": -9, "error_note": "Internal error"})

    print(f"DEBUG Click check: mti={data.get('merchant_trans_id')} amount={data.get('amount')} action={data.get('action')}")

    try:
        if _click_debug_minimal():
            print("DEBUG: CLICK_DEBUG_MINIMAL=1 — check: без проверок, всегда success")
            mti = data.get("merchant_trans_id") or "0"
            try:
                mpi = int(mti)
            except (TypeError, ValueError):
                mpi = 0
            out = {
                "click_trans_id": data.get("click_trans_id"),
                "merchant_trans_id": str(mti),
                "merchant_prepare_id": mpi,
                "error": 0,
                "error_note": "Success",
            }
            print(f"DEBUG Click check RETURN: {out}")
            return _check_return(out)

        if not await verify_click_ip(request):
            return _check_return({"error": -1, "error_note": "IP not allowed"})

        skip_sign = os.getenv("CLICK_DEBUG_SKIP_SIGNATURE", "").strip().lower() in ("1", "true", "yes")
        if skip_sign:
            print("DEBUG: CLICK_DEBUG_SKIP_SIGNATURE=1 — пропускаем проверку подписи (check)")
        elif not verify_click_signature(data, for_complete=False):
            print(f"DEBUG: Click check signature failed mti={data.get('merchant_trans_id')}")
            return _check_return({"error": -1, "error_note": "Invalid signature"})

        try:
            order_id = int(data.get("merchant_trans_id") or 0)
        except (TypeError, ValueError):
            order_id = 0
        order = db.query(Order).filter(Order.id == order_id).first()

        if not order:
            print(f"DEBUG: Click check order not found id={order_id}")
            return _check_return({"error": -5, "error_note": "Order not found"})

        if order.status == "paid":
            return _check_return({"error": -9, "error_note": "Order already paid"})

        # ВАЖНО: amount должен быть одинаковым везде (15000 ≠ 15000.0 может сломать подпись)
        # Используем тот же формат, что пришел от Click
        incoming_amount_str = str(data.get("amount") or "0")
        incoming_amount = float(incoming_amount_str)
        expected = float(order.total_price or 0)
        
        # Проверяем сумму (с небольшой погрешностью для float)
        if abs(incoming_amount - expected) > 0.01:
            print(f"DEBUG: Click check amount mismatch order={order_id} expected={expected} got={incoming_amount} (str={incoming_amount_str})")
            return _check_return({"error": -2, "error_note": "Incorrect amount"})

        # ВАЖНО: merchant_prepare_id ОБЯЗАТЕЛЕН в ответе Prepare
        # Click будет использовать его в Complete для подписи
        merchant_prepare_id = order_id  # Используем order_id как merchant_prepare_id
        
        out = {
            "click_trans_id": data.get("click_trans_id"),
            "merchant_trans_id": str(order_id),
            "merchant_prepare_id": merchant_prepare_id,  # ОБЯЗАТЕЛЕН для Complete
            "error": 0,  # ВСЕГДА 0 при успехе
            "error_note": "Success",
        }
        print(f"DEBUG Click check RETURN: {out}")
        print(f"DEBUG Click Prepare: merchant_prepare_id={merchant_prepare_id} будет использован в Complete")
        return _check_return(out)
    except Exception as e:
        print(f"Click CHECK handler exception: {e}\n{traceback.format_exc()}")
        return _check_return({"error": -9, "error_note": "Internal error"})

def _click_result_response(click_trans_id, merchant_trans_id: str, merchant_confirm_id: int, error: int, error_note: str) -> dict:
    """Ответ Complete по доке: click_trans_id, merchant_trans_id, merchant_confirm_id, error, error_note."""
    out = {
        "click_trans_id": click_trans_id,
        "merchant_trans_id": str(merchant_trans_id),
        "merchant_confirm_id": int(merchant_confirm_id),
        "error": error,
        "error_note": error_note,
    }
    print(f"DEBUG Click result RETURN (exact JSON): {json.dumps(out, ensure_ascii=False)}")
    return out


def _click_return(out: dict):
    """Всегда JSON, Content-Type: application/json. Click не должен получить HTML/500."""
    return JSONResponse(content=out, media_type="application/json")


@router.post("/click/result")
async def click_result(request: Request, db: Session = Depends(get_db)):
    """
    Finalize payment (Step 2 of Click callback). Sign includes merchant_prepare_id.
    Reply: click_trans_id, merchant_trans_id, merchant_confirm_id, error, error_note.
    Всегда возвращаем JSON — никогда 500.
    """
    try:
        data = await _click_result_read_and_log(request)
    except Exception as e:
        print(f"Click RESULT read/parse exception: {e}\n{traceback.format_exc()}")
        return _click_return(_click_result_response(None, "0", 0, -9, "Internal error"))

    cti = data.get("click_trans_id")
    mti = data.get("merchant_trans_id") or "0"
    mpi = data.get("merchant_prepare_id")
    print(f"DEBUG Click result: mti={mti} mpi={mpi} amount={data.get('amount')} action={data.get('action')} error={data.get('error')}")

    try:
        if _click_debug_minimal():
            print("DEBUG: CLICK_DEBUG_MINIMAL=1 — result: без проверок, всегда success (заказ НЕ помечаем оплаченным)")
            try:
                mci = int(mti)
            except (TypeError, ValueError):
                mci = 0
            return _click_return(_click_result_response(cti, mti, mci, 0, "Success"))

        if not await verify_click_ip(request):
            return _click_return(_click_result_response(cti, mti, 0, -1, "IP not allowed"))

        skip_sign = os.getenv("CLICK_DEBUG_SKIP_SIGNATURE", "").strip().lower() in ("1", "true", "yes")
        if skip_sign:
            print("DEBUG: CLICK_DEBUG_SKIP_SIGNATURE=1 — пропускаем проверку подписи (result)")
        elif not verify_click_signature(data, for_complete=True):
            print(f"DEBUG: Click result signature failed mti={mti} mpi={mpi}")
            print(f"DEBUG: ВАЖНО: В Complete подпись должна включать merchant_prepare_id!")
            return _click_return(_click_result_response(cti, mti, 0, -1, "Invalid signature"))

        try:
            order_id = int(mti)
            merchant_prepare_id_from_click = int(mpi) if mpi else 0
        except (TypeError, ValueError):
            order_id = 0
            merchant_prepare_id_from_click = 0

        print(f"DEBUG Click Complete: order_id={order_id}, merchant_prepare_id_from_click={merchant_prepare_id_from_click}")

        # Проверяем error от Click (если Click сам вернул ошибку)
        click_error = int(data.get("error") or 0)
        if click_error < 0:
            print(f"DEBUG: Click вернул ошибку: {click_error}")
            return _click_return(_click_result_response(cti, mti, 0, -9, "Transaction failed at Click side"))

        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            print(f"DEBUG: Click result order not found id={order_id}")
            return _click_return(_click_result_response(cti, mti, 0, -5, "Order not found"))

        if order.status == "paid":
            # Уже оплачен - возвращаем success, но не меняем статус
            print(f"DEBUG: Click result order {order_id} already paid")
            return _click_return(_click_result_response(cti, str(order_id), order_id, 0, "Already paid"))

        # ВАЖНО: Помечаем заказ как оплаченный ТОЛЬКО если все проверки пройдены
        # merchant_confirm_id должен быть равен merchant_prepare_id (или order_id)
        merchant_confirm_id = merchant_prepare_id_from_click if merchant_prepare_id_from_click > 0 else order_id
        
        order.status = "paid"
        db.commit()
        await notify_new_order(db, order)

        print(f"DEBUG Click Complete SUCCESS: order {order_id} marked as paid, merchant_confirm_id={merchant_confirm_id}")
        # ВАЖНО: error ВСЕГДА 0 при успехе, иначе Click покажет "что-то пошло не так"
        return _click_return(_click_result_response(cti, str(order_id), merchant_confirm_id, 0, "Success"))
    except Exception as e:
        print(f"Click RESULT handler exception: {e}\n{traceback.format_exc()}")
        return _click_return(_click_result_response(cti, mti, 0, -9, "Internal error"))
