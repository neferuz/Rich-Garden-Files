# Click: счёт по номеру телефона (service_id 93495 — у каждого service_id свой SECRET_KEY)
CLICK_SERVICE_ID = "93495"
CLICK_MERCHANT_ID = "14071"
CLICK_SECRET_KEY = "ZSMcjrk8mGI"  # для 93495
CLICK_MERCHANT_USER_ID = "75979"

# Base URL for callbacks (update with ngrok or real domain in production)
BASE_URL = "https://24eywa.ru" 

# Payme Config
PAYME_MERCHANT_ID = "69736609922bebc549a919a6"
PAYME_KEY = "I@ENUuwoPMeP6BnGo%9pmfRk&&@d@kHeznrs"
# Merchant API (checkout URL + callback)
PAYME_API_URL = "https://payme.uz/api"  # Merchant API endpoint (для callback от Payme)
PAYME_CHECKOUT_URL = "https://checkout.paycom.uz"  # URL для редиректа пользователя
PAYME_CALLBACK_URL = "https://24eywa.ru/api/payments/payme"  # URL для callback от Payme
# Subscribe API (receipts) — для Mini App, X-Auth, без callback
PAYME_RECEIPTS_API_URL = "https://checkout.paycom.uz/api"  # receipts.create / receipts.send / receipts.get
