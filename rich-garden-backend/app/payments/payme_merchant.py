"""
Payme Merchant API implementation
Документация: https://developer.help.paycom.uz/protokol-merchant-api/
"""
import base64
import hashlib
import time
import json
import requests
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.orders.models import Order
from app.payments.models import PaymeTransaction
from app.payments.config import (
    PAYME_MERCHANT_ID, PAYME_KEY, PAYME_CHECKOUT_URL, PAYME_CALLBACK_URL, PAYME_API_URL
)


def generate_payme_auth() -> str:
    """
    Генерирует Basic Auth заголовок для Payme Merchant API.
    Формат: base64(merchant_id:KEY)
    """
    auth_string = f"{PAYME_MERCHANT_ID}:{PAYME_KEY}"
    auth_bytes = auth_string.encode('utf-8')
    auth_b64 = base64.b64encode(auth_bytes).decode('utf-8')
    return f"Basic {auth_b64}"


def generate_payme_checkout_url(order_id: int, amount: int, return_url: str) -> str:
    """
    Генерирует URL для редиректа пользователя на Payme Checkout через GET метод.
    
    Правильный формат для Merchant API (Инициализация платежей через GET):
    https://checkout.paycom.uz/{merchant_id}?amount={amount_tiyin}&account[order_id]={order_id}&lang=ru&timeout=15000
    
    Документация:
    https://developer.help.paycom.uz/initsializatsiya-platezhey/otpravka-cheka-po-metodu-get
    
    Args:
        order_id: ID заказа
        amount: Сумма в сумах (будет конвертирована в тийины)
        return_url: URL для возврата после оплаты (опционально, можно добавить как параметр back)
    """
    from urllib.parse import urlencode, quote
    
    amount_tiyin = int(amount * 100)
    
    # Формируем параметры для GET запроса
    params = {
        "amount": amount_tiyin,
        "account[order_id]": str(order_id),
        "lang": "ru",
        "timeout": "15000"
    }
    
    # Если есть return_url, добавляем параметр back
    if return_url:
        params["back"] = return_url
    
    # Формируем query string
    query_string = urlencode(params)
    
    # Формируем финальный URL
    checkout_url = f"https://checkout.paycom.uz/{PAYME_MERCHANT_ID}?{query_string}"
    
    print(f"DEBUG: Payme checkout URL generated for order {order_id}")
    print(f"DEBUG: Amount (tiyin): {amount_tiyin}")
    print(f"DEBUG: Params: {params}")
    print(f"DEBUG: URL: {checkout_url}")
    print(f"WARNING: Если Payme возвращает 'System error', проверьте:")
    print(f"  1. В личном кабинете Payme настроен Callback URL: {PAYME_CALLBACK_URL}")
    print(f"  2. Merchant API активирован для merchant_id: {PAYME_MERCHANT_ID}")
    print(f"  3. Endpoint /api/payments/payme доступен и принимает POST запросы")
    print(f"  4. Правильность merchant_id и KEY")
    
    return checkout_url


def verify_payme_request(data: Dict[str, Any]) -> bool:
    """
    Проверяет авторизацию запроса от Payme.
    Payme отправляет заголовок Authorization: Basic base64(merchant_id:KEY)
    """
    # Проверка будет выполняться на уровне endpoint через Depends
    return True


def check_perform_transaction(params: Dict[str, Any], db: Session) -> Dict[str, Any]:
    """
    CheckPerformTransaction - проверка возможности выполнения транзакции.
    
    Payme вызывает этот метод перед созданием транзакции.
    Мы должны проверить:
    - Существование заказа
    - Сумму заказа
    - Статус заказа (не оплачен)
    
    Returns:
        {"result": {"allow": True}} - если можно выполнить транзакцию
        {"error": {"code": ..., "message": ..., "data": ...}} - если нельзя
    """
    account = params.get("account", {})
    order_id = account.get("order_id")
    amount = params.get("amount")
    
    if not order_id:
        return {
            "error": {
                "code": -31050,
                "message": "Не указан order_id",
                "data": "order_id"
            }
        }
    
    try:
        order_id_int = int(order_id)
    except (ValueError, TypeError):
        return {
            "error": {
                "code": -31050,
                "message": "Неверный формат order_id",
                "data": "order_id"
            }
        }
    
    order = db.query(Order).filter(Order.id == order_id_int).first()
    
    if not order:
        return {
            "error": {
                "code": -31050,
                "message": "Заказ не найден",
                "data": "order_id"
            }
        }
    
    # Проверяем сумму (в тийинах)
    expected_amount = int(float(order.total_price or 0) * 100)
    
    if amount != expected_amount:
        return {
            "error": {
                "code": -31001,
                "message": "Неверная сумма",
                "data": "amount"
            }
        }
    
    # Проверяем статус заказа
    if order.status == "paid":
        return {
            "error": {
                "code": -31007,
                "message": "Заказ уже оплачен",
                "data": "order_id"
            }
        }
    
    return {
        "result": {
            "allow": True
        }
    }


def create_transaction(params: Dict[str, Any], db: Session) -> Dict[str, Any]:
    """
    CreateTransaction - создание транзакции.
    
    Payme вызывает этот метод для создания транзакции.
    Мы должны:
    - Проверить заказ (через CheckPerformTransaction логику)
    - Сохранить транзакцию в БД
    - Вернуть время создания
    
    Returns:
        {"result": {"create_time": timestamp, "transaction": "transaction_id", "state": 0}}
        {"error": {...}} - если ошибка
    """
    id = params.get("id")  # ID транзакции от Payme
    time_param = params.get("time")  # Unix timestamp от Payme
    amount = params.get("amount")
    account = params.get("account", {})
    order_id = account.get("order_id")
    
    if not id or not time_param or not amount or not order_id:
        return {
            "error": {
                "code": -32600,
                "message": "Неверные параметры запроса"
            }
        }
    
    try:
        order_id_int = int(order_id)
    except (ValueError, TypeError):
        return {
            "error": {
                "code": -31050,
                "message": "Неверный формат order_id",
                "data": "order_id"
            }
        }
    
    # Проверяем, не существует ли уже транзакция с таким ID
    existing_transaction = db.query(PaymeTransaction).filter(
        PaymeTransaction.transaction_id == id
    ).first()
    
    if existing_transaction:
        # Транзакция уже существует - возвращаем её данные
        return {
            "result": {
                "create_time": existing_transaction.create_time,
                "transaction": existing_transaction.transaction_id,
                "state": existing_transaction.state
            }
        }
    
    # Проверяем заказ
    check_result = check_perform_transaction(params, db)
    if "error" in check_result:
        return check_result
    
    # Создаем транзакцию
    transaction = PaymeTransaction(
        transaction_id=id,
        order_id=order_id_int,
        amount=amount,
        state=0,  # Создана
        create_time=time_param
    )
    
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    
    print(f"DEBUG: Payme transaction created: {id} for order {order_id_int}")
    
    return {
        "result": {
            "create_time": time_param,
            "transaction": id,
            "state": 0
        }
    }


def perform_transaction(params: Dict[str, Any], db: Session) -> Dict[str, Any]:
    """
    PerformTransaction - выполнение транзакции (подтверждение оплаты).
    
    Payme вызывает этот метод после успешной оплаты.
    Мы должны:
    - Найти транзакцию
    - Обновить статус заказа на "paid"
    - Сохранить время выполнения
    
    Returns:
        {"result": {"transaction": "transaction_id", "perform_time": timestamp, "state": 1}}
        {"error": {...}} - если ошибка
    """
    id = params.get("id")  # ID транзакции
    time_param = params.get("time")  # Unix timestamp
    
    if not id or not time_param:
        return {
            "error": {
                "code": -32600,
                "message": "Неверные параметры запроса"
            }
        }
    
    transaction = db.query(PaymeTransaction).filter(
        PaymeTransaction.transaction_id == id
    ).first()
    
    if not transaction:
        return {
            "error": {
                "code": -31003,
                "message": "Транзакция не найдена",
                "data": "id"
            }
        }
    
    # Если транзакция уже выполнена
    if transaction.state == 1:
        return {
            "result": {
                "transaction": transaction.transaction_id,
                "perform_time": transaction.perform_time,
                "state": 1
            }
        }
    
    # Если транзакция отменена
    if transaction.state == -1:
        return {
            "error": {
                "code": -31008,
                "message": "Транзакция отменена",
                "data": "id"
            }
        }
    
    # Обновляем транзакцию
    transaction.state = 1  # Выполнена
    transaction.perform_time = time_param
    
    # Обновляем заказ
    order = db.query(Order).filter(Order.id == transaction.order_id).first()
    if order:
        order.status = "paid"
        db.commit()
        
        # Уведомляем о новом заказе
        from app.orders.service import notify_new_order
        import asyncio
        try:
            asyncio.run(notify_new_order(db, order))
        except Exception as e:
            print(f"ERROR: Failed to notify about order: {e}")
    
    db.commit()
    
    print(f"DEBUG: Payme transaction performed: {id} for order {transaction.order_id}")
    
    return {
        "result": {
            "transaction": transaction.transaction_id,
            "perform_time": time_param,
            "state": 1
        }
    }


def check_transaction(params: Dict[str, Any], db: Session) -> Dict[str, Any]:
    """
    CheckTransaction - проверка статуса транзакции.
    
    Returns:
        {"result": {"transaction": {...}, "state": ..., "create_time": ..., "perform_time": ..., "cancel_time": ...}}
        {"error": {...}} - если ошибка
    """
    id = params.get("id")
    
    if not id:
        return {
            "error": {
                "code": -32600,
                "message": "Неверные параметры запроса"
            }
        }
    
    transaction = db.query(PaymeTransaction).filter(
        PaymeTransaction.transaction_id == id
    ).first()
    
    if not transaction:
        return {
            "error": {
                "code": -31003,
                "message": "Транзакция не найдена",
                "data": "id"
            }
        }
    
    result = {
        "result": {
            "transaction": transaction.transaction_id,
            "state": transaction.state,
            "create_time": transaction.create_time
        }
    }
    
    if transaction.perform_time:
        result["result"]["perform_time"] = transaction.perform_time
    
    if transaction.cancel_time:
        result["result"]["cancel_time"] = transaction.cancel_time
        result["result"]["reason"] = transaction.reason
    
    return result


def cancel_transaction(params: Dict[str, Any], db: Session) -> Dict[str, Any]:
    """
    CancelTransaction - отмена транзакции.
    
    Returns:
        {"result": {"transaction": "transaction_id", "cancel_time": timestamp, "state": -1}}
        {"error": {...}} - если ошибка
    """
    id = params.get("id")
    reason = params.get("reason", -1)  # Причина отмены
    time_param = params.get("time")
    
    if not id or not time_param:
        return {
            "error": {
                "code": -32600,
                "message": "Неверные параметры запроса"
            }
        }
    
    transaction = db.query(PaymeTransaction).filter(
        PaymeTransaction.transaction_id == id
    ).first()
    
    if not transaction:
        return {
            "error": {
                "code": -31003,
                "message": "Транзакция не найдена",
                "data": "id"
            }
        }
    
    # Если транзакция уже выполнена, нельзя отменить
    if transaction.state == 1:
        return {
            "error": {
                "code": -31007,
                "message": "Транзакция уже выполнена",
                "data": "id"
            }
        }
    
    # Если транзакция уже отменена
    if transaction.state == -1:
        return {
            "result": {
                "transaction": transaction.transaction_id,
                "cancel_time": transaction.cancel_time,
                "state": -1
            }
        }
    
    # Отменяем транзакцию
    transaction.state = -1
    transaction.cancel_time = time_param
    transaction.reason = reason
    
    db.commit()
    
    print(f"DEBUG: Payme transaction cancelled: {id} for order {transaction.order_id}, reason: {reason}")
    
    return {
        "result": {
            "transaction": transaction.transaction_id,
            "cancel_time": time_param,
            "state": -1
        }
    }
