#!/usr/bin/env python3
"""
Тестовый скрипт для проверки подключения к Click API
"""
import hashlib
import time
import requests
import json

# Конфигурация
CLICK_SERVICE_ID = "93495"
CLICK_MERCHANT_ID = "14071"
CLICK_SECRET_KEY = "ZSMcjrk8mGI"
CLICK_MERCHANT_USER_ID = "75979"
CLICK_API_URL = "https://api.click.uz/v2/merchant/invoice/create"

def test_click_api():
    """Тестирует создание инвойса в Click API"""
    
    # 1. Формируем заголовок авторизации
    timestamp = str(int(time.time()))
    digest_string = timestamp + CLICK_SECRET_KEY
    digest = hashlib.sha1(digest_string.encode("utf-8")).hexdigest()
    
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Auth": f"{CLICK_MERCHANT_USER_ID}:{digest}:{timestamp}"
    }
    
    # 2. Тестируем разные варианты payload
    test_cases = [
        {
            "name": "Вариант 1: service_id и merchant_id как строки",
            "payload": {
                "service_id": str(CLICK_SERVICE_ID),
                "merchant_id": str(CLICK_MERCHANT_ID),
                "amount": 1000,
                "currency": "UZS",
                "description": "Test Order",
                "order_id": f"TEST_{int(time.time())}",
                "back_url": "https://24eywa.ru/orders"
            }
        },
        {
            "name": "Вариант 2: service_id и merchant_id как int",
            "payload": {
                "service_id": int(CLICK_SERVICE_ID),
                "merchant_id": int(CLICK_MERCHANT_ID),
                "amount": 1000,
                "currency": "UZS",
                "description": "Test Order",
                "order_id": f"TEST_{int(time.time())}",
                "back_url": "https://24eywa.ru/orders"
            }
        },
        {
            "name": "Вариант 3: Без currency (по умолчанию UZS)",
            "payload": {
                "service_id": int(CLICK_SERVICE_ID),
                "merchant_id": int(CLICK_MERCHANT_ID),
                "amount": 1000,
                "description": "Test Order",
                "order_id": f"TEST_{int(time.time())}",
                "back_url": "https://24eywa.ru/orders"
            }
        }
    ]
    
    for test_case in test_cases:
        print(f"\n{'='*60}")
        print(f"Тест: {test_case['name']}")
        print(f"{'='*60}")
        print(f"Payload: {json.dumps(test_case['payload'], indent=2, ensure_ascii=False)}")
        print(f"Headers: {json.dumps({k: v for k, v in headers.items() if k != 'Auth'}, indent=2)}")
        print(f"Auth: {headers['Auth']}")
        
        try:
            response = requests.post(
                CLICK_API_URL,
                json=test_case['payload'],
                headers=headers,
                timeout=30
            )
            
            print(f"\nResponse Status: {response.status_code}")
            print(f"Response Text: {response.text}")
            
            try:
                json_response = response.json()
                print(f"Response JSON: {json.dumps(json_response, indent=2, ensure_ascii=False)}")
                
                if "error_code" in json_response:
                    error_code = json_response["error_code"]
                    error_note = json_response.get("error_note", "No error note")
                    print(f"\n❌ Error Code: {error_code}")
                    print(f"Error Note: {error_note}")
                    
                    if error_code == 0:
                        print("✅ УСПЕХ! Инвойс создан!")
                        return True
                else:
                    print("⚠️ Неожиданный формат ответа")
                    
            except ValueError:
                print(f"❌ Не удалось распарсить JSON: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Ошибка запроса: {e}")
        
        print("\n" + "-"*60)
        time.sleep(2)  # Небольшая задержка между запросами
    
    return False

if __name__ == "__main__":
    print("Тестирование Click API...")
    print(f"API URL: {CLICK_API_URL}")
    print(f"Service ID: {CLICK_SERVICE_ID}")
    print(f"Merchant ID: {CLICK_MERCHANT_ID}")
    print(f"Merchant User ID: {CLICK_MERCHANT_USER_ID}")
    print("\n")
    
    success = test_click_api()
    
    if not success:
        print("\n" + "="*60)
        print("⚠️ Все тесты завершились с ошибками")
        print("\nВозможные причины ошибки -500:")
        print("1. Неверные credentials (service_id, merchant_id, secret_key)")
        print("2. Аккаунт не активирован в Click")
        print("3. Аккаунт заблокирован")
        print("4. Неверный формат запроса (требуется уточнить в документации)")
        print("5. Проблемы на стороне Click API")
        print("\nРекомендации:")
        print("- Проверьте credentials в личном кабинете Click")
        print("- Свяжитесь с поддержкой Click: support@click.uz")
        print("- Проверьте статус аккаунта в личном кабинете")
        print("="*60)

