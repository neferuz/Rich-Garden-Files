from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from . import service, schemas

router = APIRouter(prefix="/calendar", tags=["calendar"])

@router.get("/{telegram_id}", response_model=schemas.CalendarDataResponse)
def get_calendar_data(telegram_id: int, db: Session = Depends(get_db)):
    return service.get_calendar_data(db, telegram_id)

@router.post("/{telegram_id}/family", response_model=schemas.FamilyMemberResponse)
def create_family_member(telegram_id: int, member: schemas.FamilyMemberCreate, db: Session = Depends(get_db)):
    return service.create_family_member(db, telegram_id, member)

@router.delete("/{telegram_id}/family/{member_id}")
def delete_family_member(telegram_id: int, member_id: int, db: Session = Depends(get_db)):
    return service.delete_family_member(db, telegram_id, member_id)

@router.post("/{telegram_id}/events", response_model=schemas.CalendarEventResponse)
def create_event(telegram_id: int, event: schemas.CalendarEventCreate, db: Session = Depends(get_db)):
    return service.create_event(db, telegram_id, event)

@router.delete("/{telegram_id}/events/{event_id}")
def delete_event(telegram_id: int, event_id: int, db: Session = Depends(get_db)):
    return service.delete_event(db, telegram_id, event_id)

@router.get("/all/global", response_model=schemas.CalendarDataResponse)
def get_all_calendar_data(db: Session = Depends(get_db)):
    return service.get_all_calendar_data(db)
