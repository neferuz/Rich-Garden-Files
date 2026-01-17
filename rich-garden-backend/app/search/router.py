from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from . import service

router = APIRouter(
    prefix="/search",
    tags=["search"]
)

@router.get("/popular")
def get_popular_searches(db: Session = Depends(get_db)):
    return service.get_popular_searches(db)
