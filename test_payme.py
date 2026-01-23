import requests
import json
import base64
import time

PAYME_MERCHANT_ID = "69736609922bebc549a919a6"
PAYME_KEY = "I@ENUuwoPMeP6BnGo%9pmfRk&&@d@kHeznrs"
RESULTS_FILE = "/Users/notferuz/Desktop/Rich-Garden-Files/payme_results.txt"

def log(msg):
    with open(RESULTS_FILE, "a") as f:
        f.write(msg + "\n")

def test_combination(label, url, headers, params, auth=None):
    log(f"--- {label} ---")
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "receipts.create",
        "params": params
    }
    try:
        response = requests.post(url, json=payload, headers=headers, auth=auth, timeout=10)
        log(f"Status: {response.status_code}")
        log(f"Body: {response.text}")
    except Exception as e:
        log(f"Error: {str(e)}")
    log("")

# Clear results
with open(RESULTS_FILE, "w") as f:
    f.write("Payme Test Results\n\n")

# Flat params
flat_params = {
    "merchant_id": PAYME_MERCHANT_ID,
    "order_id": f"TEST_{int(time.time())}",
    "amount": 10000,
    "currency": "UZS",
    "description": "Test",
    "items": [{"name": "Test", "price": 10000, "quantity": 1}]
}

# 1. Guide's recommendation on checkou.paycom.uz
test_combination("Guide: X-Auth:KEY, Flat Params, checkout.paycom.uz", 
                 "https://checkout.paycom.uz/api", 
                 {"X-Auth": PAYME_KEY}, flat_params)

# 2. Guide's recommendation on payme.uz (trying with receipts.create)
test_combination("Guide: X-Auth:KEY, Flat Params, payme.uz", 
                 "https://payme.uz/api/", 
                 {"X-Auth": PAYME_KEY}, flat_params)

# 3. Standard Merchant API approach on checkout (with account)
std_params = {
    "amount": 10000,
    "account": {"order_id": f"T_{int(time.time())}"},
}
test_combination("Std: Basic Auth, Account, checkout.paycom.uz", 
                 "https://checkout.paycom.uz/api", 
                 {"X-Auth": PAYME_MERCHANT_ID}, std_params, auth=(PAYME_MERCHANT_ID, PAYME_KEY))

# 4. Composite X-Auth with Flat Params
test_combination("Composite X-Auth (HEX:KEY), Flat Params, checkout.paycom.uz", 
                 "https://checkout.paycom.uz/api", 
                 {"X-Auth": f"{PAYME_MERCHANT_ID}:{PAYME_KEY}"}, flat_params)

log("Done.")
