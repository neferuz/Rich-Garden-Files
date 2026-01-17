from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.banners import schemas, repository

router = APIRouter(
    prefix="/banners",
    tags=["banners"]
)

@router.get("/", response_model=List[schemas.Banner])
@router.get("", response_model=List[schemas.Banner])
def read_banners(active_only: bool = False, db: Session = Depends(get_db)):
    return repository.get_all(db, active_only=active_only)

@router.post("/", response_model=schemas.Banner)
@router.post("", response_model=schemas.Banner)
def create_banner(banner: schemas.BannerCreate, db: Session = Depends(get_db)):
    return repository.create(db, banner)

@router.patch("/{banner_id}", response_model=schemas.Banner)
@router.patch("/{banner_id}/", response_model=schemas.Banner)
def update_banner(banner_id: int, banner: schemas.BannerUpdate, db: Session = Depends(get_db)):
    db_banner = repository.update(db, banner_id, banner)
    if not db_banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    return db_banner

@router.delete("/{banner_id}")
@router.delete("/{banner_id}/")
def delete_banner(banner_id: int, db: Session = Depends(get_db)):
    success = repository.delete(db, banner_id)
    if not success:
        raise HTTPException(status_code=404, detail="Banner not found")
    return {"ok": True}
