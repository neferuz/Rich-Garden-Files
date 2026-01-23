from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.orders.models import Order
from app.payments.schemas import ClickInvoiceCreate
from app.payments.service import (
    create_click_invoice, verify_click_signature,
    create_payme_receipt, send_payme_receipt
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

@router.post("/create-click-invoice")
def create_click_invoice_endpoint(data: ClickInvoiceCreate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = "pending_payment"
    db.commit()
    
    response = create_click_invoice(order, data.return_url)
    if not response or response.get("status") == "error":
         error_detail = response.get("error") if response else "Unknown error"
         raise HTTPException(status_code=400, detail=f"Failed to create Click invoice: {error_detail}")
    return response

@router.post("/create-payme-invoice")
def create_payme_invoice_endpoint(data: ClickInvoiceCreate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = "pending_payment"
    db.commit()
    
    # Step 1: Create Receipt
    create_res = create_payme_receipt(order)
    if not create_res or create_res.get("status") == "error":
         error_detail = create_res.get("error") if create_res else "Unknown error"
         raise HTTPException(status_code=400, detail=f"Failed to create Payme receipt: {error_detail}")
    
    receipt_id = create_res["receipt_id"]
    
    # Step 2: Send Receipt (optional but recommended by guide)
    # Use order customer_phone or provided phone
    customer_phone = order.customer_phone
    if customer_phone:
        send_payme_receipt(receipt_id, customer_phone)
    
    # We return the checkout URL so frontend can open it immediately
    checkout_url = f"https://checkout.paycom.uz/{receipt_id}"
    
    return {
        "status": "success",
        "receipt_id": receipt_id,
        "payment_url": checkout_url
    }

@router.post("/click/check")
async def click_check(request: Request, db: Session = Depends(get_db)):
    """
    Check availability of order to pay (Step 1 of Click callback).
    """
    # Accept both form-data and json
    try:
        data = await request.form()
        if not data:
            data = await request.json()
    except:
        data = await request.json()

    # 1. IP Filtering 'Protection'
    if not await verify_click_ip(request):
        return {"error": -1, "error_note": "IP not allowed"}

    # 2. Signature Verification
    if not verify_click_signature(data):
       print(f"DEBUG: Click Signature Failed for order {data.get('merchant_trans_id')}")
       return {"error": -1, "error_note": "Invalid signature"}
    
    order_id = data.get("merchant_trans_id")
    order = db.query(Order).filter(Order.id == order_id).first()
    
    # 3. Data Integrity 'Protection'
    if not order:
        return {"error": -5, "error_note": "Order not found"}
        
    if order.status == "paid":
        return {"error": -9, "error_note": "Order already paid"}
        
    # 4. Amount 'Protection'
    incoming_amount = float(data.get("amount", 0))
    if abs(incoming_amount - float(order.total_price)) > 0.1:
         print(f"DEBUG: Amount mismatch for order {order_id}. Expected {order.total_price}, got {incoming_amount}")
         return {"error": -2, "error_note": "Incorrect amount"}

    return {
        "click_trans_id": data.get("click_trans_id"),
        "merchant_trans_id": order_id,
        "merchant_prepare_id": order_id,
        "error": 0,
        "error_note": "Success"
    }

@router.post("/click/result")
async def click_result(request: Request, db: Session = Depends(get_db)):
    """
    Finalize payment (Step 2 of Click callback).
    """
    try:
        data = await request.form()
        if not data:
            data = await request.json()
    except:
        data = await request.json()

    # 1. IP Filtering 'Protection'
    if not await verify_click_ip(request):
        return {"error": -1, "error_note": "IP not allowed"}

    # 2. Signature Verification
    if not verify_click_signature(data):
       return {"error": -1, "error_note": "Invalid signature"}
    
    order_id = data.get("merchant_trans_id")
    
    # Check Click error status
    if int(data.get("error", 0)) < 0:
         return {"error": -9, "error_note": "Transaction failed at Click side"}

    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
         return {"error": -5, "error_note": "Order not found"}
    
    if order.status == "paid":
         return {
             "click_trans_id": data.get("click_trans_id"),
             "merchant_trans_id": order_id,
             "merchant_confirm_id": order_id,
             "error": 0,
             "error_note": "Already paid"
         }
         
    # 3. Finalize
    order.status = "paid"
    db.commit()
    
    # Send telegram notification after paid!
    await notify_new_order(db, order)
    
    return {
        "click_trans_id": data.get("click_trans_id"),
        "merchant_trans_id": order_id,
        "merchant_confirm_id": order_id,
        "error": 0,
        "error_note": "Success"
    }
