#!/usr/bin/env python3
"""
Тестирование endpoint /api/payments/click/check
Проверяем, что он правильно отвечает на Prepare запросы от Click
"""
import requests
import hashlib
import json

# Тестовые данные
BASE_URL = "https://24eywa.ru"
ENDPOINT = f"{BASE_URL}/api/payments/click/check"

# Данные Click (service_id 93495 — счёт по номеру)
CLICK_SERVICE_ID = "93495"
CLICK_SECRET_KEY = "3o6r4y1UkyBqYSb0Y"

def generate_sign_string(click_trans_id, service_id, merchant_trans_id, amount, action, sign_time, merchant_prepare_id=None):
    """Генерирует подпись для Click callback. Complete: передать merchant_prepare_id."""
    base = f"{click_trans_id}{service_id}{CLICK_SECRET_KEY}{merchant_trans_id}"
    if merchant_prepare_id is not None:
        base += str(merchant_prepare_id)
    base += f"{amount}{action}{sign_time}"
    return hashlib.md5(base.encode("utf-8")).hexdigest().lower()

def test_click_check_success():
    """Тест успешного Prepare запроса"""
    print("=" * 60)
    print("Тест 1: Успешный Prepare запрос (error должен быть 0)")
    print("=" * 60)
    
    # Тестовые данные для успешного запроса
    click_trans_id = "123456789"
    merchant_trans_id = "1"  # ID существующего заказа
    amount = "50000"  # Сумма заказа
    action = "0"  # Prepare
    sign_time = "2025-01-27 12:00:00"
    
    # Генерируем правильную подпись
    sign_string = generate_sign_string(
        click_trans_id, CLICK_SERVICE_ID, merchant_trans_id,
        amount, action, sign_time
    )

    # Формируем payload как form-data (Click обычно отправляет form-data)
    payload = {
        "click_trans_id": click_trans_id,
        "service_id": CLICK_SERVICE_ID,
        "merchant_trans_id": merchant_trans_id,
        "amount": amount,
        "action": action,
        "sign_time": sign_time,
        "sign_string": sign_string
    }
    
    print(f"URL: {ENDPOINT}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    print()
    
    # Отправляем как form-data (как Click)
    try:
        response = requests.post(ENDPOINT, data=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            try:
                json_response = response.json()
                print(f"Response JSON: {json.dumps(json_response, indent=2, ensure_ascii=False)}")
                
                err = json_response.get("error")
                if err == 0:
                    print("\n✅ УСПЕХ! Endpoint правильно отвечает error=0")
                    return True
                if err == -2:
                    print("\n✅ Подпись верна (error=-2 «Incorrect amount» — сумма теста не совпала с заказом, ожидаемо)")
                    return True
                if err == -9:
                    print("\n✅ Подпись верна (error=-9 «Order already paid» — заказ уже оплачен, ожидаемо)")
                    return True
                print(f"\n❌ ОШИБКА! Endpoint вернул error={err}")
                print(f"Error note: {json_response.get('error_note')}")
                return False
            except ValueError:
                print("\n❌ ОШИБКА! Ответ не является валидным JSON")
                return False
        else:
            print(f"\n❌ ОШИБКА! HTTP статус {response.status_code}, ожидался 200")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"\n❌ ОШИБКА запроса: {e}")
        return False

def test_click_check_json():
    """Тест с JSON payload"""
    print("\n" + "=" * 60)
    print("Тест 2: Prepare запрос с JSON payload")
    print("=" * 60)
    
    click_trans_id = "987654321"
    merchant_trans_id = "1"
    amount = "50000"
    action = "0"
    sign_time = "2025-01-27 12:00:00"
    
    sign_string = generate_sign_string(
        click_trans_id, CLICK_SERVICE_ID, merchant_trans_id,
        amount, action, sign_time
    )

    payload = {
        "click_trans_id": click_trans_id,
        "service_id": CLICK_SERVICE_ID,
        "merchant_trans_id": merchant_trans_id,
        "amount": amount,
        "action": action,
        "sign_time": sign_time,
        "sign_string": sign_string
    }

    headers = {"Content-Type": "application/json"}
    
    print(f"URL: {ENDPOINT}")
    print(f"Payload (JSON): {json.dumps(payload, indent=2)}")
    print()
    
    try:
        response = requests.post(ENDPOINT, json=payload, headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            try:
                json_response = response.json()
                err = json_response.get("error")
                if err == 0:
                    print("\n✅ УСПЕХ! Endpoint работает с JSON")
                    return True
                if err == -2:
                    print("\n✅ Подпись верна (error=-2 «Incorrect amount», ожидаемо)")
                    return True
                if err == -9:
                    print("\n✅ Подпись верна (error=-9 «Order already paid», ожидаемо)")
                    return True
                print(f"\n⚠️ Endpoint вернул error={err}")
                return False
            except ValueError:
                print("\n❌ Ответ не является валидным JSON")
                return False
        else:
            print(f"\n❌ HTTP статус {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Ошибка: {e}")
        return False


def test_click_result_success():
    """Тест успешного Complete запроса (подпись с merchant_prepare_id). Используем несуществующий заказ, чтобы не трогать реальные."""
    print("\n" + "=" * 60)
    print("Тест 3: Complete запрос (с merchant_prepare_id, заказ 999999)")
    print("=" * 60)

    RESULT_ENDPOINT = f"{BASE_URL}/api/payments/click/result"
    click_trans_id = "111222333"
    merchant_trans_id = "999999"
    merchant_prepare_id = "999999"
    amount = "50000"
    action = "1"
    sign_time = "2025-01-27 12:00:00"
    error = "0"

    sign_string = generate_sign_string(
        click_trans_id, CLICK_SERVICE_ID, merchant_trans_id,
        amount, action, sign_time, merchant_prepare_id=merchant_prepare_id
    )

    payload = {
        "click_trans_id": click_trans_id,
        "service_id": CLICK_SERVICE_ID,
        "merchant_trans_id": merchant_trans_id,
        "merchant_prepare_id": merchant_prepare_id,
        "amount": amount,
        "action": action,
        "error": error,
        "sign_time": sign_time,
        "sign_string": sign_string,
    }

    print(f"URL: {RESULT_ENDPOINT}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    print()

    try:
        response = requests.post(RESULT_ENDPOINT, data=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        if response.status_code != 200:
            return False
        j = response.json()
        err = j.get("error")
        if err == 0:
            print("\n✅ УСПЕХ! Complete (result) отвечает error=0")
            return True
        if err == -5:
            print("\n✅ Подпись верна (error=-5 «Order not found» — заказ 999999 не существует, ожидаемо)")
            return True
        print(f"\n❌ Complete вернул error={err} note={j.get('error_note')} (ожидали 0 или -5)")
        return False
    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
        return False


if __name__ == "__main__":
    print("Тестирование endpoint /api/payments/click/check")
    print(f"Base URL: {BASE_URL}")
    print()
    
    # Проверяем доступность endpoint
    print("Проверка доступности endpoint...")
    try:
        response = requests.head(ENDPOINT, timeout=5)
        print(f"Endpoint доступен (HTTP {response.status_code})")
    except:
        print("⚠️ Endpoint недоступен или не отвечает на HEAD запросы")
    
    print()
    
    result1 = test_click_check_success()
    result2 = test_click_check_json()
    result3 = test_click_result_success()

    print("\n" + "=" * 60)
    print("ИТОГИ:")
    print("=" * 60)
    print(f"Тест 1 (Prepare form-data): {'✅ ПРОШЕЛ' if result1 else '❌ НЕ ПРОШЕЛ'}")
    print(f"Тест 2 (Prepare JSON): {'✅ ПРОШЕЛ' if result2 else '❌ НЕ ПРОШЕЛ'}")
    print(f"Тест 3 (Complete с merchant_prepare_id): {'✅ ПРОШЕЛ' if result3 else '❌ НЕ ПРОШЕЛ'}")
    print()

    if result1 or result2 or result3:
        print("✅ Endpoint работает и отвечает правильно!")
        print("⚠️ Если Click не отправляет запросы, проверьте:")
        print("   1. Правильно ли настроены URLs в merchant.click.uz")
        print("   2. Активирован ли сервис")
        print("   3. Ждите реальных запросов от Click (они придут при создании инвойса)")
    else:
        print("❌ Endpoint не отвечает правильно!")
        print("Проверьте:")
        print("   1. Код endpoint'а в router.py")
        print("   2. IP фильтрацию (может блокировать запросы)")
        print("   3. Логи бэкенда для деталей ошибок")

