from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import os

from app import database
# Import models to register them with Base
from app.users import models as user_models
from app.products import models as product_models
from app.orders import models as order_models
from app.expenses import models as expense_models
from app.calendar import models as calendar_models
from app.employees import models as employee_models
from app.stories import models as story_models
from app.banners import models as banner_models
from app.wow_effects import models as wow_effects_models
from app.payments import models as payment_models  # PaymeTransaction

# Import routers
from app.products import router as products_router
from app.orders import router as orders_router
from app.users import router as users_router
from app.expenses import router as expenses_router
from app.search import router as search_router
from app.common import router as common_router
from app.calendar import router as calendar_router
from app.employees import router as employees_router
from app.employees import router as employees_router
from app.stories import router as stories_router
from app.banners import router as banners_router
from app.payments import router as payments_router
from app.wow_effects import router as wow_effects_router

from app.products import repository as product_repo # for seed

app = FastAPI(title="Rich Garden API")

# Create tables
# user_models.Base.metadata.create_all(bind=database.engine)
# Better: use database.Base if they all share it.
# Wrap in try-except to prevent startup failure if DB is temporarily unavailable
try:
    database.Base.metadata.create_all(bind=database.engine)
except Exception as e:
    import logging
    logging.warning(f"Could not create database tables on startup: {e}")

# Setup CORS
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "https://24eywa.ru",
    "https://www.24eywa.ru",
    "https://admin.24eywa.ru",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure static directory exists
if not os.path.exists("app/static"):
    os.makedirs("app/static", exist_ok=True)
if not os.path.exists("app/static/uploads"):
    os.makedirs("app/static/uploads", exist_ok=True)

app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Include Routers
# Note: Some routers have prefix defined, some don't.
# products: /products
# orders: /orders
# users: /user (and internal /auth /clients) -> wait, users router was mixed.
# Let's check users router.
# It has prefix="/user" but also auth_router (prefix /auth) and clients_router (/clients) defined inside.
# I need to include them separately.

app.include_router(products_router.router, prefix="/api")
app.include_router(orders_router.router, prefix="/api")
app.include_router(expenses_router.router, prefix="/api")
app.include_router(search_router.router, prefix="/api")
app.include_router(common_router.router) # /api/upload is hardcoded in router
app.include_router(calendar_router.router, prefix="/api")
app.include_router(employees_router.router, prefix="/api")
app.include_router(stories_router.router) # Prefix /api/stories is inside router
app.include_router(banners_router.router, prefix="/api")
app.include_router(payments_router.router, prefix="/api")
app.include_router(wow_effects_router.router, prefix="/api")

# Users router is complex.
from app.users import router as users_module
app.include_router(users_module.router, prefix="/api") # /api/user
app.include_router(users_module.auth_router, prefix="/api") # /api/auth
app.include_router(users_module.clients_router, prefix="/api") # /api/clients


@app.get("/")
def read_root():
    return {"message": "Rich Garden API is running"}

# Seed Data Endpoint
@app.post("/api/seed")
def seed_data(db: Session = Depends(database.get_db)):
    # Check via repo
    # existing = product_repo.get_all(db)
    # Checking count efficiently involves query, repo uses all() -> inefficient for count but fine here.
    # Or just use model directly if repo doesn't expose count.
    # Repo get_all is fine.
    existing = product_repo.get_all(db)
    if len(existing) > 0:
        return {"message": "Data already exists"}
    
    from app.products import schemas
    products = [
        {"name": "Velvet Rose", "price_display": "450 000 сум", "price_raw": 450000, "image": "/flowers.png", "category": "roses", "is_hit": True},
        {"name": "Summer Breeze", "price_display": "320 000 сум", "price_raw": 320000, "image": "/flowers2.png", "category": "mix"},
        {"name": "Royal Peony", "price_display": "850 000 сум", "price_raw": 850000, "image": "/flowers.png", "category": "peonies", "is_new": True},
    ]
    for p in products:
        # p is dict. Schema expects keyword args.
        # ProductCreate schema matches dict keys?
        # ProductCreate has defaults.
        product_in = schemas.ProductCreate(**p)
        product_repo.create(db, product_in)
        
    return {"message": "Seeded successfully"}
