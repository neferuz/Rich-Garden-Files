
import hashlib
import time
import requests
from sqlalchemy.orm import Session
from app.orders.models import Order
from app.payments.config import (
    CLICK_SERVICE_ID, CLICK_MERCHANT_ID, CLICK_SECRET_KEY, 
    CLICK_MERCHANT_USER_ID, BASE_URL,
    PAYME_MERCHANT_ID, PAYME_KEY, PAYME_API_URL
)
import base64
import json

CLICK_API_URL = "https://api.click.uz/v2/merchant/invoice/create"

def generate_auth_headers():
    timestamp = str(int(time.time()))
    digest = hashlib.sha1((timestamp + CLICK_SECRET_KEY).encode("utf-8")).hexdigest()
    
    # Click documentation implies digest string. 
    # Try upper case to be safe as many archaic gateways prefer it.
    # digest = digest.upper() 
    
    return {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Auth": f"{CLICK_MERCHANT_USER_ID}:{digest}:{timestamp}"
    }

def create_click_invoice(order: Order, return_url: str):
    url = CLICK_API_URL
    
    # Validating amount: User says "Click hates float", send int (UZS). 
    amount = int(float(order.total_price))
    
    # Click might reject http://localhost or non-public URLs causing -500 error.
    # We will use temporary https URL if localhost is detected, to verifying correct API call.
    final_return_url = return_url
    if "localhost" in return_url or "http://" in return_url:
        # Fallback to a safe https URL to pass validation
        final_return_url = "https://richgarden.uz/" 

    # Payload
    payload = {
        "service_id": int(CLICK_SERVICE_ID),
        "merchant_id": int(CLICK_MERCHANT_ID),
        "merchant_user_id": int(CLICK_MERCHANT_USER_ID),
        "amount": amount, 
        "currency": "UZS",
        "description": f"Оплата заказа #{order.id} в Rich Garden",
        "order_id": str(order.id),
        "back_url": final_return_url, 
    }
    
    # The standard modern API is /v2/merchant/invoice/create
    user_url = CLICK_API_URL
    
    response = requests.post(user_url, json=payload, headers=generate_auth_headers())
    
    try:
        json_response = response.json()
    except ValueError:
        print(f"Click Invalid JSON: {response.text}")
        return {"error": f"Invalid response from Click: {response.text}", "status": "error"}

    # Check for functional error codes in success response
    if "error_code" in json_response and json_response["error_code"] != 0:
        error_msg = json_response.get("error_note", f"Error Code: {json_response['error_code']}")
        print(f"Click API Error: {error_msg}")
        return {"error": error_msg, "status": "error"}
        
    return json_response

def verify_click_signature(data: dict) -> bool:
    """
    Verifies the signature from Click callback.
    Formula: md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + amount + action + sign_time)
    """
    try:
        click_trans_id = str(data.get("click_trans_id", ""))
        service_id = str(data.get("service_id", ""))
        merchant_trans_id = str(data.get("merchant_trans_id", "")) # Our order_id usually, but sometimes separate. documentation says merchant_trans_id
        amount = str(data.get("amount", ""))
        action = str(data.get("action", ""))
        sign_time = str(data.get("sign_time", ""))
        sign_string = f"{click_trans_id}{service_id}{CLICK_SECRET_KEY}{merchant_trans_id}{amount}{action}{sign_time}"
        
        calculated_sign = hashlib.md5(sign_string.encode("utf-8")).hexdigest()
        incoming_sign = data.get("sign_string", "").lower()
        
        if calculated_sign != incoming_sign:
            # Try alternate format: amount might be formatted differently? 
            # Usually strict string match.
            print(f"Signature Mismatch! Calculated: {calculated_sign}, Incoming: {incoming_sign}")
            return False
            
        return True
    except Exception as e:
        print(f"Signature verification failed with exception: {e}")
        return False

def create_payme_receipt(order: Order):
    """
    Step 1: receipts.create
    Following user guide for Subscribe API.
    """
    amount_tiyin = int(float(order.total_price) * 100)
    
    items_list = []
    try:
        items_data = json.loads(order.items) if isinstance(order.items, str) else order.items
        for item in items_data:
            items_list.append({
                "name": item.get("name", "Товар"),
                "price": int(float(item.get("price", 0)) * 100),
                "quantity": int(item.get("quantity", 1))
            })
    except Exception as e:
        print(f"Error parsing items: {e}")
        # Fallback if items are missing
        items_list = [{"name": "Заказ", "price": amount_tiyin, "quantity": 1}]

    # Step 1: receipts.create
    # FINAL SPECIFICATION: Flat params, no account object
    params = {
        "merchant_id": PAYME_MERCHANT_ID,
        "order_id": str(order.id),
        "amount": amount_tiyin,
        "currency": "UZS",
        "description": f"Оплата заказа #{order.id}",
        "items": items_list
    }
    
    rpc_payload = {
        "jsonrpc": "2.0",
        "id": int(time.time()),
        "method": "receipts.create",
        "params": params
    }
    
    # FINAL AUTH: X-Auth: {merchant_id}:{secret_key}
    headers = {
        "X-Auth": f"{PAYME_MERCHANT_ID}:{PAYME_KEY}",
        "Content-Type": "application/json"
    }

    try:
        print(f"DEBUG: Creating Payme receipt for Order {order.id} (Final Spec)")
        
        response = requests.post(
            PAYME_API_URL, 
            json=rpc_payload, 
            headers=headers
        )
        json_response = response.json()
        print(f"DEBUG: Response: {json_response}")
        
        if "error" in json_response:
            return {"error": json_response['error'], "status": "error"}
            
        return {
            "status": "success",
            "receipt_id": json_response['result']['receipt']['_id']
        }
        
    except Exception as e:
        return {"error": str(e), "status": "error"}

def send_payme_receipt(receipt_id: str, phone: str):
    """
    Step 2: receipts.send
    Sends the receipt link to the user's phone.
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
            PAYME_API_URL, 
            json=rpc_payload, 
            headers=headers
        )
        return response.json()
    except Exception as e:
        return {"error": str(e), "status": "error"}
