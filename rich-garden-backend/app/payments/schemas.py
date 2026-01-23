from pydantic import BaseModel
from typing import Optional, Union

class ClickInvoiceCreate(BaseModel):
    order_id: Union[int, str]
    amount: int
    return_url: str # Where to redirect user callback in browser

class ClickCallback(BaseModel):
    click_trans_id: int
    service_id: int
    click_paydoc_id: int
    merchant_trans_id: str
    amount: float
    action: int
    error: int
    error_note: str
    sign_time: str 
    sign_string: str
    click_paydoc_id: int

class ClickResponse(BaseModel):
    click_trans_id: int
    merchant_trans_id: str
    merchant_confirm_id: Optional[int] = None
    error: int
    error_note: str
