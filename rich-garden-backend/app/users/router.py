from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from . import service, schemas
from app.products import schemas as product_schemas
from app.orders import schemas as order_schemas

router = APIRouter(
    prefix="/user", # Note: endpoints are mixed /api/auth, /api/clients, /api/user...
    tags=["users"]
)
# We will split routers properly. 
# /api/auth/telegram -> auth_router or just here.
# /api/clients -> clients_router or here.

auth_router = APIRouter(prefix="/auth", tags=["auth"])
clients_router = APIRouter(prefix="/clients", tags=["clients"])

@auth_router.post("/telegram", response_model=schemas.TelegramUser)
def auth_telegram(user: schemas.TelegramUserCreate, db: Session = Depends(get_db)):
    return service.auth_telegram(db, user)

@clients_router.get("", response_model=List[schemas.TelegramUser])
def get_clients(db: Session = Depends(get_db)):
    return service.get_clients(db)

@clients_router.post("/offline", response_model=schemas.TelegramUser)
def create_offline_client(client: schemas.TelegramUserCreate, db: Session = Depends(get_db)):
    return service.create_offline_client(db, client)

@clients_router.delete("/{client_id}")
def delete_client(client_id: int, db: Session = Depends(get_db)):
    return service.delete_user(db, client_id)

@clients_router.get("/{client_id}/orders", response_model=List[order_schemas.Order])
def get_client_orders(client_id: int, db: Session = Depends(get_db)):
    return service.get_client_orders(db, client_id)

@clients_router.post("/broadcast")
async def broadcast_message(request: schemas.BroadcastRequest, db: Session = Depends(get_db)):
    return await service.send_broadcast(db, request.text, request.filter_type)

# User specific routes
@router.post("/{telegram_id}/addresses", response_model=schemas.Address)
def create_address(telegram_id: int, address: schemas.AddressCreate, db: Session = Depends(get_db)):
    return service.create_address(db, telegram_id, address)

@router.get("/{telegram_id}/addresses", response_model=List[schemas.Address])
def get_addresses(telegram_id: int, db: Session = Depends(get_db)):
    return service.get_addresses(db, telegram_id)

@router.get("/{telegram_id}/recent") # response_model List[Product]
def get_recent_products(telegram_id: int, db: Session = Depends(get_db)):
    return service.get_recent_products(db, telegram_id)

@router.post("/{telegram_id}/recent/{product_id}")
def add_recent_product(telegram_id: int, product_id: int, db: Session = Depends(get_db)):
    return service.add_recent_product(db, telegram_id, product_id)

@router.get("/{telegram_id}/orders", response_model=List[order_schemas.Order])
def get_user_orders(telegram_id: int, db: Session = Depends(get_db)):
    return service.get_user_orders(db, telegram_id)
